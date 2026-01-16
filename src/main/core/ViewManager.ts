import type { View, WebContentsView } from "electron"

/**
 * Z-index layers for views. Higher values are rendered on top.
 */
export enum ZLayer {
	WATERMARK = 0,
	SITE_CONTENT = 10,
	NAVBAR = 100,
	FIND_BAR = 101,
	NOTIFICATIONS = 102,
	DOWNLOAD_PANEL = 103,
}

interface ManagedView {
	view: WebContentsView
	zIndex: number
}

/**
 * Manages WebContentsView z-ordering within a parent View.
 * Uses detach/reattach pattern since Electron's native z-index doesn't work reliably.
 * Views are sorted by zIndex and reattached in order (last attached = on top).
 */
export class ViewManager {
	private views: ManagedView[] = []
	private static instance: ViewManager | null = null

	constructor(private readonly contentView: View) {
		ViewManager.instance = this
	}

	static get(): ViewManager {
		if (!ViewManager.instance) {
			throw new Error("ViewManager not initialized")
		}
		return ViewManager.instance
	}

	addView(view: WebContentsView, zIndex: number) {
		if (this.views.some((v) => v.view === view)) return

		this.views.push({ view, zIndex })
		this.reorderAllViews()
	}

	removeView(view: WebContentsView) {
		const index = this.views.findIndex((v) => v.view === view)
		if (index !== -1) {
			this.views.splice(index, 1)
			this.contentView.removeChildView(view)
		}
	}

	/**
	 * Detaches all views and reattaches them sorted by zIndex.
	 * Lower zIndex = attached first = rendered below.
	 */
	reorderAllViews() {
		const sorted = [...this.views].sort((a, b) => a.zIndex - b.zIndex)

		for (const { view } of sorted) this.contentView.removeChildView(view)
		for (const { view } of sorted) this.contentView.addChildView(view)
	}
}
