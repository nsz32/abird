/**
 * Zod validation schema for configuration
 * Types inferred from Zod (single source of truth)
 * Validation used ONLY by the main process
 */
import { z } from "zod"
import { PARTITION_NAME_PATTERN, isValidPartitionName } from "./partition"

// Theme mode
export const ThemeModeSchema = z.enum(["system", "light", "dark"])
export type ThemeMode = z.infer<typeof ThemeModeSchema>

// Navigation bar configuration
export const NavBarConfigSchema = z.object({
	position: z.enum(["top", "bottom"]).default("bottom"),
	visible: z.boolean().default(true),
	autoHide: z.boolean().default(false),
	allowUrlEdit: z.boolean().default(false),
	showBackButton: z.boolean().default(true),
	showForwardButton: z.boolean().default(true),
	showRefreshButton: z.boolean().default(true),
	showHomeButton: z.boolean().default(true),
	allowSingleTabClose: z.boolean().default(false),
})
export type NavBarConfig = z.infer<typeof NavBarConfigSchema>

// Routing actions
export const RoutingActionSchema = z.enum(["internal", "download", "external", "ignore"])
export type RoutingAction = z.infer<typeof RoutingActionSchema>

// URL routing configuration (regex pattern → action)
export const RoutingConfigSchema = z.object({
	rules: z.record(z.string(), RoutingActionSchema).default({}),
})
export type RoutingConfig = z.infer<typeof RoutingConfigSchema>

// Downloads configuration
export const DownloadConfigSchema = z.object({
	directory: z.string().optional(),
	autoOpenMaxSize: z.union([z.number(), z.string()]).optional(),
	autoOpenMimeTypes: z.array(z.string()).optional(),
	allowExecutablesDownload: z.boolean().optional(),
	allowDuplicateDownloads: z.boolean().optional(),
})
export type DownloadConfig = z.infer<typeof DownloadConfigSchema>

// Partition name schema (lowercase + numbers + underscore, must start with letter)
export const PartitionNameSchema = z
	.string()
	.regex(PARTITION_NAME_PATTERN, "Partition name must start with a letter and contain only lowercase letters, numbers, and underscores")

// App configuration (isolated website)
export const AppConfigSchema = z.object({
	partition: PartitionNameSchema,
	startUrl: z.string(),
	description: z.string().optional(),
	icon: z.string().optional(),
	theme: ThemeModeSchema.optional(),
	userAgent: z.string().optional(),
	userAgentRaw: z.string().optional(),
	navBar: NavBarConfigSchema.partial().optional(),
	routing: RoutingConfigSchema.partial().optional(),
	downloads: DownloadConfigSchema.partial().optional(),
})
export type AppConfig = z.infer<typeof AppConfigSchema>

// Automatic cache cleanup configuration
export const CacheCleanupConfigSchema = z.object({
	maxFileSizeMB: z.number().nonnegative().optional(),
	maxAgeDays: z.number().nonnegative().optional(),
})
export type CacheCleanupConfig = z.infer<typeof CacheCleanupConfigSchema>

// Partition permissions (Electron permission handler)
export const PermissionsConfigSchema = z.object({
	allowMidi: z.boolean().default(true),
	allowMidiSysex: z.boolean().default(true),
	allowFullscreen: z.boolean().default(true),
	allowPointerLock: z.boolean().default(true),
	allowKeyboardLock: z.boolean().default(true),
	allowIdleDetection: z.boolean().default(true),
	allowNotifications: z.boolean().default(true),
})
export type PermissionsConfig = z.infer<typeof PermissionsConfigSchema>

/** Ordered list of permission keys for UI iteration */
export const PERMISSION_KEYS: (keyof PermissionsConfig)[] = [
	"allowFullscreen",
	"allowNotifications",
	"allowPointerLock",
	"allowKeyboardLock",
	"allowIdleDetection",
	"allowMidi",
	"allowMidiSysex",
]

// Partition configuration
export const PartitionConfigSchema = z.object({
	adBlockEnabled: z.boolean().default(true),
	cacheCleanup: CacheCleanupConfigSchema.optional(),
	permissions: PermissionsConfigSchema.partial().optional(),
})
export type PartitionConfig = z.infer<typeof PartitionConfigSchema>

// Root configuration (user JSON file)
export const BirdConfigSchema = z.object({
	projectName: z
		.string()
		.regex(/^[a-zA-Z0-9_-]+$/)
		.optional(),
	theme: ThemeModeSchema.default("system"),
	navBar: NavBarConfigSchema.partial().default({}),
	downloads: DownloadConfigSchema.default({}),
	permissions: PermissionsConfigSchema.partial().optional(),
	apps: z.record(z.string(), AppConfigSchema).default({}),
	partitions: z.record(z.string(), PartitionConfigSchema.partial()).default({}),
})
export type BirdConfig = z.infer<typeof BirdConfigSchema>

// Validation with unknown keys handling
interface ValidationResult {
	success: boolean
	data: BirdConfig
	unknownKeys: string[]
	errors: string[]
}

const IGNORED_KEYS = new Set(["$schema", "projectName"])

function collectUnknownKeys(data: unknown, schema: z.ZodObject<z.ZodRawShape>, path = ""): string[] {
	if (typeof data !== "object" || data === null) return []

	const knownKeys = new Set(Object.keys(schema.shape))
	const unknownKeys: string[] = []

	for (const key of Object.keys(data)) {
		if (IGNORED_KEYS.has(key)) continue

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

	// Special case for partitions record
	if ("partitions" in (data as Record<string, unknown>)) {
		const partitions = (data as Record<string, unknown>).partitions as Record<string, unknown>
		if (partitions && typeof partitions === "object") {
			for (const [partitionName, partitionConfig] of Object.entries(partitions)) {
				unknownKeys.push(...collectUnknownKeys(partitionConfig, PartitionConfigSchema, `partitions.${partitionName}`))
			}
		}
	}

	return unknownKeys
}

function validatePartitionNames(data: unknown): string[] {
	if (typeof data !== "object" || data === null) return []

	const config = data as Record<string, unknown>
	const errors: string[] = []

	// Validate partition keys in "partitions" object
	if (config.partitions && typeof config.partitions === "object") {
		for (const key of Object.keys(config.partitions as object)) {
			if (!isValidPartitionName(key)) {
				errors.push(`partitions.${key}: invalid partition name (must start with a letter, use only lowercase, numbers, underscore)`)
			}
		}
	}

	return errors
}

export function validateConfig(data: unknown): ValidationResult {
	const unknownKeys = collectUnknownKeys(data, BirdConfigSchema)
	const partitionErrors = validatePartitionNames(data)

	// Use passthrough to keep unknown keys during parsing (won't fail)
	const result = BirdConfigSchema.passthrough().safeParse(data)

	if (result.success && partitionErrors.length === 0) {
		return {
			success: true,
			data: result.data as BirdConfig,
			unknownKeys,
			errors: [],
		}
	}

	const zodErrors = result.success ? [] : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)

	return {
		success: false,
		data: result.success ? (result.data as BirdConfig) : (BirdConfigSchema.parse({}) as BirdConfig),
		unknownKeys,
		errors: [...zodErrors, ...partitionErrors],
	}
}

// Default values (generated from Zod - single source of truth)
export const DEFAULT_NAVBAR: NavBarConfig = NavBarConfigSchema.parse({})
export const DEFAULT_DOWNLOADS: DownloadConfig = {}
