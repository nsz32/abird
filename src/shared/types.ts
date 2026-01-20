/**
 * Types partagés entre main, preload et renderer
 * Types de config inférés depuis Zod (export type = pas d'exécution du module)
 */

// Config types (inférés depuis Zod)
export type {
	ThemeMode,
	NavBarConfig,
	RoutingConfig,
	RoutingAction,
	DownloadConfig,
	AppConfig,
	BirdConfig,
	PartitionConfig,
} from "./config.schema"

// Import local pour usage interne dans les interfaces
import type { PartitionConfig as _PartitionConfig } from "./config.schema"

// I18n types
export type { Translations } from "./i18n/translations"

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
	isStandalonePanel?: boolean
	isDownloadsPanelActive?: boolean
}

// Info d'un tab (envoyé aux overlays)
export interface TabInfo {
	id: string
	title: string
	url: string
	favicon: string | null
	isActive: boolean
	isCurrent: boolean
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
	bytesPerSecond: number
	startedAt: number
}

// Historique des téléchargements (session uniquement)
export type DownloadStatus = "completed" | "cancelled" | "failed" | "blocked" | "duplicate"

export interface DownloadHistoryItem {
	id: string
	filename: string
	savePath: string
	url: string
	partition: string
	status: DownloadStatus
	totalBytes: number
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

// État d'une partition (config + physique)
export interface PartitionState {
	name: string
	hasConfig: boolean // Existe dans config.partitions
	hasPhysical: boolean // Existe sur disque
	usedByApps: string[] // Apps qui l'utilisent
	isOrphan: boolean // Physique mais non utilisée
	isFragile: boolean // Créée auto avec app (runtime only)
	config: _PartitionConfig | null
	diskSize?: number
}

// Liste complète des partitions
export interface PartitionsState {
	partitions: PartitionState[]
	physicalPath: string
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
	CONFIG_GET: "bird:config:get",
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
	DOWNLOADS_OPEN_FILE: "bird:downloads:open-file",
	DOWNLOADS_OPEN_FOLDER: "bird:downloads:open-folder",
	DOWNLOADS_CANCEL: "bird:downloads:cancel",
	DOWNLOADS_RETRY: "bird:downloads:retry",
	DOWNLOADS_REMOVE: "bird:downloads:remove",
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
	// User config (raw JSON)
	USERCONFIG_READ: "userconfig:read",
	USERCONFIG_WRITE: "userconfig:write",
	// I18n
	I18N_GET_TRANSLATIONS: "bird:i18n:get-translations",
	// Icons
	ICONS_FETCH: "bird:icons:fetch",
	ICONS_SAVE: "bird:icons:save",
	ICONS_IMPORT_FILE: "bird:icons:import-file",
	// Deploy
	DEPLOY_SUPPORTED: "bird:deploy:supported",
	DEPLOY_STATUS: "bird:deploy:status",
	DEPLOY_APP: "bird:deploy:app",
	UNDEPLOY_APP: "bird:deploy:undeploy",
	// Partition
	PARTITION_LIST: "bird:partition:list",
	PARTITION_CLEANUP: "bird:partition:cleanup",
	PARTITION_RESET: "bird:partition:reset",
	PARTITION_DELETE: "bird:partition:delete",
	PARTITION_MARK_FRAGILE: "bird:partition:mark-fragile",
	PARTITION_RENAME: "bird:partition:rename",
	// App launch
	APP_LAUNCH_SUPPORTED: "bird:app:launch-supported",
	APP_LAUNCH: "bird:app:launch",
} as const

// Type utilitaire pour les valeurs de IpcChannels
export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]

import type { ThemeMode } from "./config.schema"
import type { Translations } from "./i18n/translations"

// Config navbar résolue (boutons individuels)
export interface ResolvedNavBarConfig {
	position: "top" | "bottom"
	visible: boolean
	autoHide: boolean
	allowUrlEdit: boolean
	allowSingleTabClose: boolean
	showBackButton: boolean
	showForwardButton: boolean
	showRefreshButton: boolean
	showHomeButton: boolean
}

// Config résolue (valeurs parsées pour runtime)
export interface ResolvedDownloadConfig {
	directory: string | null
	autoOpenMaxSize: number
	autoOpenMimeTypes: string[]
	allowExecutablesDownload: boolean
	allowDuplicateDownloads: boolean
}

// Config routing résolue (patterns compilés en RegExp)
export interface ResolvedRoutingConfig {
	internal: RegExp[]
	download: RegExp[]
	external: RegExp[]
	ignore: RegExp[]
}

// Config effective (computée selon BirdConfig + contexte)
export interface EffectiveConfig {
	startUrl: string
	partition: string
	theme: ThemeMode
	userAgent: string
	navBar: ResolvedNavBarConfig
	routing: ResolvedRoutingConfig
	downloads: ResolvedDownloadConfig
	preload?: string
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
		get: () => Promise<EffectiveConfig>
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
		openFile: (id: string) => Promise<void>
		openFolder: (id: string) => Promise<void>
		cancel: (id: string) => Promise<void>
		retry: (id: string) => Promise<void>
		remove: (id: string) => Promise<void>
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
	settings: {
		userconfig: {
			read: () => Promise<{ path: string; content: unknown }>
			write: (content: unknown) => Promise<{ success: boolean; errors?: string[] }>
		}
	}
	i18n: {
		getTranslations: () => Promise<Translations>
	}
	icons: {
		fetch: (url: string, partition?: string) => Promise<IconFetchResult>
		save: (appName: string, base64: string, oldIcon?: string) => Promise<string>
		importFile: (appName: string, oldIcon?: string) => Promise<string | null>
	}
	deploy: {
		isSupported: () => Promise<boolean>
		getStatus: (appName: string) => Promise<boolean>
		deploy: (appName: string) => Promise<void>
		undeploy: (appName: string) => Promise<void>
	}
	partition: {
		list: () => Promise<PartitionsState>
		cleanup: (name: string) => Promise<void>
		reset: (name: string) => Promise<void>
		delete: (name: string) => Promise<void>
		markFragile: (name: string) => Promise<void>
		rename: (oldName: string, newName: string) => Promise<void>
	}
	app: {
		isLaunchSupported: () => Promise<boolean>
		launch: (appName: string) => Promise<void>
	}
}

// Icon fetching
export type IconSource = "apple-touch" | "icon-hd" | "ms-tile" | "og-image" | "icon" | "favicon" | "google"

export interface IconResult {
	url: string
	source: IconSource
	size?: number
}

export interface IconFetchResult {
	icons: IconResult[]
	title?: string
	themeColor?: string
}

// Déclaration globale pour window.bird
declare global {
	interface Window {
		bird: BirdApi
	}
}
