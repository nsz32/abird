import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { validateConfig } from "@shared/config.schema"
import { type AppConfig, type GlobalConfig, type ResolvedAppConfig, defaultDownloadConfig, defaultNavBarConfig } from "@shared/types"
import { resolveDownloadConfig } from "../downloads/DownloadManager"
import { config$ } from "../states"

const CONFIG_DIR = join(homedir(), ".config", "bird")
const DEFAULT_CONFIG_FILE = join(CONFIG_DIR, "config.json")

let configFilePath = DEFAULT_CONFIG_FILE
let globalConfig: GlobalConfig = validateConfig({}).data
let currentAppName: string | null = null

export function loadConfig(customPath?: string | null) {
	if (customPath) configFilePath = customPath

	if (!existsSync(configFilePath)) {
		saveConfig()
		return
	}

	parseConfigFile()
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

function parseConfigFile() {
	try {
		console.log("Loading config from:", configFilePath)
		const content = readFileSync(configFilePath, "utf-8")
		const loaded = JSON.parse(content)
		const result = validateConfig(loaded)

		if (result.unknownKeys.length > 0) {
			console.warn("Unknown config keys:", result.unknownKeys.join(", "))
		}

		if (!result.success) {
			console.error("Config validation errors:", result.errors.join("; "))
		}

		globalConfig = result.data
		console.log("Config loaded, apps:", Object.keys(globalConfig.apps))
	} catch (err) {
		console.error("Failed to load config:", err)
		globalConfig = validateConfig({}).data
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
	const resolved: ResolvedAppConfig = {
		startUrl: app.startUrl,
		partition: app.partition || "default",
		theme: app.theme || globalConfig.theme,
		userAgent: app.userAgentRaw || app.userAgent || "desktop:bird",
		navBar: { ...defaultNavBarConfig, ...globalConfig.navBar, ...app.navBar },
		routing: app.routing || null,
		downloads: resolveDownloadConfig({ ...defaultDownloadConfig, ...globalConfig.downloads }),
	}
	config$.emit(resolved)
}
