import { IpcChannels, type NavBarConfig, type NavigationState, type TabInfo } from "@shared/types"
import { contextBridge, ipcRenderer } from "electron"

// API exposed to UI components
contextBridge.exposeInMainWorld("bird", {
	navigation: {
		back: () => ipcRenderer.invoke(IpcChannels.NAVIGATION_BACK),
		forward: () => ipcRenderer.invoke(IpcChannels.NAVIGATION_FORWARD),
		reload: (ignoreCache?: boolean) => ipcRenderer.invoke(IpcChannels.NAVIGATION_RELOAD, ignoreCache),
		stop: () => ipcRenderer.invoke(IpcChannels.NAVIGATION_STOP),
		goTo: (url: string) => ipcRenderer.invoke(IpcChannels.NAVIGATION_GO_TO, url),
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
		activate: (id: string) => ipcRenderer.invoke(IpcChannels.TABS_ACTIVATE, id),
		close: (id: string) => ipcRenderer.invoke(IpcChannels.TABS_CLOSE, id),
		create: (index?: number) => ipcRenderer.invoke(IpcChannels.TABS_CREATE, index),
	},
	config: {
		getNavBar: (): Promise<NavBarConfig> => ipcRenderer.invoke(IpcChannels.CONFIG_GET_NAVBAR),
	},
})
