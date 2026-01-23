import { createHash } from "node:crypto"
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import type { AppConfig } from "@shared/config.schema"
import { app } from "electron"
import { getConfigPath, getProjectName } from "../../config"
import { sanitizeAppName } from "../../utils/naming"
import { getDefaultIconPath, getIconPath } from "../icons"
import type { DeployableApp, Deployer } from "./types"

const DESKTOP_FILES_DIR = join(app.getPath("home"), ".local", "share", "applications")

interface ExecInfo {
	execPath: string
	asarPath: string | null
}

/**
 * Returns execution info for launching Bird.
 * Handles 3 modes:
 * - AppImage: uses APPIMAGE env variable
 * - Standalone asar: electron + asar path
 * - Standard packaged: just execPath
 */
function getExecInfo(): ExecInfo {
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

function getDesktopFileName(appName: string): string {
	const configPath = getConfigPath()
	const isCustomConfig = configPath !== join(app.getPath("userData"), "config.json")

	const safeName = sanitizeAppName(appName)
	const prefix = getProjectName()

	if (isCustomConfig) {
		const configHash = createHash("md5").update(configPath).digest("hex").slice(0, 8)
		return `${prefix}-${safeName}-${configHash}.desktop`
	}

	return `${prefix}-${safeName}.desktop`
}

function buildExecCommand(appName: string): string {
	const configPath = getConfigPath()
	const isCustomConfig = configPath !== join(app.getPath("userData"), "config.json")
	const { execPath, asarPath } = getExecInfo()

	const parts = [execPath]
	if (asarPath) parts.push(`"${asarPath}"`)
	if (isCustomConfig) parts.push(`--config "${configPath}"`)
	parts.push(`--app "${appName}"`)

	return parts.join(" ")
}

function buildDesktopFileContent(appName: string, appConfig: AppConfig): string {
	const iconPath = appConfig.icon ? getIconPath(appConfig.icon) : getDefaultIconPath()

	const lines = [
		"[Desktop Entry]",
		"Version=1.0",
		`Name=${appName}`,
		`Exec=${buildExecCommand(appName)}`,
		"Terminal=false",
		"Type=Application",
		"Categories=Network;",
		`StartupWMClass=${getProjectName()}-${sanitizeAppName(appName)}`,
	]

	if (appConfig.description) {
		lines.push(`GenericName=${appConfig.description}`)
	}

	if (iconPath) {
		lines.push(`Icon=${iconPath}`)
	}

	return lines.join("\n")
}

function ensureDesktopFilesDir(): void {
	if (!existsSync(DESKTOP_FILES_DIR)) {
		mkdirSync(DESKTOP_FILES_DIR, { recursive: true })
	}
}

export class LinuxDeployer implements Deployer {
	readonly supported = true

	getShortcutPath(appName: string): string {
		return join(DESKTOP_FILES_DIR, getDesktopFileName(appName))
	}

	isDeployed(appName: string): boolean {
		return existsSync(this.getShortcutPath(appName))
	}

	deploy({ name, config }: DeployableApp): void {
		ensureDesktopFilesDir()

		const content = buildDesktopFileContent(name, config)
		const filePath = this.getShortcutPath(name)

		writeFileSync(filePath, content, { mode: 0o755 })
	}

	undeploy(appName: string): void {
		const filePath = this.getShortcutPath(appName)

		if (existsSync(filePath)) {
			unlinkSync(filePath)
		}
	}

	rename(oldName: string, newName: string, config: AppConfig): void {
		if (!this.isDeployed(oldName)) return

		this.undeploy(oldName)
		this.deploy({ name: newName, config })
	}
}
