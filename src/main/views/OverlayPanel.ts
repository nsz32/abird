import { join } from "node:path"
import { View } from "../core/View"
import { ZLayer } from "../core/ViewManager"
import { contentBounds$ } from "../core/states"

/**
 * Fixed overlay panel (downloads, etc).
 * Not a tab - registered as content view with static ID.
 * Has preload access for IPC communication.
 */
export class OverlayPanel extends View {
	constructor(htmlPath: string) {
		super({
			layer: ZLayer.SITE_CONTENT,
			preload: true,
		})

		this.htmlPath = htmlPath
		this.init()
	}

	private readonly htmlPath: string

	protected setupSubscriptions() {
		contentBounds$.subscribe((bounds) => this.setBounds(bounds))
	}

	load() {
		if (process.env.ELECTRON_RENDERER_URL) {
			this.webContents.loadURL(`${process.env.ELECTRON_RENDERER_URL}/${this.htmlPath}/`)
		} else {
			this.webContents.loadFile(join(__dirname, `../renderer/${this.htmlPath}/index.html`))
		}
	}
}
