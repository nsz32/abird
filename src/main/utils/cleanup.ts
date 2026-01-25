import { existsSync, rmSync, unlinkSync } from "node:fs"
import { rm } from "node:fs/promises"
import { dirname, join } from "node:path"
import { app } from "electron"
import { getAvailableApps, getConfigPath, getProjectName } from "../config"
import { undeploy } from "../services/deploy"
import { createLogger } from "./logger"
import { paths } from "./platform"

const log = createLogger("Cleanup")

const SCHEMA_FILENAME = "bird.config.schema.json"

/**
 * Clean up the NSIS installer cache folder on Windows.
 * electron-builder leaves behind a {appName}-updater folder in AppData/Local
 * after installation, which can be ~100MB. This is a known issue:
 * https://github.com/electron-userland/electron-builder/issues/3000
 */
export async function cleanupInstallerCache(): Promise<void> {
	if (process.platform !== "win32") return

	const cacheDir = join(app.getPath("home"), "AppData/Local", `${app.name}-updater`)
	await rm(cacheDir, { recursive: true, force: true }).catch(() => {})
}

/**
 * Remove all Bird data: shortcuts, config files, and userData folder.
 * Order: shortcuts → config files → userData folder → installer cache
 */
export function performCleanAll(): void {
	const projectName = getProjectName()
	const appNames = getAvailableApps()

	log.info(`Cleaning all data for project: ${projectName}`)

	// 1. Remove all deployed shortcuts
	for (const appName of appNames) {
		undeploy(appName)
		log.info(`Removed shortcut: ${appName}`)
	}

	// 2. Remove userData folder (icons, partitions, etc.)
	// Done before config files so user can retry cleanup if this fails
	const userDataPath = paths.userData
	if (existsSync(userDataPath)) {
		rmSync(userDataPath, { recursive: true, force: true })
		log.info(`Removed: ${userDataPath}`)
	}

	// 3. Remove config files (uses actual loaded config path, not default)
	const configPath = getConfigPath()
	const schemaPath = join(dirname(configPath), SCHEMA_FILENAME)

	if (existsSync(configPath)) {
		unlinkSync(configPath)
		log.info(`Removed: ${configPath}`)
	}
	if (existsSync(schemaPath)) {
		unlinkSync(schemaPath)
		log.info(`Removed: ${schemaPath}`)
	}

	// 4. Remove installer cache (Windows only)
	if (process.platform === "win32") {
		const cacheDir = join(app.getPath("home"), "AppData/Local", `${projectName}-updater`)
		rmSync(cacheDir, { recursive: true, force: true })
	}

	log.info("Cleanup complete")
}
