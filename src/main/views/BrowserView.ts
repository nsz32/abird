import type { FindState, NavigationState, TabOrigin } from "@shared/types"
import { View } from "../core/View"
import { ZLayer } from "../core/ViewManager"
import { contentBounds$ } from "../core/states"

export interface BrowserViewCallbacks {
	onNavStateChanged: (state: NavigationState) => void
	onFaviconChanged: (favicon: string | null) => void
	onNewTab: (url: string, origin: TabOrigin) => void
	onExternalUrl: (url: string) => void
	onFindResult: (state: FindState) => void
}

export interface BrowserViewConfig {
	partition?: string
	userAgent?: string
	preload?: boolean
}

/**
 * Base class for navigable content views (tabs).
 * Provides navigation, find-in-page, and event callbacks.
 */
export abstract class BrowserView extends View {
	private currentFindText = ""

	constructor(
		config: BrowserViewConfig,
		protected readonly callbacks: BrowserViewCallbacks,
	) {
		super({
			layer: ZLayer.SITE_CONTENT,
			partition: config.partition,
			userAgent: config.userAgent,
			preload: config.preload,
		})

		this.setupEventListeners()
		this.init()
	}

	protected setupSubscriptions() {
		contentBounds$.subscribe((bounds) => this.setBounds(bounds))
	}

	// Navigation

	abstract loadURL(url: string): void

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

	// Find in page

	findInPage(text: string) {
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

	// Content check

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

	// Event listeners

	private setupEventListeners() {
		this.webContents.on("did-navigate", () => this.emitNavState())
		this.webContents.once("did-start-loading", () => this.emitNavState())
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

	protected emitNavState() {
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
