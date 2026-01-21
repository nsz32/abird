import { join } from "node:path"
import { Menu, app, dialog, nativeImage, shell } from "electron"
import { getTranslations } from "../core/I18n"
import { findBarVisible$ } from "../core/states"
import { closeTab, createTab, getActiveTab } from "../tabs/Tabs"
import { getNavBar } from "../views/views"

function getAppIconPath(): string {
	return app.isPackaged ? join(process.resourcesPath, "assets", "icons", "256x256.png") : join(app.getAppPath(), "assets", "icons", "256x256.png")
}

function showAboutDialog(): void {
	const detail = ["Desktop, Repackable, Isolated Browser", "", "© 2026 Nicolas Szabo", "<nszabo2@gmail.com>", "", "License: GPL-3.0"].join("\n")

	dialog.showMessageBox({
		type: "info",
		icon: nativeImage.createFromPath(getAppIconPath()),
		title: "About Bird",
		message: `Bird v${app.getVersion()}`,
		detail,
		buttons: ["OK"],
	})
}

export function createAppMenu(): Menu {
	const t = getTranslations()

	return Menu.buildFromTemplate([
		{
			label: t["menu.app"],
			submenu: [{ label: t["menu.app.quit"], role: "quit", accelerator: "CmdOrCtrl+Q" }],
		},
		{
			label: t["menu.tab"],
			submenu: [
				{
					label: t["menu.tab.new"],
					accelerator: "CmdOrCtrl+T",
					click: () => createTab(undefined, "user", 0),
				},
				{
					label: t["menu.tab.openExternal"],
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
					label: t["menu.tab.editUrl"],
					accelerator: "CmdOrCtrl+L",
					click: () => getNavBar()?.sendFocusUrl(),
				},
				{ type: "separator" },
				{
					label: t["menu.tab.close"],
					accelerator: "CmdOrCtrl+W",
					click: () => {
						const activeTab = getActiveTab()
						if (activeTab) closeTab(activeTab.id)
					},
				},
			],
		},
		{
			label: t["menu.page"],
			submenu: [
				{
					label: t["menu.page.find"],
					accelerator: "CmdOrCtrl+F",
					click: () => findBarVisible$.emit(true),
				},
			],
		},
		{
			label: t["menu.developer"],
			submenu: [
				{
					label: t["menu.developer.devtoolsSite"],
					click: () => getActiveTab()?.view.webContents.openDevTools(),
				},
				{
					label: t["menu.developer.devtoolsNavbar"],
					click: () => getNavBar()?.openDevTools(),
				},
			],
		},
		{
			label: t["menu.help"],
			submenu: [{ label: t["menu.help.about"], click: showAboutDialog }],
		},
	])
}
