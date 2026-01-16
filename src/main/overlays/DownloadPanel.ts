import { IpcChannels } from "@shared/types"
import { ipcMain } from "electron"
import { Overlay } from "./Overlay"

const MARGIN = 16
const PANEL_WIDTH = 320

export class DownloadPanel extends Overlay {
	private contentHeight = 0

	constructor() {
		super()

		ipcMain.on(IpcChannels.DOWNLOADS_PANEL_RESIZE, (_, _width: number, height: number) => {
			this.contentHeight = height
			this.updateViewBounds()
		})
	}

	protected getHtmlPath(): string {
		return "downloads"
	}

	protected updateViewBounds() {
		if (this.contentHeight === 0) {
			this.view.setBounds({ x: 0, y: 0, width: 10, height: 10 })
			return
		}

		const maxHeight = this.windowBounds.height - this.navBarHeight - MARGIN * 2
		const height = Math.min(this.contentHeight, maxHeight)

		// Position below navbar (top) or above navbar (bottom)
		const y =
			this.navBarPosition === "top"
				? this.navBarHeight + MARGIN
				: MARGIN

		this.view.setBounds({
			x: this.windowBounds.width - PANEL_WIDTH - MARGIN,
			y,
			width: PANEL_WIDTH,
			height,
		})
	}
}
