/**
 * Configuration resolver - calcul de la config effective
 * Responsabilités : fusion des configs, résolution des valeurs, émission
 */
import { DEFAULT_NAVBAR } from "@shared/config.schema"
import type { AppConfig, BirdConfig, EffectiveConfig, NavBarConfig, ResolvedNavBarConfig } from "@shared/types"
import { config$ } from "../core/states"
import { resolveDownloadConfig } from "../services/DownloadManager"
import { getBirdConfig, setCurrentAppName, setOnConfigChanged } from "./store"

interface ResolvedNavBarOverrides {
	showBackButton?: boolean
	showNextButton?: boolean
	showRefreshButton?: boolean
	showHomeButton?: boolean
}

function resolveNavBarConfig(merged: NavBarConfig, overrides?: ResolvedNavBarOverrides): ResolvedNavBarConfig {
	return {
		position: merged.position,
		visible: merged.visible,
		autoHide: merged.autoHide,
		urlEditable: merged.urlEditable,
		allowSingleTabClose: merged.allowSingleTabClose,
		showBackButton: overrides?.showBackButton ?? merged.showBackForward,
		showNextButton: overrides?.showNextButton ?? merged.showBackForward,
		showRefreshButton: overrides?.showRefreshButton ?? merged.showReload,
		showHomeButton: overrides?.showHomeButton ?? true,
	}
}

interface BuildOptions {
	navBarOverrides?: ResolvedNavBarOverrides
}

function buildEffectiveConfig(app: Partial<AppConfig>, birdConfig: BirdConfig, options?: BuildOptions): EffectiveConfig {
	const mergedNavBar: NavBarConfig = { ...DEFAULT_NAVBAR, ...birdConfig.navBar, ...app.navBar }

	return {
		startUrl: app.startUrl || "about:blank",
		partition: app.partition || "default",
		theme: app.theme || birdConfig.theme,
		userAgent: app.userAgentRaw || app.userAgent || "desktop:bird",
		navBar: resolveNavBarConfig(mergedNavBar, options?.navBarOverrides),
		routing: app.routing || null,
		downloads: resolveDownloadConfig({ ...birdConfig.downloads }),
	}
}

export function selectApp(appName: string): boolean {
	const birdConfig = getBirdConfig()
	const app = birdConfig.apps[appName]
	if (!app) return false

	setCurrentAppName(appName)
	const effective = buildEffectiveConfig(app, birdConfig)
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
			urlEditable: false,
			allowSingleTabClose: false,
		},
		routing: { internal: "^bird://" },
	}

	const effective = buildEffectiveConfig(configApp, birdConfig, {
		navBarOverrides: {
			showBackButton: true,
			showNextButton: false,
			showRefreshButton: false,
			showHomeButton: false,
		},
	})
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
setOnConfigChanged(refreshEffectiveConfig)
