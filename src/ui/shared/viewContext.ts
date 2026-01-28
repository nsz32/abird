/**
 * Extract app name from URL query parameter.
 * Views receive ?app=appName to enable CSS customization per app.
 */
export function getAppClass(): string {
	const appName = new URLSearchParams(window.location.search).get("app")
	return appName ? `app-${appName}` : ""
}
