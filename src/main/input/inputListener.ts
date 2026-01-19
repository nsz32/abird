import { app } from "electron"
import { UiohookKey, uIOhook } from "uiohook-napi"
import { ctrlPressed$, kioskMode$ } from "../core/states"

const pressed = new Set<number>()

export function setupInputListener() {
	uIOhook.on("keydown", (e) => {
		pressed.add(e.keycode)

		if (pressed.has(UiohookKey.Ctrl) && pressed.has(UiohookKey.Alt) && e.keycode === UiohookKey.K) {
			if (kioskMode$.get()) kioskMode$.emit(false)
		}

		if (e.keycode === UiohookKey.Ctrl || e.keycode === UiohookKey.CtrlRight) {
			ctrlPressed$.emit(true)
		}
	})

	uIOhook.on("keyup", (e) => {
		pressed.delete(e.keycode)

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
