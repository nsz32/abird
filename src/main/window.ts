import { join } from "node:path"
import { BaseWindow, WebContentsView } from "electron"
import { getNavBarConfig, getStartUrl } from "./api/config"

const NAV_BAR_HEIGHT = 40

let mainWindow: BaseWindow | null = null
let siteView: WebContentsView | null = null
let navBar: WebContentsView | null = null

/**
 * Crée une WebContentsView avec le preload
 */
function createView(transparent = false): WebContentsView {
	const view = new WebContentsView({
		webPreferences: {
			preload: join(__dirname, "../preload/index.js"),
			nodeIntegration: false,
			contextIsolation: true,
		},
	})

	if (transparent) {
		view.setBackgroundColor("#00000000")
	}

	return view
}

export function createWindow(): BaseWindow {
	const navBarConfig = getNavBarConfig()

	mainWindow = new BaseWindow({
		width: 1200,
		height: 800,
		backgroundColor: "#202830",
	})

	// WebContentsView for the website
	siteView = new WebContentsView({
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
		},
	})

	// Navigation bar (fixed, not floating)
	navBar = createView()
	navBar.setBackgroundColor("#1a1a2e")

	// Add views to window - order matters (last = top)
	mainWindow.contentView.addChildView(siteView)
	mainWindow.contentView.addChildView(navBar)

	// Position views based on config
	const updateBounds = () => {
		if (!mainWindow || !siteView || !navBar) return

		const bounds = mainWindow.getContentBounds()
		const navHeight = navBarConfig.visible ? NAV_BAR_HEIGHT : 0

		if (navBarConfig.position === "top") {
			// Navbar en haut
			navBar.setBounds({ x: 0, y: 0, width: bounds.width, height: navHeight })
			siteView.setBounds({ x: 0, y: navHeight, width: bounds.width, height: bounds.height - navHeight })
		} else {
			// Navbar en bas
			siteView.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height - navHeight })
			navBar.setBounds({ x: 0, y: bounds.height - navHeight, width: bounds.width, height: navHeight })
		}

		navBar.setVisible(navBarConfig.visible)
	}

	// Initial bounds
	updateBounds()
	mainWindow.on("resize", updateBounds)

	// Hide siteView until content is ready
	siteView.setVisible(false)
	siteView.webContents.once("dom-ready", () => {
		updateBounds()
		siteView?.setVisible(true)
	})

	// Load the website in siteView
	siteView.webContents.loadURL(getStartUrl())

	// Load navbar UI
	if (process.env.ELECTRON_RENDERER_URL) {
		navBar.webContents.loadURL(`${process.env.ELECTRON_RENDERER_URL}/navbar/`)
	} else {
		navBar.webContents.loadFile(join(__dirname, "../ui/navbar/index.html"))
	}

	mainWindow.on("closed", () => {
		mainWindow = null
		siteView = null
		navBar = null
	})

	return mainWindow
}

export function getMainWindow(): BaseWindow | null {
	return mainWindow
}

export function getSiteView(): WebContentsView | null {
	return siteView
}

export function getNavBar(): WebContentsView | null {
	return navBar
}

// Alias pour compatibilité avec navigation.ts
export function getOverlay(name: string): WebContentsView | null {
	if (name === "navigation") return navBar
	return null
}
