import { join } from "node:path"
import type { Notification } from "@shared/types"
import { IpcChannels } from "@shared/types"
import { type Rectangle, WebContentsView, ipcMain } from "electron"
import { registerAppShortcuts } from "../keyboard/shortcuts"

const MARGIN = 16

export class NotificationCenter {
	readonly view: WebContentsView
	private windowBounds: Rectangle = { x: 0, y: 0, width: 0, height: 0 }
	private contentSize = { width: 0, height: 0 }

	constructor() {
		this.view = new WebContentsView({
			webPreferences: {
				preload: join(__dirname, "../preload/index.js"),
				nodeIntegration: false,
				contextIsolation: true,
			},
		})
		this.view.setBackgroundColor("#00000000")
		registerAppShortcuts(this.view.webContents)

		ipcMain.on(IpcChannels.NOTIF_RESIZE, (_, width: number, height: number) => {
			console.log("📐 NotificationCenter resize:", width, "x", height)
			this.contentSize = { width, height }
			this.updateViewBounds()
		})
	}

	setBounds(windowBounds: Rectangle) {
		this.windowBounds = windowBounds
		this.updateViewBounds()
	}

	private updateViewBounds() {
		const { width, height } = this.contentSize
		if (width === 0 || height === 0) {
			this.view.setBounds({ x: 0, y: 0, width: 10, height: 10 })
			return
		}
		this.view.setBounds({
			x: this.windowBounds.width - width - MARGIN,
			y: this.windowBounds.height - height - MARGIN,
			width,
			height,
		})
	}

	setVisible(visible: boolean) {
		this.view.setVisible(visible)
	}

	sendNotifications(notifications: Notification[]) {
		this.view.webContents.send(IpcChannels.NOTIF_LIST_CHANGED, notifications)
		this.setVisible(notifications.length > 0)
	}

	load() {
		if (process.env.ELECTRON_RENDERER_URL) {
			this.view.webContents.loadURL(`${process.env.ELECTRON_RENDERER_URL}/notifications/`)
		} else {
			this.view.webContents.loadFile(join(__dirname, "../renderer/notifications/index.html"))
		}
	}

	onReady(callback: () => void) {
		this.view.webContents.once("dom-ready", callback)
	}
}
