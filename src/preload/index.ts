import type { Translations } from "@shared/i18n/translations"
import {
	type ActiveDownload,
	type DownloadEvent,
	type DownloadHistoryItem,
	type EffectiveConfig,
	type FindState,
	type IconData,
	type IconFetchResult,
	IpcChannels,
	type NavigationState,
	type Notification,
	type PartitionsState,
	type TabInfo,
} from "@shared/types"
import { contextBridge, ipcRenderer } from "electron"

// API exposed to UI components
contextBridge.exposeInMainWorld("bird", {
	navigation: {
		back: () => ipcRenderer.invoke(IpcChannels.NAVIGATION_BACK),
		forward: () => ipcRenderer.invoke(IpcChannels.NAVIGATION_FORWARD),
		reload: (ignoreCache?: boolean) => ipcRenderer.invoke(IpcChannels.NAVIGATION_RELOAD, ignoreCache),
		stop: () => ipcRenderer.invoke(IpcChannels.NAVIGATION_STOP),
		goTo: (url: string) => ipcRenderer.invoke(IpcChannels.NAVIGATION_GO_TO, url),
		goHome: () => ipcRenderer.invoke(IpcChannels.NAVIGATION_GO_HOME),
		getState: (): Promise<NavigationState> => ipcRenderer.invoke(IpcChannels.NAVIGATION_GET_STATE),
		onStateChanged: (callback: (state: NavigationState) => void): (() => void) => {
			const listener = (_event: Electron.IpcRendererEvent, state: NavigationState) => callback(state)
			ipcRenderer.on(IpcChannels.NAVIGATION_STATE_CHANGED, listener)
			return () => ipcRenderer.removeListener(IpcChannels.NAVIGATION_STATE_CHANGED, listener)
		},
	},
	tabs: {
		getList: (): Promise<TabInfo[]> => ipcRenderer.invoke(IpcChannels.TABS_GET_LIST),
		onListChanged: (callback: (tabs: TabInfo[]) => void): (() => void) => {
			const listener = (_event: Electron.IpcRendererEvent, tabs: TabInfo[]) => callback(tabs)
			ipcRenderer.on(IpcChannels.TABS_LIST_CHANGED, listener)
			return () => ipcRenderer.removeListener(IpcChannels.TABS_LIST_CHANGED, listener)
		},
		onExternalOpened: (callback: (tabId: string) => void): (() => void) => {
			const listener = (_event: Electron.IpcRendererEvent, tabId: string) => callback(tabId)
			ipcRenderer.on(IpcChannels.TABS_EXTERNAL_OPENED, listener)
			return () => ipcRenderer.removeListener(IpcChannels.TABS_EXTERNAL_OPENED, listener)
		},
		activate: (id: string) => ipcRenderer.invoke(IpcChannels.TABS_ACTIVATE, id),
		close: (id: string) => ipcRenderer.invoke(IpcChannels.TABS_CLOSE, id),
		create: (index?: number) => ipcRenderer.invoke(IpcChannels.TABS_CREATE, index),
	},
	config: {
		get: (): Promise<EffectiveConfig> => ipcRenderer.invoke(IpcChannels.CONFIG_GET),
	},
	navbar: {
		resize: (height: number) => ipcRenderer.send(IpcChannels.NAVBAR_RESIZE, height),
	},
	commands: {
		onFocusUrl: (callback: () => void): (() => void) => {
			const listener = () => callback()
			ipcRenderer.on(IpcChannels.COMMAND_FOCUS_URL, listener)
			return () => ipcRenderer.removeListener(IpcChannels.COMMAND_FOCUS_URL, listener)
		},
	},
	notifications: {
		getList: (): Promise<Notification[]> => ipcRenderer.invoke(IpcChannels.NOTIF_GET_LIST),
		onListChanged: (callback: (notifications: Notification[]) => void): (() => void) => {
			const listener = (_event: Electron.IpcRendererEvent, notifications: Notification[]) => callback(notifications)
			ipcRenderer.on(IpcChannels.NOTIF_LIST_CHANGED, listener)
			return () => ipcRenderer.removeListener(IpcChannels.NOTIF_LIST_CHANGED, listener)
		},
		dismiss: (id: string) => ipcRenderer.invoke(IpcChannels.NOTIF_DISMISS, id),
		resize: (width: number, height: number) => ipcRenderer.send(IpcChannels.NOTIF_RESIZE, width, height),
	},
	downloads: {
		toggle: () => ipcRenderer.invoke(IpcChannels.DOWNLOADS_TOGGLE),
		getHistory: (): Promise<DownloadHistoryItem[]> => ipcRenderer.invoke(IpcChannels.DOWNLOADS_GET_HISTORY),
		getActive: (): Promise<ActiveDownload[]> => ipcRenderer.invoke(IpcChannels.DOWNLOADS_GET_ACTIVE),
		onHistoryChanged: (callback: (items: DownloadHistoryItem[]) => void): (() => void) => {
			const listener = (_event: Electron.IpcRendererEvent, items: DownloadHistoryItem[]) => callback(items)
			ipcRenderer.on(IpcChannels.DOWNLOADS_HISTORY_CHANGED, listener)
			return () => ipcRenderer.removeListener(IpcChannels.DOWNLOADS_HISTORY_CHANGED, listener)
		},
		onActiveChanged: (callback: (items: ActiveDownload[]) => void): (() => void) => {
			const listener = (_event: Electron.IpcRendererEvent, items: ActiveDownload[]) => callback(items)
			ipcRenderer.on(IpcChannels.DOWNLOADS_ACTIVE_CHANGED, listener)
			return () => ipcRenderer.removeListener(IpcChannels.DOWNLOADS_ACTIVE_CHANGED, listener)
		},
		onEvent: (callback: (event: DownloadEvent) => void): (() => void) => {
			const listener = (_event: Electron.IpcRendererEvent, event: DownloadEvent) => callback(event)
			ipcRenderer.on(IpcChannels.DOWNLOADS_EVENT, listener)
			return () => ipcRenderer.removeListener(IpcChannels.DOWNLOADS_EVENT, listener)
		},
		panelResize: (width: number, height: number) => ipcRenderer.send(IpcChannels.DOWNLOADS_PANEL_RESIZE, width, height),
		openFile: (id: string) => ipcRenderer.invoke(IpcChannels.DOWNLOADS_OPEN_FILE, id),
		openFolder: (id: string) => ipcRenderer.invoke(IpcChannels.DOWNLOADS_OPEN_FOLDER, id),
		cancel: (id: string) => ipcRenderer.invoke(IpcChannels.DOWNLOADS_CANCEL, id),
		retry: (id: string) => ipcRenderer.invoke(IpcChannels.DOWNLOADS_RETRY, id),
		remove: (id: string) => ipcRenderer.invoke(IpcChannels.DOWNLOADS_REMOVE, id),
	},
	find: {
		search: (text: string) => ipcRenderer.invoke(IpcChannels.FIND_SEARCH, text),
		next: () => ipcRenderer.invoke(IpcChannels.FIND_NEXT),
		prev: () => ipcRenderer.invoke(IpcChannels.FIND_PREV),
		close: () => ipcRenderer.invoke(IpcChannels.FIND_CLOSE),
		onOpen: (callback: () => void): (() => void) => {
			const listener = () => callback()
			ipcRenderer.on(IpcChannels.FIND_OPEN, listener)
			return () => ipcRenderer.removeListener(IpcChannels.FIND_OPEN, listener)
		},
		onStateChanged: (callback: (state: FindState) => void): (() => void) => {
			const listener = (_event: Electron.IpcRendererEvent, state: FindState) => callback(state)
			ipcRenderer.on(IpcChannels.FIND_STATE_CHANGED, listener)
			return () => ipcRenderer.removeListener(IpcChannels.FIND_STATE_CHANGED, listener)
		},
		panelResize: (width: number, height: number) => ipcRenderer.send(IpcChannels.FIND_PANEL_RESIZE, width, height),
	},
	keyboard: {
		onCtrlChanged: (callback: (pressed: boolean) => void): (() => void) => {
			const listener = (_event: Electron.IpcRendererEvent, pressed: boolean) => callback(pressed)
			ipcRenderer.on(IpcChannels.CTRL_PRESSED, listener)
			return () => ipcRenderer.removeListener(IpcChannels.CTRL_PRESSED, listener)
		},
	},
	settings: {
		userconfig: {
			read: () => ipcRenderer.invoke(IpcChannels.USERCONFIG_READ),
			write: (content: unknown) => ipcRenderer.invoke(IpcChannels.USERCONFIG_WRITE, content),
		},
	},
	i18n: {
		getTranslations: (): Promise<Translations> => ipcRenderer.invoke(IpcChannels.I18N_GET_TRANSLATIONS),
	},
	icons: {
		fetch: (url: string, partition?: string): Promise<IconFetchResult> => ipcRenderer.invoke(IpcChannels.ICONS_FETCH, url, partition),
		save: (appName: string, base64: string, oldIcon?: string): Promise<string> => ipcRenderer.invoke(IpcChannels.ICONS_SAVE, appName, base64, oldIcon),
		importFile: (appName: string, oldIcon?: string): Promise<string | null> => ipcRenderer.invoke(IpcChannels.ICONS_IMPORT_FILE, appName, oldIcon),
		delete: (filename: string): Promise<void> => ipcRenderer.invoke(IpcChannels.ICONS_DELETE, filename),
		getData: (filename: string): Promise<IconData | null> => ipcRenderer.invoke(IpcChannels.ICONS_GET_DATA, filename),
	},
	deploy: {
		isSupported: (): Promise<boolean> => ipcRenderer.invoke(IpcChannels.DEPLOY_SUPPORTED),
		getStatus: (appName: string): Promise<boolean> => ipcRenderer.invoke(IpcChannels.DEPLOY_STATUS, appName),
		deploy: (appName: string): Promise<void> => ipcRenderer.invoke(IpcChannels.DEPLOY_APP, appName),
		undeploy: (appName: string): Promise<void> => ipcRenderer.invoke(IpcChannels.UNDEPLOY_APP, appName),
	},
	partition: {
		list: (): Promise<PartitionsState> => ipcRenderer.invoke(IpcChannels.PARTITION_LIST),
		cleanup: (name: string): Promise<void> => ipcRenderer.invoke(IpcChannels.PARTITION_CLEANUP, name),
		reset: (name: string): Promise<void> => ipcRenderer.invoke(IpcChannels.PARTITION_RESET, name),
		delete: (name: string): Promise<void> => ipcRenderer.invoke(IpcChannels.PARTITION_DELETE, name),
		markFragile: (name: string): Promise<void> => ipcRenderer.invoke(IpcChannels.PARTITION_MARK_FRAGILE, name),
		rename: (oldName: string, newName: string): Promise<void> => ipcRenderer.invoke(IpcChannels.PARTITION_RENAME, oldName, newName),
	},
	app: {
		isLaunchSupported: (): Promise<boolean> => ipcRenderer.invoke(IpcChannels.APP_LAUNCH_SUPPORTED),
		launch: (appName: string): Promise<void> => ipcRenderer.invoke(IpcChannels.APP_LAUNCH, appName),
	},
})
