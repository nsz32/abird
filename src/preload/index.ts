import { contextBridge } from "electron"

// API exposed to overlays
contextBridge.exposeInMainWorld("bird", {
	// APIs will be added as needed
})
