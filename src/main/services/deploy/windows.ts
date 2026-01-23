import { existsSync, mkdirSync, unlinkSync } from "node:fs"
import { join } from "node:path"
import type { AppConfig } from "@shared/config.schema"
import { shell } from "electron"
import { getBirdConfig, getProjectName } from "../../config"
import { getAppUserModelId, sanitizeAppName } from "../../utils/naming"
import { paths } from "../../utils/platform"
import { getIconPathAsIco } from "../icons"
import { buildExecArgs, getExecInfo } from "./exec"
import type { DeployableApp, Deployer } from "./types"

const START_MENU_DIR = paths.startMenu

function getShortcutFileName(appName: string): string {
	const safeName = sanitizeAppName(appName)
	const projectName = getBirdConfig().projectName

	const displayName = projectName ? `${projectName} ${safeName}` : safeName

	return `${displayName}.lnk`
}

function ensureStartMenuDir(): void {
	if (!existsSync(START_MENU_DIR)) {
		mkdirSync(START_MENU_DIR, { recursive: true })
	}
}

/**
 * Windows deployer - creates .lnk shortcuts in Start Menu.
 * Uses shell.writeShortcutLink() with AppUserModelId for taskbar grouping.
 */
export class WindowsDeployer implements Deployer {
	readonly supported = true

	getShortcutPath(appName: string): string {
		return join(START_MENU_DIR, getShortcutFileName(appName))
	}

	isDeployed(appName: string): boolean {
		return existsSync(this.getShortcutPath(appName))
	}

	async deploy({ name, config }: DeployableApp): Promise<void> {
		ensureStartMenuDir()

		const { execPath } = getExecInfo()
		const shortcutPath = this.getShortcutPath(name)
		const appUserModelId = getAppUserModelId(getProjectName(), name)

		const options: Electron.ShortcutDetails = {
			target: execPath,
			args: buildExecArgs(name),
			appUserModelId,
		}

		if (config.description) {
			options.description = config.description
		}

		if (config.icon) {
			const iconPath = await getIconPathAsIco(config.icon)
			if (iconPath) {
				options.icon = iconPath
				options.iconIndex = 0
			}
		}

		const success = shell.writeShortcutLink(shortcutPath, "create", options)
		if (!success) {
			throw new Error(`Failed to create shortcut: ${shortcutPath}`)
		}
	}

	undeploy(appName: string): void {
		const filePath = this.getShortcutPath(appName)

		if (existsSync(filePath)) {
			unlinkSync(filePath)
		}
	}

	async rename(oldName: string, newName: string, config: AppConfig): Promise<void> {
		if (!this.isDeployed(oldName)) return

		this.undeploy(oldName)
		await this.deploy({ name: newName, config })
	}
}
