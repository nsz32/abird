import type { TabInfo } from "@shared/types"
import { IpcChannels } from "@shared/types"
import { ipcMain } from "electron"
import { dismissNotification } from "../notifications/notify"
import {
	activeDownloads$,
	activeTab$,
	downloadHistory$,
	downloadPanelVisible$,
	findBarVisible$,
	findState$,
	navBarConfig$,
	navState$,
	notifications$,
	tabs$,
} from "../states"
import { activateTab, closeTab, createTab } from "../tabs/Tabs"

export function getTabsList(): TabInfo[] {
	const allTabs = tabs$.get()
	const activeId = activeTab$.get()?.id
	const hasNonProperChild = (id: string) => allTabs.some((t) => !t.proper && t.parentId === id)

	return allTabs
		.filter((t) => t.proper)
		.map((t) => ({
			id: t.id,
			title: t.navState$.get().title,
			url: t.navState$.get().url || t.initialUrl,
			favicon: t.favicon,
			isActive: t.id === activeId,
			isLoading: t.navState$.get().isLoading || hasNonProperChild(t.id),
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
	ipcMain.handle(IpcChannels.DOWNLOADS_TOGGLE, () => downloadPanelVisible$.emit(!downloadPanelVisible$.get()))
	ipcMain.handle(IpcChannels.DOWNLOADS_GET_HISTORY, () => downloadHistory$.get())
	ipcMain.handle(IpcChannels.DOWNLOADS_GET_ACTIVE, () => activeDownloads$.get())
	// Find in page
	ipcMain.handle(IpcChannels.FIND_SEARCH, (_, text: string) => {
		activeTab$.get()?.siteView.findInPage(text)
	})
	ipcMain.handle(IpcChannels.FIND_NEXT, () => {
		activeTab$.get()?.siteView.findNext()
	})
	ipcMain.handle(IpcChannels.FIND_PREV, () => {
		activeTab$.get()?.siteView.findPrev()
	})
	ipcMain.handle(IpcChannels.FIND_CLOSE, () => {
		activeTab$.get()?.siteView.stopFind()
		findBarVisible$.emit(false)
		findState$.emit({ text: "", activeMatch: 0, totalMatches: 0 })
	})
}
