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
		canGoBack: webContents.navigationHistory.canGoBack(),
		canGoForward: webContents.navigationHistory.canGoForward(),
		isLoading: webContents.isLoading(),
	}
}

/**
 * Navigue vers la page précédente
 */
export function goBack(): void {
	const siteView = getSiteView()
	if (siteView?.webContents.navigationHistory.canGoBack()) {
		siteView.webContents.navigationHistory.goBack()
	}
}

/**
 * Navigue vers la page suivante
 */
export function goForward(): void {
	const siteView = getSiteView()
	if (siteView?.webContents.navigationHistory.canGoForward()) {
		siteView.webContents.navigationHistory.goForward()
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
 * Navigue vers une URL
 */
export function goTo(url: string): void {
	const siteView = getSiteView()
	if (!siteView) return

	// Normaliser l'URL
	let normalizedUrl = url.trim()
	if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
		normalizedUrl = `https://${normalizedUrl}`
	}

	siteView.webContents.loadURL(normalizedUrl)
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

	ipcMain.handle(IpcChannels.NAVIGATION_GO_TO, (_event, url: string) => {
		goTo(url)
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
 * Supprime les entrées d'historique consécutives avec la même URL
 */
function deduplicateHistory(): void {
	const siteView = getSiteView()
	if (!siteView) return

	const history = siteView.webContents.navigationHistory
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
 * Configure la synchronisation de l'état de navigation
 * Écoute les événements webContents et push l'état aux overlays
 */
export function setupNavigationStateSync(): void {
	const siteView = getSiteView()
	if (!siteView) return

	const webContents = siteView.webContents

	// Événements qui changent l'état de navigation
	webContents.on("did-navigate", pushNavigationState)
	webContents.on("did-navigate-in-page", () => {
		deduplicateHistory()
		pushNavigationState()
	})
	webContents.on("did-start-loading", pushNavigationState)
	webContents.on("did-stop-loading", pushNavigationState)
	webContents.on("did-finish-load", pushNavigationState)
	webContents.on("page-title-updated", pushNavigationState)
	webContents.on("did-frame-navigate", pushNavigationState)
}
