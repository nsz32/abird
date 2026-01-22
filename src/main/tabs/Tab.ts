import type { FindState, NavigationState, ResolvedRoutingConfig, TabOrigin } from "@shared/types"
import { shell } from "electron"
import { ViewManager } from "../core/ViewManager"
import { externalOpened$, findState$, tabs$ } from "../core/states"
import { StateObservable } from "../utils/observable"
import type { BrowserView } from "../views/BrowserView"
import { PanelView } from "../views/PanelView"
import { WebView } from "../views/WebView"
import { closeTab, createTab, getTabIndex, isTabActive } from "./Tabs"

const CHECK_INTERVAL = 50
const CHECK_MAX_TIME = 4000

let nextId = 1

export class Tab {
	readonly id: string
	readonly view: BrowserView
	readonly initialUrl: string
	readonly parentId: string | null

	isValid = false
	favicon: string | null = null
	findState: FindState = { text: "", activeMatch: 0, totalMatches: 0 }
	findBarVisible = false
	readonly navState$ = new StateObservable<NavigationState>({
		url: "",
		title: "",
		canGoBack: false,
		canGoForward: false,
		isLoading: false,
	})

	private readonly createdAt = Date.now()
	private onValidCallback?: () => void
	private destroyed = false

	constructor(partition: string | null, routing: ResolvedRoutingConfig, url: string, userAgent: string, parentId: string | null = null) {
		this.id = `tab-${nextId++}`
		this.initialUrl = url
		this.parentId = parentId

		const callbacks = this.createCallbacks()

		this.view = url.startsWith("bird://") ? new PanelView(url, callbacks) : new WebView(url, partition ?? "", routing, userAgent, callbacks)

		ViewManager.get().registerContentView(this.id, this.view.webContentsView)
	}

	get webView(): WebView {
		if (!(this.view instanceof WebView)) {
			throw new Error("Cannot access webView on a PanelView tab")
		}
		return this.view
	}

	onValid(callback: () => void) {
		this.onValidCallback = callback
	}

	destroy() {
		this.destroyed = true
		ViewManager.get().unregisterContentView(this.id)
		this.view.destroy()
	}

	private createCallbacks() {
		return {
			onNavStateChanged: (state: NavigationState) => this.navState$.emit(state),
			onFaviconChanged: (favicon: string | null) => this.updateFavicon(favicon),
			onNewTab: (url: string, origin: TabOrigin) => this.openChildTab(url, origin),
			onExternalUrl: (url: string) => this.handleExternalUrl(url),
			onFindResult: (state: FindState) => this.emitFindResult(state),
		}
	}

	private emitFindResult(state: FindState) {
		this.findState = state
		if (isTabActive(this.id)) {
			findState$.emit(state)
		}
	}

	private updateFavicon(favicon: string | null) {
		this.favicon = favicon
		tabs$.emit([...tabs$.get()])
	}

	scheduleValidation() {
		if (this.isValid) return
		this.runValidationCheck()
	}

	private async runValidationCheck() {
		if (this.isValid || this.destroyed) return

		const elapsed = Date.now() - this.createdAt
		if (elapsed >= CHECK_MAX_TIME) {
			this.markAsValid()
			return
		}

		if (await this.checkValidity()) {
			this.markAsValid()
		} else {
			setTimeout(() => this.runValidationCheck(), CHECK_INTERVAL)
		}
	}

	private markAsValid() {
		this.isValid = true
		this.onValidCallback?.()
	}

	private openChildTab(url: string, origin: TabOrigin) {
		const parentIndex = getTabIndex(this.id)
		createTab(url, origin, parentIndex + 1, this.id)
	}

	private async handleExternalUrl(url: string) {
		shell.openExternal(url)

		const shouldClose = await this.shouldCloseAfterExternal()
		const targetId = shouldClose && this.parentId ? this.parentId : this.id
		externalOpened$.emit(targetId)

		if (shouldClose) {
			closeTab(this.id)
		}
	}

	private async shouldCloseAfterExternal(): Promise<boolean> {
		if (tabs$.get().length <= 1) return false
		return !(await this.view.hasVisibleContent())
	}

	private async checkValidity(): Promise<boolean> {
		const tabCount = tabs$.get().length
		if (tabCount <= 1) {
			return true
		}
		return this.view.hasVisibleContent()
	}
}
