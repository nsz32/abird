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
 * Setup the bird:// protocol handler.
 * Called inside app.whenReady()
 */
export function setupBirdProtocol() {
	protocol.handle("bird", (request) => {
		const { host, pathname } = new URL(request.url)

		// Dev mode: redirect to Vite server
		if (process.env.ELECTRON_RENDERER_URL) {
			const viteUrl = `${process.env.ELECTRON_RENDERER_URL}/${host}${pathname}`
			return net.fetch(viteUrl)
		}

		// Prod mode: serve from built files
		if (pathname.startsWith("/assets/")) {
			const filePath = join(__dirname, "../renderer", pathname)
			return net.fetch(pathToFileURL(filePath).toString())
		}
		const basePath = join(__dirname, "../renderer", host)
		const filePath = pathname === "/" || pathname === "" ? join(basePath, "index.html") : join(basePath, pathname)
		return net.fetch(pathToFileURL(filePath).toString())
	})
}
