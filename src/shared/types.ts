/**
 * Types partagés entre main, preload et renderer
 */

// Theme mode
export type ThemeMode = "system" | "light" | "dark"

// État de navigation (envoyé aux overlays)
export interface NavigationState {
	url: string
	title: string
	canGoBack: boolean
	canGoForward: boolean
	isLoading: boolean
}

// Info d'un tab (envoyé aux overlays)
export interface TabInfo {
	id: string
	title: string
	url: string
	favicon: string | null
	isActive: boolean
	isLoading: boolean
}

// Canaux IPC (évite les typos, autocomplétion)
export const IpcChannels = {
	// Navigation
	NAVIGATION_BACK: "bird:navigation:back",
	NAVIGATION_FORWARD: "bird:navigation:forward",
	NAVIGATION_RELOAD: "bird:navigation:reload",
	NAVIGATION_STOP: "bird:navigation:stop",
	NAVIGATION_GO_TO: "bird:navigation:go-to",
	NAVIGATION_GET_STATE: "bird:navigation:get-state",
	NAVIGATION_STATE_CHANGED: "bird:navigation:state-changed",
	// Tabs
	TABS_GET_LIST: "bird:tabs:get-list",
	TABS_LIST_CHANGED: "bird:tabs:list-changed",
	TABS_ACTIVATE: "bird:tabs:activate",
	TABS_CLOSE: "bird:tabs:close",
	TABS_CREATE: "bird:tabs:create",
	// Config
	CONFIG_GET_NAVBAR: "bird:config:get-navbar",
} as const

// Type utilitaire pour les valeurs de IpcChannels
export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]

// Configuration de la barre de navigation
export interface NavBarConfig {
	position: "top" | "bottom"
	visible: boolean
	autoHide: boolean // Pour plus tard
	urlEditable: boolean
	showBackForward: boolean
	showReload: boolean
}

// Configuration du routage des URLs
export interface RoutingConfig {
	internal: string | string[] // URLs internes (regex ^... ou baseUrl)
	download?: string | string[] // URLs autorisées pour downloads
}

// Configuration d'une app (site web isolé)
export interface AppConfig {
	partition: string // Nom de la partition (données isolées)
	startUrl: string
	theme?: ThemeMode
	userAgent?: string // Shortcode: "mobile:chrome", "desktop:firefox:linux"
	userAgentRaw?: string // UA custom brut (prioritaire sur userAgent)
	navBar?: Partial<NavBarConfig>
	routing?: Partial<RoutingConfig>
}

// API Bird exposée aux overlays via contextBridge
export interface BirdApi {
	navigation: {
		back: () => Promise<void>
		forward: () => Promise<void>
		reload: (ignoreCache?: boolean) => Promise<void>
		stop: () => Promise<void>
		goTo: (url: string) => Promise<void>
		getState: () => Promise<NavigationState>
		onStateChanged: (callback: (state: NavigationState) => void) => () => void
	}
	tabs: {
		getList: () => Promise<TabInfo[]>
		onListChanged: (callback: (tabs: TabInfo[]) => void) => () => void
		activate: (id: string) => Promise<void>
		close: (id: string) => Promise<void>
		create: (position?: "start" | "end") => Promise<void>
	}
	config: {
		getNavBar: () => Promise<NavBarConfig>
	}
}

// Déclaration globale pour window.bird
declare global {
	interface Window {
		bird: BirdApi
	}
}
