import type { NavigationState, RoutingConfig } from "@shared/types"
import { type Rectangle, WebContentsView, session, shell } from "electron"
import { shouldHandleUrl } from "../routing/UrlRouter"
import { resolveUserAgent } from "../utils/userAgents"

export interface SiteViewCallbacks {
	onNavStateChanged?: (state: NavigationState) => void
	onFaviconChanged?: (favicon: string | null) => void
	onFirstLoad?: () => void
	onNewTab?: (url: string, activate: boolean) => void
	onCloseTab?: () => void
}

export class SiteView {
	readonly view: WebContentsView

	constructor(
		partition: string,
		private routing: Partial<RoutingConfig> | null,
		userAgent: string,
		private callbacks: SiteViewCallbacks = {},
	) {
		const partitionSession = session.fromPartition(`persist:${partition}`)
		console.log(`Using partition: ${partition} (${partitionSession.getStoragePath()})`)

		const ua = resolveUserAgent(userAgent)
		partitionSession.setUserAgent(ua)
		console.log(`Using User-Agent: ${ua.substring(0, 80)}...`)

		this.view = new WebContentsView({
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
				session: partitionSession,
			},
		})
		this.view.setBackgroundColor("#202830")

		this.setupRouting()
		this.setupListeners()
	}

	private setupRouting() {
		const wc = this.view.webContents

		wc.on("will-navigate", async (event, url) => {
			console.log("will-navigate:", url)
			if (!shouldHandleUrl(url, this.routing)) {
				event.preventDefault()
				shell.openExternal(url)
				if (!wc.navigationHistory.canGoBack()) {
					const innerTextLength = await wc.executeJavaScript("document.body?.innerText.trim().length || 0")
					console.log("will-navigate: innerTextLength =", innerTextLength)
					if (innerTextLength === 0) {
						this.callbacks.onCloseTab?.()
					}
				}
			}
		})

		wc.on("will-redirect", (event, url) => {
			console.log("will-redirect:", url)
			if (!shouldHandleUrl(url, this.routing)) {
				event.preventDefault()
				shell.openExternal(url)
				if (!wc.navigationHistory.canGoBack()) {
					this.callbacks.onCloseTab?.()
				}
			}
		})

		wc.setWindowOpenHandler(({ url, disposition }) => {
			if (shouldHandleUrl(url, this.routing)) {
				const activate = disposition !== "background-tab"
				this.callbacks.onNewTab?.(url, activate)
			} else {
				shell.openExternal(url)
			}
			return { action: "deny" }
		})

		wc.session.on("will-download", (_event, item) => {
			console.log(`Download started: ${item.getFilename()} from ${item.getURL()}`)
		})
	}

	private setupListeners() {
		const wc = this.view.webContents
		const emitNavState = () => this.emitNavState()
		const emitNavStateWithDedup = () => {
			this.deduplicateHistory()
			this.emitNavState()
		}

		wc.on("did-navigate", () => {
			wc.insertCSS(`
				::-webkit-scrollbar { width: 10px; height: 10px; }
				::-webkit-scrollbar-track { background: #1a1a2e; }
				::-webkit-scrollbar-thumb { background: #3a3a5e; border-radius: 5px; }
				::-webkit-scrollbar-thumb:hover { background: #5a5a7e; }
				::-webkit-scrollbar-corner { background: #1a1a2e; }
			`)
			emitNavState()
		})

		wc.once("did-start-loading", () => {
			this.callbacks.onFirstLoad?.()
			emitNavState()
		})

		wc.on("did-navigate-in-page", emitNavStateWithDedup)
		wc.on("did-start-loading", emitNavState)
		wc.on("did-stop-loading", emitNavState)
		wc.on("did-finish-load", emitNavState)
		wc.on("page-title-updated", emitNavState)
		wc.on("page-favicon-updated", (_, favicons) => {
			this.callbacks.onFaviconChanged?.(favicons[0] || null)
		})
		wc.on("did-frame-navigate", emitNavState)
	}

	private emitNavState() {
		const wc = this.view.webContents
		this.callbacks.onNavStateChanged?.({
			url: wc.getURL(),
			title: wc.getTitle(),
			canGoBack: wc.navigationHistory.canGoBack(),
			canGoForward: wc.navigationHistory.canGoForward(),
			isLoading: wc.isLoading(),
		})
	}

	private deduplicateHistory() {
		const history = this.view.webContents.navigationHistory
		const activeIndex = history.getActiveIndex()
		for (let i = activeIndex - 1; i >= Math.max(0, activeIndex - 10); i--) {
			if (history.getEntryAtIndex(i)?.url === history.getEntryAtIndex(i + 1)?.url) {
				history.removeEntryAtIndex(i)
			}
		}
	}

	setBounds(bounds: Rectangle) {
		this.view.setBounds(bounds)
	}

	setVisible(visible: boolean) {
		this.view.setVisible(visible)
	}

	loadURL(url: string) {
		this.view.webContents.loadURL(url)
	}

	back() {
		if (this.view.webContents.navigationHistory.canGoBack()) {
			this.view.webContents.navigationHistory.goBack()
		}
	}

	forward() {
		if (this.view.webContents.navigationHistory.canGoForward()) {
			this.view.webContents.navigationHistory.goForward()
		}
	}

	reload(ignoreCache = false) {
		if (ignoreCache) {
			this.view.webContents.reloadIgnoringCache()
		} else {
			this.view.webContents.reload()
		}
	}

	stop() {
		this.view.webContents.stop()
	}

	goTo(url: string) {
		let normalized = url.trim()
		if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
			normalized = `https://${normalized}`
		}
		this.view.webContents.loadURL(normalized)
	}
}
