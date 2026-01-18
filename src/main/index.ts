import { join } from "node:path"
import { app } from "electron"
import { getAvailableApps, loadConfig, selectApp, selectBrowserMode, selectConfigMode } from "./config"
import { startApp } from "./core/App"
import { initI18n } from "./core/I18n"
import { registerBirdScheme, setupBirdProtocol } from "./core/Protocol"
import { getAvailableUserAgents } from "./utils/userAgents"

interface CliArgs {
	appName: string | null
	configPath: string | null
	browserUrl: string | null
	userAgent: string | null
	listUserAgents: boolean
}

function parseCliArgs(): CliArgs {
	const args = process.argv.slice(2)
	const appIndex = args.indexOf("--app")
	const configIndex = args.indexOf("--config")
	const userAgentIndex = args.indexOf("--userAgent")

	const firstArg = args[0]
	const browserUrl = firstArg?.match(/^https?:\/\//) ? firstArg : null

	let userAgent: string | null = null
	let listUserAgents = false

	if (userAgentIndex !== -1) {
		const nextArg = args[userAgentIndex + 1]
		if (!nextArg || nextArg.startsWith("--")) {
			listUserAgents = true
		} else {
			userAgent = nextArg
		}
	}

	return {
		appName: appIndex !== -1 ? args[appIndex + 1] : null,
		configPath: configIndex !== -1 ? args[configIndex + 1] : null,
		browserUrl,
		userAgent,
		listUserAgents,
	}
}

// XDG compliant userData
const xdgDataHome = process.env.XDG_DATA_HOME || join(app.getPath("home"), ".local", "share")
app.setPath("userData", join(xdgDataHome, "bird"))
app.setName("okbird")

// Must be called before app.whenReady()
registerBirdScheme()

app.whenReady().then(() => {
	const { appName, configPath, browserUrl, userAgent, listUserAgents } = parseCliArgs()

	if (listUserAgents) {
		console.log("Available user agents:\n")
		for (const ua of getAvailableUserAgents()) {
			console.log(`  ${ua}`)
		}
		app.quit()
		return
	}

	loadConfig(configPath)
	initI18n()
	setupBirdProtocol()

	if (browserUrl) {
		selectBrowserMode(browserUrl, userAgent ?? undefined)
		startApp()
		return
	}

	if (!appName) {
		selectConfigMode()
		startApp()
		return
	}

	if (!selectApp(appName)) {
		console.error(`App "${appName}" not found. Available: ${getAvailableApps().join(", ")}`)
		app.quit()
		return
	}

	startApp()
})

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit()
})
