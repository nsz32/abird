import { existsSync, readFileSync } from "node:fs"
import { basename, dirname, join } from "node:path"
import { app } from "electron"
import { getAvailableApps, getProjectName, loadConfig, selectApp, selectBrowserMode, selectConfigMode } from "./config"
import { startApp } from "./core/App"
import { initI18n } from "./core/I18n"
import { registerBirdScheme, setupBirdProtocol } from "./core/Protocol"
import { findConfigModeConflicts, getConfigPathFromArgs, parseCliArgs, printHelp, promptConfirmation } from "./core/cli"
import { parseShortcut, registerKioskExitShortcut } from "./core/kiosk"
import { config$, kioskMode$ } from "./core/states"
import { cleanupAllPartitionCaches, releasePartitionLock } from "./services/CacheManager"
import { cleanupInstallerCache, performCleanAll } from "./utils/cleanup"
import { createLogger } from "./utils/logger"
import { getAppUserModelId, sanitizeAppName } from "./utils/naming"
import { getAvailableUserAgents } from "./utils/userAgents"

// === Bootstrap: resolve userData before app.whenReady ===

let cleanAllInProgress = false

export function setCleanAllInProgress(value: boolean): void {
	cleanAllInProgress = value
}

const DEFAULT_PROJECT_NAME = "bird"
const PROJECT_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/

/**
 * Get the platform-appropriate data directory.
 * - Linux: XDG_DATA_HOME or ~/.local/share
 * - Windows: AppData\Roaming
 * - macOS: ~/Library/Application Support
 */
function getDataHome(): string {
	if (process.platform === "linux") {
		return process.env.XDG_DATA_HOME || join(app.getPath("home"), ".local", "share")
	}
	return app.getPath("appData")
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
	const dataHome = getDataHome()
	const customConfigPath = getConfigPathFromArgs()

	if (customConfigPath) {
		const projectName = readProjectName(customConfigPath, true)
		return join(dataHome, projectName)
	}

	// Default config path: check if it exists and has projectName
	const defaultConfigPath = join(dataHome, DEFAULT_PROJECT_NAME, "config.json")
	const projectName = readProjectName(defaultConfigPath, false)
	return join(dataHome, projectName)
}

app.setPath("userData", resolveUserDataPath())

/**
 * Set app name and Windows AppUserModelId for taskbar grouping.
 * Must be called before creating windows.
 */
function setAppIdentity(projectName: string, appName: string): void {
	const identity = `${projectName}-${sanitizeAppName(appName)}`
	app.setName(identity)

	if (process.platform === "win32") {
		app.setAppUserModelId(getAppUserModelId(projectName, appName))
	}

	if (process.platform === "linux") {
		;(app as Record<string, unknown>).setDesktopName(`${identity}.desktop`)
	}
}

async function handleCleanAll(force: boolean): Promise<void> {
	if (!force) {
		const confirmed = await promptConfirmation("This will remove all Bird data and shortcuts. Continue?")
		if (!confirmed) {
			console.log("Aborted.")
			app.quit()
			return
		}
	}

	performCleanAll()
	console.log("All Bird data has been removed.")
	app.quit()
}

// Must be called before app.whenReady()
app.commandLine.appendSwitch("ozone-platform-hint", "auto")
registerBirdScheme()

app.whenReady().then(() => {
	cleanupInstallerCache()

	const log = createLogger("Main")
	log.info(`Paths - appPath: ${app.getAppPath()}, resourcesPath: ${process.resourcesPath}, isPackaged: ${app.isPackaged}`)

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

	if (args.cleanAll) {
		handleCleanAll(args.force)
		return
	}

	initI18n()
	setupBirdProtocol()

	const projectName = getProjectName()

	if (args.browserUrl) {
		setAppIdentity(projectName, "browser")
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
		setAppIdentity(projectName, "config")
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

	setAppIdentity(projectName, args.appName)
	startApp()
})

app.on("window-all-closed", () => {
	if (cleanAllInProgress) return
	if (process.platform !== "darwin") app.quit()
})

app.on("will-quit", () => {
	const partition = config$.get().partition
	if (partition) {
		releasePartitionLock(partition)
	}
	cleanupAllPartitionCaches()
})
