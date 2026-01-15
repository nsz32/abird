import { join } from "node:path"
import { app } from "electron"
import { startApp } from "./core/App"
import { getAvailableApps, loadConfig, selectApp, selectConfigMode } from "./core/Config"
import { initI18n } from "./core/I18n"
import { registerBirdScheme, setupBirdProtocol } from "./core/Protocol"

function parseCliArgs(): { appName: string | null; configPath: string | null } {
	const args = process.argv.slice(2)
	const appIndex = args.indexOf("--app")
	const configIndex = args.indexOf("--config")
	return {
		appName: appIndex !== -1 ? args[appIndex + 1] : null,
		configPath: configIndex !== -1 ? args[configIndex + 1] : null,
	}
}

// XDG compliant userData
const xdgDataHome = process.env.XDG_DATA_HOME || join(app.getPath("home"), ".local", "share")
app.setPath("userData", join(xdgDataHome, "bird"))
app.setName("okbird")

// Must be called before app.whenReady()
registerBirdScheme()

app.whenReady().then(() => {
	const { appName, configPath } = parseCliArgs()
	loadConfig(configPath)
	initI18n()
	setupBirdProtocol()

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
