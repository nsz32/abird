import { join } from "node:path"
import { BaseWindow, Menu, app } from "electron"
import { getAvailableApps, loadConfig, registerConfigHandlers, selectApp } from "./api/config"
import { registerNavigationHandlers, setupNavigationSync } from "./api/navigation"
import { createWindow } from "./window"

/**
 * Parse les arguments CLI pour extraire --app <name>
 */
function parseCliArgs(): { appName: string | null } {
	const args = process.argv.slice(2)
	const appIndex = args.indexOf("--app")
	if (appIndex !== -1 && args[appIndex + 1]) {
		return { appName: args[appIndex + 1] }
	}
	return { appName: null }
}

// Configurer userData vers ~/.local/share/bird (XDG_DATA_HOME)
// Les partitions seront dans ~/.local/share/bird/Partitions/<name>/
const xdgDataHome = process.env.XDG_DATA_HOME || join(app.getPath("home"), ".local", "share")
app.setPath("userData", join(xdgDataHome, "bird"))

app.whenReady().then(() => {
	Menu.setApplicationMenu(null)
	loadConfig()

	// Sélectionner l'app depuis CLI
	const { appName } = parseCliArgs()
	if (appName) {
		if (!selectApp(appName)) {
			console.error(`App "${appName}" not found. Available apps: ${getAvailableApps().join(", ")}`)
			app.quit()
			return
		}
	} else {
		// Pas d'app spécifiée - pour l'instant on quitte
		// Plus tard: afficher l'interface de configuration
		console.error(`No app specified. Use --app <name>. Available apps: ${getAvailableApps().join(", ")}`)
		app.quit()
		return
	}

	registerConfigHandlers()
	registerNavigationHandlers()
	setupNavigationSync()
	createWindow()

	app.on("activate", () => {
		if (BaseWindow.getAllWindows().length === 0) {
			createWindow()
		}
	})
})

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit()
	}
})
