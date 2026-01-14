/**
 * Types partagés entre main, preload et renderer
 */

// Theme mode
export type ThemeMode = "system" | "light" | "dark"

// Tab origin - determines how a tab should behave
// "user": Created by user action (Home+, first tab) → always proper, activate immediately
// "background": Created in background (middle-click) → always proper, don't activate
// "blank": Created by _blank/JS → must be checked for content before becoming proper
export type TabOrigin = "user" | "background" | "blank"

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

// Notifications
export type NotificationType = "info" | "download" | "external-link" | "error"

export interface Notification {
	id: string
	type: NotificationType
	title: string
	message?: string
	progress?: number
	dismissable: boolean
	createdAt: number
}

// Téléchargements actifs
export interface ActiveDownload {
	id: string
	filename: string
	receivedBytes: number
	totalBytes: number // 0 si inconnu
	startedAt: number
}

// Historique des téléchargements (session uniquement)
export type DownloadStatus = "completed" | "cancelled" | "failed" | "blocked"

export interface DownloadHistoryItem {
	id: string
	filename: string
	status: DownloadStatus
	message?: string
	completedAt: number
}

// Events de téléchargement (notifications légères)
export type DownloadEventType = "started" | "progress" | "completed" | "cancelled" | "failed" | "blocked"

export interface DownloadEvent {
	type: DownloadEventType
	id: string
	progress?: number // 0-100, pour "progress"
}

// État de la recherche dans la page
export interface FindState {
	text: string
	activeMatch: number // 1-based, 0 si aucun résultat
	totalMatches: number
}

// Canaux IPC (évite les typos, autocomplétion)
export const IpcChannels = {
	// Navigation
	NAVIGATION_BACK: "bird:navigation:back",
	NAVIGATION_FORWARD: "bird:navigation:forward",
	NAVIGATION_RELOAD: "bird:navigation:reload",
	NAVIGATION_STOP: "bird:navigation:stop",
	NAVIGATION_GO_TO: "bird:navigation:go-to",
	NAVIGATION_GO_HOME: "bird:navigation:go-home",
	NAVIGATION_GET_STATE: "bird:navigation:get-state",
	NAVIGATION_STATE_CHANGED: "bird:navigation:state-changed",
	// Tabs
	TABS_GET_LIST: "bird:tabs:get-list",
	TABS_LIST_CHANGED: "bird:tabs:list-changed",
	TABS_ACTIVATE: "bird:tabs:activate",
	TABS_CLOSE: "bird:tabs:close",
	TABS_CREATE: "bird:tabs:create",
	TABS_EXTERNAL_OPENED: "bird:tabs:external-opened",
	// Config
	CONFIG_GET_NAVBAR: "bird:config:get-navbar",
	// Notifications
	NOTIF_LIST_CHANGED: "bird:notif:list-changed",
	NOTIF_DISMISS: "bird:notif:dismiss",
	NOTIF_GET_LIST: "bird:notif:get-list",
	NOTIF_RESIZE: "bird:notif:resize",
	// Navbar
	NAVBAR_RESIZE: "bird:navbar:resize",
	// Commands
	COMMAND_FOCUS_URL: "bird:command:focus-url",
	// Downloads panel
	DOWNLOADS_TOGGLE: "bird:downloads:toggle",
	DOWNLOADS_GET_HISTORY: "bird:downloads:get-history",
	DOWNLOADS_HISTORY_CHANGED: "bird:downloads:history-changed",
	DOWNLOADS_GET_ACTIVE: "bird:downloads:get-active",
	DOWNLOADS_ACTIVE_CHANGED: "bird:downloads:active-changed",
	DOWNLOADS_EVENT: "bird:downloads:event",
	DOWNLOADS_PANEL_RESIZE: "bird:downloads:panel-resize",
	// Find in page
	FIND_OPEN: "bird:find:open",
	FIND_SEARCH: "bird:find:search",
	FIND_NEXT: "bird:find:next",
	FIND_PREV: "bird:find:prev",
	FIND_CLOSE: "bird:find:close",
	FIND_STATE_CHANGED: "bird:find:state-changed",
	FIND_PANEL_RESIZE: "bird:find:panel-resize",
	// Keyboard
	CTRL_PRESSED: "bird:keyboard:ctrl-pressed",
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
	allowSingleTabClose: boolean
}

export const defaultNavBarConfig: NavBarConfig = {
	position: "top",
	visible: true,
	autoHide: false,
	urlEditable: true,
	showBackForward: true,
	showReload: true,
	allowSingleTabClose: false,
}

// Configuration du routage des URLs
export interface RoutingConfig {
	internal: string | string[] // URLs internes (regex ^... ou baseUrl)
	download?: string | string[] // URLs autorisées pour downloads
}

// Configuration des téléchargements
export interface DownloadConfig {
	directory?: string // Si absent → dossier Downloads système
	autoOpenMaxSize?: number | string // Bytes ou "512k", "10M" (0 = désactivé)
	autoOpenMimeTypes?: string[] // Ex: ["image/*", "application/pdf"]
	allowExecutablesDownload?: boolean // Si true, autorise le téléchargement d'exécutables (défaut: false)
	preventDuplicateDownloads?: boolean // Si true, supprime les doublons MD5 (défaut: false)
}

export const defaultDownloadConfig: DownloadConfig = {}

// Config résolue (valeurs parsées pour runtime)
export interface ResolvedDownloadConfig {
	directory: string | null
	autoOpenMaxSize: number
	autoOpenMimeTypes: string[]
	allowExecutablesDownload: boolean
	preventDuplicateDownloads: boolean
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
		goHome: () => Promise<void>
		getState: () => Promise<NavigationState>
		onStateChanged: (callback: (state: NavigationState) => void) => () => void
	}
	tabs: {
		getList: () => Promise<TabInfo[]>
		onListChanged: (callback: (tabs: TabInfo[]) => void) => () => void
		onExternalOpened: (callback: (tabId: string) => void) => () => void
		activate: (id: string) => Promise<void>
		close: (id: string) => Promise<void>
		create: (index?: number) => Promise<void>
	}
	config: {
		getNavBar: () => Promise<NavBarConfig>
	}
	navbar: {
		resize: (height: number) => void
	}
	commands: {
		onFocusUrl: (callback: () => void) => () => void
	}
	notifications: {
		getList: () => Promise<Notification[]>
		onListChanged: (callback: (notifications: Notification[]) => void) => () => void
		dismiss: (id: string) => Promise<void>
		resize: (width: number, height: number) => void
	}
	downloads: {
		toggle: () => Promise<void>
		getHistory: () => Promise<DownloadHistoryItem[]>
		getActive: () => Promise<ActiveDownload[]>
		onHistoryChanged: (callback: (items: DownloadHistoryItem[]) => void) => () => void
		onActiveChanged: (callback: (items: ActiveDownload[]) => void) => () => void
		onEvent: (callback: (event: DownloadEvent) => void) => () => void
		panelResize: (width: number, height: number) => void
	}
	find: {
		search: (text: string) => Promise<void>
		next: () => Promise<void>
		prev: () => Promise<void>
		close: () => Promise<void>
		onOpen: (callback: () => void) => () => void
		onStateChanged: (callback: (state: FindState) => void) => () => void
		panelResize: (width: number, height: number) => void
	}
	keyboard: {
		onCtrlChanged: (callback: (pressed: boolean) => void) => () => void
	}
}

// Déclaration globale pour window.bird
declare global {
	interface Window {
		bird: BirdApi
	}
}
