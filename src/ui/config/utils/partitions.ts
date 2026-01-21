import type { BirdConfig } from "@shared/config.schema"
import type { PartitionsState } from "@shared/types"

/**
 * Returns all available partition names (from state + config).
 */
export function getAvailablePartitions(config: BirdConfig, partitionsState: PartitionsState): string[] {
	const partitions = new Set<string>()

	for (const p of partitionsState.partitions) {
		partitions.add(p.name)
	}

	for (const appConfig of Object.values(config.apps)) {
		partitions.add(appConfig.partition)
	}

	return [...partitions].sort()
}

/**
 * Returns a map of partition name → apps that use it.
 */
export function getPartitionUsage(config: BirdConfig): Map<string, string[]> {
	const usage = new Map<string, string[]>()

	for (const [appName, appConfig] of Object.entries(config.apps)) {
		const partition = appConfig.partition
		if (!usage.has(partition)) {
			usage.set(partition, [])
		}
		usage.get(partition)?.push(appName)
	}

	return usage
}

/**
 * Returns all existing names (apps + partitions) for uniqueness validation.
 */
export function getExistingNames(config: BirdConfig): string[] {
	return [...Object.keys(config.apps), ...Object.keys(config.partitions || {})]
}
