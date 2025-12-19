import { BaseWindow, app } from "electron"
import { registerNavigationHandlers, setupNavigationStateSync } from "./api/navigation"
import { createWindow } from "./window"

app.whenReady().then(() => {
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
