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
