/**
 * Gestion des bounds du contenu (zone où s'affichent les tabs)
 */

import type { BaseWindow, Rectangle } from "electron"
import { getNavBarConfig } from "./config"
import { createStateObservable } from "./observable"

const NAV_BAR_HEIGHT = 40

// Bounds initiaux (avant init)
const initialBounds: Rectangle = { x: 0, y: 0, width: 0, height: 0 }

const contentBounds$ = createStateObservable<Rectangle>(initialBounds)
const navBarBounds$ = createStateObservable<Rectangle>(initialBounds)

let mainWindowRef: BaseWindow | null = null

/**
 * Calcule les bounds à partir de la window
 */
function computeBounds(): { content: Rectangle; navBar: Rectangle } {
	if (!mainWindowRef) {
		return { content: initialBounds, navBar: initialBounds }
	}

	const navBarConfig = getNavBarConfig()
	const windowBounds = mainWindowRef.getContentBounds()
	const navHeight = navBarConfig.visible ? NAV_BAR_HEIGHT : 0

	const content =
		navBarConfig.position === "top"
			? { x: 0, y: navHeight, width: windowBounds.width, height: windowBounds.height - navHeight }
			: { x: 0, y: 0, width: windowBounds.width, height: windowBounds.height - navHeight }

	const navBar =
		navBarConfig.position === "top"
			? { x: 0, y: 0, width: windowBounds.width, height: navHeight }
			: { x: 0, y: windowBounds.height - navHeight, width: windowBounds.width, height: navHeight }

	return { content, navBar }
}

/**
 * Met à jour les bounds et notifie les subscribers
 */
function updateBounds(): void {
	const { content, navBar } = computeBounds()
	console.log("updateBounds:", { content, navBar })
	contentBounds$.emit(content)
	navBarBounds$.emit(navBar)
}

/**
 * Initialise le système de bounds avec la window principale
 */
export function initBounds(window: BaseWindow): void {
	mainWindowRef = window

	// Pousser immédiatement les bounds (taille demandée)
	updateBounds()

	// Mise à jour sur resize
	window.on("resize", updateBounds)

	// Recalculer après que le window manager ait finalisé la taille


	// Cleanup
	window.on("closed", () => {
		mainWindowRef = null
	})
}

/**
 * Calcule et émet les bounds, puis affiche la window
 * À appeler quand l'UI est prête (ex: navbar dom-ready)
 */
export function showWindowWithBounds(): void {
	mainWindowRef?.show()
	for(let i = 100; i <= 500; i+= 10)
		setTimeout(updateBounds, i)
}

/**
 * Retourne les bounds du contenu (lecture synchrone)
 */
export function getContentBounds(): Rectangle {
	return contentBounds$.get()
}

/**
 * Retourne les bounds de la navbar (lecture synchrone)
 */
export function getNavBarBounds(): Rectangle {
	return navBarBounds$.get()
}

/**
 * S'abonne aux changements de bounds du contenu
 */
export const onContentBoundsChanged = contentBounds$.subscribe

/**
 * S'abonne aux changements de bounds de la navbar
 */
export const onNavBarBoundsChanged = navBarBounds$.subscribe

