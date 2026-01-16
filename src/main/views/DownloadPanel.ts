import { IpcChannels } from "@shared/types"
import { type Rectangle, ipcMain } from "electron"
import { View } from "../core/View"
import { ZLayer } from "../core/ViewManager"
import { config$, navBarHeight$, windowBounds$ } from "../core/states"

const MARGIN = 16
const PANEL_WIDTH = 320

export class DownloadPanel extends View {
	private windowBounds: Rectangle = { x: 0, y: 0, width: 0, height: 0 }
	private navBarPosition: "top" | "bottom" = "top"
	private navBarHeight = 0
	private contentHeight = 0

	constructor() {
		super({
			layer: ZLayer.DOWNLOAD_PANEL,
			preload: true,
			html: "downloads",
		})

		ipcMain.on(IpcChannels.DOWNLOADS_PANEL_RESIZE, (_, _width: number, height: number) => {
			this.contentHeight = height
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
		if (this.contentHeight === 0) {
			this.setBounds({ x: 0, y: 0, width: 10, height: 10 })
			return
		}

		const maxHeight = this.windowBounds.height - this.navBarHeight - MARGIN * 2
		const height = Math.min(this.contentHeight, maxHeight)

		const y = this.navBarPosition === "top" ? this.navBarHeight + MARGIN : MARGIN

		this.setBounds({
			x: this.windowBounds.width - PANEL_WIDTH - MARGIN,
			y,
			width: PANEL_WIDTH,
			height,
		})
	}
}
