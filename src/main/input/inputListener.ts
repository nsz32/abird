import { app } from "electron"
import { UiohookKey, uIOhook } from "uiohook-napi"
import { checkKioskExitShortcut } from "../core/kiosk"
import { ctrlPressed$, kioskMode$ } from "../core/states"

const pressed = new Set<number>()

export function setupInputListener() {
	uIOhook.on("keydown", (e) => {
		pressed.add(e.keycode)

		if (checkKioskExitShortcut(pressed, e.keycode)) {
			kioskMode$.emit(false)
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
