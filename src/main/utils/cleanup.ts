import { rm } from "node:fs/promises"
import { join } from "node:path"
import { app } from "electron"

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
