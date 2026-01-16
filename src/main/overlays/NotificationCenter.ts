import type { Notification } from "@shared/types"
import { IpcChannels } from "@shared/types"
import { ipcMain } from "electron"
import { Overlay } from "./Overlay"

const MARGIN = 16

export class NotificationCenter extends Overlay {
	private contentSize = { width: 0, height: 0 }

	constructor() {
		super()

		ipcMain.on(IpcChannels.NOTIF_RESIZE, (_, width: number, height: number) => {
			console.log("NotificationCenter resize:", width, "x", height)
			this.contentSize = { width, height }
			this.updateViewBounds()
		})
	}

	protected getHtmlPath(): string {
		return "notifications"
	}

	protected updateViewBounds() {
		const { width, height } = this.contentSize
		if (width === 0 || height === 0) {
			this.view.setBounds({ x: 0, y: 0, width: 10, height: 10 })
			return
		}

		// Position opposite to navbar to avoid overlap
		const y =
			this.navBarPosition === "top"
				? this.windowBounds.height - height - MARGIN
				: this.navBarHeight + MARGIN

		this.view.setBounds({
			x: this.windowBounds.width - width - MARGIN,
			y,
			width,
			height,
		})
	}

	sendNotifications(notifications: Notification[]) {
		this.view.webContents.send(IpcChannels.NOTIF_LIST_CHANGED, notifications)
		this.setVisible(notifications.length > 0)
	}
}
