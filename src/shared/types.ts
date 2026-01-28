/**
 * Types shared between main, preload and renderer
 * Config types inferred from Zod (export type = no module execution)
 */

// Config types (inferred from Zod)
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

// Local import for internal use in interfaces
import type { PartitionConfig as _PartitionConfig } from "./config.schema"

// I18n types
export type { Translations } from "./i18n"

// Tab origin - determines how a tab should behave
// "user": Created by user action (Home+, first tab) → always proper, activate immediately
// "background": Created in background (middle-click) → always proper, don't activate
// "blank": Created by _blank/JS → must be checked for content before becoming proper
export type TabOrigin = "user" | "background" | "blank"

// Navigation state (sent to overlays)
export interface NavigationState {
	url: string
	title: string
	canGoBack: boolean
	canGoForward: boolean
	isLoading: boolean
	isStandalonePanel?: boolean
	isDownloadsPanelActive?: boolean
}

// Tab info (sent to overlays)
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

// Active downloads
export interface ActiveDownload {
	id: string
	filename: string
	receivedBytes: number
	totalBytes: number // 0 if unknown
	bytesPerSecond: number
	startedAt: number
}

// Download history (session only)
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

// Download events (lightweight notifications)
export type DownloadEventType = "started" | "progress" | "completed" | "cancelled" | "failed" | "blocked"

export interface DownloadEvent {
	type: DownloadEventType
	id: string
	progress?: number // 0-100, for "progress"
	autoOpened?: boolean // for "completed"
}

// Find in page state
export interface FindState {
	text: string
	activeMatch: number // 1-based, 0 if no results
	totalMatches: number
}

// Partition state (config + physical)
export interface PartitionState {
	name: string
	hasConfig: boolean // Exists in config.partitions
	hasPhysical: boolean // Exists on disk
	usedByApps: string[] // Apps using it
	isOrphan: boolean // Physical but unused
	config: _PartitionConfig | null
	diskSize?: number
}

// Complete list of partitions
export interface PartitionsState {
	partitions: PartitionState[]
	physicalPath: string
}

// App deployment state (desktop shortcuts)
export interface DeployState {
	supported: boolean
	apps: Record<string, boolean> // appName -> isDeployed
}

// User agent presets (available shortcodes + default)
export interface UserAgentPresets {
	keys: string[]
	defaultKey: string
}

// IPC channels (prevents typos, enables autocompletion)
export const IpcChannels = {
	// Navigation
	NAVIGATION_BACK: "abird:navigation:back",
	NAVIGATION_FORWARD: "abird:navigation:forward",
	NAVIGATION_RELOAD: "abird:navigation:reload",
	NAVIGATION_STOP: "abird:navigation:stop",
	NAVIGATION_GO_TO: "abird:navigation:go-to",
	NAVIGATION_GO_HOME: "abird:navigation:go-home",
	NAVIGATION_GET_STATE: "abird:navigation:get-state",
	NAVIGATION_STATE_CHANGED: "abird:navigation:state-changed",
	// Tabs
	TABS_GET_LIST: "abird:tabs:get-list",
	TABS_LIST_CHANGED: "abird:tabs:list-changed",
	TABS_ACTIVATE: "abird:tabs:activate",
	TABS_CLOSE: "abird:tabs:close",
	TABS_CREATE: "abird:tabs:create",
	TABS_EXTERNAL_OPENED: "abird:tabs:external-opened",
	// Config
	CONFIG_GET: "abird:config:get",
	// Notifications
	NOTIF_LIST_CHANGED: "abird:notif:list-changed",
	NOTIF_DISMISS: "abird:notif:dismiss",
	NOTIF_GET_LIST: "abird:notif:get-list",
	NOTIF_RESIZE: "abird:notif:resize",
	// Navbar
	NAVBAR_RESIZE: "abird:navbar:resize",
	NAVBAR_URL_EDIT_MODE: "abird:navbar:url-edit-mode",
	// Commands
	COMMAND_FOCUS_URL: "abird:command:focus-url",
	// Downloads panel
	DOWNLOADS_TOGGLE: "abird:downloads:toggle",
	DOWNLOADS_GET_HISTORY: "abird:downloads:get-history",
	DOWNLOADS_HISTORY_CHANGED: "abird:downloads:history-changed",
	DOWNLOADS_GET_ACTIVE: "abird:downloads:get-active",
	DOWNLOADS_ACTIVE_CHANGED: "abird:downloads:active-changed",
	DOWNLOADS_EVENT: "abird:downloads:event",
	DOWNLOADS_PANEL_RESIZE: "abird:downloads:panel-resize",
	DOWNLOADS_OPEN_FILE: "abird:downloads:open-file",
	DOWNLOADS_OPEN_FOLDER: "abird:downloads:open-folder",
	DOWNLOADS_CANCEL: "abird:downloads:cancel",
	DOWNLOADS_RETRY: "abird:downloads:retry",
	DOWNLOADS_REMOVE: "abird:downloads:remove",
	// Find in page
	FIND_OPEN: "abird:find:open",
	FIND_SEARCH: "abird:find:search",
	FIND_NEXT: "abird:find:next",
	FIND_PREV: "abird:find:prev",
	FIND_CLOSE: "abird:find:close",
	FIND_STATE_CHANGED: "abird:find:state-changed",
	FIND_PANEL_RESIZE: "abird:find:panel-resize",
	// Keyboard
	CTRL_PRESSED: "abird:keyboard:ctrl-pressed",
	// User config (raw JSON)
	USERCONFIG_READ: "userconfig:read",
	USERCONFIG_WRITE: "userconfig:write",
	// I18n
	I18N_GET_TRANSLATIONS: "abird:i18n:get-translations",
	// Icons
	ICONS_FETCH: "abird:icons:fetch",
	ICONS_SAVE: "abird:icons:save",
	ICONS_IMPORT_FILE: "abird:icons:import-file",
	ICONS_DELETE: "abird:icons:delete",
	ICONS_GET_DATA: "abird:icons:get-data",
	// Deploy
	DEPLOY_SUPPORTED: "abird:deploy:supported",
	DEPLOY_STATUS: "abird:deploy:status",
	DEPLOY_LIST: "abird:deploy:list",
	DEPLOY_APP: "abird:deploy:app",
	UNDEPLOY_APP: "abird:deploy:undeploy",
	DEPLOY_RENAME: "abird:deploy:rename",
	// Partition
	PARTITION_LIST: "abird:partition:list",
	PARTITION_CLEANUP: "abird:partition:cleanup",
	PARTITION_RESET: "abird:partition:reset",
	PARTITION_DELETE: "abird:partition:delete",
	PARTITION_RENAME: "abird:partition:rename",
	// App launch & cleanup
	APP_LAUNCH_SUPPORTED: "abird:app:launch-supported",
	APP_LAUNCH: "abird:app:launch",
	APP_CLEAN_ALL: "abird:app:clean-all",
	// Settings
	SETTINGS_SELECT_DIRECTORY: "abird:settings:select-directory",
	SETTINGS_GET_DEFAULT_DOWNLOADS_PATH: "abird:settings:get-default-downloads-path",
	SETTINGS_GET_USER_AGENTS: "abird:settings:get-user-agents",
} as const

// Utility type for IpcChannels values
export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]

import type { ThemeMode } from "./config.schema"
import type { Translations } from "./i18n"

// Resolved navbar config (individual buttons)
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

// Resolved config (parsed values for runtime)
export interface ResolvedDownloadConfig {
	directory: string | null
	autoOpenMaxSize: number
	autoOpenMimeTypes: string[]
	allowExecutablesDownload: boolean
	allowDuplicateDownloads: boolean
}

// Resolved routing config (patterns compiled to RegExp)
export interface ResolvedRoutingConfig {
	internal: RegExp[]
	download: RegExp[]
	external: RegExp[]
	ignore: RegExp[]
}

// Effective config (computed from BirdConfig + context)
export interface EffectiveConfig {
	startUrl: string
	partition: string | null
	theme: ThemeMode
	userAgent: string
	navBar: ResolvedNavBarConfig
	routing: ResolvedRoutingConfig
	downloads: ResolvedDownloadConfig
	preload?: string
}

// ABird API exposed to overlays via contextBridge
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
		setUrlEditMode: (active: boolean) => void
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
		selectDirectory: (defaultPath?: string) => Promise<string | null>
		getDefaultDownloadsPath: () => Promise<string>
		getUserAgents: () => Promise<UserAgentPresets>
	}
	i18n: {
		getTranslations: () => Promise<Translations>
	}
	icons: {
		fetch: (url: string, partition?: string) => Promise<IconFetchResult>
		save: (appName: string, base64: string, oldIcon?: string) => Promise<string>
		importFile: (appName: string, oldIcon?: string) => Promise<string | null>
		delete: (filename: string) => Promise<void>
		getData: (filename: string) => Promise<IconData | null>
	}
	deploy: {
		isSupported: () => Promise<boolean>
		getStatus: (appName: string) => Promise<boolean>
		list: (appNames: string[]) => Promise<DeployState>
		deploy: (appName: string) => Promise<void>
		undeploy: (appName: string) => Promise<void>
		rename: (oldName: string, newName: string) => Promise<void>
	}
	partition: {
		list: () => Promise<PartitionsState>
		cleanup: (name: string) => Promise<void>
		reset: (name: string) => Promise<void>
		delete: (name: string) => Promise<void>
		rename: (oldName: string, newName: string) => Promise<void>
	}
	app: {
		isLaunchSupported: () => Promise<boolean>
		launch: (appName: string) => Promise<void>
		cleanAll: () => Promise<void>
	}
}

// Icon data (for icon preview with dimensions)
export interface IconData {
	data: string // base64 data URL
	width: number
	height: number
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

// Global declaration for window.abird
declare global {
	interface Window {
		abird: BirdApi
	}
}
