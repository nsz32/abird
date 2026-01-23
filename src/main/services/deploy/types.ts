import type { AppConfig } from "@shared/config.schema"

export interface DeployableApp {
	name: string
	config: AppConfig
}

export interface Deployer {
	readonly supported: boolean
	deploy(app: DeployableApp): Promise<void>
	undeploy(appName: string): void
	rename(oldName: string, newName: string, config: AppConfig): Promise<void>
	isDeployed(appName: string): boolean
	getShortcutPath(appName: string): string
}
