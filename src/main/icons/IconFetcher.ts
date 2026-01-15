import type { IconFetchResult, IconResult, IconSource } from "@shared/types"
import { WebContentsView, net } from "electron"

const PAGE_LOAD_TIMEOUT = 10000
const FETCH_TIMEOUT = 5000

// Script d'extraction des URLs d'icônes (exécuté dans la page)
const EXTRACT_SCRIPT = `
(function() {
	const get = (sel, attr = 'href') => {
		const el = document.querySelector(sel);
		return el ? (el[attr] || el.getAttribute(attr)) : null;
	};

	const toAbsolute = (url) => {
		if (!url) return null;
		try { return new URL(url, location.href).href; }
		catch { return null; }
	};

	return {
		appleTouchIcon: toAbsolute(get('link[rel="apple-touch-icon"]')),
		icon192: toAbsolute(get('link[rel="icon"][sizes*="192"]')),
		icon: toAbsolute(get('link[rel="icon"]')) || toAbsolute(get('link[rel="shortcut icon"]')),
		ogImage: toAbsolute(get('meta[property="og:image"]', 'content')),
		msIcon: toAbsolute(get('meta[name="msapplication-TileImage"]', 'content')),
		favicon: new URL('/favicon.ico', location.origin).href,
		title: document.title,
		themeColor: get('meta[name="theme-color"]', 'content'),
		domain: location.hostname,
	};
})()
`

interface ExtractedData {
	appleTouchIcon: string | null
	icon192: string | null
	icon: string | null
	ogImage: string | null
	msIcon: string | null
	favicon: string | null
	title: string | null
	themeColor: string | null
	domain: string
}

async function fetchAsBase64(url: string): Promise<string | null> {
	try {
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

		const res = await net.fetch(url, { signal: controller.signal })
		clearTimeout(timeoutId)

		if (!res.ok) return null

		const contentType = res.headers.get("content-type") || ""
		if (!contentType.startsWith("image/")) return null

		const buffer = await res.arrayBuffer()
		return `data:${contentType};base64,${Buffer.from(buffer).toString("base64")}`
	} catch {
		return null
	}
}

async function buildIconResults(extracted: ExtractedData): Promise<IconResult[]> {
	// Définir les sources à fetcher
	const sources: { url: string | null; source: IconSource; size?: number }[] = [
		{ url: extracted.appleTouchIcon, source: "apple-touch", size: 180 },
		{ url: extracted.icon192, source: "icon-hd", size: 192 },
		{ url: extracted.msIcon, source: "ms-tile", size: 144 },
		{ url: extracted.ogImage, source: "og-image" },
		{ url: extracted.icon, source: "icon" },
		{ url: extracted.favicon, source: "favicon", size: 32 },
	]

	// Ajouter Google Favicon API
	if (extracted.domain) {
		sources.push({
			url: `https://www.google.com/s2/favicons?domain=${extracted.domain}&sz=128`,
			source: "google",
			size: 128,
		})
	}

	// Fetch toutes les icônes en parallèle
	const results = await Promise.all(
		sources.map(async ({ url, source, size }) => {
			if (!url) return null
			const base64 = await fetchAsBase64(url)
			if (!base64) return null
			return { url: base64, source, size } as IconResult
		})
	)

	// Filtrer les nulls
	return results.filter((r): r is IconResult => r !== null)
}

export async function fetchIcons(url: string, partition?: string): Promise<IconFetchResult> {
	return new Promise((resolve) => {
		const view = new WebContentsView({
			webPreferences: {
				nodeIntegration: false,
				contextIsolation: true,
				sandbox: true,
				partition: partition ? `persist:${partition}` : undefined,
			},
		})

		// Vue cachée (pas ajoutée à une fenêtre)
		view.setBounds({ x: 0, y: 0, width: 1, height: 1 })

		let resolved = false
		const cleanup = () => {
			if (!resolved) {
				resolved = true
				view.webContents.close()
			}
		}

		const fallbackResult = async (): Promise<IconFetchResult> => {
			try {
				const domain = new URL(url).hostname
				const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
				const base64 = await fetchAsBase64(googleUrl)
				if (base64) {
					return { icons: [{ url: base64, source: "google", size: 128 }] }
				}
			} catch {
				// ignore
			}
			return { icons: [] }
		}

		// Timeout global
		const timeout = setTimeout(async () => {
			cleanup()
			resolve(await fallbackResult())
		}, PAGE_LOAD_TIMEOUT)

		view.webContents.on("did-finish-load", async () => {
			try {
				const extracted = (await view.webContents.executeJavaScript(EXTRACT_SCRIPT)) as ExtractedData
				clearTimeout(timeout)
				cleanup()

				const icons = await buildIconResults(extracted)

				resolve({
					icons,
					title: extracted.title || undefined,
					themeColor: extracted.themeColor || undefined,
				})
			} catch {
				clearTimeout(timeout)
				cleanup()
				resolve(await fallbackResult())
			}
		})

		view.webContents.on("did-fail-load", async () => {
			clearTimeout(timeout)
			cleanup()
			resolve(await fallbackResult())
		})

		view.webContents.loadURL(url).catch(async () => {
			clearTimeout(timeout)
			cleanup()
			resolve(await fallbackResult())
		})
	})
}
