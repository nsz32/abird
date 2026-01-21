import { useEffect, useState } from "react"

export interface UseAppIconResult {
	iconData: string | null
	iconSize: { w: number; h: number } | null
	onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void
}

/**
 * Manages icon display for an app.
 * Loads icon data from storage and tracks dimensions.
 */
export function useAppIcon(iconFilename?: string): UseAppIconResult {
	const [iconData, setIconData] = useState<string | null>(null)
	const [iconSize, setIconSize] = useState<{ w: number; h: number } | null>(null)

	useEffect(() => {
		if (iconFilename) {
			window.bird.icons.getData(iconFilename).then(setIconData)
		} else {
			setIconData(null)
		}
		setIconSize(null)
	}, [iconFilename])

	const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
		const img = e.currentTarget
		setIconSize({ w: img.naturalWidth, h: img.naturalHeight })
	}

	return { iconData, iconSize, onImageLoad }
}
