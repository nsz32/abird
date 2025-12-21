/**
 * API Navigation - Fonctions de navigation pour le site web
 */

import { IpcChannels, type NavigationState } from "@shared/types"
import { ipcMain } from "electron"
import { getNavBar } from "../window"
import { getActiveTab, onNavigationStateChanged } from "./tabs"

/**
 * Retourne l'état de navigation du tab actif
 */
function getNavigationState(): NavigationState {
	const tab = getActiveTab()
	if (!tab) {
		return {
			url: "",
			title: "",
			canGoBack: false,
			canGoForward: false,
			isLoading: false,
		}
	}

	const wc = tab.view.webContents
	return {
		url: wc.getURL(),
		title: wc.getTitle(),
		canGoBack: wc.navigationHistory.canGoBack(),
		canGoForward: wc.navigationHistory.canGoForward(),
		isLoading: wc.isLoading(),
	}
}

/**
 * Navigue vers la page précédente
 */
function goBack(): void {
	const tab = getActiveTab()
	if (tab?.view.webContents.navigationHistory.canGoBack()) {
		tab.view.webContents.navigationHistory.goBack()
	}
}

/**
 * Navigue vers la page suivante
 */
function goForward(): void {
	const tab = getActiveTab()
	if (tab?.view.webContents.navigationHistory.canGoForward()) {
		tab.view.webContents.navigationHistory.goForward()
	}
}

/**
 * Recharge la page
 */
function reload(ignoreCache = false): void {
	const tab = getActiveTab()
	if (!tab) return

	if (ignoreCache) {
		tab.view.webContents.reloadIgnoringCache()
	} else {
		tab.view.webContents.reload()
	}
}

/**
 * Navigue vers une URL
 */
function goTo(url: string): void {
	const tab = getActiveTab()
	if (!tab) return

	let normalizedUrl = url.trim()
	if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
		normalizedUrl = `https://${normalizedUrl}`
	}

	tab.view.webContents.loadURL(normalizedUrl)
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
 * Configure la synchronisation de l'état de navigation vers la navbar
 */
export function setupNavigationSync(): void {
	onNavigationStateChanged((state) => {
		const navBar = getNavBar()
		if (navBar) {
			navBar.webContents.send(IpcChannels.NAVIGATION_STATE_CHANGED, state)
		}
	})
}
