import { Menu, app, nativeTheme } from "electron"
import { getTabsList, registerHandlers } from "../ipc/handlers"
import { setupInputListener } from "../keyboard/inputListener"
import { createAppMenu } from "../keyboard/menu"
import {
	activeDownloads$,
	activeTab$,
	contentBounds$,
	ctrlPressed$,
	downloadEvents$,
	downloadHistory$,
	downloadPanelVisible$,
	externalOpened$,
	findBarVisible$,
	findState$,
	navBarBounds$,
	navBarConfig$,
	navBarHeight$,
	navbarSync$,
	notifications$,
	tabs$,
	theme$,
	windowBounds$,
} from "../states"
import type { Tab } from "../tabs/Tab"
import { createTab } from "../tabs/Tabs"
import { DownloadPanel } from "../ui/DownloadPanel"
import { FindBar } from "../ui/FindBar"
import { NavBar } from "../ui/NavBar"
import { NotificationCenter } from "../ui/NotificationCenter"
import { MainWindow } from "./MainWindow"

let mainWindow: MainWindow
let navBar: NavBar
let notificationCenter: NotificationCenter
let downloadPanel: DownloadPanel
let findBar: FindBar

export function startApp() {
	// Must be first to capture all WebContents
	setupInputListener()
	registerHandlers()

	// Initialize components
	mainWindow = new MainWindow()
	navBar = new NavBar()
	notificationCenter = new NotificationCenter()
	downloadPanel = new DownloadPanel()
	findBar = new FindBar()

	mainWindow.setNavBar(navBar.view)
	mainWindow.setNotificationCenter(notificationCenter.view)
	mainWindow.setDownloadPanel(downloadPanel.view)
	mainWindow.setFindBar(findBar.view)
	navBar.setBounds(navBarBounds$.get())
	navBar.setVisible(navBarConfig$.get().visible)
	downloadPanel.setVisible(false)
	findBar.setVisible(false)

	// Register views for broadcast observables
	activeDownloads$.register(navBar.view.webContents)
	activeDownloads$.register(downloadPanel.view.webContents)
	downloadHistory$.register(navBar.view.webContents)
	downloadHistory$.register(downloadPanel.view.webContents)
	downloadEvents$.register(navBar.view.webContents)
	downloadEvents$.register(downloadPanel.view.webContents)
	findState$.register(findBar.view.webContents)
	ctrlPressed$.register(navBar.view.webContents)

	// Setup subscriptions
	setupSubscriptions()

	// Setup menu
	Menu.setApplicationMenu(
		createAppMenu({
			onFocusUrl: () => navBar.sendFocusUrl(),
		}),
	)

	// Load and show
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
	theme$.subscribe((theme) => {
		nativeTheme.themeSource = theme
	})

	navBarBounds$.subscribe((bounds) => navBar.setBounds(bounds))
	contentBounds$.subscribe((bounds) => activeTab$.get()?.siteView.setBounds(bounds))
	windowBounds$.subscribe((bounds) => {
		notificationCenter.setBounds(bounds)
		downloadPanel.setBounds(bounds)
		findBar.setBounds(bounds)
	})

	// Update panels position when navbar config or height changes
	const updatePanelsNavBar = () => {
		const { position, visible } = navBarConfig$.get()
		const height = visible ? navBarHeight$.get() : 0
		notificationCenter.setNavBar(position, height)
		downloadPanel.setNavBar(position, height)
		findBar.setNavBar(position, height)
	}
	navBarConfig$.subscribe(updatePanelsNavBar)
	navBarHeight$.subscribe(updatePanelsNavBar)

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
		// Non-proper tabs stay visible (loading in background)
		// Proper tabs are only visible when active
		tab.siteView.setVisible(isActive || !tab.proper)
		if (isActive) {
			tab.siteView.setBounds(contentBounds$.get())
			mainWindow.bringViewToFront(tab.siteView.view)
		}
	}
}
