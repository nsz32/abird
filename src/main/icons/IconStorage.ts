import { randomBytes } from "node:crypto"
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { Jimp } from "jimp"
import { paths } from "../utils/platform"

function sanitizeAppName(name: string): string {
	// Garde uniquement caractères safe pour filename
	return name
		.replace(/[^a-zA-Z0-9_-]/g, "_")
		.replace(/_+/g, "_")
		.substring(0, 32)
}

function generateFilename(appName: string): string {
	const safe = sanitizeAppName(appName)
	const hash = randomBytes(4).toString("hex") // 8 chars
	return `${safe}-${hash}.png`
}

function ensureIconsDir(): void {
	if (!existsSync(paths.icons)) {
		mkdirSync(paths.icons, { recursive: true })
	}
}

export async function saveIcon(appName: string, base64: string, oldIcon?: string): Promise<string> {
	ensureIconsDir()

	// Décoder base64
	const base64Data = base64.replace(/^data:image\/\w+;base64,/, "")
	const buffer = Buffer.from(base64Data, "base64")

	// Convertir en PNG avec jimp
	const image = await Jimp.fromBuffer(buffer)
	const pngBuffer = await image.getBuffer("image/png")

	// Générer nom et sauvegarder
	const filename = generateFilename(appName)
	writeFileSync(join(paths.icons, filename), pngBuffer)

	// Supprimer ancienne icône si existe
	if (oldIcon) {
		deleteIcon(oldIcon)
	}

	return filename
}

export function deleteIcon(filename: string): void {
	// Sécurité : ne pas permettre de path traversal
	if (filename.includes("/") || filename.includes("\\")) return

	const path = join(paths.icons, filename)
	if (existsSync(path)) {
		try {
			unlinkSync(path)
		} catch {
			// Ignore errors
		}
	}
}

export function getIconPath(filename: string): string | null {
	if (!filename || filename.includes("/") || filename.includes("\\")) return null

	const path = join(paths.icons, filename)
	return existsSync(path) ? path : null
}
