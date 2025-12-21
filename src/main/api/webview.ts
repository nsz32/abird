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

	setupRouting(view)

	return view
}

/**
 * Configure les listeners de navigation sur une webview
 * Appelle onStateChange à chaque changement d'état
 */
export function setupWebViewListeners(view: WebContentsView, onStateChange: () => void): () => void {
	const wc = view.webContents

	wc.on("did-navigate", onStateChange)
	wc.on("did-navigate-in-page", onStateChange)
	wc.on("did-start-loading", onStateChange)
	wc.on("did-stop-loading", onStateChange)
	wc.on("did-finish-load", onStateChange)
	wc.on("page-title-updated", onStateChange)
	wc.on("did-frame-navigate", onStateChange)

	// Retourne fonction pour se désabonner
	return () => {
		wc.off("did-navigate", onStateChange)
		wc.off("did-navigate-in-page", onStateChange)
		wc.off("did-start-loading", onStateChange)
		wc.off("did-stop-loading", onStateChange)
		wc.off("did-finish-load", onStateChange)
		wc.off("page-title-updated", onStateChange)
		wc.off("did-frame-navigate", onStateChange)
	}
}
