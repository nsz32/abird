import { nativeTheme } from "electron"
import { getTabsList, registerHandlers } from "../ipc/handlers"
import { activeTab$, contentBounds$, navBarBounds$, navBarConfig$, navState$, tabs$, theme$ } from "../states"
import { createTab } from "../tabs/Tabs"
import { NavBar } from "../ui/NavBar"
import { MainWindow } from "./MainWindow"

export function startApp() {
	const mainWindow = new MainWindow()
	const navBar = new NavBar()

	// Ajouter navbar
	mainWindow.addView(navBar.view)
	navBar.setBounds(navBarBounds$.get())
	navBar.setVisible(navBarConfig$.get().visible)

	// Subscribe theme
	theme$.subscribe((theme) => {
		nativeTheme.themeSource = theme
		console.log(`Theme set to: ${theme} (shouldUseDarkColors: ${nativeTheme.shouldUseDarkColors})`)
	})

	// Subscribe bounds
	navBarBounds$.subscribe((bounds) => navBar.setBounds(bounds))
	contentBounds$.subscribe((bounds) => activeTab$.get()?.siteView.setBounds(bounds))

	// Subscribe tabs - ajouter les nouvelles vues
	tabs$.subscribe((tabList) => {
		for (const tab of tabList) {
			if (!tab.siteView.view.webContents.hostWebContents) {
				mainWindow.addView(tab.siteView.view)
			}
		}
		mainWindow.bringToFront(navBar.view)
	})

	// Subscribe active tab - gérer visibilité (seulement si ready)
	activeTab$.subscribe((activeTab) => {
		for (const t of tabs$.get()) {
			const isActive = t.id === activeTab?.id && t.siteView.ready
			t.siteView.setVisible(isActive)
			if (isActive) t.siteView.setBounds(contentBounds$.get())
		}
	})

	// Sync vers navbar
	const syncNavbar = () => {
		navBar.sendNavigationState(navState$.get())
		navBar.sendTabsList(getTabsList())
	}
	navState$.subscribe(syncNavbar)
	tabs$.subscribe(syncNavbar)
	activeTab$.subscribe(syncNavbar)

	// IPC
	registerHandlers()

	// Start
	navBar.load()
	navBar.onReady(() => mainWindow.show())
	createTab()
}
