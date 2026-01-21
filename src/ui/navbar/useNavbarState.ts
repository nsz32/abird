import { useBirdState } from "@ui/shared/hooks"
import { useCallback, useEffect, useRef, useState } from "react"

const EXTERNAL_INDICATOR_DURATION = 800

export function useNavbarState() {
	const config = useBirdState(window.bird.config.get, () => () => {})
	const navState = useBirdState(window.bird.navigation.getState, window.bird.navigation.onStateChanged)
	const tabs = useBirdState(window.bird.tabs.getList, window.bird.tabs.onListChanged)

	const [externalTabIds, setExternalTabIds] = useState<Set<string>>(new Set())
	const [isUrlMode, setIsUrlMode] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const urlInputRef = useRef<HTMLInputElement>(null)

	const enterUrlMode = useCallback(() => {
		setIsUrlMode(true)
		window.bird.navbar.setUrlEditMode(true)
		setTimeout(() => {
			urlInputRef.current?.focus()
			urlInputRef.current?.select()
		}, 100)
	}, [])

	const exitUrlMode = useCallback(() => {
		setIsUrlMode(false)
		window.bird.navbar.setUrlEditMode(false)
	}, [])

	useEffect(() => {
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
