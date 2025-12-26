import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { type AppConfig, type NavBarConfig, type ThemeMode, defaultNavBarConfig } from "@shared/types"
import { navBarConfig$, partition$, routing$, startUrl$, theme$, userAgent$ } from "../states"

const CONFIG_DIR = join(homedir(), ".config", "bird")
const DEFAULT_CONFIG_FILE = join(CONFIG_DIR, "config.json")

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

	globalConfig = parseConfigFile()
}

export function saveConfig() {
	ensureConfigDir()
	writeConfigFile()
}

export function selectApp(appName: string): boolean {
	const app = globalConfig.apps[appName]
	if (!app) return false

	currentAppName = appName
	emitAppConfig(app)
	return true
}

export function getAvailableApps(): string[] {
	return Object.keys(globalConfig.apps)
}

export function getCurrentAppName(): string | null {
	return currentAppName
}

function parseConfigFile(): GlobalConfig {
	try {
		const content = readFileSync(configFilePath, "utf-8")
		const loaded = JSON.parse(content)
		return mergeWithDefaults(loaded)
	} catch {
		console.error("Failed to load config, using defaults")
		return structuredClone(defaultGlobalConfig)
	}
}

function mergeWithDefaults(loaded: Partial<GlobalConfig>): GlobalConfig {
	return {
		...defaultGlobalConfig,
		...loaded,
		theme: loaded.theme || defaultGlobalConfig.theme,
		navBar: { ...defaultNavBarConfig, ...loaded.navBar },
		apps: { ...defaultGlobalConfig.apps, ...loaded.apps },
	}
}

function ensureConfigDir() {
	const dir = dirname(configFilePath)
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true })
	}
}

function writeConfigFile() {
	try {
		writeFileSync(configFilePath, JSON.stringify(globalConfig, null, "\t"))
	} catch (err) {
		console.error("Failed to save config:", err)
	}
}

function emitAppConfig(app: AppConfig) {
	navBarConfig$.emit({ ...globalConfig.navBar, ...app.navBar })
	routing$.emit(app.routing || null)
	startUrl$.emit(app.startUrl)
	partition$.emit(app.partition || "default")
	theme$.emit(app.theme || globalConfig.theme)
	userAgent$.emit(app.userAgentRaw || app.userAgent || "desktop:bird")
}
