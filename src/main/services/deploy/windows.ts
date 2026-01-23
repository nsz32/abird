import type { AppConfig } from "@shared/config.schema"
import type { DeployableApp, Deployer } from "./types"

/**
 * Windows deployer - creates .lnk shortcuts in Start Menu.
 * TODO: Implement using shell.writeShortcutLink() or windows-shortcuts lib.
 */
export class WindowsDeployer implements Deployer {
	readonly supported = false

	getShortcutPath(_appName: string): string {
		// Future: join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', `${appName}.lnk`)
		return ""
	}

	isDeployed(_appName: string): boolean {
		return false
	}

	deploy(_app: DeployableApp): void {
		throw new Error("Windows deploy not yet implemented")
	}

	undeploy(_appName: string): void {
		// No-op until implemented
	}

	rename(_oldName: string, _newName: string, _config: AppConfig): void {
		// No-op until implemented
	}
}
