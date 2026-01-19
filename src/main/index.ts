import { join } from "node:path"
import { app } from "electron"
import { getAvailableApps, loadConfig, selectApp, selectBrowserMode, selectConfigMode } from "./config"
import { startApp } from "./core/App"
import { parseCliArgs, printHelp } from "./core/cli"
import { parseShortcut, registerKioskExitShortcut } from "./core/kiosk"
import { kioskMode$ } from "./core/states"
import { initI18n } from "./core/I18n"
import { registerBirdScheme, setupBirdProtocol } from "./core/Protocol"
import { getAvailableUserAgents } from "./utils/userAgents"

// XDG compliant userData
const xdgDataHome = process.env.XDG_DATA_HOME || join(app.getPath("home"), ".local", "share")
app.setPath("userData", join(xdgDataHome, "bird"))
app.setName("okbird")

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
		selectBrowserMode(args.browserUrl, args.userAgent ?? undefined)
		startApp()
		return
	}

	if (!args.appName) {
		selectConfigMode()
		startApp()
		return
	}

	if (!selectApp(args.appName)) {
		console.error(`App "${args.appName}" not found. Available: ${getAvailableApps().join(", ")}`)
		app.quit()
		return
	}

	startApp()
})

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit()
})
