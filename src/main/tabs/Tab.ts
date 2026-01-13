import type { FindState, NavigationState, RoutingConfig, TabOrigin } from "@shared/types"
import { StateObservable } from "../api/observable"
import { activeTab$, externalOpened$, findState$, tabs$ } from "../states"
import { SiteView } from "../ui/SiteView"
import { closeTab, createTab, getTabIndex } from "./Tabs"

const CHECK_INTERVAL = 50
const CHECK_MAX_TIME = 4000

let nextId = 1

export class Tab {
	readonly id: string
	readonly siteView: SiteView
	readonly initialUrl: string
	readonly parentId: string | null

	proper = false
	favicon: string | null = null
	readonly navState$ = new StateObservable<NavigationState>({
		url: "",
		title: "",
		canGoBack: false,
		canGoForward: false,
		isLoading: false,
	})

	private readonly createdAt = Date.now()
	private onProperCallback?: () => void
	private destroyed = false

	constructor(partition: string, routing: Partial<RoutingConfig> | null, url: string, userAgent: string, parentId: string | null = null) {
		this.id = `tab-${nextId++}`
		this.initialUrl = url
		this.parentId = parentId

		this.siteView = new SiteView(partition, routing, userAgent, this.createCallbacks())
		this.siteView.loadURL(url)

		console.log("CREATE TAB", this.id)
	}

	onProper(callback: () => void) {
		this.onProperCallback = callback
	}

	destroy() {
		console.log("DESTROY TAB", this.id)
		this.destroyed = true
		this.siteView.destroy()
	}

	private createCallbacks() {
		return {
			onNavStateChanged: (state: NavigationState) => this.navState$.emit(state),
			onFaviconChanged: (favicon: string | null) => this.updateFavicon(favicon),
			onNewTab: (url: string, origin: TabOrigin) => this.openChildTab(url, origin),
			onCloseTab: () => closeTab(this.id),
			onExternalOpened: (willClose: boolean) => this.emitExternalOpened(willClose),
			shouldCloseTab: () => this.shouldCloseOnExternalLink(),
			onFindResult: (state: FindState) => this.emitFindResult(state),
		}
	}

	private emitFindResult(state: FindState) {
		// Only emit if this tab is active
		if (activeTab$.get()?.id === this.id) {
			findState$.emit(state)
		}
	}

	private updateFavicon(favicon: string | null) {
		this.favicon = favicon
		tabs$.emit([...tabs$.get()])
	}

	scheduleProperCheck() {
		if (this.proper) return
		this.runProperCheck()
	}

	private async runProperCheck() {
		if (this.proper || this.destroyed) return

		const elapsed = Date.now() - this.createdAt
		if (elapsed >= CHECK_MAX_TIME) {
			this.setProper()
			return
		}

		if (await this.isTabProper()) {
			this.setProper()
		} else {
			setTimeout(() => this.runProperCheck(), CHECK_INTERVAL)
		}
	}

	private setProper() {
		console.log(`[${this.id}] setProper`)
		this.proper = true
		this.onProperCallback?.()
	}

	private openChildTab(url: string, origin: TabOrigin) {
		const parentIndex = getTabIndex(this.id)
		createTab(url, origin, parentIndex + 1, this.id)
	}

	private emitExternalOpened(willClose: boolean) {
		const targetId = willClose && this.parentId ? this.parentId : this.id
		externalOpened$.emit(targetId)
	}

	private async isTabProper(): Promise<boolean> {
		const tabCount = tabs$.get().length
		if (tabCount <= 1) {
			console.log(`[${this.id}] isTabProper: true (only ${tabCount} tab)`)
			return true
		}
		const hasContent = await this.siteView.hasVisibleContent()
		console.log(`[${this.id}] isTabProper: ${hasContent} (hasContent=${hasContent})`)
		return hasContent
	}

	private async shouldCloseOnExternalLink(): Promise<boolean> {
		if (tabs$.get().length <= 1) {
			console.log(`[${this.id}] shouldCloseOnExternalLink: false (last tab)`)
			return false
		}
		const hasContent = await this.siteView.hasVisibleContent()
		console.log(`[${this.id}] shouldCloseOnExternalLink: ${!hasContent} (hasContent=${hasContent})`)
		return !hasContent
	}
}
