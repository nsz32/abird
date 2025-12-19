import { join } from "node:path"
import { BaseWindow, WebContentsView } from "electron"

let mainWindow: BaseWindow | null = null
let siteView: WebContentsView | null = null

// Overlays registry
const overlays: Map<string, { view: WebContentsView; bounds: OverlayBounds }> = new Map()

interface OverlayBounds {
	width: number
	height: number
	position: "bottom-left" | "bottom-right" | "top-left" | "top-right"
	margin: number
}

function createOverlay(name: string, bounds: OverlayBounds): WebContentsView {
	const view = new WebContentsView({
		webPreferences: {
			preload: join(__dirname, "../preload/index.js"),
			nodeIntegration: false,
			contextIsolation: true,
		},
	})

	view.setBackgroundColor("#00000000")
	overlays.set(name, { view, bounds })

	return view
}

function updateOverlayBounds(windowBounds: { width: number; height: number }) {
	for (const [, overlay] of overlays) {
		const { view, bounds } = overlay
		let x = bounds.margin
		let y = bounds.margin

		switch (bounds.position) {
			case "bottom-left":
				x = bounds.margin
				y = windowBounds.height - bounds.height - bounds.margin
				break
			case "bottom-right":
				x = windowBounds.width - bounds.width - bounds.margin
				y = windowBounds.height - bounds.height - bounds.margin
				break
			case "top-left":
				x = bounds.margin
				y = bounds.margin
				break
			case "top-right":
				x = windowBounds.width - bounds.width - bounds.margin
				y = bounds.margin
				break
		}

		view.setBounds({ x, y, width: bounds.width, height: bounds.height })
	}
}

export function createWindow(): BaseWindow {
	mainWindow = new BaseWindow({
		width: 1200,
		height: 800,
		backgroundColor: "#202830",
	})

	// WebContentsView for the website (bottom layer - full size)
	siteView = new WebContentsView({
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
		},
	})

	// Create navigation overlay
	const navigationOverlay = createOverlay("navigation", {
		width: 600,
		height: 50,
		position: "bottom-left",
		margin: 20,
	})

	// Add views to window - order matters (last = top)
	mainWindow.contentView.addChildView(siteView)
	mainWindow.contentView.addChildView(navigationOverlay)

	// Position views
	const updateBounds = () => {
		if (mainWindow && siteView) {
			const bounds = mainWindow.getContentBounds()

			// Site fills the entire window
			siteView.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height })

			// Update all overlays
			updateOverlayBounds(bounds)
		}
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
	// TODO: Temporaire - charger koreus.com pour test
	siteView.webContents.loadURL("https://www.koreus.com")

	// Load overlay UI
	if (process.env.ELECTRON_RENDERER_URL) {
		navigationOverlay.webContents.loadURL(`${process.env.ELECTRON_RENDERER_URL}/navigation/`)
	} else {
		navigationOverlay.webContents.loadFile(join(__dirname, "../overlays/navigation/index.html"))
	}

	mainWindow.on("closed", () => {
		mainWindow = null
		siteView = null
		overlays.clear()
	})

	return mainWindow
}

export function getMainWindow(): BaseWindow | null {
	return mainWindow
}

export function getSiteView(): WebContentsView | null {
	return siteView
}

export function getOverlay(name: string): WebContentsView | null {
	return overlays.get(name)?.view ?? null
}
