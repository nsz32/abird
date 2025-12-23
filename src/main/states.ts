import type { NavBarConfig, NavigationState, RoutingConfig, ThemeMode } from "@shared/types"
import type { Rectangle } from "electron"
import { CombinedObservable, StateObservable } from "./api/observable"
import type { Tab } from "./tabs/Tab"

const NAV_BAR_HEIGHT = 40

const defaultNavBarConfig: NavBarConfig = {
	position: "top",
	visible: true,
	autoHide: false,
	urlEditable: true,
	showBackForward: true,
	showReload: true,
}

// Config
export const navBarConfig$ = new StateObservable<NavBarConfig>(defaultNavBarConfig)
export const routing$ = new StateObservable<RoutingConfig | null>(null)
export const startUrl$ = new StateObservable<string>("about:blank")
export const partition$ = new StateObservable<string>("default")
export const theme$ = new StateObservable<ThemeMode>("system")
export const userAgent$ = new StateObservable<string>("desktop:bird")

// Window
export const windowBounds$ = new StateObservable<Rectangle>({ x: 0, y: 0, width: 0, height: 0 })

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
export const navBarBounds$ = new CombinedObservable([windowBounds$, navBarConfig$], (windowBounds, navBarConfig) => {
	const navHeight = navBarConfig.visible ? NAV_BAR_HEIGHT : 0
	return navBarConfig.position === "top"
		? { x: 0, y: 0, width: windowBounds.width, height: navHeight }
		: { x: 0, y: windowBounds.height - navHeight, width: windowBounds.width, height: navHeight }
})

export const contentBounds$ = new CombinedObservable([windowBounds$, navBarConfig$], (windowBounds, navBarConfig) => {
	const navHeight = navBarConfig.visible ? NAV_BAR_HEIGHT : 0
	return navBarConfig.position === "top"
		? { x: 0, y: navHeight, width: windowBounds.width, height: windowBounds.height - navHeight }
		: { x: 0, y: 0, width: windowBounds.width, height: windowBounds.height - navHeight }
})
