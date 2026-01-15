import { join } from "node:path"
import { type Rectangle, WebContentsView } from "electron"

export class Watermark {
	readonly view: WebContentsView

	constructor() {
		this.view = new WebContentsView({
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
			},
		})
		this.view.setBackgroundColor("#00000000")
	}

	setBounds(bounds: Rectangle) {
		console.log(bounds)
		this.view.setBounds({
			x: 0,
			y: 0,
			width: bounds.width,
			height: bounds.height,
		})
	}

	load() {
		if (process.env.ELECTRON_RENDERER_URL) {
			this.view.webContents.loadURL(`${process.env.ELECTRON_RENDERER_URL}/watermark/`)
		} else {
			this.view.webContents.loadFile(join(__dirname, "../renderer/watermark/index.html"))
		}
	}
}
