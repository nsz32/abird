import { View } from "../core/View"
import { ZLayer } from "../core/ViewManager"
import { contentBounds$ } from "../core/states"

/**
 * Fixed overlay panel (downloads, etc).
 * Not a tab - registered as content view with static ID.
 * Has preload access for IPC communication.
 */
export class OverlayPanel extends View {
	constructor(url: string) {
		super({
			layer: ZLayer.SITE_CONTENT,
			preload: true,
			url,
		})

		this.init()
	}

	protected setupSubscriptions() {
		contentBounds$.subscribe((bounds) => this.setBounds(bounds))
	}
}
