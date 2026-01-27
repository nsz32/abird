import { IpcChannels } from "@shared/types"
import { BaseWindow, app, dialog, ipcMain, shell } from "electron"
import { getBirdConfig, readRawConfig, writeRawConfig } from "./config"
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
	navBarForceShow$,
	navState$,
	notifications$,
} from "./core/states"
import { setCleanAllInProgress } from "./index"
import { cancelDownload, getDownloadPath, removeFromHistory, retryDownload } from "./services/DownloadManager"
import { cleanupPartition, deletePartition, getPartitionsState, renamePartition, resetPartition } from "./services/PartitionManager"
import { deploy, getDeployState, isDeploySupported, isDeployed, isLaunchSupported, launchApp, renameDeploy, undeploy } from "./services/deploy"
import { deleteIcon, fetchIcons, getIconData, importIconFile, saveIcon } from "./services/icons"
import { dismissNotification } from "./services/notify"
import { activateTab, closeTab, createTab, getActiveTab, getTabsList } from "./tabs/Tabs"
import { performCleanAll } from "./utils/cleanup"
import { createLogger } from "./utils/logger"
import { openFile } from "./utils/platform"
import { getAvailableUserAgents, getDefaultUserAgent } from "./utils/userAgents"

const log = createLogger("IPC")

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
	ipcMain.handle(IpcChannels.DOWNLOADS_OPEN_FILE, (_, id: string) => {
		const path = getDownloadPath(id)
		if (path) return openFile(path)
	})
	ipcMain.handle(IpcChannels.DOWNLOADS_OPEN_FOLDER, (_, id: string) => {
		const path = getDownloadPath(id)
		if (path) shell.showItemInFolder(path)
	})
	ipcMain.handle(IpcChannels.DOWNLOADS_CANCEL, (_, id: string) => cancelDownload(id))
	ipcMain.handle(IpcChannels.DOWNLOADS_RETRY, (_, id: string) => retryDownload(id))
	ipcMain.handle(IpcChannels.DOWNLOADS_REMOVE, (_, id: string) => removeFromHistory(id))

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
	ipcMain.handle(IpcChannels.ICONS_IMPORT_FILE, (_, appName: string, oldIcon?: string) => importIconFile(appName, oldIcon))
	ipcMain.handle(IpcChannels.ICONS_DELETE, (_, filename: string) => deleteIcon(filename))
	ipcMain.handle(IpcChannels.ICONS_GET_DATA, (_, filename: string) => getIconData(filename))

	// Deploy
	ipcMain.handle(IpcChannels.DEPLOY_SUPPORTED, () => isDeploySupported())
	ipcMain.handle(IpcChannels.DEPLOY_STATUS, (_, appName: string) => isDeployed(appName))
	ipcMain.handle(IpcChannels.DEPLOY_LIST, (_, appNames: string[]) => getDeployState(appNames))
	ipcMain.handle(IpcChannels.DEPLOY_APP, (_, appName: string) => {
		const appConfig = getBirdConfig().apps[appName]
		if (!appConfig) throw new Error(`App not found: ${appName}`)
		deploy(appName, appConfig)
	})
	ipcMain.handle(IpcChannels.UNDEPLOY_APP, (_, appName: string) => undeploy(appName))
	ipcMain.handle(IpcChannels.DEPLOY_RENAME, (_, oldName: string, newName: string) => {
		const appConfig = getBirdConfig().apps[newName]
		if (!appConfig) throw new Error(`App not found: ${newName}`)
		renameDeploy(oldName, newName, appConfig)
	})

	// Partition management
	ipcMain.handle(IpcChannels.PARTITION_LIST, () => {
		try {
			return getPartitionsState()
		} catch (err) {
			log.error("Failed to get partition state:", err)
			return { partitions: [], physicalPath: "" }
		}
	})
	ipcMain.handle(IpcChannels.PARTITION_CLEANUP, (_, name: string) => cleanupPartition(name))
	ipcMain.handle(IpcChannels.PARTITION_RESET, (_, name: string) => resetPartition(name))
	ipcMain.handle(IpcChannels.PARTITION_DELETE, (_, name: string) => deletePartition(name))
	ipcMain.handle(IpcChannels.PARTITION_RENAME, (_, oldName: string, newName: string) => renamePartition(oldName, newName))

	// App launch
	ipcMain.handle(IpcChannels.APP_LAUNCH_SUPPORTED, () => isLaunchSupported())
	ipcMain.handle(IpcChannels.APP_LAUNCH, (_, appName: string) => launchApp(appName))
	ipcMain.handle(IpcChannels.APP_CLEAN_ALL, async () => {
		setCleanAllInProgress(true)

		const windows = BaseWindow.getAllWindows()
		await Promise.all(
			windows.map(
				(win) =>
					new Promise<void>((resolve) => {
						win.once("closed", resolve)
						win.close()
					}),
			),
		)

		await new Promise((resolve) => setTimeout(resolve, 500))

		performCleanAll()
		app.quit()
	})

	// Navbar auto-hide
	ipcMain.on(IpcChannels.NAVBAR_URL_EDIT_MODE, (_, active: boolean) => {
		const current = navBarForceShow$.get()
		if (active !== current.urlEdit) {
			navBarForceShow$.emit({ ...current, urlEdit: active })
		}
	})

	// Settings
	ipcMain.handle(IpcChannels.SETTINGS_GET_DEFAULT_DOWNLOADS_PATH, () => app.getPath("downloads"))
	ipcMain.handle(IpcChannels.SETTINGS_SELECT_DIRECTORY, async (_, defaultPath?: string) => {
		const result = await dialog.showOpenDialog({
			properties: ["openDirectory"],
			defaultPath: defaultPath || app.getPath("downloads"),
		})
		return result.canceled ? null : result.filePaths[0]
	})
	ipcMain.handle(IpcChannels.SETTINGS_GET_USER_AGENTS, () => ({
		keys: getAvailableUserAgents(),
		defaultKey: getDefaultUserAgent(),
	}))
}
