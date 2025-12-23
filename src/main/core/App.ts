import { nativeTheme } from "electron"
import { getTabsList, registerHandlers } from "../ipc/handlers"
import { activeTab$, contentBounds$, navBarBounds$, navBarConfig$, navbarSync$, tabs$, theme$ } from "../states"
import { createTab } from "../tabs/Tabs"
import { NavBar } from "../ui/NavBar"
import { MainWindow } from "./MainWindow"

export function startApp() {
	const mainWindow = new MainWindow()
	const navBar = new NavBar()

	mainWindow.setNavBar(navBar.view)
	navBar.setBounds(navBarBounds$.get())
	navBar.setVisible(navBarConfig$.get().visible)

	theme$.subscribe((theme) => {
		nativeTheme.themeSource = theme
	})
	navBarBounds$.subscribe((bounds) => navBar.setBounds(bounds))
	contentBounds$.subscribe((bounds) => activeTab$.get()?.siteView.setBounds(bounds))

	activeTab$.subscribe((activeTab) => {
		for (const t of tabs$.get()) {
			const isActive = t.id === activeTab?.id
			t.siteView.setVisible(isActive)
			if (isActive) t.siteView.setBounds(contentBounds$.get())
		}
	})

	navbarSync$.subscribe(({ navState }) => {
		navBar.sendNavigationState(navState)
		navBar.sendTabsList(getTabsList())
	})

	registerHandlers()

	navBar.load()
	navBar.onReady(() => mainWindow.show())
	createTab()
}
