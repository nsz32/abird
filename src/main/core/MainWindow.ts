import { BaseWindow, type WebContentsView } from "electron"
import { tabs$, windowBounds$ } from "../states"

const BOUNDS_UPDATE_DELAYS = [100, 200, 300, 400, 500, 750, 1000, 1500, 2000]

export class MainWindow {
	readonly window: BaseWindow
	private watermarkView: WebContentsView | null = null
	private navBarView: WebContentsView | null = null
	private notificationView: WebContentsView | null = null
	private downloadPanelView: WebContentsView | null = null
	private findBarView: WebContentsView | null = null

	constructor() {
		this.window = new BaseWindow({
			width: 1200,
			height: 800,
			backgroundColor: "#202830",
			show: false,
			autoHideMenuBar: true,
		})

		this.setupEventListeners()
		this.setupTabsSubscription()
	}

	show() {
		this.window.show()
		this.emitBoundsWithRetry()
	}

	addView(view: WebContentsView) {
		this.window.contentView.addChildView(view)
	}

	setWatermark(view: WebContentsView) {
		this.watermarkView = view
		this.addView(view)
		this.bringToFront(this.watermarkView)
	}

	setNavBar(view: WebContentsView) {
		this.navBarView = view
		this.addView(view)
	}

	setNotificationCenter(view: WebContentsView) {
		this.notificationView = view
		this.addView(view)
		this.bringOverlaysToFront()
	}

	setDownloadPanel(view: WebContentsView) {
		this.downloadPanelView = view
		this.addView(view)
		this.bringOverlaysToFront()
	}

	setFindBar(view: WebContentsView) {
		this.findBarView = view
		this.addView(view)
		this.bringOverlaysToFront()
	}

	bringViewToFront(view: WebContentsView) {
		this.bringToFront(view)
		this.bringOverlaysToFront()
	}

	bringOverlaysToFront() {
		if (this.navBarView) this.bringToFront(this.navBarView)
		if (this.findBarView) this.bringToFront(this.findBarView)
		if (this.downloadPanelView) this.bringToFront(this.downloadPanelView)
		if (this.notificationView) this.bringToFront(this.notificationView)
	}

	private setupEventListeners() {
		this.window.on("resize", () => this.emitBounds())
		this.window.on("enter-full-screen", () => this.emitBounds())
		this.window.on("leave-full-screen", () => this.emitBounds())
	}

	private setupTabsSubscription() {
		tabs$.subscribe((tabList) => {
			for (const tab of tabList) {
				if (!tab.siteView.view.webContents.hostWebContents) {
					this.addView(tab.siteView.view)
				}
			}
			this.bringOverlaysToFront()
		})
	}

	private emitBounds() {
		windowBounds$.emit(this.window.getContentBounds())
	}

	private emitBoundsWithRetry() {
		this.emitBounds()
		for (const delay of BOUNDS_UPDATE_DELAYS) {
			setTimeout(() => this.emitBounds(), delay)
		}
	}

	private bringToFront(view: WebContentsView) {
		this.window.contentView.removeChildView(view)
		this.window.contentView.addChildView(view)
	}
}
