import {
	type ActiveDownload,
	type DownloadEvent,
	type DownloadHistoryItem,
	type EffectiveConfig,
	type FindState,
	IpcChannels,
	type NavigationState,
	type Notification,
} from "@shared/types"
import type { Rectangle } from "electron"
import type { Tab } from "../tabs/Tab"
import { BroadcastEvent, BroadcastObservable, CombinedObservable, StateObservable } from "../utils/observable"

// Config effective - single source of truth
const DEFAULT_CONFIG: EffectiveConfig = {
	startUrl: "about:blank",
	partition: "default",
	theme: "system",
	userAgent: "desktop:bird",
	navBar: {
		position: "bottom",
		visible: true,
		autoHide: false,
		allowUrlEdit: false,
		allowSingleTabClose: false,
		showBackButton: false,
		showForwardButton: false,
		showRefreshButton: false,
		showHomeButton: true,
	},
	routing: { internal: [], download: [], external: [], ignore: [] },
	downloads: {
		directory: null,
		autoOpenMaxSize: 0,
		autoOpenMimeTypes: [],
		allowExecutablesDownload: false,
		allowDuplicateDownloads: false,
	},
}

export const config$ = new StateObservable<EffectiveConfig>(DEFAULT_CONFIG)

// Window
export const windowBounds$ = new StateObservable<Rectangle>({ x: 0, y: 0, width: 0, height: 0 })
export const navBarHeight$ = new StateObservable<number>(0)

// Tabs
export const tabs$ = new StateObservable<Tab[]>([])

// Active content view (tab id or panel id like "downloads")
export const activeContentId$ = new StateObservable<string | null>(null)

// Selected tab (persists when a panel like downloads is shown)
export const activeTabId$ = new StateObservable<string | null>(null)

// Navigation (active tab)
export const navState$ = new StateObservable<NavigationState>({
	url: "",
	title: "",
	canGoBack: false,
	canGoForward: false,
	isLoading: false,
})

// Bounds dérivés
const DEFAULT_NAVBAR_HEIGHT = 40

export const navBarBounds$ = new CombinedObservable([windowBounds$, config$, navBarHeight$], (windowBounds, config, navBarHeight) => {
	const { navBar } = config
	const height = navBar.visible ? navBarHeight || DEFAULT_NAVBAR_HEIGHT : 0
	const width = windowBounds.width || 1
	return navBar.position === "top" ? { x: 0, y: 0, width, height } : { x: 0, y: windowBounds.height - height, width, height }
})

export const contentBounds$ = new CombinedObservable([windowBounds$, config$, navBarHeight$], (windowBounds, config, navBarHeight) => {
	const { navBar } = config
	const navHeight = navBar.visible ? navBarHeight || DEFAULT_NAVBAR_HEIGHT : 0
	return navBar.position === "top"
		? { x: 0, y: navHeight, width: windowBounds.width, height: windowBounds.height - navHeight }
		: { x: 0, y: 0, width: windowBounds.width, height: windowBounds.height - navHeight }
})

// Navbar sync trigger
export const navbarSync$ = new CombinedObservable([navState$, tabs$, activeContentId$, activeTabId$], () => ({
	navState: navState$.get(),
	tabs: tabs$.get(),
	activeContentId: activeContentId$.get(),
	activeTabId: activeTabId$.get(),
}))

// Notifications
export const notifications$ = new StateObservable<Notification[]>([])

// Downloads - broadcast to all registered views
export const activeDownloads$ = new BroadcastObservable<ActiveDownload[]>([], IpcChannels.DOWNLOADS_ACTIVE_CHANGED)
export const downloadHistory$ = new BroadcastObservable<DownloadHistoryItem[]>([], IpcChannels.DOWNLOADS_HISTORY_CHANGED)
export const downloadEvents$ = new BroadcastEvent<DownloadEvent>(IpcChannels.DOWNLOADS_EVENT)

// Find in page
export const findBarVisible$ = new StateObservable<boolean>(false)
export const findState$ = new BroadcastObservable<FindState>({ text: "", activeMatch: 0, totalMatches: 0 }, IpcChannels.FIND_STATE_CHANGED)

// Events
export const externalOpened$ = new StateObservable<string | null>(null)

// Keyboard
export const ctrlPressed$ = new BroadcastObservable<boolean>(false, IpcChannels.CTRL_PRESSED)

// Kiosk mode
export const kioskMode$ = new StateObservable<boolean>(false)
