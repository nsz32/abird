import type { FindState } from "@shared/types"
import { IpcChannels } from "@shared/types"
import type { Rectangle } from "electron"
import { View } from "../core/View"
import { ZLayer } from "../core/ViewManager"
import { config$, navBarHeight$, windowBounds$ } from "../core/states"
import { buildViewUrl } from "../utils/url"

const DEFAULT_WIDTH = 350
const DEFAULT_HEIGHT = 36

export class FindBar extends View {
	private windowBounds: Rectangle = { x: 0, y: 0, width: 0, height: 0 }
	private navBarPosition: "top" | "bottom" = "top"
	private navBarHeight = 0
	private contentSize = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }

	constructor() {
		super({
			layer: ZLayer.FIND_BAR,
			preload: true,
			url: buildViewUrl("findbar"),
		})

		this.init()
	}

	protected setupSubscriptions() {
		windowBounds$.subscribe((bounds) => {
			this.windowBounds = bounds
			this.updateBounds()
		})

		const updateNavBar = () => {
			const { navBar } = config$.get()
			this.navBarPosition = navBar.position
			this.navBarHeight = navBar.visible ? navBarHeight$.get() : 0
			this.updateBounds()
		}
		config$.subscribe(updateNavBar)
		navBarHeight$.subscribe(updateNavBar)
	}

	private updateBounds() {
		const { width, height } = this.contentSize

		const y = this.navBarPosition === "top" ? this.windowBounds.height - height : this.windowBounds.height - this.navBarHeight - height

		this.setBounds({
			x: 0,
			y,
			width,
			height,
		})
	}

	sendFindState(state: FindState) {
		this.webContents.send(IpcChannels.FIND_STATE_CHANGED, state)
	}

	sendOpen() {
		this.webContents.focus()
		this.webContents.send(IpcChannels.FIND_OPEN)
	}
}
