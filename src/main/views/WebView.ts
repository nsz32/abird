import type { RoutingConfig, TabOrigin } from "@shared/types"
import { shouldHandleUrl } from "../core/UrlRouter"
import { config$ } from "../core/states"
import { setupDownloads } from "../services/DownloadManager"
import { resolveUserAgent } from "../utils/userAgents"
import { BrowserView, type BrowserViewCallbacks } from "./BrowserView"

/**
 * View for external web content (http/https).
 * No preload - safe for untrusted websites.
 */
export class WebView extends BrowserView {
	constructor(
		url: string,
		partition: string,
		private readonly routing: Partial<RoutingConfig> | null,
		userAgent: string,
		callbacks: BrowserViewCallbacks,
	) {
		super(
			{
				url,
				partition,
				userAgent: resolveUserAgent(userAgent),
				preload: false,
			},
			callbacks,
		)

		setupDownloads(this.webContents.session, config$.get().downloads)
		this.setupNavigation()
	}

	goTo(url: string) {
		const normalized = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`
		this.webContents.loadURL(normalized)
	}

	// External navigation handling

	private setupNavigation() {
		this.webContents.on("will-navigate", (event, url) => this.handleNavigation(event, url))
		this.webContents.on("will-redirect", (event, url) => this.handleNavigation(event, url))

		this.webContents.setWindowOpenHandler(({ url, disposition }) => {
			this.handleNewWindow(url, disposition)
			return { action: "deny" }
		})
	}

	private handleNavigation(event: Electron.Event, url: string) {
		if (shouldHandleUrl(url, this.routing)) return

		event.preventDefault()
		this.callbacks.onExternalUrl(url)
	}

	private handleNewWindow(url: string, disposition: string) {
		if (shouldHandleUrl(url, this.routing)) {
			const origin: TabOrigin = disposition === "background-tab" ? "background" : "blank"
			this.callbacks.onNewTab(url, origin)
		} else {
			this.callbacks.onExternalUrl(url)
		}
	}
}
