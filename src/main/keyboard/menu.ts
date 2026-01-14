import { Menu, shell } from "electron"
import { activeTab$, findBarVisible$ } from "../states"
import { closeTab, createTab } from "../tabs/Tabs"

interface MenuCallbacks {
	onFocusUrl: () => void
}

export function createAppMenu(callbacks: MenuCallbacks): Menu {
	const { onFocusUrl } = callbacks

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
						const activeTab = activeTab$.get()
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
						const activeTab = activeTab$.get()
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
	])
}
