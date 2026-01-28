import { BrowserView, type BrowserViewCallbacks } from "./BrowserView"

/**
 * View for internal content (abird:// URLs).
 * Has preload access - only for trusted internal pages.
 */
export class PanelView extends BrowserView {
	constructor(url: string, callbacks: BrowserViewCallbacks) {
		if (!url.startsWith("abird://")) {
			throw new Error("PanelView can only load abird:// URLs")
		}
		super({ url, preload: true }, callbacks)
	}
}
