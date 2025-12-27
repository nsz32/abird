import { BaseWindow, type WebContentsView } from "electron"
import { tabs$, windowBounds$ } from "../states"

const BOUNDS_UPDATE_DELAYS = [100, 200, 300, 400, 500]

export class MainWindow {
	readonly window: BaseWindow
	private navBarView: WebContentsView | null = null
	private notificationView: WebContentsView | null = null

	constructor() {
		this.window = new BaseWindow({
			width: 1200,
			height: 800,
			backgroundColor: "#202830",
			show: false,
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

	setNavBar(view: WebContentsView) {
		this.navBarView = view
		this.addView(view)
	}

	setNotificationCenter(view: WebContentsView) {
		this.notificationView = view
		this.addView(view)
		this.bringOverlaysToFront()
	}

	bringViewToFront(view: WebContentsView) {
		this.bringToFront(view)
		this.bringOverlaysToFront()
	}

	bringOverlaysToFront() {
		if (this.navBarView) this.bringToFront(this.navBarView)
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
