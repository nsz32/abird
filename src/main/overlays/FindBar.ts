import type { FindState } from "@shared/types"
import { IpcChannels } from "@shared/types"
import { Overlay } from "./Overlay"

const DEFAULT_WIDTH = 350
const DEFAULT_HEIGHT = 36

export class FindBar extends Overlay {
	private contentSize = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }

	protected getHtmlPath(): string {
		return "findbar"
	}

	protected updateViewBounds() {
		const { width, height } = this.contentSize

		// Always at bottom, flush with window edge or navbar
		const y =
			this.navBarPosition === "top"
				? this.windowBounds.height - height
				: this.windowBounds.height - this.navBarHeight - height

		this.view.setBounds({
			x: 0,
			y,
			width,
			height,
		})
	}

	sendFindState(state: FindState) {
		this.view.webContents.send(IpcChannels.FIND_STATE_CHANGED, state)
	}

	sendOpen() {
		this.view.webContents.focus()
		this.view.webContents.send(IpcChannels.FIND_OPEN)
	}
}
