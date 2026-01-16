import { join } from "node:path"
import { BrowserView, type BrowserViewCallbacks } from "./BrowserView"

/**
 * View for internal content (bird:// URLs).
 * Has preload access - only for trusted internal pages.
 */
export class PanelView extends BrowserView {
	constructor(callbacks: BrowserViewCallbacks) {
		super({ preload: true }, callbacks)
	}

	loadURL(url: string) {
		if (!url.startsWith("bird://")) {
			throw new Error("PanelView can only load bird:// URLs")
		}

		const { host, pathname } = new URL(url)

		if (process.env.ELECTRON_RENDERER_URL) {
			this.webContents.loadURL(`${process.env.ELECTRON_RENDERER_URL}/${host}${pathname}/`)
		} else {
			const basePath = join(__dirname, "../renderer", host)
			const filePath = pathname === "/" || pathname === "" ? join(basePath, "index.html") : join(basePath, pathname)
			this.webContents.loadFile(filePath)
		}
	}
}
