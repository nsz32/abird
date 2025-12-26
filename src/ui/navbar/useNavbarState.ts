import type { NavBarConfig, NavigationState, TabInfo } from "@shared/types"
import { useEffect, useState } from "react"

const EXTERNAL_INDICATOR_DURATION = 800

export function useNavbarState() {
	const [navState, setNavState] = useState<NavigationState>({
		url: "",
		title: "",
		canGoBack: false,
		canGoForward: false,
		isLoading: false,
	})
	const [config, setConfig] = useState<NavBarConfig | null>(null)
	const [tabs, setTabs] = useState<TabInfo[]>([])
	const [externalTabIds, setExternalTabIds] = useState<Set<string>>(new Set())

	useEffect(() => {
		window.bird.config.getNavBar().then(setConfig)
		window.bird.navigation.getState().then(setNavState)
		window.bird.tabs.getList().then(setTabs)

		const unsubscribeNav = window.bird.navigation.onStateChanged(setNavState)
		const unsubscribeTabs = window.bird.tabs.onListChanged(setTabs)
		const unsubscribeExternal = window.bird.tabs.onExternalOpened((tabId) => {
			setExternalTabIds((prev) => new Set(prev).add(tabId))
			setTimeout(() => {
				setExternalTabIds((prev) => {
					const next = new Set(prev)
					next.delete(tabId)
					return next
				})
			}, EXTERNAL_INDICATOR_DURATION)
		})

		return () => {
			unsubscribeNav()
			unsubscribeTabs()
			unsubscribeExternal()
		}
	}, [])

	return { navState, config, tabs, externalTabIds }
}
