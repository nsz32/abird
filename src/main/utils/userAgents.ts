import { app } from "electron"

// User-Agents par plateforme:navigateur:os
const USER_AGENTS: Record<string, string> = {
	// Bird (défaut) - sera remplacé dynamiquement par le UA Electron nettoyé
	"desktop:bird": "",

	// Desktop Chrome
	"desktop:chrome:windows": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
	"desktop:chrome:macos": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
	"desktop:chrome:linux": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",

	// Desktop Firefox
	"desktop:firefox:windows": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
	"desktop:firefox:macos": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0",
	"desktop:firefox:linux": "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0",

	// Desktop Safari (macOS only)
	"desktop:safari": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",

	// Desktop Edge (Windows)
	"desktop:edge": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",

	// Desktop Opera
	"desktop:opera": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 OPR/114.0.0.0",

	// Internet Explorer (pour rire... et legacy)
	"desktop:ie11": "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko",
	"desktop:ie6": "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)",

	// Mobile Chrome
	"mobile:chrome:android": "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
	"mobile:chrome:ios":
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.0.0 Mobile/15E148 Safari/604.1",
	"mobile:chrome": "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36", // Alias -> Android par défaut

	// Mobile Safari (iPhone)
	"mobile:safari": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",

	// Mobile Firefox
	"mobile:firefox:android": "Mozilla/5.0 (Android 14; Mobile; rv:133.0) Gecko/133.0 Firefox/133.0",
	"mobile:firefox:ios":
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/133.0 Mobile/15E148 Safari/605.1.15",
	"mobile:firefox": "Mozilla/5.0 (Android 14; Mobile; rv:133.0) Gecko/133.0 Firefox/133.0", // Alias -> Android par défaut

	// Mobile Edge
	"mobile:edge:android":
		"Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 EdgA/131.0.0.0",
	"mobile:edge:ios":
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/131.0.0.0 Mobile/15E148 Safari/605.1.15",

	// Tablet Safari (iPad)
	"tablet:safari": "Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",

	// Tablet Chrome (Android)
	"tablet:chrome": "Mozilla/5.0 (Linux; Android 14; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
}

// Mapping process.platform -> OS pour les shortcodes
function getHostOS(): string {
	switch (process.platform) {
		case "win32":
			return "windows"
		case "darwin":
			return "macos"
		default:
			return "linux"
	}
}

// Nettoie le UA Electron par défaut (enlève "Electron/X.X.X")
function cleanElectronUA(ua: string): string {
	return ua.replace(/Electron\/[\d.]+ /, "")
}

// Retourne le UA Electron nettoyé (sans mention d'Electron)
export function getCleanDefaultUA(): string {
	return cleanElectronUA(app.userAgentFallback)
}

// Parse shortcode et retourne le User-Agent
function parseShortcode(shortcode: string): string | null {
	const parts = shortcode.split(":")
	if (parts.length < 2) return null

	const [platform, browser, os] = parts

	// Cas spécial : desktop:bird = UA Electron nettoyé
	if (platform === "desktop" && browser === "bird") {
		return getCleanDefaultUA()
	}

	// Essayer avec OS spécifié, sinon OS hôte, sinon sans OS
	const keys = [os ? `${platform}:${browser}:${os}` : null, `${platform}:${browser}:${getHostOS()}`, `${platform}:${browser}`].filter(Boolean) as string[]

	for (const key of keys) {
		if (USER_AGENTS[key]) return USER_AGENTS[key]
	}

	return null
}

// Liste des shortcodes disponibles
export function getAvailableUserAgents(): string[] {
	return Object.keys(USER_AGENTS)
}

// Résout le User-Agent (shortcode ou raw) vers la string finale
export function resolveUserAgent(userAgent: string): string {
	// Si ça ressemble à un UA complet (contient Mozilla ou des espaces), c'est du raw
	if (userAgent.includes(" ") || userAgent.startsWith("Mozilla")) {
		return userAgent
	}

	// Sinon c'est un shortcode
	const parsed = parseShortcode(userAgent)
	if (parsed) return parsed

	console.warn(`Unknown userAgent shortcode: ${userAgent}, using desktop:bird`)
	return getCleanDefaultUA()
}
