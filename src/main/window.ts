import { join } from "node:path"
import { BaseWindow, WebContentsView } from "electron"

let mainWindow: BaseWindow | null = null
let siteView: WebContentsView | null = null
let overlayView: WebContentsView | null = null

// Overlay dimensions
const OVERLAY_WIDTH = 180
const OVERLAY_HEIGHT = 70
const OVERLAY_MARGIN = 20

export function createWindow(): BaseWindow {
	mainWindow = new BaseWindow({
		width: 1200,
		height: 800,
	})

	// WebContentsView for the website (bottom layer - full size)
	siteView = new WebContentsView({
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
		},
	})

	// WebContentsView for our overlay (top layer - small, positioned bottom-left)
	overlayView = new WebContentsView({
		webPreferences: {
			preload: join(__dirname, "../preload/index.mjs"),
			nodeIntegration: false,
			contextIsolation: true,
		},
	})

	// Make overlay background transparent
	overlayView.setBackgroundColor("#00000000")

	// Add views to window - order matters (last = top)
	mainWindow.contentView.addChildView(siteView)
	mainWindow.contentView.addChildView(overlayView)

	// Position views
	const updateBounds = () => {
		if (mainWindow && siteView && overlayView) {
			const bounds = mainWindow.getContentBounds()

			// Site fills the entire window
			siteView.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height })

			// Overlay is a small box in the bottom-left corner
			overlayView.setBounds({
				x: OVERLAY_MARGIN,
				y: bounds.height - OVERLAY_HEIGHT - OVERLAY_MARGIN,
				width: OVERLAY_WIDTH,
				height: OVERLAY_HEIGHT,
			})
		}
	}

	updateBounds()
	mainWindow.on("resize", updateBounds)

	// Load the website in siteView
	// TODO: Temporaire - charger koreus.com pour test
	siteView.webContents.loadURL("https://www.koreus.com")

	// Load our overlay UI
	if (process.env.ELECTRON_RENDERER_URL) {
		overlayView.webContents.loadURL(process.env.ELECTRON_RENDERER_URL)
	} else {
		overlayView.webContents.loadFile(join(__dirname, "../renderer/index.html"))
	}

	mainWindow.on("closed", () => {
		mainWindow = null
		siteView = null
		overlayView = null
	})

	return mainWindow
}

export function getMainWindow(): BaseWindow | null {
	return mainWindow
}

export function getSiteView(): WebContentsView | null {
	return siteView
}

export function getOverlayView(): WebContentsView | null {
	return overlayView
}
