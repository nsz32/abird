/**
 * Types partagés entre main, preload et renderer
 */

// État de navigation (envoyé aux overlays)
export interface NavigationState {
	url: string
	title: string
	canGoBack: boolean
	canGoForward: boolean
	isLoading: boolean
}

// Canaux IPC (évite les typos, autocomplétion)
export const IpcChannels = {
	// Navigation
	NAVIGATION_BACK: "bird:navigation:back",
	NAVIGATION_FORWARD: "bird:navigation:forward",
	NAVIGATION_RELOAD: "bird:navigation:reload",
	NAVIGATION_GET_STATE: "bird:navigation:get-state",
	NAVIGATION_STATE_CHANGED: "bird:navigation:state-changed",
} as const

// Type utilitaire pour les valeurs de IpcChannels
export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]

// API Bird exposée aux overlays via contextBridge
export interface BirdApi {
	navigation: {
		back: () => Promise<void>
		forward: () => Promise<void>
		reload: (ignoreCache?: boolean) => Promise<void>
		getState: () => Promise<NavigationState>
		onStateChanged: (callback: (state: NavigationState) => void) => () => void
	}
}

// Déclaration globale pour window.bird
declare global {
	interface Window {
		bird: BirdApi
	}
}
