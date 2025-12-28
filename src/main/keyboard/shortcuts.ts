import { globalShortcut, shell } from "electron"
import { activeTab$ } from "../states"
import { closeTab } from "../tabs/Tabs"

interface ShortcutCallbacks {
	isWindowFocused: () => boolean
	onFocusUrl: () => void
}

export function registerGlobalShortcuts(callbacks: ShortcutCallbacks) {
	const { isWindowFocused, onFocusUrl } = callbacks

	globalShortcut.register("CommandOrControl+W", () => {
		if (!isWindowFocused()) return
		const activeTab = activeTab$.get()
		if (activeTab) closeTab(activeTab.id)
	})

	globalShortcut.register("CommandOrControl+E", () => {
		if (!isWindowFocused()) return
		const activeTab = activeTab$.get()
		if (activeTab) {
			const url = activeTab.navState$.get().url || activeTab.initialUrl
			if (url && url !== "about:blank") shell.openExternal(url)
		}
	})

	globalShortcut.register("CommandOrControl+L", () => {
		if (!isWindowFocused()) return
		onFocusUrl()
	})
}

export function unregisterGlobalShortcuts() {
	globalShortcut.unregisterAll()
}
