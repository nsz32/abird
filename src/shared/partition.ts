/**
 * Partition name validation and normalization
 * Electron/Chromium stores partitions in lowercase folders.
 * Valid names: [a-z0-9_] only.
 */

/** Pattern for valid partition names (lowercase, numbers, underscore) */
export const PARTITION_NAME_PATTERN = /^[a-z][a-z0-9_]*$/

/** Validates a partition name. Returns true if valid. */
export function isValidPartitionName(name: string): boolean {
	return PARTITION_NAME_PATTERN.test(name)
}

/** Validates a partition name. Returns i18n error key or null if valid. */
export function validatePartitionName(name: string): "partition.invalidName" | null {
	if (!isValidPartitionName(name)) {
		return "partition.invalidName"
	}
	return null
}

/**
 * Normalizes a partition name to be compatible with Electron/Chromium.
 * - Converts to lowercase
 * - Replaces invalid characters with underscore
 * - Collapses multiple underscores
 * - Trims leading/trailing underscores
 */
export function normalizePartitionName(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9_]/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_|_$/g, "")
}
