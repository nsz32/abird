import { Menu, nativeTheme } from "electron"
import {
	activeDownloads$,
	config$,
	ctrlPressed$,
	downloadEvents$,
	downloadHistory$,
	externalOpened$,
	findBarVisible$,
	findState$,
	kioskMode$,
	navbarSync$,
	notifications$,
} from "../core/states"
import { registerHandlers } from "../handlers"
import { setupInputListener } from "../input/inputListener"
import { createAppMenu } from "../input/menu"
import { createTab, getTabsList } from "../tabs/Tabs"
import { FindBar } from "../views/FindBar"
import { NavBar } from "../views/NavBar"
import { NotificationCenter } from "../views/NotificationCenter"
import { OverlayPanel } from "../views/OverlayPanel"
import { Watermark } from "../views/Watermark"
import { MainWindow } from "./MainWindow"
import { ViewManager } from "./ViewManager"

export const DOWNLOADS_VIEW_ID = "downloads"

let mainWindow: MainWindow
let watermark: Watermark
let navBar: NavBar
let notificationCenter: NotificationCenter
let downloadsPanel: OverlayPanel
let findBar: FindBar

export function startApp() {
	setupInputListener()
	registerHandlers()

	// MainWindow must be created first (initializes ViewManager)
	mainWindow = new MainWindow()

	// Views auto-register with ViewManager on construction
	watermark = new Watermark()
	navBar = new NavBar()
	notificationCenter = new NotificationCenter()
	downloadsPanel = new OverlayPanel("bird://downloads/")
	findBar = new FindBar()

	// Register downloads panel as a content view (not a tab)
	ViewManager.get().registerContentView(DOWNLOADS_VIEW_ID, downloadsPanel.webContentsView)

	// Initial visibility
	navBar.setVisible(config$.get().navBar.visible)
	findBar.setVisible(false)

	// Register views for broadcast observables
	activeDownloads$.register(navBar.webContents)
	activeDownloads$.register(downloadsPanel.webContents)
	downloadHistory$.register(navBar.webContents)
	downloadHistory$.register(downloadsPanel.webContents)
	downloadEvents$.register(navBar.webContents)
	downloadEvents$.register(downloadsPanel.webContents)
	findState$.register(findBar.webContents)
	ctrlPressed$.register(navBar.webContents)

	setupSubscriptions()

	if (kioskMode$.get()) {
		Menu.setApplicationMenu(null)
	} else {
		Menu.setApplicationMenu(
			createAppMenu({
				onFocusUrl: () => navBar.sendFocusUrl(),
				onNavbarDevTools: () => navBar.openDevTools(),
			}),
		)
	}

	// Load HTML and show
	watermark.load()
	navBar.load()
	notificationCenter.load()
	downloadsPanel.load()
	findBar.load()

	navBar.onReady(() => {
		mainWindow.show()
		createTab()
	})
}

function setupSubscriptions() {
	config$.subscribe((config) => {
		nativeTheme.themeSource = config.theme
	})
	nativeTheme.themeSource = config$.get().theme

	navbarSync$.subscribe(() => {
		const { navState, activeContentId, activeTabId } = navbarSync$.get()
		const isStandalonePanel = activeContentId !== null && activeContentId !== activeTabId
		const isDownloadsPanelActive = activeContentId === DOWNLOADS_VIEW_ID
		navBar.sendNavigationState({ ...navState, isStandalonePanel, isDownloadsPanelActive })
		navBar.sendTabsList(getTabsList())
	})

	externalOpened$.subscribe((tabId) => {
		if (tabId) navBar.sendExternalOpened(tabId)
	})

	notifications$.subscribe((notifications) => {
		notificationCenter.sendNotifications(notifications)
	})

	findBarVisible$.subscribe((visible) => {
		findBar.setVisible(visible)
		if (visible) {
			findBar.sendOpen()
		}
	})
}
