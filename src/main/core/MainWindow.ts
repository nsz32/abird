import { BaseWindow, type WebContentsView } from "electron"
import { tabs$, windowBounds$ } from "../states"

export class MainWindow {
	readonly window: BaseWindow
	private navBarView: WebContentsView | null = null

	constructor() {
		this.window = new BaseWindow({
			width: 1200,
			height: 800,
			backgroundColor: "#202830",
			show: false,
		})

		this.updateBounds()
		this.window.on("resize", () => this.updateBounds())
		this.window.on("enter-full-screen", () => this.updateBounds())
		this.window.on("leave-full-screen", () => this.updateBounds())

		tabs$.subscribe((tabList) => {
			for (const tab of tabList) {
				if (!tab.siteView.view.webContents.hostWebContents) {
					this.addView(tab.siteView.view)
				}
			}
			if (this.navBarView) this.bringToFront(this.navBarView)
		})
	}

	private updateBounds() {
		windowBounds$.emit(this.window.getContentBounds())
	}

	show() {
		this.window.show()
		for (let i = 100; i <= 500; i += 100) setTimeout(() => this.updateBounds(), i)
	}

	addView(view: WebContentsView) {
		this.window.contentView.addChildView(view)
	}

	setNavBar(view: WebContentsView) {
		this.navBarView = view
		this.addView(view)
	}

	private bringToFront(view: WebContentsView) {
		this.window.contentView.removeChildView(view)
		this.window.contentView.addChildView(view)
	}
}
