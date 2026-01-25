import { execSync } from "node:child_process"
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const EXTERNAL_MODULES = ["@ghostery/adblocker-electron-preload", "uiohook-napi", "node-gyp-build"]

type Platform = "linux" | "darwin" | "win32"
type Arch = "x64" | "arm64"

function parseArgs(): { platform: Platform; arch: Arch } {
	const args = process.argv.slice(2)
	let platform: Platform = process.platform as Platform
	let arch: Arch = process.arch as Arch

	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--platform" && args[i + 1]) platform = args[i + 1] as Platform
		if (args[i] === "--arch" && args[i + 1]) arch = args[i + 1] as Arch
	}

	return { platform, arch }
}

async function main() {
	const { platform, arch } = parseArgs()
	console.log(`Preparing ASAR for ${platform}-${arch}`)

	const rootDir = join(import.meta.dirname, "..")
	const outDir = join(rootDir, "out")
	const releaseDir = join(rootDir, "release")
	const stagingDir = join(releaseDir, "staging")
	const unpackedDir = join(releaseDir, "bird.asar.unpacked")

	// Clean
	if (existsSync(stagingDir)) rmSync(stagingDir, { recursive: true })
	if (existsSync(unpackedDir)) rmSync(unpackedDir, { recursive: true })
	mkdirSync(stagingDir, { recursive: true })

	// Copy compiled code
	cpSync(outDir, stagingDir, { recursive: true })

	// Create minimal package.json
	const packageJson = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf-8"))
	writeFileSync(
		join(stagingDir, "package.json"),
		JSON.stringify({ name: packageJson.name, version: packageJson.version, type: "module", main: "main/index.js" }, null, "\t"),
	)

	// Copy schema
	cpSync(join(rootDir, "bird.config.schema.json"), join(stagingDir, "bird.config.schema.json"))

	// Include external modules in asar
	for (const mod of EXTERNAL_MODULES) {
		const modSrc = join(rootDir, "node_modules", mod)
		const modDst = join(stagingDir, "node_modules", mod)
		if (!existsSync(modSrc)) continue

		cpSync(modSrc, modDst, { recursive: true, dereference: true })

		// Filter prebuilds to keep only target platform
		const prebuildsPath = join(modDst, "prebuilds")
		if (existsSync(prebuildsPath)) {
			const targetDir = `${platform}-${arch}`
			for (const dir of readdirSync(prebuildsPath)) {
				if (dir !== targetDir) rmSync(join(prebuildsPath, dir), { recursive: true })
			}
		}

		console.log(`Included: ${mod}`)
	}

	// Pack ASAR (unpack native .node files to bird.asar.unpacked/)
	console.log("Packing ASAR...")
	execSync(`pnpm dlx @electron/asar pack "${stagingDir}" "${join(releaseDir, "bird.asar")}" --unpack "**/*.node"`, { stdio: "inherit" })

	// Create tarball (zstd compression)
	const tarballName = `Bird-${packageJson.version}-asar-${platform}-${arch}.tar.zst`
	console.log(`Creating tarball: ${tarballName}`)
	execSync(`tar --zstd -cf "${join(releaseDir, tarballName)}" -C "${releaseDir}" bird.asar bird.asar.unpacked`, {
		stdio: "inherit",
	})

	// Cleanup
	rmSync(stagingDir, { recursive: true })

	console.log("\nAsar packaging complete:")
	console.log(`  - ${join(releaseDir, "bird.asar")}`)
	console.log(`  - ${unpackedDir}/`)
	console.log(`  - ${join(releaseDir, tarballName)}`)
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
