import { join } from "node:path"
import { type Rectangle, WebContentsView, session } from "electron"
import { SCROLLBAR_CSS } from "../views/scrollbar.css"
import { ViewManager, type ZLayer } from "./ViewManager"

export interface ViewConfig {
	layer: ZLayer
	preload?: boolean | string
	backgroundColor?: string
	partition?: string
	userAgent?: string
	url?: string
}

/**
 * Base class for all views in the application.
 * Handles WebContentsView lifecycle, session management, and ViewManager registration.
 */
export abstract class View {
	readonly webContentsView: WebContentsView
	readonly webContents: Electron.WebContents
	private readonly url?: string

	constructor(config: ViewConfig) {
		const sess = this.createSession(config.partition, config.userAgent)

		this.webContentsView = new WebContentsView({
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
				sandbox: true,
				session: sess,
				preload: this.resolvePreload(config.preload),
			},
		})
		this.webContentsView.setBackgroundColor(config.backgroundColor ?? "#00000000")
		this.webContents = this.webContentsView.webContents

		this.url = config.url

		this.webContents.on("did-navigate", () => this.webContents.insertCSS(SCROLLBAR_CSS))

		ViewManager.get().addView(this.webContentsView, config.layer)
	}

	protected init() {
		this.setupSubscriptions()
	}

	load() {
		if (!this.url) return

		const scheme = "abird://"
		const finalUrl =
			process.env.ELECTRON_RENDERER_URL && this.url.startsWith(scheme) ? `${process.env.ELECTRON_RENDERER_URL}/${this.url.slice(scheme.length)}/` : this.url
		this.webContents.loadURL(finalUrl)
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
		if (typeof preload === "string") return join(import.meta.dirname, preload)
		return join(import.meta.dirname, "../preload/index.js")
	}
}
