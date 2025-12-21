/**
 * Gestionnaire d'onglets avec pattern Observable
 */

import type { NavigationState } from "@shared/types"
import type { WebContentsView } from "electron"
import { getContentBounds } from "./bounds"
import { getStartUrl } from "./config"
import { createObservable } from "./observable"
import { createSiteView, setupWebViewListeners } from "./webview"

export interface Tab {
	id: string
	view: WebContentsView
}

// État interne
const tabs: Tab[] = []
let activeTabId: string | null = null
let nextTabId = 1
let unsubscribeActiveListeners: (() => void) | null = null

// Observables
const tabCreated = createObservable<Tab>()
const tabClosed = createObservable<string>()
const tabActivated = createObservable<Tab>()
const navigationStateChanged = createObservable<NavigationState>()

/**
 * Génère un nouvel ID de tab
 */
function generateTabId(): string {
	return `tab-${nextTabId++}`
}

/**
 * Retourne l'état de navigation d'une tab
 */
function getTabNavigationState(tab: Tab): NavigationState {
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
 * Push l'état de navigation du tab actif
 */
function pushActiveNavigationState(): void {
	const tab = getActiveTab()
	if (tab) {
		navigationStateChanged.emit(getTabNavigationState(tab))
	}
}

/**
 * Crée un nouveau tab
 */
export function createTab(url?: string): string {
	const view = createSiteView()
	const id = generateTabId()
	const tab: Tab = { id, view }

	// Appliquer les bounds immédiatement
	view.setBounds(getContentBounds())

	tabs.push(tab)
	tabCreated.emit(tab)

	// Charger l'URL
	view.webContents.loadURL(url || getStartUrl())

	// Activer le premier tab automatiquement
	if (tabs.length === 1) {
		activateTab(id)
	}

	return id
}

/**
 * Ferme un tab
 */
export function closeTab(id: string): void {
	const index = tabs.findIndex((t) => t.id === id)
	if (index === -1) return

	// Désabonner si c'est le tab actif
	if (activeTabId === id && unsubscribeActiveListeners) {
		unsubscribeActiveListeners()
		unsubscribeActiveListeners = null
	}

	tabs.splice(index, 1)
	tabClosed.emit(id)

	// Si c'était le tab actif, activer un autre
	if (activeTabId === id) {
		activeTabId = null
		if (tabs.length > 0) {
			const newIndex = Math.min(index, tabs.length - 1)
			activateTab(tabs[newIndex].id)
		}
	}
}

/**
 * Active un tab
 */
export function activateTab(id: string): void {
	const tab = tabs.find((t) => t.id === id)
	if (!tab) return

	// Désabonner l'ancien tab actif
	if (unsubscribeActiveListeners) {
		unsubscribeActiveListeners()
	}

	activeTabId = id

	// S'abonner aux changements du nouveau tab actif
	unsubscribeActiveListeners = setupWebViewListeners(tab.view, pushActiveNavigationState)

	tabActivated.emit(tab)

	// Push immédiat de l'état
	pushActiveNavigationState()
}

/**
 * Retourne le tab actif
 */
export function getActiveTab(): Tab | null {
	return tabs.find((t) => t.id === activeTabId) || null
}

/**
 * Retourne tous les tabs
 */
export function getAllTabs(): Tab[] {
	return [...tabs]
}

// Export des observables (subscribe seulement)
export const onTabCreated = tabCreated.subscribe
export const onTabClosed = tabClosed.subscribe
export const onTabActivated = tabActivated.subscribe
export const onNavigationStateChanged = navigationStateChanged.subscribe
