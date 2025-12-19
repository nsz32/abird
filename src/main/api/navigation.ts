/**
 * API Navigation - Fonctions de navigation pour le site web
 */

import { IpcChannels, type NavigationState } from "@shared/types"
import { ipcMain } from "electron"
import { getOverlay, getSiteView } from "../window"

/**
 * Retourne l'état de navigation actuel
 */
export function getNavigationState(): NavigationState {
	const siteView = getSiteView()
	if (!siteView) {
		return {
			url: "",
			title: "",
			canGoBack: false,
			canGoForward: false,
			isLoading: false,
		}
	}

	const webContents = siteView.webContents
	return {
		url: webContents.getURL(),
		title: webContents.getTitle(),
		canGoBack: webContents.canGoBack(),
		canGoForward: webContents.canGoForward(),
		isLoading: webContents.isLoading(),
	}
}

/**
 * Navigue vers la page précédente
 */
export function goBack(): void {
	const siteView = getSiteView()
	if (siteView?.webContents.canGoBack()) {
		siteView.webContents.goBack()
	}
}

/**
 * Navigue vers la page suivante
 */
export function goForward(): void {
	const siteView = getSiteView()
	if (siteView?.webContents.canGoForward()) {
		siteView.webContents.goForward()
	}
}

/**
 * Recharge la page
 * @param ignoreCache - Si true, ignore le cache (hard reload)
 */
export function reload(ignoreCache = false): void {
	const siteView = getSiteView()
	if (!siteView) return

	if (ignoreCache) {
		siteView.webContents.reloadIgnoringCache()
	} else {
		siteView.webContents.reload()
	}
}

/**
 * Enregistre les handlers IPC pour la navigation
 */
export function registerNavigationHandlers(): void {
	ipcMain.handle(IpcChannels.NAVIGATION_GET_STATE, () => {
		return getNavigationState()
	})

	ipcMain.handle(IpcChannels.NAVIGATION_BACK, () => {
		goBack()
	})

	ipcMain.handle(IpcChannels.NAVIGATION_FORWARD, () => {
		goForward()
	})

	ipcMain.handle(IpcChannels.NAVIGATION_RELOAD, (_event, ignoreCache?: boolean) => {
		reload(ignoreCache)
	})
}

/**
 * Envoie l'état de navigation à l'overlay navigation
 */
function pushNavigationState(): void {
	const navigationOverlay = getOverlay("navigation")
	if (navigationOverlay) {
		navigationOverlay.webContents.send(IpcChannels.NAVIGATION_STATE_CHANGED, getNavigationState())
	}
}

/**
 * Configure la synchronisation de l'état de navigation
 * Écoute les événements webContents et push l'état aux overlays
 */
export function setupNavigationStateSync(): void {
	const siteView = getSiteView()
	if (!siteView) return

	const webContents = siteView.webContents

	// Événements qui changent l'état de navigation
	webContents.on("did-navigate", pushNavigationState)
	webContents.on("did-navigate-in-page", pushNavigationState)
	webContents.on("did-start-loading", pushNavigationState)
	webContents.on("did-stop-loading", pushNavigationState)
	webContents.on("did-finish-load", pushNavigationState)
	webContents.on("page-title-updated", pushNavigationState)
	webContents.on("did-frame-navigate", pushNavigationState)
}
