import { View } from "../core/View"
import { ZLayer } from "../core/ViewManager"
import { contentBounds$ } from "../core/states"

/**
 * View for internal panels (downloads, config, etc).
 * Full preload access - only for trusted internal pages.
 */
export class PanelView extends View {
	constructor(htmlPath: string) {
		super({
			layer: ZLayer.SITE_CONTENT,
			preload: true,
			html: htmlPath,
		})

		this.init()
	}

	protected setupSubscriptions() {
		contentBounds$.subscribe((bounds) => this.setBounds(bounds))
	}
}
