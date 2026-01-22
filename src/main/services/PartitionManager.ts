/**
 * Gestion des partitions Electron
 * Responsabilités : listing, détection orphelins, reset, suppression
 */
import { existsSync, readdirSync, renameSync, rmSync, statSync } from "node:fs"
import { join } from "node:path"
import type { PartitionConfig, PartitionState, PartitionsState } from "@shared/types"
import { session } from "electron"
import { getBirdConfig } from "../config"
import { config$ } from "../core/states"
import { createLogger } from "../utils/logger"
import { paths } from "../utils/platform"

const log = createLogger("Partition")

export function getPartitionConfig(name: string): PartitionConfig | null {
	const birdConfig = getBirdConfig()
	return (birdConfig.partitions?.[name] as PartitionConfig) ?? null
}

/**
 * Retourne les noms des partitions "fantômes" à supprimer :
 * partitions en config uniquement (pas sur disque) et sans apps associées.
 */
export function getOrphanedConfigPartitions(): string[] {
	const state = getPartitionsState()
	return state.partitions
		.filter((p) => !p.hasPhysical && p.usedByApps.length === 0 && p.hasConfig)
		.map((p) => p.name)
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
			config: (birdConfig.partitions?.[name] as PartitionConfig) || null,
			diskSize: hasPhysical ? getPartitionSize(name) : undefined,
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

export async function cleanupPartition(name: string): Promise<void> {
	const currentPartition = config$.get().partition
	if (name === currentPartition) {
		throw new Error("Cannot cleanup the active partition")
	}

	const sess = session.fromPartition(`persist:${name}`)
	await Promise.all([sess.clearCache(), sess.clearHostResolverCache(), sess.clearCodeCaches({})])
	log.info(`Cleanup: ${name}`)
}

export async function resetPartition(name: string): Promise<void> {
	const currentPartition = config$.get().partition
	if (name === currentPartition) {
		throw new Error("Cannot reset the active partition")
	}

	const partitionPath = join(getPartitionsDir(), name)
	if (existsSync(partitionPath)) {
		rmSync(partitionPath, { recursive: true, force: true })
		log.info(`Reset: ${name}`)
	}
}

export async function deletePartition(name: string): Promise<void> {
	const currentPartition = config$.get().partition
	if (name === currentPartition) {
		throw new Error("Cannot delete the active partition")
	}

	const appUsage = getAppPartitionUsage()
	if ((appUsage.get(name)?.length ?? 0) > 0) {
		throw new Error("Cannot delete a partition used by apps")
	}

	await resetPartition(name)
	log.info(`Deleted: ${name}`)
}

export function renamePartition(oldName: string, newName: string): void {
	const currentPartition = config$.get().partition
	if (oldName === currentPartition) {
		throw new Error("Cannot rename the active partition")
	}

	const partitionsDir = getPartitionsDir()
	const oldPath = join(partitionsDir, oldName)
	const newPath = join(partitionsDir, newName)

	// Renommer le dossier physique s'il existe
	if (existsSync(oldPath)) {
		if (existsSync(newPath)) {
			throw new Error(`Partition folder already exists: ${newName}`)
		}
		renameSync(oldPath, newPath)
		log.info(`Renamed: ${oldName} -> ${newName}`)
	}

}
