import { Menu, shell } from "electron"
import { findBarVisible$ } from "../core/states"
import { closeTab, createTab, getActiveTab } from "../tabs/Tabs"

interface MenuCallbacks {
	onFocusUrl: () => void
	onNavbarDevTools: () => void
}

export function createAppMenu(callbacks: MenuCallbacks): Menu {
	const { onFocusUrl, onNavbarDevTools } = callbacks

	return Menu.buildFromTemplate([
		{
			label: "Onglet",
			submenu: [
				{
					label: "Nouveau",
					accelerator: "CmdOrCtrl+T",
					click: () => createTab(undefined, "user", 0),
				},
				{
					label: "Ouvrir externe",
					accelerator: "CmdOrCtrl+E",
					click: () => {
						const activeTab = getActiveTab()
						if (activeTab) {
							const url = activeTab.navState$.get().url || activeTab.initialUrl
							if (url && url !== "about:blank") shell.openExternal(url)
						}
					},
				},
				{
					label: "Éditer l'URL",
					accelerator: "CmdOrCtrl+L",
					click: () => onFocusUrl(),
				},
				{ type: "separator" },
				{
					label: "Fermer",
					accelerator: "CmdOrCtrl+W",
					click: () => {
						const activeTab = getActiveTab()
						if (activeTab) closeTab(activeTab.id)
					},
				},
			],
		},
		{
			label: "Page",
			submenu: [
				{
					label: "Rechercher",
					accelerator: "CmdOrCtrl+F",
					click: () => findBarVisible$.emit(true),
				},
			],
		},
		{
			label: "Développeur",
			submenu: [
				{
					label: "DevTools Site",
					click: () => getActiveTab()?.webView.webContents.openDevTools(),
				},
				{
					label: "DevTools Navbar",
					click: () => onNavbarDevTools(),
				},
			],
		},
	])
}
