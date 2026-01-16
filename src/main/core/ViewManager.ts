import type { View, WebContentsView } from "electron"
import { StateObservable } from "../utils/observable"

/**
 * Z-index layers for views. Higher values are rendered on top.
 */
export enum ZLayer {
	WATERMARK = 0,
	SITE_CONTENT = 10,
	NAVBAR = 100,
	FIND_BAR = 101,
	NOTIFICATIONS = 102,
}

interface ManagedView {
	view: WebContentsView
	zIndex: number
}

/**
 * Manages WebContentsView z-ordering and content view visibility.
 * Uses detach/reattach pattern since Electron's native z-index doesn't work reliably.
 */
export class ViewManager {
	private views: ManagedView[] = []
	private contentViews = new Map<string, WebContentsView>()
	private static instance: ViewManager | null = null

	readonly activeContentId$ = new StateObservable<string | null>(null)

	constructor(private readonly contentView: View) {
		ViewManager.instance = this
	}

	static get(): ViewManager {
		if (!ViewManager.instance) {
			throw new Error("ViewManager not initialized")
		}
		return ViewManager.instance
	}

	// Z-ordering

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

	reorderAllViews() {
		const sorted = [...this.views].sort((a, b) => a.zIndex - b.zIndex)

		for (const { view } of sorted) this.contentView.removeChildView(view)
		for (const { view } of sorted) this.contentView.addChildView(view)
	}

	// Content views management

	registerContentView(id: string, view: WebContentsView) {
		this.contentViews.set(id, view)
		view.setVisible(false)
	}

	unregisterContentView(id: string) {
		this.contentViews.delete(id)

		if (this.activeContentId$.get() === id) {
			this.activeContentId$.emit(null)
		}
	}

	showContent(id: string) {
		if (!this.contentViews.has(id)) return

		for (const [viewId, view] of this.contentViews) {
			view.setVisible(viewId === id)
		}

		this.activeContentId$.emit(id)
	}

	hideAllContent() {
		for (const view of this.contentViews.values()) {
			view.setVisible(false)
		}

		this.activeContentId$.emit(null)
	}
}
