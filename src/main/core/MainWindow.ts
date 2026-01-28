import { BaseWindow } from "electron"
import { resolveAppIcon } from "../services/icons"
import { ViewManager } from "./ViewManager"
import { setupKiosk } from "./kiosk"
import { kioskMode$, windowBounds$ } from "./states"

const BOUNDS_UPDATE_DELAYS = [100, 200, 300, 400, 500, 750, 1000, 1500, 2000]

export class MainWindow {
	readonly window: BaseWindow

	constructor() {
		this.window = new BaseWindow({
			width: 1200,
			height: 800,
			backgroundColor: "#202830",
			show: false,
			autoHideMenuBar: true,
			kiosk: kioskMode$.get(),
			icon: resolveAppIcon(),
		})

		// Initialize ViewManager singleton with this window's contentView
		new ViewManager(this.window.contentView)

		this.setupEventListeners()
		setupKiosk(this.window)
	}

	show() {
		this.window.show()
		this.emitBoundsWithRetry()
	}

	private setupEventListeners() {
		this.window.on("resize", () => this.emitBounds())
		this.window.on("enter-full-screen", () => this.emitBounds())
		this.window.on("leave-full-screen", () => this.emitBounds())
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
