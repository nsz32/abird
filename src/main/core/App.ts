import { nativeTheme } from "electron"
import { getTabsList, registerHandlers } from "../ipc/handlers"
import { activeTab$, contentBounds$, externalOpened$, navBarBounds$, navBarConfig$, navbarSync$, notifications$, tabs$, theme$, windowBounds$ } from "../states"
import { createTab } from "../tabs/Tabs"
import { NavBar } from "../ui/NavBar"
import { NotificationCenter } from "../ui/NotificationCenter"
import { MainWindow } from "./MainWindow"

let mainWindow: MainWindow
let navBar: NavBar
let notificationCenter: NotificationCenter

export function startApp() {
	initializeComponents()
	setupSubscriptions()
	launch()
}

function initializeComponents() {
	mainWindow = new MainWindow()
	navBar = new NavBar()
	notificationCenter = new NotificationCenter()

	mainWindow.setNavBar(navBar.view)
	mainWindow.setNotificationCenter(notificationCenter.view)
	navBar.setBounds(navBarBounds$.get())
	navBar.setVisible(navBarConfig$.get().visible)
}

function setupSubscriptions() {
	theme$.subscribe((theme) => {
		nativeTheme.themeSource = theme
	})

	navBarBounds$.subscribe((bounds) => navBar.setBounds(bounds))
	contentBounds$.subscribe((bounds) => activeTab$.get()?.siteView.setBounds(bounds))
	windowBounds$.subscribe((bounds) => notificationCenter.setBounds(bounds))

	activeTab$.subscribe((activeTab) => {
		for (const t of tabs$.get()) {
			const isActive = t.id === activeTab?.id
			t.siteView.setVisible(isActive && t.ready)
			if (isActive) t.siteView.setBounds(contentBounds$.get())
		}
		mainWindow.bringOverlaysToFront()
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
}

function launch() {
	registerHandlers()

	navBar.load()
	notificationCenter.load()

	navBar.onReady(() => {
		mainWindow.show()
		createTab()
	})
}
