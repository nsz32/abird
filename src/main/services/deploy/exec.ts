/**
 * Execution info utilities for app deployment.
 * Shared between deployers to build launch commands.
 */
import { app } from "electron"
import { getConfigPath } from "../../config"
import { paths } from "../../utils/platform"

export interface ExecInfo {
	execPath: string
	asarPath: string | null
}

/**
 * Returns execution info for launching ABird.
 * Handles 3 modes:
 * - AppImage: uses APPIMAGE env variable
 * - Standalone asar: electron + asar path
 * - Standard packaged: just execPath
 */
export function getExecInfo(): ExecInfo {
	if (process.env.APPIMAGE) {
		return { execPath: process.env.APPIMAGE, asarPath: null }
	}

	const appPath = app.getAppPath()
	const isStandaloneAsar = appPath.endsWith(".asar") && !appPath.includes("/resources/")

	if (isStandaloneAsar) {
		return { execPath: process.execPath, asarPath: appPath }
	}

	return { execPath: process.execPath, asarPath: null }
}

/**
 * Check if a custom config path is being used.
 */
export function isCustomConfig(): boolean {
	return getConfigPath() !== paths.config
}

/**
 * Build command-line arguments for launching an app.
 * Returns a string suitable for shortcut args or spawn.
 */
export function buildExecArgs(appName: string): string {
	const configPath = getConfigPath()
	const { asarPath } = getExecInfo()

	const parts: string[] = []

	if (asarPath) parts.push(`"${asarPath}"`)
	if (isCustomConfig()) parts.push(`--config "${configPath}"`)
	parts.push(`--app "${appName}"`)

	return parts.join(" ")
}

/**
 * Build command-line arguments as an array for spawn.
 */
export function buildExecArgsArray(appName: string): string[] {
	const configPath = getConfigPath()
	const { asarPath } = getExecInfo()

	const args: string[] = []

	if (asarPath) args.push(asarPath)
	if (isCustomConfig()) args.push("--config", configPath)
	args.push("--app", appName)

	return args
}

/**
 * Get a unique filename suffix for custom config paths.
 * Uses MD5 hash of the config path.
 */
export function getConfigHash(): string {
	const { createHash } = require("node:crypto")
	return createHash("md5").update(getConfigPath()).digest("hex").slice(0, 8)
}
