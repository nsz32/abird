import type { NavigationState, RoutingConfig } from "@shared/types"
import { type Rectangle, WebContentsView, session, shell } from "electron"
import { StateObservable } from "../api/observable"
import { closeTab, createTab } from "../tabs/Tabs"

export class SiteView {
	readonly view: WebContentsView
	ready = false
	favicon: string | null = null
	readonly navState$ = new StateObservable<NavigationState>({
		url: "",
		title: "",
		canGoBack: false,
		canGoForward: false,
		isLoading: false,
	})

	constructor(
		partition: string,
		private routingConfig: RoutingConfig | null,
		private tabId: string,
		private onReady?: () => void,
	) {
		const partitionSession = session.fromPartition(`persist:${partition}`)
		console.log(`Using partition: ${partition} (${partitionSession.getStoragePath()})`)

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

		wc.on("will-navigate", (event, url) => {
			if (!this.shouldHandleUrl(url)) {
				event.preventDefault()
				shell.openExternal(url)
			}
		})

		wc.on("will-redirect", (event, url) => {
			if (!this.shouldHandleUrl(url)) {
				event.preventDefault()
				shell.openExternal(url)
				// Fermer le tab s'il n'a pas d'historique (tab créé juste pour ce lien)
				if (!wc.navigationHistory.canGoBack()) {
					closeTab(this.tabId)
				}
			}
		})

		wc.setWindowOpenHandler(({ url }) => {
			if (this.shouldHandleUrl(url)) {
				createTab(url)
			} else {
				shell.openExternal(url)
			}
			return { action: "deny" }
		})

		wc.session.on("will-download", (_event, item) => {
			console.log(`Download started: ${item.getFilename()} from ${item.getURL()}`)
		})
	}

	private shouldHandleUrl(url: string): boolean {
		if (!url || url.startsWith("about:") || url.startsWith("javascript:") || url.startsWith("data:")) {
			return true
		}
		return this.isInternalUrl(url) || this.isDownloadAllowed(url)
	}

	private isInternalUrl(url: string): boolean {
		if (!this.routingConfig) return false
		return this.matchesPatterns(url, this.routingConfig.internal)
	}

	private isDownloadAllowed(url: string): boolean {
		if (!this.routingConfig?.download) return false
		return this.matchesPatterns(url, this.routingConfig.download)
	}

	private matchesPatterns(url: string, patterns: string | string[]): boolean {
		const list = Array.isArray(patterns) ? patterns : [patterns]
		return list.some((p) => (p.startsWith("^") ? new RegExp(p).test(url) : url.startsWith(p)))
	}

	private setupListeners() {
		const wc = this.view.webContents
		const update = () => this.updateNavState()
		const updateWithDedup = () => {
			this.deduplicateHistory()
			this.updateNavState()
		}

		wc.on("did-navigate", () => {
			if (!this.ready) {
				this.ready = true
				this.onReady?.()
			}
			update()
		})
		wc.on("did-navigate-in-page", updateWithDedup)
		wc.on("did-start-loading", update)
		wc.on("did-stop-loading", update)
		wc.on("did-finish-load", update)
		wc.on("page-title-updated", update)
		wc.on("page-favicon-updated", (_, favicons) => {
			this.favicon = favicons[0] || null
			this.onReady?.() // Refresh navbar
		})
		wc.on("did-frame-navigate", update)
	}

	private updateNavState() {
		const wc = this.view.webContents
		this.navState$.emit({
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

	goTo(url: string) {
		let normalized = url.trim()
		if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
			normalized = `https://${normalized}`
		}
		this.view.webContents.loadURL(normalized)
	}
}
