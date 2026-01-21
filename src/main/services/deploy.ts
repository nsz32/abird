import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import type { AppConfig } from "@shared/config.schema"
import type { DeployState } from "@shared/types"
import { app } from "electron"
import { getConfigPath } from "../config"
import { paths } from "../utils/platform"
import { getDefaultIconPath, getIconPath } from "./icons"

export function isDeploySupported(): boolean {
	return process.platform === "linux"
}

export function isLaunchSupported(): boolean {
	return app.isPackaged
}

function sanitizeAppName(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9_-]/g, "-")
		.replace(/-+/g, "-")
		.substring(0, 32)
}

function getDesktopFileName(appName: string): string {
	const configPath = getConfigPath()
	const isCustomConfig = configPath !== paths.config

	const safeName = sanitizeAppName(appName)

	if (isCustomConfig) {
		const configHash = createHash("md5").update(configPath).digest("hex").slice(0, 8)
		return `bird-${safeName}-${configHash}.desktop`
	}

	return `bird-${safeName}.desktop`
}

function getDesktopFilePath(appName: string): string {
	return join(paths.desktopFiles, getDesktopFileName(appName))
}

function buildExecCommand(appName: string): string {
	const configPath = getConfigPath()
	const isCustomConfig = configPath !== paths.config

	const execPath = process.env.APPIMAGE ?? process.execPath

	if (isCustomConfig) {
		return `${execPath} --config "${configPath}" --app "${appName}"`
	}

	return `${execPath} --app "${appName}"`
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
		`StartupWMClass=bird-${sanitizeAppName(appName)}`,
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
	const execPath = process.env.APPIMAGE ?? process.execPath

	const args = isCustomConfig ? ["--config", configPath, "--app", appName] : ["--app", appName]

	spawn(execPath, args, { detached: true, stdio: "ignore" }).unref()
}
