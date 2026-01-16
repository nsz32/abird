import { join } from "node:path"
import { type Rectangle, WebContentsView } from "electron"

export abstract class Overlay {
	readonly view: WebContentsView
	protected windowBounds: Rectangle = { x: 0, y: 0, width: 0, height: 0 }
	protected navBarPosition: "top" | "bottom" = "top"
	protected navBarHeight = 0

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

	setVisible(visible: boolean) {
		this.view.setVisible(visible)
	}

	onReady(callback: () => void) {
		this.view.webContents.once("dom-ready", callback)
	}

	protected abstract updateViewBounds(): void

	protected abstract getHtmlPath(): string

	load() {
		if (process.env.ELECTRON_RENDERER_URL) {
			this.view.webContents.loadURL(`${process.env.ELECTRON_RENDERER_URL}/${this.getHtmlPath()}/`)
		} else {
			this.view.webContents.loadFile(join(__dirname, `../renderer/${this.getHtmlPath()}/index.html`))
		}
	}
}
