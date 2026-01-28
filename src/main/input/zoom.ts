import { getActiveTab } from "../tabs/Tabs"

const MIN_ZOOM = 0.1
const MAX_ZOOM = 3.0

/**
 * Zoom the active tab by ±10% steps, or reset to 100%.
 * Uses zoomFactor for linear percentage steps with floating-point rounding.
 */
export function zoomActiveTab(step: number) {
	const wc = getActiveTab()?.view.webContents
	if (!wc) return

	if (step === 0) {
		wc.zoomFactor = 1
	} else {
		const newZoom = Math.round((wc.zoomFactor + step) * 10) / 10
		wc.zoomFactor = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom))
	}
}
