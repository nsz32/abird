import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import type { AppConfig, NavBarConfig, ThemeMode } from "@shared/types"
import { navBarConfig$, partition$, routing$, startUrl$, theme$, userAgent$ } from "../states"

const CONFIG_DIR = join(homedir(), ".config", "bird")
const DEFAULT_CONFIG_FILE = join(CONFIG_DIR, "config.json")

const defaultNavBarConfig: NavBarConfig = {
	position: "top",
	visible: true,
	autoHide: false,
	urlEditable: true,
	showBackForward: true,
	showReload: true,
}

interface GlobalConfig {
	theme: ThemeMode
	navBar: NavBarConfig
	apps: Record<string, AppConfig>
}

const defaultGlobalConfig: GlobalConfig = {
	theme: "system",
	navBar: defaultNavBarConfig,
	apps: {},
}

let configFilePath = DEFAULT_CONFIG_FILE
let globalConfig: GlobalConfig = structuredClone(defaultGlobalConfig)
let currentAppName: string | null = null

export function loadConfig(customPath?: string | null) {
	if (customPath) configFilePath = customPath

	if (!existsSync(configFilePath)) {
		saveConfig()
		return
	}

	try {
		const content = readFileSync(configFilePath, "utf-8")
		const loaded = JSON.parse(content)
		globalConfig = {
			...defaultGlobalConfig,
			...loaded,
			theme: loaded.theme || defaultGlobalConfig.theme,
			navBar: { ...defaultNavBarConfig, ...loaded.navBar },
			apps: { ...defaultGlobalConfig.apps, ...loaded.apps },
		}
	} catch {
		console.error("Failed to load config, using defaults")
	}
}

export function saveConfig() {
	try {
		const configDir = join(configFilePath, "..")
		if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true })
		writeFileSync(configFilePath, JSON.stringify(globalConfig, null, "\t"))
	} catch (err) {
		console.error("Failed to save config:", err)
	}
}

export function selectApp(appName: string): boolean {
	const app = globalConfig.apps[appName]
	if (!app) return false

	currentAppName = appName
	navBarConfig$.emit({ ...globalConfig.navBar, ...app.navBar })
	routing$.emit(app.routing || null)
	startUrl$.emit(app.startUrl)
	partition$.emit(app.partition || "default")
	theme$.emit(app.theme || globalConfig.theme)
	userAgent$.emit(app.userAgentRaw || app.userAgent || "desktop:bird")
	return true
}

export function getAvailableApps(): string[] {
	return Object.keys(globalConfig.apps)
}

export function getCurrentAppName(): string | null {
	return currentAppName
}
