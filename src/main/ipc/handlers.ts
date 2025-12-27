import type { TabInfo } from "@shared/types"
import { IpcChannels } from "@shared/types"
import { ipcMain } from "electron"
import { dismissNotification } from "../notifications/notify"
import { activeTab$, navBarConfig$, navState$, notifications$, tabs$ } from "../states"
import { activateTab, closeTab, createTab } from "../tabs/Tabs"

export function getTabsList(): TabInfo[] {
	const activeId = activeTab$.get()?.id
	return tabs$
		.get()
		.filter((t) => t.proper)
		.map((t) => ({
			id: t.id,
			title: t.navState$.get().title,
			url: t.navState$.get().url || t.initialUrl,
			favicon: t.favicon,
			isActive: t.id === activeId,
			isLoading: t.navState$.get().isLoading,
		}))
}

export function registerHandlers() {
	ipcMain.handle(IpcChannels.NAVIGATION_GET_STATE, () => navState$.get())
	ipcMain.handle(IpcChannels.NAVIGATION_BACK, () => activeTab$.get()?.siteView.back())
	ipcMain.handle(IpcChannels.NAVIGATION_FORWARD, () => activeTab$.get()?.siteView.forward())
	ipcMain.handle(IpcChannels.NAVIGATION_RELOAD, (_, ignoreCache?: boolean) => activeTab$.get()?.siteView.reload(ignoreCache))
	ipcMain.handle(IpcChannels.NAVIGATION_STOP, () => activeTab$.get()?.siteView.stop())
	ipcMain.handle(IpcChannels.NAVIGATION_GO_TO, (_, url: string) => activeTab$.get()?.siteView.goTo(url))
	ipcMain.handle(IpcChannels.TABS_GET_LIST, () => getTabsList())
	ipcMain.handle(IpcChannels.TABS_ACTIVATE, (_, id: string) => activateTab(id))
	ipcMain.handle(IpcChannels.TABS_CLOSE, (_, id: string) => closeTab(id))
	ipcMain.handle(IpcChannels.TABS_CREATE, (_, index?: number) => createTab(undefined, "user", index))
	ipcMain.handle(IpcChannels.CONFIG_GET_NAVBAR, () => navBarConfig$.get())
	ipcMain.handle(IpcChannels.NOTIF_GET_LIST, () => notifications$.get())
	ipcMain.handle(IpcChannels.NOTIF_DISMISS, (_, id: string) => dismissNotification(id))
}
