/**
 * Factory pour créer des WebContentsView de sites
 */

import { WebContentsView } from "electron"
import { setupRouting } from "./routing"

/**
 * Crée une WebContentsView pour afficher un site (sans preload)
 */
export function createSiteView(): WebContentsView {
	const view = new WebContentsView({
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
		},
	})

	view.setBackgroundColor("#202830")
	setupRouting(view)

	return view
}

/**
 * Supprime les entrées d'historique consécutives avec la même URL
 */
function deduplicateHistory(view: WebContentsView): void {
	const history = view.webContents.navigationHistory
	const activeIndex = history.getActiveIndex()
	const startIndex = Math.max(0, activeIndex - 10)

	// Itérer à l'envers pour ne pas décaler les index lors des suppressions
	for (let i = activeIndex - 1; i >= startIndex; i--) {
		const entry = history.getEntryAtIndex(i)
		const nextEntry = history.getEntryAtIndex(i + 1)
		if (entry?.url === nextEntry?.url) {
			history.removeEntryAtIndex(i)
		}
	}
}

/**
 * Configure les listeners de navigation sur une webview
 * Appelle onStateChange à chaque changement d'état
 */
export function setupWebViewListeners(view: WebContentsView, onStateChange: () => void): () => void {
	const wc = view.webContents

	const onNavigateInPage = () => {
		deduplicateHistory(view)
		onStateChange()
	}

	wc.on("did-navigate", onStateChange)
	wc.on("did-navigate-in-page", onNavigateInPage)
	wc.on("did-start-loading", onStateChange)
	wc.on("did-stop-loading", onStateChange)
	wc.on("did-finish-load", onStateChange)
	wc.on("page-title-updated", onStateChange)
	wc.on("did-frame-navigate", onStateChange)

	// Retourne fonction pour se désabonner
	return () => {
		wc.off("did-navigate", onStateChange)
		wc.off("did-navigate-in-page", onNavigateInPage)
		wc.off("did-start-loading", onStateChange)
		wc.off("did-stop-loading", onStateChange)
		wc.off("did-finish-load", onStateChange)
		wc.off("page-title-updated", onStateChange)
		wc.off("did-frame-navigate", onStateChange)
	}
}
