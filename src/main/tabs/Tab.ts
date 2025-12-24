import type { NavigationState, RoutingConfig } from "@shared/types"
import { StateObservable } from "../api/observable"
import { SiteView } from "../ui/SiteView"
import { closeTab, createTab, getTabIndex } from "./Tabs"

const MIN_READY_DELAY = 150

let nextId = 1

export class Tab {
	readonly id: string
	readonly siteView: SiteView
	readonly initialUrl: string

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

	constructor(partition: string, routing: Partial<RoutingConfig> | null, url: string, userAgent: string) {
		this.id = `tab-${nextId++}`
		this.initialUrl = url

		this.siteView = new SiteView(partition, routing, userAgent, {
			onNavStateChanged: (state) => this.navState$.emit(state),
			onFaviconChanged: (favicon) => {
				this.favicon = favicon
				this.onReadyCallback?.()
			},
			onFirstLoad: () => this.handleFirstLoad(),
			onNewTab: (tabUrl, activate) => {
				const parentIndex = getTabIndex(this.id)
				createTab(tabUrl, activate, parentIndex + 1)
			},
			onCloseTab: () => closeTab(this.id),
		})

		this.siteView.loadURL(url)
	}

	private handleFirstLoad() {
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

	onReady(callback: () => void) {
		this.onReadyCallback = callback
	}
}
