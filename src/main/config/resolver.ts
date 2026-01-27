/**
 * Configuration resolver - effective config computation
 * Responsibilities: config merging, value resolution, emission
 */
import { DEFAULT_NAVBAR } from "@shared/config.schema"
import type { AppConfig, BirdConfig, EffectiveConfig, NavBarConfig, ResolvedNavBarConfig, ResolvedRoutingConfig, RoutingConfig } from "@shared/types"
import { config$ } from "../core/states"
import { acquirePartitionLock } from "../services/CacheManager"
import { resolveDownloadConfig } from "../services/DownloadManager"
import { createLogger } from "../utils/logger"
import { getDefaultUserAgent, isKnownUserAgent } from "../utils/userAgents"
import { getBirdConfig, setCurrentAppName, setOnConfigChanged } from "./store"

const log = createLogger("Resolver")

interface ResolvedNavBarOverrides {
	showBackButton?: boolean
	showForwardButton?: boolean
	showRefreshButton?: boolean
	showHomeButton?: boolean
}

function resolveNavBarConfig(merged: NavBarConfig, overrides?: ResolvedNavBarOverrides): ResolvedNavBarConfig {
	return {
		position: merged.position,
		visible: merged.visible,
		autoHide: merged.autoHide,
		allowUrlEdit: merged.allowUrlEdit,
		allowSingleTabClose: merged.allowSingleTabClose,
		showBackButton: overrides?.showBackButton ?? merged.showBackButton,
		showForwardButton: overrides?.showForwardButton ?? merged.showForwardButton,
		showRefreshButton: overrides?.showRefreshButton ?? merged.showRefreshButton,
		showHomeButton: overrides?.showHomeButton ?? merged.showHomeButton,
	}
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function resolveRoutingConfig(config: Partial<RoutingConfig> | undefined, startUrl?: string): ResolvedRoutingConfig {
	const resolved: ResolvedRoutingConfig = {
		internal: [],
		download: [],
		external: [],
		ignore: [],
	}

	if (startUrl && startUrl !== "about:blank") {
		resolved.internal.push(new RegExp(`^${escapeRegex(startUrl)}`))
	}

	if (!config?.rules) return resolved

	for (const [pattern, action] of Object.entries(config.rules)) {
		try {
			resolved[action].push(new RegExp(pattern))
		} catch {
			log.warn(`Invalid pattern ignored: ${pattern}`)
		}
	}

	return resolved
}

interface BuildOptions {
	navBarOverrides?: ResolvedNavBarOverrides
	cliOverrides?: CliOverrides
}

export interface CliOverrides {
	userAgent?: string
}

function isRawUserAgent(value: string): boolean {
	return value.includes(" ") || value.startsWith("Mozilla")
}

function resolveUserAgentKey(value: string | undefined): string {
	if (!value) return getDefaultUserAgent()
	if (isRawUserAgent(value)) return value

	if (isKnownUserAgent(value)) return value

	const fallback = getDefaultUserAgent()
	log.warn(`Unknown user agent "${value}", falling back to ${fallback}`)
	return fallback
}

function buildEffectiveConfig(app: Partial<AppConfig>, birdConfig: BirdConfig, options?: BuildOptions): EffectiveConfig {
	const mergedNavBar: NavBarConfig = { ...DEFAULT_NAVBAR, ...birdConfig.navBar, ...app.navBar }
	const cli = options?.cliOverrides

	const rawUserAgent = cli?.userAgent || app.userAgentRaw || app.userAgent
	const userAgent = resolveUserAgentKey(rawUserAgent)

	return {
		startUrl: app.startUrl || "about:blank",
		partition: app.partition || null,
		theme: app.theme || birdConfig.theme,
		userAgent,
		navBar: resolveNavBarConfig(mergedNavBar, options?.navBarOverrides),
		routing: resolveRoutingConfig(app.routing, app.startUrl),
		downloads: resolveDownloadConfig({ ...birdConfig.downloads, ...app.downloads }),
	}
}

export function selectApp(appName: string, cliOverrides?: CliOverrides): boolean {
	const birdConfig = getBirdConfig()
	const app = birdConfig.apps[appName]
	if (!app) return false

	setCurrentAppName(appName)
	const effective = buildEffectiveConfig(app, birdConfig, { cliOverrides })
	if (effective.partition) acquirePartitionLock(effective.partition)
	config$.emit(effective)
	return true
}

export function selectConfigMode(): void {
	const birdConfig = getBirdConfig()
	setCurrentAppName("Bird")

	const configApp: Partial<AppConfig> = {
		startUrl: "bird://config/",
		navBar: {
			visible: true,
			autoHide: false,
			allowUrlEdit: false,
			allowSingleTabClose: true,
		},
		routing: { rules: { "^bird://": "internal" } },
	}

	const effective = buildEffectiveConfig(configApp, birdConfig, {
		navBarOverrides: {
			showBackButton: true,
			showForwardButton: false,
			showRefreshButton: false,
			showHomeButton: false,
		},
	})
	config$.emit(effective)
}

export function selectBrowserMode(startUrl: string, userAgent?: string): void {
	const birdConfig = getBirdConfig()
	setCurrentAppName("Bird")

	const browserApp: Partial<AppConfig> = {
		startUrl,
		partition: "browsermode",
		userAgent,
		navBar: {
			visible: true,
			autoHide: false,
			allowUrlEdit: true,
			allowSingleTabClose: true,
		},
		routing: { rules: { "^": "internal" } },
	}

	const effective = buildEffectiveConfig(browserApp, birdConfig, {
		navBarOverrides: {
			showBackButton: true,
			showForwardButton: true,
			showRefreshButton: true,
			showHomeButton: true,
		},
	})

	effective.downloads = {
		directory: null,
		autoOpenMaxSize: 0,
		autoOpenMimeTypes: [],
		allowExecutablesDownload: true,
		allowDuplicateDownloads: true,
	}

	if (effective.partition) acquirePartitionLock(effective.partition)
	config$.emit(effective)
}

export function refreshEffectiveConfig(): void {
	const birdConfig = getBirdConfig()
	const currentConfig = config$.get()

	config$.emit({
		...currentConfig,
		theme: birdConfig.theme,
		navBar: {
			...currentConfig.navBar,
			position: birdConfig.navBar?.position || "bottom",
		},
	})
}

// Connect the callback to refresh effective config after modification
setOnConfigChanged(refreshEffectiveConfig)
