import { spawn } from "node:child_process"
import { join } from "node:path"
import { app, shell } from "electron"
import { createLogger } from "./logger"

const log = createLogger("Platform")

/**
 * Centralized paths for the application.
 * Uses Electron's app.getPath for cross-platform compatibility:
 * - Linux: ~/.local/share/bird
 * - Windows: C:\Users\<user>\AppData\Roaming\bird
 * - macOS: ~/Library/Application Support/bird
 */
export const paths = {
	get userData() {
		return app.getPath("userData")
	},
	get config() {
		return join(this.userData, "config.json")
	},
	get icons() {
		return join(this.userData, "icons")
	},
	get desktopFiles() {
		return join(app.getPath("home"), ".local", "share", "applications")
	},
	get startMenu() {
		return join(app.getPath("appData"), "Microsoft", "Windows", "Start Menu", "Programs")
	},
}

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

/**
 * Open a URL in the system's default browser.
 */
export function openExternal(url: string): void {
	log.info(`Opening external URL: ${url}`)
	shell.openExternal(url)
}

/**
 * Get MD5 hash of a file using system command.
 * Uses md5sum (Linux), md5 (macOS), or certutil (Windows).
 */
export function getFileMd5(filePath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		let cmd: string
		let args: string[]
		let parseOutput: (output: string) => string

		if (process.platform === "linux") {
			cmd = "md5sum"
			args = [filePath]
			parseOutput = (output) => output.split(" ")[0]
		} else if (process.platform === "darwin") {
			cmd = "md5"
			args = ["-q", filePath]
			parseOutput = (output) => output.trim()
		} else {
			// Windows
			cmd = "certutil"
			args = ["-hashfile", filePath, "MD5"]
			parseOutput = (output) => output.split("\n")[1].trim()
		}

		const child = spawn(cmd, args)
		let output = ""
		let error = ""

		child.stdout.on("data", (data) => {
			output += data
		})
		child.stderr.on("data", (data) => {
			error += data
		})
		child.on("close", (code) => {
			if (code === 0) {
				resolve(parseOutput(output))
			} else {
				reject(new Error(`${cmd} failed: ${error || `exit code ${code}`}`))
			}
		})
		child.on("error", reject)
	})
}
