import { join } from "node:path"
import { IpcChannels } from "@shared/types"
import { type Rectangle, WebContentsView, ipcMain } from "electron"

const MARGIN = 16
const PANEL_WIDTH = 320

export class DownloadPanel {
	readonly view: WebContentsView
	private windowBounds: Rectangle = { x: 0, y: 0, width: 0, height: 0 }
	private navBarPosition: "top" | "bottom" = "top"
	private navBarHeight = 0
	private contentHeight = 0

	constructor() {
		this.view = new WebContentsView({
			webPreferences: {
				preload: join(__dirname, "../preload/index.js"),
				nodeIntegration: false,
				contextIsolation: true,
			},
		})
		this.view.setBackgroundColor("#00000000")

		ipcMain.on(IpcChannels.DOWNLOADS_PANEL_RESIZE, (_, _width: number, height: number) => {
			this.contentHeight = height
			this.updateViewBounds()
		})
	}

	setBounds(windowBounds: Rectangle) {
		this.windowBounds = windowBounds
		this.updateViewBounds()
	}

	setNavBar(position: "top" | "bottom", height: number) {
		this.navBarPosition = position
		this.navBarHeight = height
		this.updateViewBounds()
	}

	private updateViewBounds() {
		if (this.contentHeight === 0) {
			this.view.setBounds({ x: 0, y: 0, width: 10, height: 10 })
			return
		}

		const maxHeight = this.windowBounds.height - this.navBarHeight - MARGIN * 2
		const height = Math.min(this.contentHeight, maxHeight)

		// Position below navbar (top) or above navbar (bottom)
		const y =
			this.navBarPosition === "top"
				? this.navBarHeight + MARGIN // Navbar top → panel below
				: MARGIN // Navbar bottom → panel at top

		this.view.setBounds({
			x: this.windowBounds.width - PANEL_WIDTH - MARGIN,
			y,
			width: PANEL_WIDTH,
			height,
		})
	}

	setVisible(visible: boolean) {
		this.view.setVisible(visible)
	}

	load() {
		if (process.env.ELECTRON_RENDERER_URL) {
			this.view.webContents.loadURL(`${process.env.ELECTRON_RENDERER_URL}/downloads/`)
		} else {
			this.view.webContents.loadFile(join(__dirname, "../renderer/downloads/index.html"))
		}
	}

	onReady(callback: () => void) {
		this.view.webContents.once("dom-ready", callback)
	}
}
