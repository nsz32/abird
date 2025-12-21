/**
 * API Config - Configuration de l'application
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { IpcChannels, type NavBarConfig, type RoutingConfig } from "@shared/types"
import { ipcMain } from "electron"

// Chemins de configuration
const CONFIG_DIR = join(homedir(), ".config", "bird")
const CONFIG_FILE = join(CONFIG_DIR, "config.json")

// Configuration par défaut de la navbar
const defaultNavBarConfig: NavBarConfig = {
	position: "top",
	visible: true,
	autoHide: false,
	urlEditable: true,
	showBackForward: true,
	showReload: true,
}

const defaultRoutingConfig: RoutingConfig = {
	internal: "https://www.koreus.com",
}

// Configuration par défaut complète
interface AppConfig {
	navBar: NavBarConfig
	routing: RoutingConfig
	startUrl: string
}

const defaultConfig: AppConfig = {
	navBar: defaultNavBarConfig,
	routing: defaultRoutingConfig,
	startUrl: "https://www.koreus.com",
}

// Config actuelle
let config: AppConfig = structuredClone(defaultConfig)

/**
 * Charge la configuration depuis le fichier JSON
 */
export function loadConfig(): void {
	if (!existsSync(CONFIG_FILE)) {
		// Créer le fichier de config par défaut
		saveConfig()
		return
	}

	try {
		const content = readFileSync(CONFIG_FILE, "utf-8")
		const loaded = JSON.parse(content)
		// Merge avec les defaults pour les nouvelles propriétés
		config = {
			...defaultConfig,
			...loaded,
			navBar: { ...defaultNavBarConfig, ...loaded.navBar },
			routing: { ...defaultRoutingConfig, ...loaded.routing },
		}
	} catch {
		// En cas d'erreur, garder les defaults
		console.error("Failed to load config, using defaults")
	}
}

/**
 * Sauvegarde la configuration dans le fichier JSON
 */
export function saveConfig(): void {
	try {
		if (!existsSync(CONFIG_DIR)) {
			mkdirSync(CONFIG_DIR, { recursive: true })
		}
		writeFileSync(CONFIG_FILE, JSON.stringify(config, null, "\t"))
	} catch (err) {
		console.error("Failed to save config:", err)
	}
}

/**
 * Retourne la configuration complète
 */
export function getConfig(): AppConfig {
	return config
}

/**
 * Retourne la configuration de la navbar
 */
export function getNavBarConfig(): NavBarConfig {
	return config.navBar
}

/**
 * Retourne l'URL de démarrage
 */
export function getStartUrl(): string {
	return config.startUrl
}

/**
 * Retourne la configuration du routing
 */
export function getRoutingConfig(): RoutingConfig {
	return config.routing
}

/**
 * Met à jour la configuration de la navbar
 */
export function setNavBarConfig(navBarConfig: Partial<NavBarConfig>): void {
	config.navBar = { ...config.navBar, ...navBarConfig }
	saveConfig()
}

/**
 * Enregistre les handlers IPC pour la config
 */
export function registerConfigHandlers(): void {
	ipcMain.handle(IpcChannels.CONFIG_GET_NAVBAR, () => {
		return getNavBarConfig()
	})
}
