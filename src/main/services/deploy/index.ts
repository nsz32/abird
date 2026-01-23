import { spawn } from "node:child_process"
import type { AppConfig } from "@shared/config.schema"
import type { DeployState } from "@shared/types"
import { app } from "electron"
import { buildExecArgsArray, getExecInfo } from "./exec"
import { LinuxDeployer } from "./linux"
import { MacDeployer } from "./mac"
import type { Deployer } from "./types"
import { WindowsDeployer } from "./windows"

function createDeployer(): Deployer {
	switch (process.platform) {
		case "linux":
			return new LinuxDeployer()
		case "win32":
			return new WindowsDeployer()
		case "darwin":
			return new MacDeployer()
		default:
			return new WindowsDeployer() // Fallback to unsupported stub
	}
}

const deployer = createDeployer()

// === Public API (backward compatible) ===

export function isDeploySupported(): boolean {
	return deployer.supported
}

export function isLaunchSupported(): boolean {
	return app.isPackaged
}

export function isDeployed(appName: string): boolean {
	if (!deployer.supported) return false
	return deployer.isDeployed(appName)
}

export function getDeployState(appNames: string[]): DeployState {
	const supported = deployer.supported
	const apps: Record<string, boolean> = {}

	if (supported) {
		for (const name of appNames) {
			apps[name] = deployer.isDeployed(name)
		}
	}

	return { supported, apps }
}

export function deploy(appName: string, appConfig: AppConfig): void {
	if (!deployer.supported) {
		throw new Error(`Deploy is not supported on ${process.platform}`)
	}
	deployer.deploy({ name: appName, config: appConfig })
}

export function undeploy(appName: string): void {
	if (!deployer.supported) return
	deployer.undeploy(appName)
}

export function renameDeploy(oldName: string, newName: string, appConfig: AppConfig): void {
	if (!deployer.supported) return
	deployer.rename(oldName, newName, appConfig)
}

// === App launching (platform-independent) ===

export function launchApp(appName: string): void {
	const { execPath } = getExecInfo()
	const args = buildExecArgsArray(appName)

	spawn(execPath, args, { detached: true, stdio: "ignore" }).unref()
}

// Re-export types for consumers
export type { Deployer, DeployableApp } from "./types"
