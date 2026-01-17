import type { NavigationState, TabInfo } from "@shared/types"
import { IpcChannels } from "@shared/types"
import { ipcMain } from "electron"
import { View } from "../core/View"
import { ZLayer } from "../core/ViewManager"
import { navBarBounds$, navBarHeight$ } from "../core/states"

export class NavBar extends View {
	constructor() {
		super({
			layer: ZLayer.NAVBAR,
			preload: true,
			backgroundColor: "#1a1a2e",
			url: "bird://navbar/",
		})

		ipcMain.on(IpcChannels.NAVBAR_RESIZE, (_, height: number) => {
			navBarHeight$.emit(height)
		})

		this.init()
	}

	protected setupSubscriptions() {
		navBarBounds$.subscribe((bounds) => {
			this.setBounds(bounds)
		})
	}

	sendNavigationState(state: NavigationState) {
		this.webContents.send(IpcChannels.NAVIGATION_STATE_CHANGED, state)
	}

	sendTabsList(tabs: TabInfo[]) {
		this.webContents.send(IpcChannels.TABS_LIST_CHANGED, tabs)
	}

	sendExternalOpened(tabId: string) {
		this.webContents.send(IpcChannels.TABS_EXTERNAL_OPENED, tabId)
	}

	sendFocusUrl() {
		this.webContents.focus()
		this.webContents.send(IpcChannels.COMMAND_FOCUS_URL)
	}

	openDevTools() {
		this.webContents.openDevTools({ mode: "detach" })
	}
}
