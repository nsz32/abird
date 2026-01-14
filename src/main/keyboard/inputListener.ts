import { app } from "electron"

export function setupInputListener() {
	app.on("web-contents-created", (_, webContents) => {
		webContents.on("before-input-event", (_, input) => {
			if (input.type === "keyDown") {
				if (input.control) {
					console.log("[Input] CTRL +", input.key)
				} else {
					console.log("[Input]", input.key)
				}
			}
		})
	})
}
