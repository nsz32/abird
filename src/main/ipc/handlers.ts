import type { TabInfo } from "@shared/types"
import { IpcChannels } from "@shared/types"
import { ipcMain } from "electron"
import { activeTab$, navBarConfig$, navState$, tabs$ } from "../states"
import { activateTab, closeTab, createTab } from "../tabs/Tabs"

export function getTabsList(): TabInfo[] {
	const activeId = activeTab$.get()?.id
	return tabs$.get().map((t) => ({ id: t.id, title: t.siteView.navState$.get().title || "New Tab", isActive: t.id === activeId }))
}

export function registerHandlers() {
	ipcMain.handle(IpcChannels.NAVIGATION_GET_STATE, () => navState$.get())
	ipcMain.handle(IpcChannels.NAVIGATION_BACK, () => activeTab$.get()?.siteView.back())
	ipcMain.handle(IpcChannels.NAVIGATION_FORWARD, () => activeTab$.get()?.siteView.forward())
	ipcMain.handle(IpcChannels.NAVIGATION_RELOAD, (_, ignoreCache?: boolean) => activeTab$.get()?.siteView.reload(ignoreCache))
	ipcMain.handle(IpcChannels.NAVIGATION_GO_TO, (_, url: string) => activeTab$.get()?.siteView.goTo(url))
	ipcMain.handle(IpcChannels.TABS_GET_LIST, () => getTabsList())
	ipcMain.handle(IpcChannels.TABS_ACTIVATE, (_, id: string) => activateTab(id))
	ipcMain.handle(IpcChannels.TABS_CLOSE, (_, id: string) => closeTab(id))
	ipcMain.handle(IpcChannels.TABS_CREATE, () => createTab())
	ipcMain.handle(IpcChannels.CONFIG_GET_NAVBAR, () => navBarConfig$.get())
}
