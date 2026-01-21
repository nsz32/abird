import { useEffect, useRef } from "react"

/**
 * Automatically redeploys the app when its icon changes.
 * Only triggers if the app is already deployed.
 */
export function useAutoRedeploy(appName: string, appIcon?: string, deployed?: boolean): void {
	const prevIconRef = useRef<string | undefined>(undefined)

	useEffect(() => {
		if (!deployed) return

		const prevIcon = prevIconRef.current
		prevIconRef.current = appIcon

		// Skip on first render (when prevIcon is undefined)
		if (prevIcon === undefined) return
		if (prevIcon === appIcon) return

		window.bird.deploy.deploy(appName).catch((err) => {
			console.error("Failed to redeploy after icon change:", err)
		})
	}, [appIcon, deployed, appName])
}
