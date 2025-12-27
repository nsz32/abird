import type { Input, WebContents } from "electron"
import { activeTab$ } from "../states"
import { closeTab } from "../tabs/Tabs"

type ShortcutHandler = () => void

const APP_SHORTCUTS: Record<string, ShortcutHandler> = {
	"ctrl+w": () => {
		const activeTab = activeTab$.get()
		if (activeTab) closeTab(activeTab.id)
	},
}

function inputToAccelerator(input: Input): string | null {
	if (input.type !== "keyDown") return null

	const parts: string[] = []
	if (input.control || input.meta) parts.push("ctrl")
	if (input.shift) parts.push("shift")
	if (input.alt) parts.push("alt")

	if (parts.length === 0) return null

	parts.push(input.key.toLowerCase())
	return parts.join("+")
}

export function registerAppShortcuts(webContents: WebContents) {
	webContents.on("before-input-event", (event, input) => {
		const accelerator = inputToAccelerator(input)
		if (!accelerator) return

		const handler = APP_SHORTCUTS[accelerator]
		if (handler) {
			event.preventDefault()
			handler()
		}
	})
}
