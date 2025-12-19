export interface SiteConfig {
	name: string
	url: string
	internalPatterns: string[]
	icon?: string
	downloads?: DownloadConfig
	tabs?: TabConfig[]
}

export interface DownloadConfig {
	autoOpenThreshold: number // Size in bytes below which files auto-open
	downloadPath?: string
}

export interface TabConfig {
	name: string
	url: string
}

export interface AppConfig {
	sites: SiteConfig[]
	defaultSite?: string
}
