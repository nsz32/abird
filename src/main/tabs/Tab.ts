import type { NavigationState, RoutingConfig } from "@shared/types"
import { StateObservable } from "../api/observable"
import { externalOpened$ } from "../states"
import { SiteView } from "../ui/SiteView"
import { closeTab, createTab, getTabIndex } from "./Tabs"

const MIN_READY_DELAY = 150

let nextId = 1

export class Tab {
	readonly id: string
	readonly siteView: SiteView
	readonly initialUrl: string
	readonly parentId: string | null

	ready = false
	favicon: string | null = null
	readonly navState$ = new StateObservable<NavigationState>({
		url: "",
		title: "",
		canGoBack: false,
		canGoForward: false,
		isLoading: false,
	})

	private readonly createdAt = Date.now()
	private onReadyCallback?: () => void

	constructor(partition: string, routing: Partial<RoutingConfig> | null, url: string, userAgent: string, parentId: string | null = null) {
		this.id = `tab-${nextId++}`
		this.initialUrl = url
		this.parentId = parentId

		this.siteView = new SiteView(partition, routing, userAgent, this.createCallbacks())
		this.siteView.loadURL(url)
	}

	onReady(callback: () => void) {
		this.onReadyCallback = callback
	}

	private createCallbacks() {
		return {
			onNavStateChanged: (state: NavigationState) => this.navState$.emit(state),
			onFaviconChanged: (favicon: string | null) => this.updateFavicon(favicon),
			onFirstLoad: () => this.scheduleReady(),
			onNewTab: (url: string, activate: boolean) => this.openChildTab(url, activate),
			onCloseTab: () => closeTab(this.id),
			onExternalOpened: (willClose: boolean) => this.emitExternalOpened(willClose),
		}
	}

	private updateFavicon(favicon: string | null) {
		this.favicon = favicon
		this.onReadyCallback?.()
	}

	private scheduleReady() {
		const elapsed = Date.now() - this.createdAt
		const remaining = MIN_READY_DELAY - elapsed

		if (remaining <= 0) {
			this.setReady()
		} else {
			setTimeout(() => this.setReady(), remaining)
		}
	}

	private setReady() {
		this.ready = true
		this.onReadyCallback?.()
	}

	private openChildTab(url: string, activate: boolean) {
		const parentIndex = getTabIndex(this.id)
		createTab(url, activate, parentIndex + 1, this.id)
	}

	private emitExternalOpened(willClose: boolean) {
		const targetId = willClose && this.parentId ? this.parentId : this.id
		externalOpened$.emit(targetId)
	}
}
