// Remove unnecessary files from the Electron bundle to reduce size
// LICENSES.chromium.html alone is ~14MB

const { existsSync, unlinkSync } = require("node:fs")
const { join } = require("node:path")

const FILES_TO_REMOVE = ["LICENSES.chromium.html"]

exports.default = async function afterPack(context) {
	const { appOutDir } = context

	for (const file of FILES_TO_REMOVE) {
		const filePath = join(appOutDir, file)
		if (existsSync(filePath)) {
			unlinkSync(filePath)
			console.log(`Removed: ${file}`)
		}
	}
}
