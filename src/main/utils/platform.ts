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
