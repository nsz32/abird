import { copyFileSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const rootDir = join(import.meta.dirname, "..")
const outDir = join(rootDir, "out")

const packageJson = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf-8"))
const asarPackageJson = {
	name: packageJson.name,
	version: packageJson.version,
	type: "module",
	main: "main/index.js",
}

writeFileSync(join(outDir, "package.json"), JSON.stringify(asarPackageJson, null, "\t"))
copyFileSync(join(rootDir, "bird.config.schema.json"), join(outDir, "bird.config.schema.json"))

console.log("Asar prepared: package.json + schema")
