import { join } from "node:path"
import { type Rectangle, WebContentsView, session } from "electron"
import { ViewManager, type ZLayer } from "./ViewManager"

export interface ViewConfig {
	layer: ZLayer
	preload?: boolean | string
	backgroundColor?: string
	partition?: string
	userAgent?: string
	html?: string
	url?: string
}

/**
 * Base class for all views in the application.
 * Handles WebContentsView lifecycle, session management, and ViewManager registration.
 */
export abstract class View {
	readonly webContentsView: WebContentsView
	readonly webContents: Electron.WebContents
	private readonly htmlPath?: string
	private readonly initialUrl?: string

	constructor(config: ViewConfig) {
		const sess = this.createSession(config.partition, config.userAgent)

		this.webContentsView = new WebContentsView({
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
				session: sess,
				preload: this.resolvePreload(config.preload),
			},
		})
		this.webContentsView.setBackgroundColor(config.backgroundColor ?? "#00000000")
		this.webContents = this.webContentsView.webContents

		this.htmlPath = config.html
		this.initialUrl = config.url

		ViewManager.get().addView(this.webContentsView, config.layer)
	}

	protected init() {
		this.setupSubscriptions()
	}

	load() {
		if (this.initialUrl) {
			this.webContents.loadURL(this.initialUrl)
			return
		}

		if (this.htmlPath) {
			if (process.env.ELECTRON_RENDERER_URL) {
				this.webContents.loadURL(`${process.env.ELECTRON_RENDERER_URL}/${this.htmlPath}/`)
			} else {
				this.webContents.loadFile(join(__dirname, `../renderer/${this.htmlPath}/index.html`))
			}
		}
	}

	setBounds(bounds: Rectangle) {
		this.webContentsView.setBounds(bounds)
	}

	setVisible(visible: boolean) {
		this.webContentsView.setVisible(visible)
	}

	onReady(callback: () => void) {
		this.webContents.once("dom-ready", callback)
	}

	destroy() {
		ViewManager.get().removeView(this.webContentsView)
		this.webContents.close()
	}

	protected abstract setupSubscriptions(): void

	private createSession(partition?: string, userAgent?: string) {
		if (!partition) return undefined

		const sess = session.fromPartition(`persist:${partition}`)
		if (userAgent) {
			sess.setUserAgent(userAgent)
		}
		return sess
	}

	private resolvePreload(preload?: boolean | string): string | undefined {
		if (!preload) return undefined
		if (typeof preload === "string") return join(__dirname, preload)
		return join(__dirname, "../preload/index.js")
	}
}
