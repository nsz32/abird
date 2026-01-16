import { app } from "electron"
import { UiohookKey, uIOhook } from "uiohook-napi"
import { ctrlPressed$ } from "../core/states"

export function setupInputListener() {
	uIOhook.on("keydown", (e) => {
		if (e.keycode === UiohookKey.Ctrl || e.keycode === UiohookKey.CtrlRight) {
			ctrlPressed$.emit(true)
		}
	})

	uIOhook.on("keyup", (e) => {
		if (e.keycode === UiohookKey.Ctrl || e.keycode === UiohookKey.CtrlRight) {
			ctrlPressed$.emit(false)
		}
	})

	uIOhook.start()

	app.on("will-quit", () => {
		console.log("stopping uiokook")
		uIOhook.stop()
	})
}
