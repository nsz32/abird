import { IpcChannels, type NavigationState } from "@shared/types"
import { contextBridge, ipcRenderer } from "electron"

// API exposed to overlays
contextBridge.exposeInMainWorld("bird", {
	navigation: {
		back: () => ipcRenderer.invoke(IpcChannels.NAVIGATION_BACK),
		forward: () => ipcRenderer.invoke(IpcChannels.NAVIGATION_FORWARD),
		reload: (ignoreCache?: boolean) => ipcRenderer.invoke(IpcChannels.NAVIGATION_RELOAD, ignoreCache),
		getState: (): Promise<NavigationState> => ipcRenderer.invoke(IpcChannels.NAVIGATION_GET_STATE),
		onStateChanged: (callback: (state: NavigationState) => void): (() => void) => {
			const listener = (_event: Electron.IpcRendererEvent, state: NavigationState) => callback(state)
			ipcRenderer.on(IpcChannels.NAVIGATION_STATE_CHANGED, listener)
			return () => ipcRenderer.removeListener(IpcChannels.NAVIGATION_STATE_CHANGED, listener)
		},
	},
})
