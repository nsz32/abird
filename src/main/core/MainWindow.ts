import { BaseWindow } from "electron"
import { kioskMode$, windowBounds$ } from "../core/states"
import { ViewManager } from "./ViewManager"

const BOUNDS_UPDATE_DELAYS = [100, 200, 300, 400, 500, 750, 1000, 1500, 2000]

export class MainWindow {
	readonly window: BaseWindow
	private kioskBounds: { width: number; height: number } | null = null

	constructor() {
		this.window = new BaseWindow({
			width: 1200,
			height: 800,
			backgroundColor: "#202830",
			show: false,
			autoHideMenuBar: true,
			kiosk: kioskMode$.get(),
		})

		// Initialize ViewManager singleton with this window's contentView
		new ViewManager(this.window.contentView)

		this.setupEventListeners()
	}

	show() {
		this.window.show()
		this.emitBoundsWithRetry()
	}

	private setupEventListeners() {
		this.window.on("resize", () => {
			if (kioskMode$.get()) {
				const bounds = this.window.getBounds()

				if (!this.kioskBounds) {
					this.kioskBounds = { width: bounds.width, height: bounds.height }
				} else if (bounds.width < this.kioskBounds.width || bounds.height < this.kioskBounds.height) {
					this.window.setKiosk(false)
					this.window.setKiosk(true)
				}
			}
			this.emitBounds()
		})

		this.window.on("enter-full-screen", () => this.emitBounds())
		this.window.on("leave-full-screen", () => this.emitBounds())

		this.window.on("blur", () => {
			if (kioskMode$.get()) this.window.focus()
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
