import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { net, protocol } from "electron"

/**
 * Register the bird:// scheme as privileged.
 * MUST be called BEFORE app.whenReady()
 */
export function registerBirdScheme() {
	protocol.registerSchemesAsPrivileged([{ scheme: "bird", privileges: { standard: true, secure: true, supportFetchAPI: true } }])
}

/**
 * Setup the bird:// protocol handler for production.
 * In dev, Views load directly from Vite server (bypassing this handler).
 *
 * URL structure: bird://[view]/[path]
 * - Assets and public files (favicon.png) are served from renderer root
 * - View-specific files are served from renderer/[view]/
 */
export function setupBirdProtocol() {
	protocol.handle("bird", (request) => {
		const { host, pathname } = new URL(request.url)
		const rendererPath = join(import.meta.dirname, "../renderer")

		const isRootAsset = pathname.startsWith("/assets/") || pathname === "/favicon.png"
		if (isRootAsset) {
			return net.fetch(pathToFileURL(join(rendererPath, pathname)).toString())
		}

		const filePath = pathname === "/" || pathname === "" ? join(rendererPath, host, "index.html") : join(rendererPath, host, pathname)

		return net.fetch(pathToFileURL(filePath).toString())
	})
}
