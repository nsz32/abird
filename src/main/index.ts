import { BaseWindow, app } from "electron"
import { createWindow } from "./window"

app.whenReady().then(() => {
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
