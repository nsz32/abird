import { BaseWindow, type WebContentsView } from "electron"
import { tabs$, windowBounds$ } from "../states"
import { ViewManager, ZLayer } from "./ViewManager"

const BOUNDS_UPDATE_DELAYS = [100, 200, 300, 400, 500, 750, 1000, 1500, 2000]

export class MainWindow {
	readonly window: BaseWindow
	private readonly viewManager: ViewManager

	constructor() {
		this.window = new BaseWindow({
			width: 1200,
			height: 800,
			backgroundColor: "#202830",
			show: false,
			autoHideMenuBar: true,
		})

		this.viewManager = new ViewManager(this.window.contentView)

		this.setupEventListeners()
		this.setupTabsSubscription()
	}

	show() {
		this.window.show()
		this.emitBoundsWithRetry()
	}

	addSiteView(view: WebContentsView) {
		this.viewManager.addView(view, ZLayer.SITE_CONTENT)
	}

	setWatermark(view: WebContentsView) {
		this.viewManager.addView(view, ZLayer.WATERMARK)
	}

	setNavBar(view: WebContentsView) {
		this.viewManager.addView(view, ZLayer.NAVBAR)
	}

	setNotificationCenter(view: WebContentsView) {
		this.viewManager.addView(view, ZLayer.NOTIFICATIONS)
	}

	setDownloadPanel(view: WebContentsView) {
		this.viewManager.addView(view, ZLayer.DOWNLOAD_PANEL)
	}

	setFindBar(view: WebContentsView) {
		this.viewManager.addView(view, ZLayer.FIND_BAR)
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
					console.log("[MainWindow] addView for tab", tab.id)
					this.addSiteView(tab.siteView.view)
				}
			}
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
}
