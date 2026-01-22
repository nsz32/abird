/**
 * URL routing utilities
 * Pattern generation to determine internal/external URLs
 */

/**
 * Escapes special characters for use in a regex
 */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Derives a regex pattern for internal URLs from a start URL.
 *
 * Strategy: allows all URLs from the same base domain (domain.tld)
 * and their subdomains.
 *
 * Examples:
 * - "https://mail.google.com/inbox" → "^https?://([^/]+\\.)?google\\.com(/|$)"
 * - "https://app.example.org" → "^https?://([^/]+\\.)?example\\.org(/|$)"
 * - "https://localhost:3000" → "^https?://localhost(:\\d+)?(/|$)"
 */
export function deriveInternalPattern(startUrl: string): string {
	try {
		const url = new URL(startUrl)
		const hostname = url.hostname

		// Special case: localhost
		if (hostname === "localhost" || hostname === "127.0.0.1") {
			return `^https?://${escapeRegex(hostname)}(:\\d+)?(/|$)`
		}

		// Special case: IP address
		if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
			return `^https?://${escapeRegex(hostname)}(:\\d+)?(/|$)`
		}

		// Normal domain: extract domain.tld (last 2 segments)
		const parts = hostname.split(".")
		const baseDomain = parts.length >= 2 ? parts.slice(-2).join(".") : hostname

		return `^https?://([^/]+\\.)?${escapeRegex(baseDomain)}(/|$)`
	} catch {
		// Invalid URL: fallback to exact prefix
		return startUrl
	}
}
