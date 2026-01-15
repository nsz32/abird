import type { RoutingConfig } from "@shared/types"

export function shouldHandleUrl(url: string, config: Partial<RoutingConfig> | null): boolean {
	if (!url || url.startsWith("bird:") || url.startsWith("about:") || url.startsWith("javascript:") || url.startsWith("data:")) {
		return true
	}
	return isInternalUrl(url, config) || isDownloadAllowed(url, config)
}

function isInternalUrl(url: string, config: Partial<RoutingConfig> | null): boolean {
	if (!config?.internal) return false
	return matchesPatterns(url, config.internal)
}

function isDownloadAllowed(url: string, config: Partial<RoutingConfig> | null): boolean {
	if (!config?.download) return false
	return matchesPatterns(url, config.download)
}

function matchesPatterns(url: string, patterns: string | string[]): boolean {
	const list = Array.isArray(patterns) ? patterns : [patterns]
	return list.some((p) => (p.startsWith("^") ? new RegExp(p).test(url) : url.startsWith(p)))
}
