import { join } from "node:path"
import type { NavigationState, TabInfo } from "@shared/types"
import { IpcChannels } from "@shared/types"
import { type Rectangle, WebContentsView, ipcMain } from "electron"
import { navBarHeight$ } from "../states"

export class NavBar {
	readonly view: WebContentsView

	constructor() {
		this.view = new WebContentsView({
			webPreferences: {
				preload: join(__dirname, "../preload/index.js"),
				nodeIntegration: false,
				contextIsolation: true,
			},
		})
		this.view.setBackgroundColor("#1a1a2e")

		ipcMain.on(IpcChannels.NAVBAR_RESIZE, (_, height: number) => {
			navBarHeight$.emit(height)
		})
	}

	setBounds(bounds: Rectangle) {
		this.view.setBounds(bounds)
	}

	setVisible(visible: boolean) {
		this.view.setVisible(visible)
	}

	sendNavigationState(state: NavigationState) {
		this.view.webContents.send(IpcChannels.NAVIGATION_STATE_CHANGED, state)
	}

	sendTabsList(tabs: TabInfo[]) {
		this.view.webContents.send(IpcChannels.TABS_LIST_CHANGED, tabs)
	}

	sendExternalOpened(tabId: string) {
		this.view.webContents.send(IpcChannels.TABS_EXTERNAL_OPENED, tabId)
	}

	load() {
		if (process.env.ELECTRON_RENDERER_URL) {
			this.view.webContents.loadURL(`${process.env.ELECTRON_RENDERER_URL}/navbar/`)
		} else {
			this.view.webContents.loadFile(join(__dirname, "../renderer/navbar/index.html"))
		}
	}

	onReady(callback: () => void) {
		this.view.webContents.once("dom-ready", callback)
	}

	openDevTools() {
		this.view.webContents.openDevTools({ mode: "detach" })
	}
}
