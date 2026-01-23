import type { AppConfig } from "@shared/config.schema"
import type { DeployableApp, Deployer } from "./types"

/**
 * macOS deployer - creates app aliases or stub applications.
 * TODO: Implement using osascript or native APIs.
 */
export class MacDeployer implements Deployer {
	readonly supported = false

	getShortcutPath(_appName: string): string {
		// Future: join(app.getPath('home'), 'Applications', `${appName}.app`) or alias
		return ""
	}

	isDeployed(_appName: string): boolean {
		return false
	}

	deploy(_app: DeployableApp): void {
		throw new Error("macOS deploy not yet implemented")
	}

	undeploy(_appName: string): void {
		// No-op until implemented
	}

	rename(_oldName: string, _newName: string, _config: AppConfig): void {
		// No-op until implemented
	}
}
