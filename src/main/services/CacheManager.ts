/**
 * Gestion du nettoyage automatique du cache des partitions
 * Responsabilités : lock soft, cleanup basé sur taille/âge
 */
import { existsSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import type { CacheCleanupConfig } from "@shared/config.schema"
import { getBirdConfig } from "../config"
import { paths } from "../utils/platform"

const LOCK_FILENAME = ".bird-lock"

interface LockHolder {
	pid: number
	startedAt: number
}

interface LockFile {
	holders: LockHolder[]
}

function getPartitionPath(name: string): string {
	return join(paths.userData, "Partitions", name)
}

function getLockPath(partitionName: string): string {
	return join(getPartitionPath(partitionName), LOCK_FILENAME)
}

function isProcessAlive(pid: number): boolean {
	try {
		process.kill(pid, 0)
		return true
	} catch {
		return false
	}
}

function readLockFile(partitionName: string): LockFile {
	const lockPath = getLockPath(partitionName)
	if (!existsSync(lockPath)) return { holders: [] }

	try {
		const content = readFileSync(lockPath, "utf-8")
		const lock = JSON.parse(content) as LockFile
		// Nettoyer les PIDs morts
		lock.holders = lock.holders.filter((h) => isProcessAlive(h.pid))
		return lock
	} catch {
		return { holders: [] }
	}
}

function writeLockFile(partitionName: string, lock: LockFile): void {
	const lockPath = getLockPath(partitionName)
	writeFileSync(lockPath, JSON.stringify(lock, null, "\t"))
}

export function acquirePartitionLock(partitionName: string): void {
	const partitionPath = getPartitionPath(partitionName)
	if (!existsSync(partitionPath)) return

	const lock = readLockFile(partitionName)
	const pid = process.pid

	if (!lock.holders.some((h) => h.pid === pid)) {
		lock.holders.push({ pid, startedAt: Date.now() })
		writeLockFile(partitionName, lock)
		console.log(`[CacheManager] Lock acquired: ${partitionName} (pid: ${pid})`)
	}
}

export function releasePartitionLock(partitionName: string): void {
	const lock = readLockFile(partitionName)
	const pid = process.pid
	const hadLock = lock.holders.some((h) => h.pid === pid)

	lock.holders = lock.holders.filter((h) => h.pid !== pid)
	writeLockFile(partitionName, lock)

	if (hadLock) {
		console.log(`[CacheManager] Lock released: ${partitionName} (pid: ${pid})`)
	}
}

export function isPartitionLocked(partitionName: string): boolean {
	const lock = readLockFile(partitionName)
	return lock.holders.length > 0
}

interface CleanupStats {
	deletedCount: number
	deletedBytes: number
	skippedCount: number
}

function cleanupPartitionCache(partitionName: string, config: CacheCleanupConfig): CleanupStats {
	const stats: CleanupStats = { deletedCount: 0, deletedBytes: 0, skippedCount: 0 }

	const cacheDir = join(getPartitionPath(partitionName), "Cache", "Cache_Data")
	if (!existsSync(cacheDir)) return stats

	const maxSizeBytes = config.maxFileSizeMB ? config.maxFileSizeMB * 1024 * 1024 : Number.POSITIVE_INFINITY
	const maxAgeMs = config.maxAgeDays ? config.maxAgeDays * 24 * 60 * 60 * 1000 : Number.POSITIVE_INFINITY
	const now = Date.now()

	const entries = readdirSync(cacheDir, { withFileTypes: true })

	for (const entry of entries) {
		if (entry.isDirectory()) continue

		const filePath = join(cacheDir, entry.name)

		try {
			const fileStat = statSync(filePath)
			const isTooLarge = fileStat.size > maxSizeBytes
			const isTooOld = now - fileStat.mtimeMs > maxAgeMs

			if (isTooLarge || isTooOld) {
				unlinkSync(filePath)
				stats.deletedCount++
				stats.deletedBytes += fileStat.size
			}
		} catch {
			stats.skippedCount++
		}
	}

	return stats
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function cleanupAllPartitionCaches(): void {
	const birdConfig = getBirdConfig()

	for (const [name, partitionConfig] of Object.entries(birdConfig.partitions || {})) {
		const cacheCleanup = partitionConfig?.cacheCleanup
		if (!cacheCleanup?.maxFileSizeMB && !cacheCleanup?.maxAgeDays) continue

		if (isPartitionLocked(name)) {
			console.log(`[CacheManager] Skipped ${name}: partition in use`)
			continue
		}

		const stats = cleanupPartitionCache(name, cacheCleanup)
		if (stats.deletedCount > 0) {
			console.log(`[CacheManager] ${name}: deleted ${stats.deletedCount} files (${formatBytes(stats.deletedBytes)})`)
		}
	}
}
