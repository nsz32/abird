import { type Rectangle, app } from "electron"
import { UiohookKey, uIOhook } from "uiohook-napi"
import { checkKioskExitShortcut } from "../core/kiosk"
import { config$, ctrlPressed$, kioskMode$, navBarForceShow$, navBarHeight$ } from "../core/states"
import { createLogger } from "../utils/logger"

const log = createLogger("InputListener")

const pressed = new Set<number>()

// Hysteresis thresholds (relative to navbar height)
const SHOW_THRESHOLD = 0.75 // Enter zone at 75% of navbar height to show
const HIDE_THRESHOLD = 1.0 // Leave zone at 100% of navbar height to hide

let mainWindowRef: { getBounds: () => Rectangle } | null = null

export function setMainWindowRef(window: { getBounds: () => Rectangle }) {
	mainWindowRef = window
}

function checkMouseInNavBarZone(mouseX: number, mouseY: number): boolean {
	if (!mainWindowRef) return false

	const config = config$.get()
	if (!config.navBar.autoHide) return false

	const bounds = mainWindowRef.getBounds()

	// Check if mouse is within window horizontal bounds
	if (mouseX < bounds.x || mouseX > bounds.x + bounds.width) return false

	// Use hysteresis: different threshold based on current state
	const currentlyVisible = navBarForceShow$.get().mouseHover
	const navHeight = navBarHeight$.get() || 40
	const threshold = navHeight * (currentlyVisible ? HIDE_THRESHOLD : SHOW_THRESHOLD)

	// Check if mouse is in trigger zone (top or bottom)
	if (config.navBar.position === "top") {
		return mouseY >= bounds.y && mouseY <= bounds.y + threshold
	}
	return mouseY >= bounds.y + bounds.height - threshold && mouseY <= bounds.y + bounds.height
}

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

	uIOhook.on("mousemove", (e) => {
		const current = navBarForceShow$.get()
		const inZone = checkMouseInNavBarZone(e.x, e.y)

		if (inZone !== current.mouseHover) {
			navBarForceShow$.emit({ ...current, mouseHover: inZone })
		}
	})

	uIOhook.start()

	app.on("will-quit", () => {
		log.debug("Stopping uIOhook")
		uIOhook.stop()
	})
}
