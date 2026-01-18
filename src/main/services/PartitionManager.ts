/**
 * Gestion des partitions Electron
 * Responsabilités : listing, détection orphelins, reset, suppression
 */
import { existsSync, readdirSync, rmSync, statSync } from "node:fs"
import { join } from "node:path"
import type { PartitionConfig, PartitionState, PartitionsState } from "@shared/types"
import { session } from "electron"
import { getBirdConfig } from "../config"
import { config$ } from "../core/states"
import { paths } from "../utils/platform"

// Partitions créées automatiquement avec une app (runtime only, pas persisté)
const fragilePartitions = new Set<string>()

export function markPartitionFragile(name: string): void {
	fragilePartitions.add(name)
}

export function isPartitionFragile(name: string): boolean {
	return fragilePartitions.has(name)
}

export function cleanupFragilePartitions(): void {
	const state = getPartitionsState()
	for (const partition of state.partitions) {
		if (fragilePartitions.has(partition.name) && partition.usedByApps.length === 0) {
			fragilePartitions.delete(partition.name)
			if (partition.hasPhysical) {
				deletePartition(partition.name).catch(console.error)
			}
		}
	}
}

function getPartitionsDir(): string {
	return join(paths.userData, "Partitions")
}

function getPhysicalPartitions(): string[] {
	const dir = getPartitionsDir()
	if (!existsSync(dir)) return []
	return readdirSync(dir, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name)
}

function getAppPartitionUsage(): Map<string, string[]> {
	const birdConfig = getBirdConfig()
	const usage = new Map<string, string[]>()

	for (const [appName, appConfig] of Object.entries(birdConfig.apps)) {
		const partition = appConfig.partition
		if (!usage.has(partition)) {
			usage.set(partition, [])
		}
		usage.get(partition)?.push(appName)
	}
	return usage
}

export function getPartitionsState(): PartitionsState {
	const birdConfig = getBirdConfig()
	const physicalPartitions = new Set(getPhysicalPartitions())
	const configPartitions = new Set(Object.keys(birdConfig.partitions || {}))
	const appUsage = getAppPartitionUsage()

	// Fusionner toutes les sources de partitions
	const allPartitions = new Set([...physicalPartitions, ...configPartitions, ...appUsage.keys()])

	const partitions: PartitionState[] = []

	for (const name of allPartitions) {
		const usedByApps = appUsage.get(name) || []
		const hasPhysical = physicalPartitions.has(name)
		const hasConfig = configPartitions.has(name)

		partitions.push({
			name,
			hasConfig,
			hasPhysical,
			usedByApps,
			isOrphan: hasPhysical && usedByApps.length === 0,
			isFragile: fragilePartitions.has(name),
			config: (birdConfig.partitions?.[name] as PartitionConfig) || null,
		})
	}

	// Tri : orphelins d'abord, puis alphabétique
	partitions.sort((a, b) => {
		if (a.isOrphan !== b.isOrphan) return a.isOrphan ? -1 : 1
		return a.name.localeCompare(b.name)
	})

	return {
		partitions,
		physicalPath: getPartitionsDir(),
	}
}

export function getPartitionSize(name: string): number {
	const partitionPath = join(getPartitionsDir(), name)
	if (!existsSync(partitionPath)) return 0
	return getDirectorySize(partitionPath)
}

function getDirectorySize(dir: string): number {
	let size = 0
	const entries = readdirSync(dir, { withFileTypes: true })
	for (const entry of entries) {
		const path = join(dir, entry.name)
		if (entry.isDirectory()) {
			size += getDirectorySize(path)
		} else {
			size += statSync(path).size
		}
	}
	return size
}

export async function resetPartition(name: string): Promise<void> {
	const currentPartition = config$.get().partition
	if (name === currentPartition) {
		throw new Error("Cannot reset the active partition")
	}

	const sess = session.fromPartition(`persist:${name}`)
	await sess.clearStorageData()
	await sess.clearCache()
	await sess.clearAuthCache()
	console.log(`[Partition] reset: ${name}`)
}

export async function deletePartition(name: string): Promise<void> {
	const currentPartition = config$.get().partition
	if (name === currentPartition) {
		throw new Error("Cannot delete the active partition")
	}

	// D'abord vider via Electron
	await resetPartition(name)

	// Puis supprimer le dossier
	const partitionPath = join(getPartitionsDir(), name)
	if (existsSync(partitionPath)) {
		rmSync(partitionPath, { recursive: true, force: true })
		console.log(`[Partition] deleted: ${partitionPath}`)
	}
}
