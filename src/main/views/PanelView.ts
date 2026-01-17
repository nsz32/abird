import { BrowserView, type BrowserViewCallbacks } from "./BrowserView"

/**
 * View for internal content (bird:// URLs).
 * Has preload access - only for trusted internal pages.
 */
export class PanelView extends BrowserView {
	constructor(url: string, callbacks: BrowserViewCallbacks) {
		if (!url.startsWith("bird://")) {
			throw new Error("PanelView can only load bird:// URLs")
		}
		super({ url, preload: true }, callbacks)
	}
}
