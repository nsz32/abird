/**
 * Configuration store - gestion du fichier JSON utilisateur
 * Responsabilités : lecture, écriture, validation, cache
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { basename, dirname, join, resolve } from "node:path"
import { type BirdConfig, validateConfig } from "@shared/config.schema"
import { app } from "electron"
import { getOrphanedConfigPartitions } from "../services/PartitionManager"
import { paths } from "../utils/platform"

const SCHEMA_FILENAME = "bird.config.schema.json"
const PROJECT_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/

let configPath: string = paths.config
let birdConfig: BirdConfig = validateConfig({}).data
let currentAppName: string | null = null

export function getConfigPath(): string {
	return configPath
}

export function getBirdConfig(): BirdConfig {
	return birdConfig
}

export function getCurrentAppName(): string | null {
	return currentAppName
}

export function setCurrentAppName(name: string | null): void {
	currentAppName = name
}

export function loadConfig(customPath?: string | null): void {
	if (customPath) configPath = resolve(customPath)

	if (!existsSync(configPath)) {
		if (customPath) {
			const folderName = basename(dirname(configPath))
			if (PROJECT_NAME_PATTERN.test(folderName)) {
				birdConfig = { projectName: folderName, ...birdConfig }
			}
		}
		saveConfig()
		return
	}

	parseConfigFile()
}

export function saveConfig(): void {
	ensureConfigDir()
	copySchemaIfNeeded()
	writeConfigFile()
}

export function getAvailableApps(): string[] {
	return Object.keys(birdConfig.apps)
}

function parseConfigFile(): void {
	try {
		console.log("Loading config from:", configPath)
		const content = readFileSync(configPath, "utf-8")
		const loaded = JSON.parse(content)
		const result = validateConfig(loaded)

		if (result.unknownKeys.length > 0) {
			console.warn("Unknown config keys:", result.unknownKeys.join(", "))
		}

		if (!result.success) {
			console.error("Config validation errors:", result.errors.join("; "))
		}

		birdConfig = result.data
		console.log("Config loaded, apps:", Object.keys(birdConfig.apps))
	} catch (err) {
		console.error("Failed to load config:", err)
		birdConfig = validateConfig({}).data
	}
}

function ensureConfigDir(): void {
	const dir = dirname(configPath)
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true })
	}
}

function getSchemaSourcePath(): string {
	if (app.isPackaged) {
		return join(process.resourcesPath, SCHEMA_FILENAME)
	}
	return join(app.getAppPath(), SCHEMA_FILENAME)
}

function getSchemaDestPath(): string {
	return join(dirname(configPath), SCHEMA_FILENAME)
}

function copySchemaIfNeeded(): void {
	const source = getSchemaSourcePath()
	const dest = getSchemaDestPath()

	if (!existsSync(source)) {
		console.warn("Schema file not found:", source)
		return
	}

	try {
		copyFileSync(source, dest)
	} catch (err) {
		console.warn("Failed to copy schema file:", err)
	}
}

function writeConfigFile(): void {
	try {
		const configWithSchema = { $schema: `./${SCHEMA_FILENAME}`, ...birdConfig }
		writeFileSync(configPath, JSON.stringify(configWithSchema, null, "\t"))
	} catch (err) {
		console.error("Failed to save config:", err)
	}
}

export interface RawUserConfig {
	path: string
	content: unknown
}

export function readRawConfig(): RawUserConfig {
	if (!existsSync(configPath)) {
		return { path: configPath, content: {} }
	}
	try {
		const content = readFileSync(configPath, "utf-8")
		return { path: configPath, content: JSON.parse(content) }
	} catch {
		return { path: configPath, content: {} }
	}
}

let onConfigChanged: (() => void) | null = null

export function setOnConfigChanged(callback: () => void): void {
	onConfigChanged = callback
}

export function writeRawConfig(content: unknown): { success: boolean; errors?: string[] } {
	const result = validateConfig(content)
	if (!result.success) {
		return { success: false, errors: result.errors }
	}

	birdConfig = result.data

	// Nettoyer les partitions orphelines (en config mais pas sur disque et sans apps)
	const orphaned = getOrphanedConfigPartitions()
	if (orphaned.length > 0 && birdConfig.partitions) {
		for (const name of orphaned) {
			delete birdConfig.partitions[name]
		}
		console.log(`[Partition] cleaned orphaned config entries: ${orphaned.join(", ")}`)
	}

	ensureConfigDir()
	copySchemaIfNeeded()
	try {
		const contentWithSchema = { $schema: `./${SCHEMA_FILENAME}`, ...birdConfig }
		writeFileSync(configPath, JSON.stringify(contentWithSchema, null, "\t"))
		onConfigChanged?.()
		return { success: true }
	} catch (err) {
		return { success: false, errors: [(err as Error).message] }
	}
}
