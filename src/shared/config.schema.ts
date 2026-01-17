/**
 * Schéma de validation Zod pour la configuration
 * Types inférés depuis Zod (source unique)
 * Validation utilisée UNIQUEMENT par le main process
 */
import { z } from "zod"

// Theme mode
export const ThemeModeSchema = z.enum(["system", "light", "dark"])
export type ThemeMode = z.infer<typeof ThemeModeSchema>

// Configuration de la barre de navigation
export const NavBarConfigSchema = z.object({
	position: z.enum(["top", "bottom"]).default("top"),
	visible: z.boolean().default(true),
	autoHide: z.boolean().default(false),
	urlEditable: z.boolean().default(true),
	showBackForward: z.boolean().default(true),
	showReload: z.boolean().default(true),
	allowSingleTabClose: z.boolean().default(false),
})
export type NavBarConfig = z.infer<typeof NavBarConfigSchema>

// Configuration du routage des URLs
export const RoutingConfigSchema = z.object({
	internal: z.union([z.string(), z.array(z.string())]),
	download: z.union([z.string(), z.array(z.string())]).optional(),
})
export type RoutingConfig = z.infer<typeof RoutingConfigSchema>

// Configuration des téléchargements
export const DownloadConfigSchema = z.object({
	directory: z.string().optional(),
	autoOpenMaxSize: z.union([z.number(), z.string()]).optional(),
	autoOpenMimeTypes: z.array(z.string()).optional(),
	allowExecutablesDownload: z.boolean().optional(),
	preventDuplicateDownloads: z.boolean().optional(),
})
export type DownloadConfig = z.infer<typeof DownloadConfigSchema>

// Configuration d'une app (site web isolé)
export const AppConfigSchema = z.object({
	partition: z.string(),
	startUrl: z.string(),
	icon: z.string().optional(),
	theme: ThemeModeSchema.optional(),
	userAgent: z.string().optional(),
	userAgentRaw: z.string().optional(),
	navBar: NavBarConfigSchema.partial().optional(),
	routing: RoutingConfigSchema.partial().optional(),
})
export type AppConfig = z.infer<typeof AppConfigSchema>

// Configuration racine (fichier JSON utilisateur)
export const BirdConfigSchema = z.object({
	theme: ThemeModeSchema.default("system"),
	navBar: NavBarConfigSchema.partial().default({}),
	downloads: DownloadConfigSchema.default({}),
	apps: z.record(z.string(), AppConfigSchema).default({}),
})
export type BirdConfig = z.infer<typeof BirdConfigSchema>

// Validation avec gestion des clés inconnues
interface ValidationResult {
	success: boolean
	data: BirdConfig
	unknownKeys: string[]
	errors: string[]
}

function collectUnknownKeys(data: unknown, schema: z.ZodObject<z.ZodRawShape>, path = ""): string[] {
	if (typeof data !== "object" || data === null) return []

	const knownKeys = new Set(Object.keys(schema.shape))
	const unknownKeys: string[] = []

	for (const key of Object.keys(data)) {
		const fullPath = path ? `${path}.${key}` : key
		if (!knownKeys.has(key)) {
			unknownKeys.push(fullPath)
		} else {
			const fieldSchema = schema.shape[key]
			const fieldValue = (data as Record<string, unknown>)[key]
			// Recurse into nested objects
			if (fieldSchema instanceof z.ZodObject) {
				unknownKeys.push(...collectUnknownKeys(fieldValue, fieldSchema, fullPath))
			} else if (fieldSchema instanceof z.ZodDefault && fieldSchema._def.innerType instanceof z.ZodObject) {
				unknownKeys.push(...collectUnknownKeys(fieldValue, fieldSchema._def.innerType, fullPath))
			}
		}
	}

	// Special case for apps record
	if ("apps" in (data as Record<string, unknown>)) {
		const apps = (data as Record<string, unknown>).apps as Record<string, unknown>
		if (apps && typeof apps === "object") {
			for (const [appName, appConfig] of Object.entries(apps)) {
				unknownKeys.push(...collectUnknownKeys(appConfig, AppConfigSchema, `apps.${appName}`))
			}
		}
	}

	return unknownKeys
}

export function validateConfig(data: unknown): ValidationResult {
	const unknownKeys = collectUnknownKeys(data, BirdConfigSchema)

	// Use passthrough to keep unknown keys during parsing (won't fail)
	const result = BirdConfigSchema.passthrough().safeParse(data)

	if (result.success) {
		return {
			success: true,
			data: result.data as BirdConfig,
			unknownKeys,
			errors: [],
		}
	}

	return {
		success: false,
		data: BirdConfigSchema.parse({}) as BirdConfig,
		unknownKeys,
		errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
	}
}

// Valeurs par défaut (générées depuis Zod - source unique de vérité)
export const DEFAULT_NAVBAR: NavBarConfig = NavBarConfigSchema.parse({})
export const DEFAULT_DOWNLOADS: DownloadConfig = {}
