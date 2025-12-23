import type { NavigationState } from "@shared/types"
import { type Rectangle, WebContentsView, session, shell } from "electron"
import { StateObservable } from "../api/observable"
import type { UrlRouter } from "../routing/UrlRouter"
import { closeTab, createTab, getTabIndex } from "../tabs/Tabs"
import { resolveUserAgent } from "../utils/userAgents"

const MIN_READY_DELAY = 150

export class SiteView {
	readonly view: WebContentsView
	ready = false
	favicon: string | null = null
	private readonly createdAt = Date.now()
	readonly navState$ = new StateObservable<NavigationState>({
		url: "",
		title: "",
		canGoBack: false,
		canGoForward: false,
		isLoading: false,
	})

	constructor(
		partition: string,
		private router: UrlRouter,
		private tabId: string,
		userAgent: string,
		private onReady?: () => void,
	) {
		const partitionSession = session.fromPartition(`persist:${partition}`)
		console.log(`Using partition: ${partition} (${partitionSession.getStoragePath()})`)

		// Appliquer le User-Agent
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
			if (!this.router.shouldHandle(url)) {
				event.preventDefault()
				shell.openExternal(url)
				// Fermer le tab s'il est vide (page de redirection JS)
				if (!wc.navigationHistory.canGoBack()) {
					const innerTextLength = await wc.executeJavaScript("document.body?.innerText.trim().length || 0")
					console.log("will-navigate: innerTextLength =", innerTextLength)
					if (innerTextLength === 0) {
						closeTab(this.tabId)
					}
				}
			}
		})

		wc.on("will-redirect", (event, url) => {
			console.log("will-redirect:", url)
			if (!this.router.shouldHandle(url)) {
				event.preventDefault()
				shell.openExternal(url)
				// Fermer le tab s'il n'a pas d'historique (tab créé juste pour ce lien)
				if (!wc.navigationHistory.canGoBack()) {
					closeTab(this.tabId)
				}
			}
		})

		wc.setWindowOpenHandler(({ url, disposition }) => {
			if (this.router.shouldHandle(url)) {
				const activate = disposition !== "background-tab"
				const parentIndex = getTabIndex(this.tabId)
				createTab(url, activate, parentIndex + 1)
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
		const update = () => this.updateNavState()
		const updateWithDedup = () => {
			this.deduplicateHistory()
			this.updateNavState()
		}

		wc.on("did-navigate", () => {
			wc.insertCSS(`
				::-webkit-scrollbar { width: 10px; height: 10px; }
				::-webkit-scrollbar-track { background: #1a1a2e; }
				::-webkit-scrollbar-thumb { background: #3a3a5e; border-radius: 5px; }
				::-webkit-scrollbar-thumb:hover { background: #5a5a7e; }
				::-webkit-scrollbar-corner { background: #1a1a2e; }
			`)
			update()
		})
		wc.once("did-start-loading", () => {
			const elapsed = Date.now() - this.createdAt
			const remaining = MIN_READY_DELAY - elapsed
			if (remaining <= 0) {
				this.ready = true
				this.onReady?.()
				update()
			} else {
				setTimeout(() => {
					this.ready = true
					this.onReady?.()
					update()
				}, remaining)
			}
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
