/**
 * API Config - Configuration de l'application
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { type AppConfig, IpcChannels, type NavBarConfig, type RoutingConfig } from "@shared/types"
import { ipcMain } from "electron"

// Chemins de configuration par défaut
const CONFIG_DIR = join(homedir(), ".config", "bird")
const DEFAULT_CONFIG_FILE = join(CONFIG_DIR, "config.json")

// Chemin du fichier de config utilisé (peut être custom via --config)
let configFilePath = DEFAULT_CONFIG_FILE

// Configuration par défaut de la navbar
const defaultNavBarConfig: NavBarConfig = {
	position: "top",
	visible: true,
	autoHide: false,
	urlEditable: true,
	showBackForward: true,
	showReload: true,
}

// Configuration globale du fichier (navBar global + apps)
interface GlobalConfig {
	navBar: NavBarConfig
	apps: Record<string, AppConfig>
}

const defaultGlobalConfig: GlobalConfig = {
	navBar: defaultNavBarConfig,
	apps: {
		koreus: {
			partition: "default",
			startUrl: "https://www.koreus.com",
			routing: { internal: "https://www.koreus.com" },
		},
	},
}

// Config globale chargée
let globalConfig: GlobalConfig = structuredClone(defaultGlobalConfig)

// App courante (définie par CLI)
let currentAppName: string | null = null
let currentAppConfig: AppConfig | null = null

/**
 * Charge la configuration depuis le fichier JSON
 * @param customPath Chemin custom du fichier de config (optionnel)
 */
export function loadConfig(customPath?: string | null): void {
	// Utiliser le chemin custom si fourni
	if (customPath) {
		configFilePath = customPath
	}

	if (!existsSync(configFilePath)) {
		saveConfig()
		return
	}

	try {
		const content = readFileSync(configFilePath, "utf-8")
		const loaded = JSON.parse(content)
		globalConfig = {
			...defaultGlobalConfig,
			...loaded,
			navBar: { ...defaultNavBarConfig, ...loaded.navBar },
			apps: { ...defaultGlobalConfig.apps, ...loaded.apps },
		}
	} catch {
		console.error("Failed to load config, using defaults")
	}
}

/**
 * Sauvegarde la configuration dans le fichier JSON
 */
export function saveConfig(): void {
	try {
		const configDir = join(configFilePath, "..")
		if (!existsSync(configDir)) {
			mkdirSync(configDir, { recursive: true })
		}
		writeFileSync(configFilePath, JSON.stringify(globalConfig, null, "\t"))
	} catch (err) {
		console.error("Failed to save config:", err)
	}
}

/**
 * Sélectionne l'app courante par son nom
 * Retourne false si l'app n'existe pas
 */
export function selectApp(appName: string): boolean {
	const app = globalConfig.apps[appName]
	if (!app) {
		return false
	}
	currentAppName = appName
	currentAppConfig = app
	return true
}

/**
 * Retourne le nom de l'app courante
 */
export function getCurrentAppName(): string | null {
	return currentAppName
}

/**
 * Retourne la liste des apps disponibles
 */
export function getAvailableApps(): string[] {
	return Object.keys(globalConfig.apps)
}

/**
 * Retourne la configuration de la navbar (merge global + app)
 */
export function getNavBarConfig(): NavBarConfig {
	return {
		...globalConfig.navBar,
		...currentAppConfig?.navBar,
	}
}

/**
 * Retourne l'URL de démarrage de l'app courante
 */
export function getStartUrl(): string {
	return currentAppConfig?.startUrl || "about:blank"
}

/**
 * Retourne la configuration du routing de l'app courante
 */
export function getRoutingConfig(): RoutingConfig | null {
	return currentAppConfig?.routing || null
}

/**
 * Retourne le nom de la partition de l'app courante
 */
export function getPartitionName(): string {
	return currentAppConfig?.partition || "default"
}

/**
 * Enregistre les handlers IPC pour la config
 */
export function registerConfigHandlers(): void {
	ipcMain.handle(IpcChannels.CONFIG_GET_NAVBAR, () => {
		return getNavBarConfig()
	})
}
