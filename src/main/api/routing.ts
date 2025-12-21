/**
 * API Routing - Gestion du routage des URLs
 * Détermine si une URL doit s'ouvrir dans Bird ou dans le navigateur externe
 */

import type { WebContentsView } from "electron"
import { shell } from "electron"
import { getRoutingConfig } from "./config"

/**
 * Teste si une URL correspond à un pattern (regex ou baseUrl)
 */
function matchesPattern(url: string, pattern: string): boolean {
	if (pattern.startsWith("^")) {
		// C'est une regex
		try {
			return new RegExp(pattern).test(url)
		} catch {
			return false
		}
	}
	// C'est une baseUrl
	return url.startsWith(pattern)
}

/**
 * Teste si une URL correspond à au moins un pattern de la liste
 */
function matchesPatterns(url: string, patterns: string | string[]): boolean {
	const patternList = Array.isArray(patterns) ? patterns : [patterns]
	return patternList.some((p) => matchesPattern(url, p))
}

/**
 * Vérifie si l'URL est interne (doit rester dans Bird)
 * Si pas de config routing, tout est externe
 */
export function isInternalUrl(url: string): boolean {
	const config = getRoutingConfig()
	if (!config) return false
	return matchesPatterns(url, config.internal)
}

/**
 * Vérifie si l'URL est autorisée pour les downloads
 */
export function isDownloadAllowed(url: string): boolean {
	const config = getRoutingConfig()
	if (!config?.download || (Array.isArray(config.download) && config.download.length === 0)) {
		return false
	}
	return matchesPatterns(url, config.download)
}

/**
 * Détermine si une URL doit être gérée par Bird
 */
function shouldHandleUrl(url: string): boolean {
	// Ignorer les URLs spéciales
	if (!url || url.startsWith("about:") || url.startsWith("javascript:") || url.startsWith("data:")) {
		return true
	}
	return isInternalUrl(url) || isDownloadAllowed(url)
}

/**
 * Configure le routage pour une WebContentsView
 */
export function setupRouting(siteView: WebContentsView): void {
	const webContents = siteView.webContents

	// Intercepter les navigations (clics sur liens normaux)
	webContents.on("will-navigate", (event, url) => {
		if (!shouldHandleUrl(url)) {
			event.preventDefault()
			shell.openExternal(url)
		}
	})

	// Intercepter les ouvertures de nouvelles fenêtres (target="_blank", middle-click)
	webContents.setWindowOpenHandler(({ url }) => {
		if (shouldHandleUrl(url)) {
			// Ouvrir dans la vue actuelle
			webContents.loadURL(url)
		} else {
			shell.openExternal(url)
		}
		return { action: "deny" }
	})

	// Handler de download (minimal pour l'instant)
	webContents.session.on("will-download", (_event, item) => {
		console.log(`Download started: ${item.getFilename()} from ${item.getURL()}`)
	})
}
