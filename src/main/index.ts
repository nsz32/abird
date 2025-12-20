import { BaseWindow, Menu, app } from "electron"
import { loadConfig, registerConfigHandlers } from "./api/config"
import { registerNavigationHandlers, setupNavigationStateSync } from "./api/navigation"
import { createWindow } from "./window"

app.whenReady().then(() => {
	Menu.setApplicationMenu(null)
	loadConfig()
	registerConfigHandlers()
	registerNavigationHandlers()
	createWindow()
	setupNavigationStateSync()

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
