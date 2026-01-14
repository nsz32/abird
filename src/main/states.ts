import {
	type ActiveDownload,
	type DownloadEvent,
	type DownloadHistoryItem,
	type FindState,
	IpcChannels,
	type NavBarConfig,
	type NavigationState,
	type Notification,
	type ResolvedDownloadConfig,
	type RoutingConfig,
	type ThemeMode,
	defaultNavBarConfig,
} from "@shared/types"
import type { Rectangle } from "electron"
import { BroadcastEvent, BroadcastObservable, CombinedObservable, StateObservable } from "./api/observable"
import type { Tab } from "./tabs/Tab"

// Config
export const navBarConfig$ = new StateObservable<NavBarConfig>(defaultNavBarConfig)
export const routing$ = new StateObservable<Partial<RoutingConfig> | null>(null)
export const startUrl$ = new StateObservable<string>("about:blank")
export const partition$ = new StateObservable<string>("default")
export const theme$ = new StateObservable<ThemeMode>("system")
export const userAgent$ = new StateObservable<string>("desktop:bird")
export const downloadConfig$ = new StateObservable<ResolvedDownloadConfig>({
	directory: null,
	autoOpenMaxSize: 0,
	autoOpenExtensions: [],
})

// Window
export const windowBounds$ = new StateObservable<Rectangle>({ x: 0, y: 0, width: 0, height: 0 })
export const navBarHeight$ = new StateObservable<number>(0)

// Tabs
export const tabs$ = new StateObservable<Tab[]>([])
export const activeTab$ = new StateObservable<Tab | null>(null)

// Navigation (tab active)
export const navState$ = new StateObservable<NavigationState>({
	url: "",
	title: "",
	canGoBack: false,
	canGoForward: false,
	isLoading: false,
})

// Bounds dérivés
const DEFAULT_NAVBAR_HEIGHT = 40

export const navBarBounds$ = new CombinedObservable([windowBounds$, navBarConfig$, navBarHeight$], (windowBounds, navBarConfig, navBarHeight) => {
	const height = navBarConfig.visible ? navBarHeight || DEFAULT_NAVBAR_HEIGHT : 0
	const width = windowBounds.width || 1
	return navBarConfig.position === "top" ? { x: 0, y: 0, width, height } : { x: 0, y: windowBounds.height - height, width, height }
})

export const contentBounds$ = new CombinedObservable([windowBounds$, navBarConfig$, navBarHeight$], (windowBounds, navBarConfig, navBarHeight) => {
	const navHeight = navBarConfig.visible ? navBarHeight || DEFAULT_NAVBAR_HEIGHT : 0
	return navBarConfig.position === "top"
		? { x: 0, y: navHeight, width: windowBounds.width, height: windowBounds.height - navHeight }
		: { x: 0, y: 0, width: windowBounds.width, height: windowBounds.height - navHeight }
})

// Navbar sync trigger (combinaison de navState, tabs, activeTab)
export const navbarSync$ = new CombinedObservable([navState$, tabs$, activeTab$], () => ({
	navState: navState$.get(),
	tabs: tabs$.get(),
	activeTab: activeTab$.get(),
}))

// Notifications
export const notifications$ = new StateObservable<Notification[]>([])

// Downloads - broadcast to all registered views
export const activeDownloads$ = new BroadcastObservable<ActiveDownload[]>([], IpcChannels.DOWNLOADS_ACTIVE_CHANGED)
export const downloadHistory$ = new BroadcastObservable<DownloadHistoryItem[]>([], IpcChannels.DOWNLOADS_HISTORY_CHANGED)
export const downloadEvents$ = new BroadcastEvent<DownloadEvent>(IpcChannels.DOWNLOADS_EVENT)
export const downloadPanelVisible$ = new StateObservable<boolean>(false)

// Find in page
export const findBarVisible$ = new StateObservable<boolean>(false)
export const findState$ = new BroadcastObservable<FindState>({ text: "", activeMatch: 0, totalMatches: 0 }, IpcChannels.FIND_STATE_CHANGED)

// Events
export const externalOpened$ = new StateObservable<string | null>(null)

// Keyboard
export const ctrlPressed$ = new BroadcastObservable<boolean>(false, IpcChannels.CTRL_PRESSED)
