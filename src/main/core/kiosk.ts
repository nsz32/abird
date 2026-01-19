import type { BaseWindow } from "electron"
import { UiohookKey } from "uiohook-napi"
import { kioskMode$ } from "./states"

let exitShortcutKeycodes: number[] = []
let kioskBounds: { width: number; height: number } | null = null

/** Parse a shortcut string like "Ctrl+Alt+K" into UiohookKey codes */
export function parseShortcut(combo: string): number[] | null {
	const parts = combo
		.split("+")
		.map((p) => p.trim())
		.filter(Boolean)

	if (parts.length === 0) {
		console.error("--kiosk requires a valid shortcut, e.g. --kiosk Ctrl+Alt+K")
		printAvailableKeys()
		return null
	}

	const keycodes: number[] = []
	const invalidKeys: string[] = []

	for (const part of parts) {
		const keycode = UiohookKey[part as keyof typeof UiohookKey]
		if (keycode === undefined) {
			invalidKeys.push(part)
		} else {
			keycodes.push(keycode)
		}
	}

	if (invalidKeys.length > 0) {
		console.error(`Invalid keys in shortcut: ${invalidKeys.join(", ")}`)
		printAvailableKeys()
		return null
	}

	return keycodes
}

function printAvailableKeys(): void {
	const keys = Object.keys(UiohookKey).filter((k) => Number.isNaN(Number(k)))
	console.error(`Available keys: ${keys.join(", ")}`)
}

/** Register the exit shortcut keycodes */
export function registerKioskExitShortcut(keycodes: number[]): void {
	exitShortcutKeycodes = keycodes
}

/** Check if the exit shortcut is currently pressed */
export function checkKioskExitShortcut(pressed: Set<number>, keycode: number): boolean {
	if (exitShortcutKeycodes.length === 0) return false
	if (!kioskMode$.get()) return false

	const lastKey = exitShortcutKeycodes[exitShortcutKeycodes.length - 1]
	if (keycode !== lastKey) return false

	return exitShortcutKeycodes.every((k) => pressed.has(k))
}

/** Setup kiosk mode handlers on a window */
export function setupKiosk(window: BaseWindow): void {
	window.on("resize", () => {
		if (!kioskMode$.get()) return

		const bounds = window.getBounds()

		if (!kioskBounds) {
			kioskBounds = { width: bounds.width, height: bounds.height }
		} else if (bounds.width < kioskBounds.width || bounds.height < kioskBounds.height) {
			window.setKiosk(false)
			window.setKiosk(true)
		}
	})

	window.on("blur", () => {
		if (kioskMode$.get()) window.focus()
	})

	kioskMode$.subscribe((enabled) => {
		if (!enabled) {
			window.setKiosk(false)
			kioskBounds = null
		}
	})
}
