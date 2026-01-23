import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import type { AppConfig } from "@shared/config.schema"
import { getProjectName } from "../../config"
import { sanitizeAppName } from "../../utils/naming"
import { paths } from "../../utils/platform"
import { getDefaultIconPath, getIconPath } from "../icons"
import { buildExecArgs, getExecInfo } from "./exec"
import type { DeployableApp, Deployer } from "./types"

const DESKTOP_FILES_DIR = paths.desktopFiles

function getDesktopFileName(appName: string): string {
	const safeName = sanitizeAppName(appName)
	const prefix = getProjectName()

	return `${prefix}-${safeName}.desktop`
}

function buildExecCommand(appName: string): string {
	const { execPath } = getExecInfo()
	const args = buildExecArgs(appName)

	return args ? `${execPath} ${args}` : execPath
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
