import { useEffect, useState } from "react"

export interface UseAppIconResult {
	iconData: string | null
	iconSize: { w: number; h: number } | null
}

/**
 * Manages icon display for an app.
 * Loads icon data and dimensions from storage.
 */
export function useAppIcon(iconFilename?: string): UseAppIconResult {
	const [iconData, setIconData] = useState<string | null>(null)
	const [iconSize, setIconSize] = useState<{ w: number; h: number } | null>(null)

	useEffect(() => {
		if (iconFilename) {
			window.abird.icons.getData(iconFilename).then((result) => {
				if (result) {
					setIconData(result.data)
					setIconSize({ w: result.width, h: result.height })
				} else {
					setIconData(null)
					setIconSize(null)
				}
			})
		} else {
			setIconData(null)
			setIconSize(null)
		}
	}, [iconFilename])

	return { iconData, iconSize }
}
