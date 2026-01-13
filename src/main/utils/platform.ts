import { spawn } from "node:child_process"
import { shell } from "electron"

/**
 * Open a file with the system's default application.
 * Uses xdg-open on Linux to avoid shell.openPath issues with some apps.
 */
export function openFile(path: string): Promise<string> {
	if (process.platform === "linux") {
		return new Promise((resolve) => {
			const child = spawn("xdg-open", [path], {
				detached: true,
				stdio: "ignore",
			})
			child.unref()
			child.on("error", (err) => resolve(err.message))
			child.on("spawn", () => resolve(""))
		})
	}
	return shell.openPath(path)
}
