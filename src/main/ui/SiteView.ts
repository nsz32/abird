import type { FindState, NavigationState, RoutingConfig, TabOrigin } from "@shared/types"
import { type Rectangle, WebContentsView, session, shell } from "electron"
import { shouldHandleUrl } from "../core/UrlRouter"
import { setupDownloads } from "../downloads/DownloadManager"
import { config$ } from "../states"
import { resolveUserAgent } from "../utils/userAgents"
import { SCROLLBAR_CSS } from "./scrollbar.css"

export interface SiteViewCallbacks {
	onNavStateChanged: (state: NavigationState) => void
	onFaviconChanged: (favicon: string | null) => void
	onNewTab: (url: string, origin: TabOrigin) => void
	onCloseTab: () => void
	onExternalOpened: (willClose: boolean) => void
	shouldCloseTab: () => Promise<boolean>
	onFindResult: (state: FindState) => void
}

export class SiteView {
	readonly view: WebContentsView
	private readonly webContents: Electron.WebContents

	constructor(
		partition: string,
		private readonly routing: Partial<RoutingConfig> | null,
		userAgent: string,
		private readonly callbacks: SiteViewCallbacks,
	) {
		const sess = session.fromPartition(`persist:${partition}`)
		sess.setUserAgent(resolveUserAgent(userAgent))
		setupDownloads(sess, config$.get().downloads)

		this.view = new WebContentsView({
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
				session: sess,
			},
		})
		this.view.setBackgroundColor("#00000000")
		this.webContents = this.view.webContents

		this.setupNavigation()
		this.setupEventListeners()
	}

	// ─── Navigation API ─────────────────────────────────────────────────────────

	loadURL(url: string) {
		this.webContents.loadURL(url)
	}

	goTo(url: string) {
		const normalized = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`
		this.webContents.loadURL(normalized)
	}

	back() {
		if (this.webContents.navigationHistory.canGoBack()) {
			this.webContents.navigationHistory.goBack()
		}
	}

	forward() {
		if (this.webContents.navigationHistory.canGoForward()) {
			this.webContents.navigationHistory.goForward()
		}
	}

	reload(ignoreCache = false) {
		ignoreCache ? this.webContents.reloadIgnoringCache() : this.webContents.reload()
	}

	stop() {
		this.webContents.stop()
	}

	setBounds(bounds: Rectangle) {
		this.view.setBounds(bounds)
	}

	setVisible(visible: boolean) {
		this.view.setVisible(visible)
	}

	destroy() {
		this.webContents.close()
	}

	// ─── Find in Page API ──────────────────────────────────────────────────────

	private currentFindText = ""

	findInPage(text: string) {
		// Stop previous search before starting a new one
		if (this.currentFindText) {
			this.webContents.stopFindInPage("clearSelection")
		}
		if (!text) {
			this.currentFindText = ""
			this.callbacks.onFindResult({ text: "", activeMatch: 0, totalMatches: 0 })
			return
		}
		this.currentFindText = text
		this.webContents.findInPage(text)
	}

	findNext() {
		if (this.currentFindText) {
			this.webContents.findInPage(this.currentFindText, { findNext: true, forward: true })
		}
	}

	findPrev() {
		if (this.currentFindText) {
			this.webContents.findInPage(this.currentFindText, { findNext: true, forward: false })
		}
	}

	stopFind() {
		if (this.currentFindText) {
			this.webContents.stopFindInPage("clearSelection")
		}
		this.currentFindText = ""
		this.callbacks.onFindResult({ text: "", activeMatch: 0, totalMatches: 0 })
	}

	async hasVisibleContent(): Promise<boolean> {
		try {
			const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 500))
			const check = this.webContents.executeJavaScript(`(function(){
				if(!document.body)return false;
				if(document.querySelector('meta[http-equiv="refresh"]'))return false;
				if(document.body.querySelector('iframe,img,video,audio,canvas,svg,embed,object'))return true;
				const s=new Set(["SCRIPT","STYLE","NOSCRIPT","TEMPLATE"]);
				const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>s.has(n.parentElement?.tagName)?2:1});
				let l=0;while(w.nextNode()&&l<100)l+=w.currentNode.textContent.trim().length;
				return l>=100;
			})()`)
			return await Promise.race([check, timeout])
		} catch {
			return false
		}
	}

	private setupNavigation() {
		this.webContents.on("will-navigate", (event, url) => this.handleUrlNavigation(event, url))
		this.webContents.on("will-redirect", (event, url) => this.handleUrlNavigation(event, url))

		this.webContents.setWindowOpenHandler(({ url, disposition }) => {
			if (shouldHandleUrl(url, this.routing)) {
				const origin: TabOrigin = disposition === "background-tab" ? "background" : "blank"
				this.callbacks.onNewTab(url, origin)
			} else {
				shell.openExternal(url)
				this.callbacks.onExternalOpened(false)
			}
			return { action: "deny" }
		})
	}

	private handleUrlNavigation(event: Electron.Event, url: string) {
		if (shouldHandleUrl(url, this.routing)) return

		console.log(`[SiteView] handleUrlNavigation: external URL ${url}`)
		event.preventDefault()
		shell.openExternal(url)

		this.callbacks.shouldCloseTab().then((willClose) => {
			console.log(`[SiteView] shouldCloseTab resolved: willClose=${willClose}`)
			this.callbacks.onExternalOpened(willClose)
			if (willClose) this.callbacks.onCloseTab()
		})
	}

	private setupEventListeners() {
		this.webContents.on("did-navigate", () => {
			this.webContents.insertCSS(SCROLLBAR_CSS)
			this.emitNavState()
		})

		this.webContents.once("did-start-loading", () => {
			this.emitNavState()
		})

		this.webContents.on("did-navigate-in-page", () => {
			this.deduplicateHistory()
			this.emitNavState()
		})

		this.webContents.on("did-start-loading", () => this.emitNavState())
		this.webContents.on("did-stop-loading", () => this.emitNavState())
		this.webContents.on("did-finish-load", () => this.emitNavState())
		this.webContents.on("page-title-updated", () => this.emitNavState())
		this.webContents.on("did-frame-navigate", () => this.emitNavState())

		this.webContents.on("page-favicon-updated", (_, favicons) => {
			this.callbacks.onFaviconChanged(favicons[0] ?? null)
		})

		this.webContents.on("found-in-page", (_, result) => {
			this.callbacks.onFindResult({
				text: this.currentFindText,
				activeMatch: result.activeMatchOrdinal,
				totalMatches: result.matches,
			})
		})
	}

	private emitNavState() {
		this.callbacks.onNavStateChanged({
			url: this.webContents.getURL(),
			title: this.webContents.getTitle(),
			canGoBack: this.webContents.navigationHistory.canGoBack(),
			canGoForward: this.webContents.navigationHistory.canGoForward(),
			isLoading: this.webContents.isLoading(),
		})
	}

	private deduplicateHistory() {
		const history = this.webContents.navigationHistory
		const activeIndex = history.getActiveIndex()

		for (let i = activeIndex - 1; i >= Math.max(0, activeIndex - 10); i--) {
			if (history.getEntryAtIndex(i)?.url === history.getEntryAtIndex(i + 1)?.url) {
				history.removeEntryAtIndex(i)
			}
		}
	}
}
