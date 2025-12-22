import { BaseWindow, type WebContentsView } from "electron"
import { windowBounds$ } from "../states"

export class MainWindow {
	readonly window: BaseWindow

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

	bringToFront(view: WebContentsView) {
		this.window.contentView.removeChildView(view)
		this.window.contentView.addChildView(view)
	}
}
