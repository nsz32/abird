/**
 * Configuration resolver - calcul de la config effective
 * Responsabilités : fusion des configs, résolution des valeurs, émission
 */
import { DEFAULT_NAVBAR } from "@shared/config.schema"
import type { AppConfig, BirdConfig, EffectiveConfig, NavBarConfig, ResolvedNavBarConfig, ResolvedRoutingConfig, RoutingConfig } from "@shared/types"
import { config$ } from "../core/states"
import { resolveDownloadConfig } from "../services/DownloadManager"
import { cleanupFragilePartitions } from "../services/PartitionManager"
import { getBirdConfig, setCurrentAppName, setOnConfigChanged } from "./store"

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
		showHomeButton: overrides?.showHomeButton ?? true,
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
			console.warn(`[Routing] Invalid pattern ignored: ${pattern}`)
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

function buildEffectiveConfig(app: Partial<AppConfig>, birdConfig: BirdConfig, options?: BuildOptions): EffectiveConfig {
	const mergedNavBar: NavBarConfig = { ...DEFAULT_NAVBAR, ...birdConfig.navBar, ...app.navBar }
	const cli = options?.cliOverrides

	return {
		startUrl: app.startUrl || "about:blank",
		partition: app.partition || "default",
		theme: app.theme || birdConfig.theme,
		userAgent: cli?.userAgent || app.userAgentRaw || app.userAgent || "desktop:bird",
		navBar: resolveNavBarConfig(mergedNavBar, options?.navBarOverrides),
		routing: resolveRoutingConfig(app.routing, app.startUrl),
		downloads: resolveDownloadConfig({ ...birdConfig.downloads }),
	}
}

export function selectApp(appName: string, cliOverrides?: CliOverrides): boolean {
	const birdConfig = getBirdConfig()
	const app = birdConfig.apps[appName]
	if (!app) return false

	setCurrentAppName(appName)
	const effective = buildEffectiveConfig(app, birdConfig, { cliOverrides })
	config$.emit(effective)
	return true
}

export function selectConfigMode(): void {
	const birdConfig = getBirdConfig()
	setCurrentAppName("config")

	const configApp: Partial<AppConfig> = {
		startUrl: "bird://config/",
		partition: "",
		userAgent: "Bird",
		navBar: {
			visible: true,
			autoHide: false,
			allowUrlEdit: false,
			allowSingleTabClose: false,
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

export function selectBrowserMode(startUrl: string, userAgent = "desktop:bird"): void {
	const birdConfig = getBirdConfig()
	setCurrentAppName("browser")

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
			position: birdConfig.navBar?.position || "top",
		},
	})
}

// Connecter le callback pour rafraîchir la config effective après modification
setOnConfigChanged(() => {
	refreshEffectiveConfig()
	cleanupFragilePartitions()
})
