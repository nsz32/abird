import { IpcChannels } from "@shared/types"
import { ipcMain } from "electron"
import { dismissNotification } from "../notifications/notify"
import {
	activeDownloads$,
	activeTab$,
	config$,
	downloadHistory$,
	downloadPanelVisible$,
	findBarVisible$,
	findState$,
	navState$,
	notifications$,
} from "../states"
import { activateTab, closeTab, createTab, getTabsList } from "../tabs/Tabs"

export function registerHandlers() {
	ipcMain.handle(IpcChannels.NAVIGATION_GET_STATE, () => navState$.get())
	ipcMain.handle(IpcChannels.NAVIGATION_BACK, () => activeTab$.get()?.siteView.back())
	ipcMain.handle(IpcChannels.NAVIGATION_FORWARD, () => activeTab$.get()?.siteView.forward())
	ipcMain.handle(IpcChannels.NAVIGATION_RELOAD, (_, ignoreCache?: boolean) => activeTab$.get()?.siteView.reload(ignoreCache))
	ipcMain.handle(IpcChannels.NAVIGATION_STOP, () => activeTab$.get()?.siteView.stop())
	ipcMain.handle(IpcChannels.NAVIGATION_GO_TO, (_, url: string) => activeTab$.get()?.siteView.goTo(url))
	ipcMain.handle(IpcChannels.NAVIGATION_GO_HOME, () => activeTab$.get()?.siteView.goTo(config$.get().startUrl))
	ipcMain.handle(IpcChannels.TABS_GET_LIST, () => getTabsList())
	ipcMain.handle(IpcChannels.TABS_ACTIVATE, (_, id: string) => activateTab(id))
	ipcMain.handle(IpcChannels.TABS_CLOSE, (_, id: string) => closeTab(id))
	ipcMain.handle(IpcChannels.TABS_CREATE, (_, index?: number) => {
		createTab(undefined, "user", index)
	})
	ipcMain.handle(IpcChannels.CONFIG_GET, () => config$.get())
	ipcMain.handle(IpcChannels.NOTIF_GET_LIST, () => notifications$.get())
	ipcMain.handle(IpcChannels.NOTIF_DISMISS, (_, id: string) => dismissNotification(id))
	ipcMain.handle(IpcChannels.DOWNLOADS_TOGGLE, () => downloadPanelVisible$.emit(!downloadPanelVisible$.get()))
	ipcMain.handle(IpcChannels.DOWNLOADS_GET_HISTORY, () => downloadHistory$.get())
	ipcMain.handle(IpcChannels.DOWNLOADS_GET_ACTIVE, () => activeDownloads$.get())
	// Find in page
	ipcMain.handle(IpcChannels.FIND_SEARCH, (_, text: string) => {
		const tab = activeTab$.get()
		if (tab) {
			tab.findBarVisible = true
			tab.siteView.findInPage(text)
		}
	})
	ipcMain.handle(IpcChannels.FIND_NEXT, () => {
		activeTab$.get()?.siteView.findNext()
	})
	ipcMain.handle(IpcChannels.FIND_PREV, () => {
		activeTab$.get()?.siteView.findPrev()
	})
	ipcMain.handle(IpcChannels.FIND_CLOSE, () => {
		const tab = activeTab$.get()
		if (tab) {
			tab.findBarVisible = false
			tab.findState = { text: "", activeMatch: 0, totalMatches: 0 }
			tab.siteView.stopFind()
		}
		findBarVisible$.emit(false)
		findState$.emit({ text: "", activeMatch: 0, totalMatches: 0 })
	})
}
