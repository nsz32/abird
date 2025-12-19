import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("bird", {
	// App info
	getVersion: () => ipcRenderer.invoke("app:version"),

	// Navigation
	navigate: (url: string) => ipcRenderer.invoke("nav:goto", url),
	goBack: () => ipcRenderer.invoke("nav:back"),
	goForward: () => ipcRenderer.invoke("nav:forward"),
	reload: () => ipcRenderer.invoke("nav:reload"),

	// Events
	onUrlChange: (callback: (url: string) => void) => {
		ipcRenderer.on("url-changed", (_, url) => callback(url))
	},
})
