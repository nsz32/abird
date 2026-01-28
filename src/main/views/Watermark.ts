import { View } from "../core/View"
import { ZLayer } from "../core/ViewManager"
import { windowBounds$ } from "../core/states"

export class Watermark extends View {
	constructor() {
		super({
			layer: ZLayer.WATERMARK,
			url: "abird://watermark/",
		})

		this.init()
	}

	protected setupSubscriptions() {
		windowBounds$.subscribe((bounds) => {
			this.setBounds({
				x: 0,
				y: 0,
				width: bounds.width,
				height: bounds.height,
			})
		})
	}
}
