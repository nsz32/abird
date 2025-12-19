/**
 * Check if a URL matches any of the internal patterns
 */
export function isInternalUrl(url: string, patterns: string[]): boolean {
	for (const pattern of patterns) {
		try {
			const regex = new RegExp(pattern)
			if (regex.test(url)) {
				return true
			}
		} catch {
			// If pattern is not a valid regex, treat as base URL
			if (url.startsWith(pattern)) {
				return true
			}
		}
	}
	return false
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
	try {
		const urlObj = new URL(url)
		return urlObj.hostname
	} catch {
		return ""
	}
}
