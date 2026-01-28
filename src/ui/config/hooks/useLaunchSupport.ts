import { useEffect, useState } from "react"

/**
 * Checks if launching apps externally is supported on this platform.
 */
export function useLaunchSupport(): boolean {
	const [supported, setSupported] = useState(false)

	useEffect(() => {
		window.abird.app.isLaunchSupported().then(setSupported)
	}, [])

	return supported
}
