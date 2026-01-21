import { useEffect, useRef } from "react"

const REDEPLOY_DEBOUNCE_MS = 300

interface RedeployState {
	icon?: string
	description?: string
}

/**
 * Automatically redeploys the app when its icon or description changes.
 * Only triggers if the app is already deployed.
 * Uses debounce to avoid excessive redeploys during typing.
 */
export function useAutoRedeploy(appName: string, appIcon?: string, appDescription?: string, deployed?: boolean): void {
	const prevStateRef = useRef<RedeployState | null>(null)
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		if (!deployed) return

		const prevState = prevStateRef.current
		const currentState: RedeployState = { icon: appIcon, description: appDescription }
		prevStateRef.current = currentState

		// Skip on first render
		if (prevState === null) return
		if (prevState.icon === appIcon && prevState.description === appDescription) return

		// Clear previous debounce
		if (debounceRef.current) {
			clearTimeout(debounceRef.current)
		}

		debounceRef.current = setTimeout(() => {
			window.bird.deploy.deploy(appName).catch((err) => {
				console.error("Failed to redeploy after config change:", err)
			})
		}, REDEPLOY_DEBOUNCE_MS)

		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current)
			}
		}
	}, [appIcon, appDescription, deployed, appName])
}
