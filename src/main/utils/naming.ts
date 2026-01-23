/**
 * Naming utilities for app identifiers
 */

/**
 * Sanitize an app name for use in identifiers (WM_CLASS, filenames, etc.)
 * - Lowercase
 * - Only alphanumeric, hyphens and underscores
 * - Collapse multiple hyphens
 * - Max 32 characters
 */
export function sanitizeAppName(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9_-]/g, "-")
		.replace(/-+/g, "-")
		.substring(0, 32)
}

/**
 * Convert a string to PascalCase.
 */
function toPascalCase(str: string): string {
	return str
		.split(/[-_]/)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join("")
}

/**
 * Generate AppUserModelId for Windows taskbar grouping.
 * Format: ProjectName.AppName (PascalCase, max 128 chars, no spaces)
 */
export function getAppUserModelId(projectName: string, appName: string): string {
	const pascalProject = toPascalCase(projectName)
	const pascalApp = toPascalCase(sanitizeAppName(appName))

	return `${pascalProject}.${pascalApp}`
}
