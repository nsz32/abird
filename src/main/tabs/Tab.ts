import type { NavigationState, RoutingConfig, TabOrigin } from "@shared/types"
import { StateObservable } from "../api/observable"
import { externalOpened$, tabs$ } from "../states"
import { SiteView } from "../ui/SiteView"
import { closeTab, createTab, getTabIndex } from "./Tabs"

const CHECK_DELAYS = [100, 300, 600, 1000, 1500, 2000]

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

	constructor(partition: string, routing: Partial<RoutingConfig> | null, url: string, userAgent: string, parentId: string | null = null) {
		this.id = `tab-${nextId++}`
		this.initialUrl = url
		this.parentId = parentId

		this.siteView = new SiteView(partition, routing, userAgent, this.createCallbacks())
		this.siteView.loadURL(url)
	}

	onProper(callback: () => void) {
		this.onProperCallback = callback
	}

	destroy() {
		this.siteView.destroy()
	}

	private createCallbacks() {
		return {
			onNavStateChanged: (state: NavigationState) => this.navState$.emit(state),
			onFaviconChanged: (favicon: string | null) => this.updateFavicon(favicon),
			onFirstLoad: () => this.scheduleProperCheck(),
			onNewTab: (url: string, origin: TabOrigin) => this.openChildTab(url, origin),
			onCloseTab: () => closeTab(this.id),
			onExternalOpened: (willClose: boolean) => this.emitExternalOpened(willClose),
			shouldCloseTab: () => this.shouldCloseOnExternalLink(),
		}
	}

	private updateFavicon(favicon: string | null) {
		this.favicon = favicon
	}

	scheduleProperCheck() {
		if (this.proper) return
		this.checkProperAt(0)
	}

	private checkProperAt(index: number) {
		const delay = CHECK_DELAYS[index]
		if (delay === undefined) {
			this.setProper()
			return
		}

		const elapsed = Date.now() - this.createdAt
		const remaining = delay - elapsed

		setTimeout(async () => {
			if (this.proper) return
			console.log("proper check", index)
			if (await this.isTabProper()) {
				this.setProper()
			} else {
				this.checkProperAt(index + 1)
			}
		}, Math.max(0, remaining))
	}

	private setProper() {
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
		if (tabs$.get().length <= 1) return true
		if (this.siteView.hasNavigationHistory()) return true
		return this.siteView.hasVisibleContent()
	}

	private async shouldCloseOnExternalLink(): Promise<boolean> {
		if (tabs$.get().length <= 1) return false
		if (this.siteView.hasNavigationHistory()) return false
		return !(await this.siteView.hasVisibleContent())
	}
}
