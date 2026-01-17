import { IpcChannels } from "@shared/types"
import { ipcMain } from "electron"
import { readRawConfig, writeRawConfig } from "./config"
import { DOWNLOADS_VIEW_ID } from "./core/App"
import { getTranslations } from "./core/I18n"
import { ViewManager } from "./core/ViewManager"
import {
	activeContentId$,
	activeDownloads$,
	activeTabId$,
	config$,
	downloadHistory$,
	findBarVisible$,
	findState$,
	navState$,
	notifications$,
} from "./core/states"
import { fetchIcons, saveIcon } from "./services/icons"
import { dismissNotification } from "./services/notify"
import { activateTab, closeTab, createTab, getActiveTab, getTabsList } from "./tabs/Tabs"

export function registerHandlers() {
	ipcMain.handle(IpcChannels.NAVIGATION_GET_STATE, () => navState$.get())
	ipcMain.handle(IpcChannels.NAVIGATION_BACK, () => getActiveTab()?.view.back())
	ipcMain.handle(IpcChannels.NAVIGATION_FORWARD, () => getActiveTab()?.view.forward())
	ipcMain.handle(IpcChannels.NAVIGATION_RELOAD, (_, ignoreCache?: boolean) => getActiveTab()?.view.reload(ignoreCache))
	ipcMain.handle(IpcChannels.NAVIGATION_STOP, () => getActiveTab()?.view.stop())
	ipcMain.handle(IpcChannels.NAVIGATION_GO_TO, (_, url: string) => getActiveTab()?.webView.goTo(url))
	ipcMain.handle(IpcChannels.NAVIGATION_GO_HOME, () => getActiveTab()?.webView.goTo(config$.get().startUrl))
	ipcMain.handle(IpcChannels.TABS_GET_LIST, () => getTabsList())
	ipcMain.handle(IpcChannels.TABS_ACTIVATE, (_, id: string) => activateTab(id))
	ipcMain.handle(IpcChannels.TABS_CLOSE, (_, id: string) => closeTab(id))
	ipcMain.handle(IpcChannels.TABS_CREATE, (_, index?: number) => {
		createTab(undefined, "user", index)
	})
	ipcMain.handle(IpcChannels.CONFIG_GET, () => config$.get())
	ipcMain.handle(IpcChannels.NOTIF_GET_LIST, () => notifications$.get())
	ipcMain.handle(IpcChannels.NOTIF_DISMISS, (_, id: string) => dismissNotification(id))
	ipcMain.handle(IpcChannels.DOWNLOADS_TOGGLE, () => {
		const isDownloadsActive = activeContentId$.get() === DOWNLOADS_VIEW_ID
		if (isDownloadsActive) {
			const tabId = activeTabId$.get()
			if (tabId) activateTab(tabId)
		} else {
			ViewManager.get().showContent(DOWNLOADS_VIEW_ID)
		}
	})
	ipcMain.handle(IpcChannels.DOWNLOADS_GET_HISTORY, () => downloadHistory$.get())
	ipcMain.handle(IpcChannels.DOWNLOADS_GET_ACTIVE, () => activeDownloads$.get())

	// Find in page
	ipcMain.handle(IpcChannels.FIND_SEARCH, (_, text: string) => {
		const tab = getActiveTab()
		if (tab) {
			tab.findBarVisible = true
			tab.view.findInPage(text)
		}
	})
	ipcMain.handle(IpcChannels.FIND_NEXT, () => {
		getActiveTab()?.view.findNext()
	})
	ipcMain.handle(IpcChannels.FIND_PREV, () => {
		getActiveTab()?.view.findPrev()
	})
	ipcMain.handle(IpcChannels.FIND_CLOSE, () => {
		const tab = getActiveTab()
		if (tab) {
			tab.findBarVisible = false
			tab.findState = { text: "", activeMatch: 0, totalMatches: 0 }
			tab.view.stopFind()
		}
		findBarVisible$.emit(false)
		findState$.emit({ text: "", activeMatch: 0, totalMatches: 0 })
	})

	// User config (raw JSON)
	ipcMain.handle(IpcChannels.USERCONFIG_READ, () => readRawConfig())
	ipcMain.handle(IpcChannels.USERCONFIG_WRITE, (_, content: unknown) => writeRawConfig(content))

	// I18n
	ipcMain.handle(IpcChannels.I18N_GET_TRANSLATIONS, () => getTranslations())

	// Icons
	ipcMain.handle(IpcChannels.ICONS_FETCH, (_, url: string, partition?: string) => fetchIcons(url, partition))
	ipcMain.handle(IpcChannels.ICONS_SAVE, (_, appName: string, base64: string, oldIcon?: string) => saveIcon(appName, base64, oldIcon))
}
