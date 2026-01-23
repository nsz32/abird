import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import type { AppConfig } from "@shared/config.schema"
import type { DeployState } from "@shared/types"
import { app } from "electron"
import { getConfigPath, getProjectName } from "../config"
import { paths } from "../utils/platform"
import { sanitizeAppName } from "../utils/naming"
import { getDefaultIconPath, getIconPath } from "./icons"

export function isDeploySupported(): boolean {
	return process.platform === "linux"
}

export function isLaunchSupported(): boolean {
	return app.isPackaged
}

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
	const isCustomConfig = configPath !== paths.config

	const safeName = sanitizeAppName(appName)

	const prefix = getProjectName()

	if (isCustomConfig) {
		const configHash = createHash("md5").update(configPath).digest("hex").slice(0, 8)
		return `${prefix}-${safeName}-${configHash}.desktop`
	}

	return `${prefix}-${safeName}.desktop`
}

function getDesktopFilePath(appName: string): string {
	return join(paths.desktopFiles, getDesktopFileName(appName))
}

function buildExecCommand(appName: string): string {
	const configPath = getConfigPath()
	const isCustomConfig = configPath !== paths.config
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
		lines.push(`Comment=${appConfig.description}`)
	}

	if (iconPath) {
		lines.push(`Icon=${iconPath}`)
	}

	return lines.join("\n")
}

function ensureDesktopFilesDir(): void {
	if (!existsSync(paths.desktopFiles)) {
		mkdirSync(paths.desktopFiles, { recursive: true })
	}
}

export function isDeployed(appName: string): boolean {
	if (!isDeploySupported()) return false
	return existsSync(getDesktopFilePath(appName))
}

export function getDeployState(appNames: string[]): DeployState {
	const supported = isDeploySupported()
	const apps: Record<string, boolean> = {}

	if (supported) {
		for (const name of appNames) {
			apps[name] = isDeployed(name)
		}
	}

	return { supported, apps }
}

export function deploy(appName: string, appConfig: AppConfig): void {
	if (!isDeploySupported()) {
		throw new Error("Deploy is only supported on Linux")
	}

	ensureDesktopFilesDir()

	const content = buildDesktopFileContent(appName, appConfig)
	const filePath = getDesktopFilePath(appName)

	writeFileSync(filePath, content, { mode: 0o755 })
}

export function undeploy(appName: string): void {
	if (!isDeploySupported()) return

	const filePath = getDesktopFilePath(appName)

	if (existsSync(filePath)) {
		unlinkSync(filePath)
	}
}

export function renameDeploy(oldName: string, newName: string, appConfig: AppConfig): void {
	if (!isDeploySupported()) return

	const wasDeployed = isDeployed(oldName)
	if (!wasDeployed) return

	undeploy(oldName)
	deploy(newName, appConfig)
}

export function launchApp(appName: string): void {
	const configPath = getConfigPath()
	const isCustomConfig = configPath !== paths.config
	const { execPath, asarPath } = getExecInfo()

	const args: string[] = []
	if (asarPath) args.push(asarPath)
	if (isCustomConfig) args.push("--config", configPath)
	args.push("--app", appName)

	spawn(execPath, args, { detached: true, stdio: "ignore" }).unref()
}
