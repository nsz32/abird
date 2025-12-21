import { join } from "node:path"
import { BaseWindow, WebContentsView } from "electron"
import { getNavBarBounds, initBounds, onContentBoundsChanged, onNavBarBoundsChanged, showWindowWithBounds } from "./api/bounds"
import { getNavBarConfig } from "./api/config"
import { createTab, onTabActivated, onTabClosed, onTabCreated } from "./api/tabs"

let mainWindow: BaseWindow | null = null
let navBar: WebContentsView | null = null
let activeTabView: WebContentsView | null = null

/**
 * Crée une WebContentsView avec le preload (pour overlays)
 */
function createOverlayView(): WebContentsView {
	return new WebContentsView({
		webPreferences: {
			preload: join(__dirname, "../preload/index.js"),
			nodeIntegration: false,
			contextIsolation: true,
		},
	})
}

export function createWindow(): BaseWindow {
	mainWindow = new BaseWindow({
		width: 1200,
		height: 800,
		backgroundColor: "#202830",
		show: false, // Attendre ready-to-show pour afficher avec les bonnes dimensions
	})

	// Initialiser le système de bounds AVANT de créer les views
	initBounds(mainWindow)

	// Navigation bar
	navBar = createOverlayView()
	navBar.setBackgroundColor("#1a1a2e")
	mainWindow.contentView.addChildView(navBar)

	// Appliquer bounds navbar immédiatement
	const navBarConfig = getNavBarConfig()
	navBar.setBounds(getNavBarBounds())
	navBar.setVisible(navBarConfig.visible)

	// S'abonner aux changements de bounds navbar
	onNavBarBoundsChanged((bounds) => {
		if (navBar) {
			navBar.setBounds(bounds)
		}
	})

	// S'abonner aux changements de bounds contenu pour le tab actif
	onContentBoundsChanged((bounds) => {
		if (activeTabView) {
			activeTabView.setBounds(bounds)
		}
	})

	// S'abonner aux événements tabs
	onTabCreated((tab) => {
		if (!mainWindow || !navBar) return

		// Ajouter la vue à la window (sous la navbar)
		mainWindow.contentView.addChildView(tab.view)
		// Réordonner pour que navbar reste au-dessus
		mainWindow.contentView.removeChildView(navBar)
		mainWindow.contentView.addChildView(navBar)

		// Cacher par défaut, sera affiché quand activé
		tab.view.setVisible(false)
	})

	onTabClosed((_id) => {
		// La vue sera retirée par le garbage collector
	})

	onTabActivated((tab) => {
		// Cacher l'ancien tab actif
		if (activeTabView) {
			activeTabView.setVisible(false)
		}

		activeTabView = tab.view
		activeTabView.setVisible(true)
		// Bounds déjà appliqués par onContentBoundsChanged lors du subscribe
	})

	// Créer le premier tab
	createTab()

	// Afficher la window quand la navbar est prête
	navBar.webContents.once("dom-ready", showWindowWithBounds)

	// Load navbar UI
	if (process.env.ELECTRON_RENDERER_URL) {
		navBar.webContents.loadURL(`${process.env.ELECTRON_RENDERER_URL}/navbar/`)
	} else {
		navBar.webContents.loadFile(join(__dirname, "../ui/navbar/index.html"))
	}

	mainWindow.on("closed", () => {
		mainWindow = null
		navBar = null
		activeTabView = null
	})

	return mainWindow
}

export function getNavBar(): WebContentsView | null {
	return navBar
}
