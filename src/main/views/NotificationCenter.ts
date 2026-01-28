import type { Notification } from "@shared/types"
import { IpcChannels } from "@shared/types"
import { type Rectangle, ipcMain } from "electron"
import { View } from "../core/View"
import { ZLayer } from "../core/ViewManager"
import { config$, navBarHeight$, windowBounds$ } from "../core/states"
import { buildViewUrl } from "../utils/url"

const MARGIN = 16

export class NotificationCenter extends View {
	private windowBounds: Rectangle = { x: 0, y: 0, width: 0, height: 0 }
	private navBarPosition: "top" | "bottom" = "top"
	private navBarHeight = 0
	private contentSize = { width: 0, height: 0 }

	constructor() {
		super({
			layer: ZLayer.NOTIFICATIONS,
			preload: true,
			url: buildViewUrl("notifications"),
		})

		ipcMain.on(IpcChannels.NOTIF_RESIZE, (_, width: number, height: number) => {
			this.contentSize = { width, height }
			this.updateBounds()
		})

		this.init()
	}

	protected setupSubscriptions() {
		windowBounds$.subscribe((bounds) => {
			this.windowBounds = bounds
			this.updateBounds()
		})

		const updateNavBar = () => {
			const { navBar } = config$.get()
			this.navBarPosition = navBar.position
			this.navBarHeight = navBar.visible ? navBarHeight$.get() : 0
			this.updateBounds()
		}
		config$.subscribe(updateNavBar)
		navBarHeight$.subscribe(updateNavBar)
	}

	private updateBounds() {
		const { width, height } = this.contentSize
		if (width === 0 || height === 0) {
			this.setBounds({ x: 0, y: 0, width: 10, height: 10 })
			return
		}

		const y = this.navBarPosition === "top" ? this.windowBounds.height - height - MARGIN : this.navBarHeight + MARGIN

		this.setBounds({
			x: this.windowBounds.width - width - MARGIN,
			y,
			width,
			height,
		})
	}

	sendNotifications(notifications: Notification[]) {
		this.webContents.send(IpcChannels.NOTIF_LIST_CHANGED, notifications)
		this.setVisible(notifications.length > 0)
	}
}
