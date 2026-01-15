import type { GlobalConfig, ThemeMode } from "@shared/config.schema"
import { IpcChannels } from "@shared/types"
import { contextBridge, ipcRenderer } from "electron"

export interface BirdSettingsApi {
	getGlobalConfig: () => Promise<GlobalConfig>
	setTheme: (theme: ThemeMode) => Promise<void>
}

contextBridge.exposeInMainWorld("birdSettings", {
	getGlobalConfig: (): Promise<GlobalConfig> => ipcRenderer.invoke(IpcChannels.SETTINGS_GET_GLOBAL),
	setTheme: (theme: ThemeMode): Promise<void> => ipcRenderer.invoke(IpcChannels.SETTINGS_SET_THEME, theme),
} satisfies BirdSettingsApi)

declare global {
	interface Window {
		birdSettings: BirdSettingsApi
	}
}
