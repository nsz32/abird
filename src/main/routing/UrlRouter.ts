import type { RoutingConfig } from "@shared/types"

export class UrlRouter {
	constructor(private config: Partial<RoutingConfig> | null) {}

	shouldHandle(url: string): boolean {
		if (!url || url.startsWith("about:") || url.startsWith("javascript:") || url.startsWith("data:")) {
			return true
		}
		return this.isInternal(url) || this.isDownloadAllowed(url)
	}

	private isInternal(url: string): boolean {
		if (!this.config?.internal) return false
		return this.matchesPatterns(url, this.config.internal)
	}

	private isDownloadAllowed(url: string): boolean {
		if (!this.config?.download) return false
		return this.matchesPatterns(url, this.config.download)
	}

	private matchesPatterns(url: string, patterns: string | string[]): boolean {
		const list = Array.isArray(patterns) ? patterns : [patterns]
		return list.some((p) => (p.startsWith("^") ? new RegExp(p).test(url) : url.startsWith(p)))
	}
}
