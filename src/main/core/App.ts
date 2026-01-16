import { Menu, nativeTheme } from "electron"
import {
	activeDownloads$,
	activeTab$,
	config$,
	contentBounds$,
	ctrlPressed$,
	downloadEvents$,
	downloadHistory$,
	downloadPanelVisible$,
	externalOpened$,
	findBarVisible$,
	findState$,
	navbarSync$,
	notifications$,
	tabs$,
} from "../core/states"
import { registerHandlers } from "../handlers"
import { setupInputListener } from "../input/inputListener"
import { createAppMenu } from "../input/menu"
import type { Tab } from "../tabs/Tab"
import { createTab, getTabsList } from "../tabs/Tabs"
import { DownloadPanel } from "../views/DownloadPanel"
import { FindBar } from "../views/FindBar"
import { NavBar } from "../views/NavBar"
import { NotificationCenter } from "../views/NotificationCenter"
import { Watermark } from "../views/Watermark"
import { MainWindow } from "./MainWindow"

let mainWindow: MainWindow
let watermark: Watermark
let navBar: NavBar
let notificationCenter: NotificationCenter
let downloadPanel: DownloadPanel
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
	downloadPanel = new DownloadPanel()
	findBar = new FindBar()

	// Initial visibility
	navBar.setVisible(config$.get().navBar.visible)
	downloadPanel.setVisible(false)
	findBar.setVisible(false)

	// Register views for broadcast observables
	activeDownloads$.register(navBar.webContents)
	activeDownloads$.register(downloadPanel.webContents)
	downloadHistory$.register(navBar.webContents)
	downloadHistory$.register(downloadPanel.webContents)
	downloadEvents$.register(navBar.webContents)
	downloadEvents$.register(downloadPanel.webContents)
	findState$.register(findBar.webContents)
	ctrlPressed$.register(navBar.webContents)

	setupSubscriptions()

	Menu.setApplicationMenu(
		createAppMenu({
			onFocusUrl: () => navBar.sendFocusUrl(),
			onNavbarDevTools: () => navBar.openDevTools(),
		}),
	)

	// Load HTML and show
	watermark.load()
	navBar.load()
	notificationCenter.load()
	downloadPanel.load()
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

	contentBounds$.subscribe((bounds) => activeTab$.get()?.siteView.setBounds(bounds))

	activeTab$.subscribe((activeTab) => {
		updateTabsVisibility(activeTab)
	})

	tabs$.subscribe(() => {
		updateTabsVisibility(activeTab$.get())
	})

	navbarSync$.subscribe(() => {
		navBar.sendNavigationState(navbarSync$.get().navState)
		navBar.sendTabsList(getTabsList())
	})

	externalOpened$.subscribe((tabId) => {
		if (tabId) navBar.sendExternalOpened(tabId)
	})

	notifications$.subscribe((notifications) => {
		notificationCenter.sendNotifications(notifications)
	})

	downloadPanelVisible$.subscribe((visible) => {
		downloadPanel.setVisible(visible)
	})

	findBarVisible$.subscribe((visible) => {
		findBar.setVisible(visible)
		if (visible) {
			findBar.sendOpen()
		}
	})
}

function updateTabsVisibility(activeTab: Tab | null) {
	for (const tab of tabs$.get()) {
		const isActive = tab.id === activeTab?.id
		tab.siteView.setVisible(isActive || !tab.isValid)
		if (isActive) {
			tab.siteView.setBounds(contentBounds$.get())
		}
	}
}
