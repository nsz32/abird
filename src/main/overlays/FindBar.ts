import { join } from "node:path"
import type { FindState } from "@shared/types"
import { IpcChannels } from "@shared/types"
import { type Rectangle, WebContentsView } from "electron"

const DEFAULT_WIDTH = 350
const DEFAULT_HEIGHT = 36

export class FindBar {
	readonly view: WebContentsView
	private windowBounds: Rectangle = { x: 0, y: 0, width: 0, height: 0 }
	private navBarPosition: "top" | "bottom" = "top"
	private navBarHeight = 0
	private contentSize = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }

	constructor() {
		this.view = new WebContentsView({
			webPreferences: {
				preload: join(__dirname, "../preload/index.js"),
				nodeIntegration: false,
				contextIsolation: true,
			},
		})
		this.view.setBackgroundColor("#00000000")
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
		const { width, height } = this.contentSize

		// Always at bottom, flush with window edge or navbar
		const y =
			this.navBarPosition === "top"
				? this.windowBounds.height - height // Bottom of window
				: this.windowBounds.height - this.navBarHeight - height // Just above navbar

		this.view.setBounds({
			x: 0,
			y,
			width,
			height,
		})
	}

	setVisible(visible: boolean) {
		this.view.setVisible(visible)
	}

	sendFindState(state: FindState) {
		this.view.webContents.send(IpcChannels.FIND_STATE_CHANGED, state)
	}

	sendOpen() {
		this.view.webContents.focus()
		this.view.webContents.send(IpcChannels.FIND_OPEN)
	}

	load() {
		if (process.env.ELECTRON_RENDERER_URL) {
			this.view.webContents.loadURL(`${process.env.ELECTRON_RENDERER_URL}/findbar/`)
		} else {
			this.view.webContents.loadFile(join(__dirname, "../renderer/findbar/index.html"))
		}
	}

	onReady(callback: () => void) {
		this.view.webContents.once("dom-ready", callback)
	}
}
