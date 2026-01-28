import { getCurrentAppName } from "../config"
import { sanitizeAppName } from "./naming"

/**
 * Build a view URL with app context query parameter.
 * Example: buildViewUrl("navbar") -> "abird://navbar/?app=my-app"
 */
export function buildViewUrl(viewName: string): string {
	const appName = getCurrentAppName()
	const appParam = appName ? `?app=${sanitizeAppName(appName)}` : ""

	return `abird://${viewName}/${appParam}`
}
