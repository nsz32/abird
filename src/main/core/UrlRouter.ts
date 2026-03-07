import type { ResolvedRoutingConfig, RoutingAction } from "@shared/types"

const SPECIAL_PREFIXES = ["abird:", "about:", "blob:", "data:", "javascript:"]

function matchesAny(url: string, patterns: RegExp[]): boolean {
	return patterns.some((p) => p.test(url))
}

function isSpecialUrl(url: string): boolean {
	return !url || SPECIAL_PREFIXES.some((p) => url.startsWith(p))
}

export function getNavigationAction(url: string, routing: ResolvedRoutingConfig): RoutingAction {
	if (isSpecialUrl(url)) return "internal"

	if (matchesAny(url, routing.internal) || matchesAny(url, routing.download)) {
		return "internal"
	}
	if (matchesAny(url, routing.external)) {
		return "external"
	}
	if (matchesAny(url, routing.ignore)) {
		return "ignore"
	}

	return "external"
}

export function getDownloadAction(url: string, routing: ResolvedRoutingConfig): RoutingAction {
	if (isSpecialUrl(url)) return "internal"

	if (matchesAny(url, routing.internal) || matchesAny(url, routing.download)) {
		return "download"
	}
	if (matchesAny(url, routing.external)) {
		return "external"
	}
	if (matchesAny(url, routing.ignore)) {
		return "ignore"
	}

	return "external"
}
