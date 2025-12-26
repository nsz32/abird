import type { NavBarConfig, NavigationState, TabInfo } from "@shared/types"
import { useEffect, useRef, useState } from "react"

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
	const containerRef = useRef<HTMLDivElement>(null)

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

	useEffect(() => {
		if (!containerRef.current) return

		const observer = new ResizeObserver((entries) => {
			const height = entries[0]?.contentRect.height ?? 0
			window.bird.navbar.resize(height)
		})

		observer.observe(containerRef.current)
		return () => observer.disconnect()
	})

	return { navState, config, tabs, externalTabIds, containerRef }
}
