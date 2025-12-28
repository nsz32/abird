import type { NavBarConfig, NavigationState, TabInfo } from "@shared/types"
import { useCallback, useEffect, useRef, useState } from "react"

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
	const [isUrlMode, setIsUrlMode] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const urlInputRef = useRef<HTMLInputElement>(null)

	const enterUrlMode = useCallback(() => {
		setIsUrlMode(true)
		setTimeout(() => {
			urlInputRef.current?.focus()
			urlInputRef.current?.select()
		}, 100)
	}, [])

	const exitUrlMode = useCallback(() => {
		setIsUrlMode(false)
	}, [])

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
		const unsubscribeFocusUrl = window.bird.commands.onFocusUrl(enterUrlMode)

		return () => {
			unsubscribeNav()
			unsubscribeTabs()
			unsubscribeExternal()
			unsubscribeFocusUrl()
		}
	}, [enterUrlMode])

	useEffect(() => {
		if (!containerRef.current) return

		const observer = new ResizeObserver((entries) => {
			const height = entries[0]?.contentRect.height ?? 0
			window.bird.navbar.resize(height)
		})

		observer.observe(containerRef.current)
		return () => observer.disconnect()
	})

	return { navState, config, tabs, externalTabIds, containerRef, isUrlMode, urlInputRef, exitUrlMode }
}
