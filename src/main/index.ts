import { existsSync, readFileSync } from "node:fs"
import { basename, dirname, join } from "node:path"
import { app } from "electron"
import { getAvailableApps, loadConfig, selectApp, selectBrowserMode, selectConfigMode } from "./config"
import { sanitizeAppName } from "./utils/naming"
import { startApp } from "./core/App"
import { initI18n } from "./core/I18n"
import { registerBirdScheme, setupBirdProtocol } from "./core/Protocol"
import { findConfigModeConflicts, getConfigPathFromArgs, parseCliArgs, printHelp } from "./core/cli"
import { parseShortcut, registerKioskExitShortcut } from "./core/kiosk"
import { config$, kioskMode$ } from "./core/states"
import { cleanupAllPartitionCaches, releasePartitionLock } from "./services/CacheManager"
import { getAvailableUserAgents } from "./utils/userAgents"

// === Bootstrap: resolve userData before app.whenReady ===

const DEFAULT_PROJECT_NAME = "bird"
const PROJECT_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/

function getXdgDataHome(): string {
	return process.env.XDG_DATA_HOME || join(app.getPath("home"), ".local", "share")
}

function inferProjectNameFromPath(configPath: string): string {
	const parentDir = dirname(configPath)
	const folderName = basename(parentDir)
	return PROJECT_NAME_PATTERN.test(folderName) ? folderName : DEFAULT_PROJECT_NAME
}

function readProjectName(configPath: string, isCustomPath: boolean): string {
	if (!existsSync(configPath)) {
		return isCustomPath ? inferProjectNameFromPath(configPath) : DEFAULT_PROJECT_NAME
	}

	try {
		const content = JSON.parse(readFileSync(configPath, "utf-8"))
		if (typeof content.projectName === "string" && PROJECT_NAME_PATTERN.test(content.projectName)) {
			return content.projectName
		}
	} catch {
		// Invalid JSON, use default
	}

	return DEFAULT_PROJECT_NAME
}

function resolveUserDataPath(): string {
	const xdgDataHome = getXdgDataHome()
	const customConfigPath = getConfigPathFromArgs()

	if (customConfigPath) {
		const projectName = readProjectName(customConfigPath, true)
		return join(xdgDataHome, projectName)
	}

	// Default config path: check if it exists and has projectName
	const defaultConfigPath = join(xdgDataHome, DEFAULT_PROJECT_NAME, "config.json")
	const projectName = readProjectName(defaultConfigPath, false)
	return join(xdgDataHome, projectName)
}

app.setPath("userData", resolveUserDataPath())

// Must be called before app.whenReady()
registerBirdScheme()

app.whenReady().then(() => {
	const args = parseCliArgs()
	if (!args) {
		app.quit()
		return
	}

	if (args.showHelp) {
		printHelp()
		app.quit()
		return
	}

	if (args.kioskShortcut !== null) {
		const keycodes = parseShortcut(args.kioskShortcut)
		if (!keycodes) {
			app.quit()
			return
		}
		registerKioskExitShortcut(keycodes)
		kioskMode$.emit(true)
	}

	if (args.listUserAgents) {
		console.log("Available user agents:\n")
		for (const ua of getAvailableUserAgents()) {
			console.log(`  ${ua}`)
		}
		app.quit()
		return
	}

	loadConfig(args.configPath)
	initI18n()
	setupBirdProtocol()

	if (args.browserUrl) {
		app.setName("bird-browser")
		selectBrowserMode(args.browserUrl, args.userAgent ?? undefined)
		startApp()
		return
	}

	if (!args.appName) {
		const conflicts = findConfigModeConflicts(args)
		if (conflicts.length > 0) {
			console.error(`Options ${conflicts.join(", ")} require --app or a URL`)
			app.quit()
			return
		}
		app.setName("bird-config")
		selectConfigMode()
		startApp()
		return
	}

	const cliOverrides = args.userAgent ? { userAgent: args.userAgent } : undefined
	if (!selectApp(args.appName, cliOverrides)) {
		console.error(`App "${args.appName}" not found. Available: ${getAvailableApps().join(", ")}`)
		app.quit()
		return
	}

	app.setName(`bird-${sanitizeAppName(args.appName)}`)
	startApp()
})

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit()
})

app.on("will-quit", () => {
	const partition = config$.get().partition
	if (partition) {
		releasePartitionLock(partition)
	}
	cleanupAllPartitionCaches()
})
