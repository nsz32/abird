import type { ResolvedRoutingConfig, TabOrigin } from "@shared/types"
import { app } from "electron"
import contextMenu from "electron-context-menu"
import { getNavigationAction } from "../core/UrlRouter"
import { config$ } from "../core/states"
import { disableAdBlock, enableAdBlock } from "../services/AdBlocker"
import { setupDownloads } from "../services/DownloadManager"
import { getPartitionConfig } from "../services/PartitionManager"
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
		private readonly routing: ResolvedRoutingConfig,
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
		this.setupAdBlock(partition)
		this.setupNavigation()
		this.setupContextMenu()
	}

	private setupContextMenu() {
		contextMenu({
			window: this.webContents,
			showSaveImageAs: true,
			showCopyImageAddress: true,
			showSaveLinkAs: true,
			showInspectElement: !app.isPackaged,
		})
	}

	private setupAdBlock(partition: string) {
		const config = getPartitionConfig(partition)

		if (config?.adBlockEnabled === false) {
			disableAdBlock(this.webContents.session, partition)
			return
		}

		enableAdBlock(this.webContents.session, partition)
	}

	goTo(url: string) {
		const normalized = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`
		this.webContents.loadURL(normalized)
	}

	private setupNavigation() {
		this.webContents.on("will-navigate", (event, url) => this.handleNavigation(event, url))
		this.webContents.on("will-redirect", (event, url) => this.handleNavigation(event, url))

		this.webContents.setWindowOpenHandler(({ url, disposition }) => {
			this.handleNewWindow(url, disposition)
			return { action: "deny" }
		})
	}

	private handleNavigation(event: Electron.Event, url: string) {
		if (url.startsWith("bird://")) return event.preventDefault()

		const action = getNavigationAction(url, this.routing)

		if (action === "internal") return

		event.preventDefault()

		if (action === "external") {
			this.callbacks.onExternalUrl(url)
		}
		// action === "ignore" → nothing
	}

	private handleNewWindow(url: string, disposition: string) {
		if (url.startsWith("bird://")) return

		const action = getNavigationAction(url, this.routing)

		if (action === "internal") {
			const origin: TabOrigin = disposition === "background-tab" ? "background" : "blank"
			this.callbacks.onNewTab(url, origin)
		} else if (action === "external") {
			this.callbacks.onExternalUrl(url)
		}
		// action === "ignore" → nothing
	}
}
