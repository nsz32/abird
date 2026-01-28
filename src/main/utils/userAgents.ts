import { app } from "electron"
import { createLogger } from "./logger"

const log = createLogger("UserAgent")

// User-Agents by platform:browser:os
const USER_AGENTS: Record<string, string> = {
	// ABird (default) - will be dynamically replaced by the cleaned Electron UA
	"desktop:abird": "",

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

	// Internet Explorer (for laughs... and legacy)
	"desktop:ie11": "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko",
	"desktop:ie6": "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)",

	// Mobile Chrome
	"mobile:chrome:android": "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
	"mobile:chrome:ios":
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.0.0 Mobile/15E148 Safari/604.1",
	"mobile:chrome": "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36", // Alias -> Android by default

	// Mobile Safari (iPhone)
	"mobile:safari": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",

	// Mobile Firefox
	"mobile:firefox:android": "Mozilla/5.0 (Android 14; Mobile; rv:133.0) Gecko/133.0 Firefox/133.0",
	"mobile:firefox:ios":
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/133.0 Mobile/15E148 Safari/605.1.15",
	"mobile:firefox": "Mozilla/5.0 (Android 14; Mobile; rv:133.0) Gecko/133.0 Firefox/133.0", // Alias -> Android by default

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

// Mapping process.platform -> OS for shortcodes
export function getHostOS(): string {
	switch (process.platform) {
		case "win32":
			return "windows"
		case "darwin":
			return "macos"
		default:
			return "linux"
	}
}

// Cleans the default Electron UA (removes "Electron/X.X.X")
function cleanElectronUA(ua: string): string {
	return ua.replace(/Electron\/[\d.]+ /, "")
}

// Returns the cleaned Electron UA (without Electron mention)
export function getCleanDefaultUA(): string {
	return cleanElectronUA(app.userAgentFallback)
}

// Parse shortcode and return the User-Agent
function parseShortcode(shortcode: string): string | null {
	const parts = shortcode.split(":")
	if (parts.length < 2) return null

	const [platform, browser, os] = parts

	// Special case: desktop:abird = cleaned Electron UA
	if (platform === "desktop" && browser === "abird") {
		return getCleanDefaultUA()
	}

	// Try with specified OS, then host OS, then without OS
	const keys = [os ? `${platform}:${browser}:${os}` : null, `${platform}:${browser}:${getHostOS()}`, `${platform}:${browser}`].filter(Boolean) as string[]

	for (const key of keys) {
		if (USER_AGENTS[key]) return USER_AGENTS[key]
	}

	return null
}

// Default user agent shortcode (Chrome on host OS)
export function getDefaultUserAgent(): string {
	return `desktop:chrome:${getHostOS()}`
}

// Checks whether a shortcode is a known key in USER_AGENTS
export function isKnownUserAgent(shortcode: string): boolean {
	return shortcode in USER_AGENTS
}

// List of available shortcodes
export function getAvailableUserAgents(): string[] {
	return Object.keys(USER_AGENTS)
}

// Resolves the User-Agent (shortcode or raw) to the final string
export function resolveUserAgent(userAgent: string): string {
	// If it looks like a complete UA (contains Mozilla or spaces), it's raw
	if (userAgent.includes(" ") || userAgent.startsWith("Mozilla")) {
		return userAgent
	}

	// Otherwise it's a shortcode
	const parsed = parseShortcode(userAgent)
	if (parsed) return parsed

	const fallback = getDefaultUserAgent()
	log.warn(`Unknown user agent shortcode "${userAgent}", falling back to ${fallback}`)
	return parseShortcode(fallback) as string
}
