import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const rootDir = join(import.meta.dirname, "..")
const packageJson = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf-8"))

const asarPackageJson = {
	name: packageJson.name,
	version: packageJson.version,
	type: "module",
	main: "main/index.js",
}

const outputPath = join(rootDir, "out", "package.json")
writeFileSync(outputPath, JSON.stringify(asarPackageJson, null, "\t"))

console.log(`Asar package.json generated: ${outputPath}`)
