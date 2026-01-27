import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { pathToFileURL } from "node:url"
import { net, protocol } from "electron"
import { getConfigPath } from "../config"

const CUSTOM_CSS_FILENAME = "custom.css"
const CSS_HEADERS = { "Content-Type": "text/css" }

let customCSS: string | null = null

function loadCustomCSS(): string {
	if (customCSS !== null) return customCSS

	try {
		customCSS = readFileSync(join(dirname(getConfigPath()), CUSTOM_CSS_FILENAME), "utf-8")
	} catch {
		customCSS = ""
	}

	return customCSS
}

/**
 * Register the bird:// scheme as privileged.
 * MUST be called BEFORE app.whenReady()
 */
export function registerBirdScheme() {
	protocol.registerSchemesAsPrivileged([{ scheme: "bird", privileges: { standard: true, secure: true, supportFetchAPI: true } }])
}

/**
 * Setup the bird:// protocol handler.
 *
 * URL structure: bird://[view]/[path]
 * - bird://custom.css serves user custom stylesheet from config directory
 * - Assets and public files (favicon.png) are served from renderer root
 * - View-specific files are served from renderer/[view]/
 */
export function setupBirdProtocol() {
	protocol.handle("bird", (request) => {
		const { host, pathname } = new URL(request.url)

		if (host === CUSTOM_CSS_FILENAME) {
			return new Response(loadCustomCSS(), { headers: CSS_HEADERS })
		}

		const rendererPath = join(import.meta.dirname, "../renderer")

		const isRootAsset = pathname.startsWith("/assets/") || pathname === "/favicon.png"
		if (isRootAsset) {
			return net.fetch(pathToFileURL(join(rendererPath, pathname)).toString())
		}

		const filePath = pathname === "/" || pathname === "" ? join(rendererPath, host, "index.html") : join(rendererPath, host, pathname)

		return net.fetch(pathToFileURL(filePath).toString())
	})
}
