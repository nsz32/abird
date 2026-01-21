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
	partition: null,
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

// Navbar auto-hide state
export interface NavBarForceShowState {
	urlEdit: boolean // URL edit mode active
	mouseHover: boolean // Mouse in trigger zone
	downloading: boolean // Active downloads
}
export const navBarForceShow$ = new StateObservable<NavBarForceShowState>({
	urlEdit: false,
	mouseHover: false,
	downloading: false,
})

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

// Navbar effective visibility (considering autoHide)
export const navBarEffectiveVisible$ = new CombinedObservable(
	[config$, navBarForceShow$],
	(config, forceShow) => {
		const { navBar } = config
		if (!navBar.visible) return false
		if (!navBar.autoHide) return true
		return forceShow.urlEdit || forceShow.mouseHover || forceShow.downloading
	},
)

export const navBarBounds$ = new CombinedObservable(
	[windowBounds$, config$, navBarHeight$, navBarEffectiveVisible$],
	(windowBounds, config, navBarHeight, effectiveVisible) => {
		const { navBar } = config
		const width = windowBounds.width || 1
		const height = navBarHeight || DEFAULT_NAVBAR_HEIGHT

		// Hidden or autoHide collapsed: no bounds (mouse detection via uiohook)
		if (!navBar.visible || (navBar.autoHide && !effectiveVisible)) {
			return { x: 0, y: 0, width: 0, height: 0 }
		}

		return navBar.position === "top"
			? { x: 0, y: 0, width, height }
			: { x: 0, y: windowBounds.height - height, width, height }
	},
)

export const contentBounds$ = new CombinedObservable(
	[windowBounds$, config$, navBarHeight$, navBarEffectiveVisible$],
	(windowBounds, config, navBarHeight, effectiveVisible) => {
		const { navBar } = config

		// When navbar is hidden or in autoHide collapsed state, content takes full height
		if (!navBar.visible || (navBar.autoHide && !effectiveVisible)) {
			return { x: 0, y: 0, width: windowBounds.width, height: windowBounds.height }
		}

		const navHeight = navBarHeight || DEFAULT_NAVBAR_HEIGHT
		return navBar.position === "top"
			? { x: 0, y: navHeight, width: windowBounds.width, height: windowBounds.height - navHeight }
			: { x: 0, y: 0, width: windowBounds.width, height: windowBounds.height - navHeight }
	},
)

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
