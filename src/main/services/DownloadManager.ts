import { existsSync, renameSync, statSync, unlinkSync } from "node:fs"
import { basename, dirname, extname, join } from "node:path"
import type { ActiveDownload, DownloadConfig, DownloadHistoryItem, DownloadStatus, ResolvedDownloadConfig } from "@shared/types"
import type { DownloadItem, Session } from "electron"
import { app, session, shell } from "electron"
import { getDownloadAction } from "../core/UrlRouter"
import { activeDownloads$, config$, downloadEvents$, downloadHistory$ } from "../core/states"
import { checkOfficeMacroWarning } from "../utils/executableDetection"
import { type FileDetectionResult, detectFileType, detectFileTypeWithRetry } from "../utils/fileDetection"
import { createLogger } from "../utils/logger"
import { parseSize } from "../utils/parseSize"
import { getFileMd5, openFile } from "../utils/platform"
import { addNotification, dismissNotification, updateNotification } from "./notify"

const log = createLogger("Download")

const MIN_BYTES_FOR_DETECTION = 4096
const SPEED_UPDATE_INTERVAL = 1000

let nextDownloadId = 1

function generateDownloadId(): string {
	return `dl-${nextDownloadId++}`
}

interface DownloadSpeedState {
	lastBytes: number
	lastTime: number
	bytesPerSecond: number
}

const speedStates = new Map<string, DownloadSpeedState>()
const activeItems = new Map<string, DownloadItem>()

function addActiveDownload(id: string, filename: string, totalBytes: number): void {
	const now = Date.now()
	speedStates.set(id, { lastBytes: 0, lastTime: now, bytesPerSecond: 0 })

	const download: ActiveDownload = {
		id,
		filename,
		receivedBytes: 0,
		totalBytes,
		bytesPerSecond: 0,
		startedAt: now,
	}
	activeDownloads$.emit([download, ...activeDownloads$.get()])
	downloadEvents$.emit({ type: "started", id })
}

function updateActiveDownload(id: string, receivedBytes: number, totalBytes: number): void {
	const state = speedStates.get(id)
	let bytesPerSecond = 0

	if (state) {
		const now = Date.now()
		const deltaTime = now - state.lastTime
		if (deltaTime >= SPEED_UPDATE_INTERVAL) {
			const deltaBytes = receivedBytes - state.lastBytes
			bytesPerSecond = Math.round((deltaBytes / deltaTime) * 1000)
			state.lastBytes = receivedBytes
			state.lastTime = now
			state.bytesPerSecond = bytesPerSecond
		} else {
			bytesPerSecond = state.bytesPerSecond
		}
	}

	const downloads = activeDownloads$.get()
	const updated = downloads.map((d) => (d.id === id ? { ...d, receivedBytes, totalBytes, bytesPerSecond } : d))
	activeDownloads$.emit(updated)

	const progress = totalBytes > 0 ? Math.round((receivedBytes / totalBytes) * 100) : 0
	downloadEvents$.emit({ type: "progress", id, progress })
}

function removeActiveDownload(id: string): void {
	speedStates.delete(id)
	activeItems.delete(id)
	activeDownloads$.emit(activeDownloads$.get().filter((d) => d.id !== id))
}

function addToHistory(
	id: string,
	filename: string,
	savePath: string,
	url: string,
	partition: string,
	status: DownloadStatus,
	totalBytes: number,
	message?: string,
): void {
	const item: DownloadHistoryItem = { id, filename, savePath, url, partition, status, totalBytes, message, completedAt: Date.now() }
	downloadHistory$.emit([item, ...downloadHistory$.get()])
	downloadEvents$.emit({ type: status === "duplicate" ? "completed" : status, id })
}

export function getDownloadPath(id: string): string | null {
	const item = downloadHistory$.get().find((d) => d.id === id)
	return item?.savePath ?? null
}

export function resolveDownloadConfig(config: DownloadConfig): ResolvedDownloadConfig {
	return {
		directory: config.directory || null,
		autoOpenMaxSize: parseSize(config.autoOpenMaxSize),
		autoOpenMimeTypes: config.autoOpenMimeTypes || [],
		allowExecutablesDownload: config.allowExecutablesDownload ?? false,
		allowDuplicateDownloads: config.allowDuplicateDownloads ?? false,
	}
}

const configuredSessions = new WeakSet<Session>()

interface UniquePathResult {
	finalPath: string
	tempPath: string
	originalPath: string | null // null if no rename needed (file didn't exist)
}

function getTempPath(finalPath: string): string {
	const dir = dirname(finalPath)
	const filename = basename(finalPath)
	return join(dir, `.${filename}.birdtmp`)
}

function getDownloadPaths(basePath: string): UniquePathResult {
	if (!existsSync(basePath)) {
		const tempPath = getTempPath(basePath)
		return { finalPath: basePath, tempPath, originalPath: null }
	}

	const ext = extname(basePath)
	const name = basename(basePath, ext)
	const dir = dirname(basePath)

	let counter = 1
	let finalPath: string
	do {
		finalPath = join(dir, `${name} (${counter})${ext}`)
		counter++
	} while (existsSync(finalPath))

	const tempPath = getTempPath(finalPath)
	return { finalPath, tempPath, originalPath: basePath }
}

async function isDuplicateOf(newPath: string, originalPath: string): Promise<boolean> {
	// Quick size check first - if sizes differ, files are different
	const newSize = statSync(newPath).size
	const originalSize = statSync(originalPath).size
	if (newSize !== originalSize) return false

	// Same size, compare MD5
	const [newMd5, originalMd5] = await Promise.all([getFileMd5(newPath), getFileMd5(originalPath)])
	return newMd5 === originalMd5
}

export function setupDownloads(session: Session, config: ResolvedDownloadConfig) {
	if (configuredSessions.has(session)) return
	configuredSessions.add(session)
	const downloadDir = config.directory || app.getPath("downloads")

	session.on("will-download", (event, item) => {
		const url = item.getURL()
		const action = getDownloadAction(url, config$.get().routing)

		if (action === "external") {
			event.preventDefault()
			shell.openExternal(url)
			return
		}
		if (action === "ignore") {
			event.preventDefault()
			return
		}

		const downloadId = generateDownloadId()
		const filename = item.getFilename()
		const partition = config$.get().partition ?? ""
		const { finalPath, tempPath, originalPath } = getDownloadPaths(join(downloadDir, filename))
		item.setSavePath(tempPath)

		activeItems.set(downloadId, item)
		addActiveDownload(downloadId, filename, item.getTotalBytes())

		const notifId = addNotification("download", filename, "Téléchargement en cours...", {
			dismissable: true,
		})

		let earlyDetectionResult: Promise<FileDetectionResult> | null = null
		let wasBlockedAsExecutable = false

		item.on("updated", (_e, state) => {
			if (state === "progressing" && !item.isPaused()) {
				const received = item.getReceivedBytes()
				const total = item.getTotalBytes()

				updateActiveDownload(downloadId, received, total)

				if (!config.allowExecutablesDownload && !earlyDetectionResult && received >= MIN_BYTES_FOR_DETECTION) {
					earlyDetectionResult = detectFileTypeWithRetry(tempPath, { minSize: MIN_BYTES_FOR_DETECTION }).then((result) => {
						if (result.executable.isExecutable) {
							log.info(`Blocking executable: ${filename} (${result.executable.name})`)
							wasBlockedAsExecutable = true
							item.cancel()
							try {
								unlinkSync(tempPath)
							} catch {}
							updateNotification(notifId, {
								title: `${filename} - Bloqué`,
								message: `Fichier exécutable détecté (${result.executable.name})`,
								dismissable: true,
							})
							removeActiveDownload(downloadId)
							addToHistory(downloadId, filename, "", url, partition, "blocked", 0, `Exécutable (${result.executable.name})`)
						}
						return result
					})
				}

				const progress = total > 0 ? Math.round((received / total) * 100) : undefined
				updateNotification(notifId, { progress })
			}
		})

		item.once("done", (_e, state) => {
			removeActiveDownload(downloadId)

			if (state === "completed") {
				dismissNotification(notifId)
				handleCompletedDownload(
					downloadId,
					tempPath,
					finalPath,
					filename,
					url,
					partition,
					item.getTotalBytes(),
					config,
					earlyDetectionResult,
					originalPath,
				)
			} else if (state === "cancelled") {
				try {
					unlinkSync(tempPath)
				} catch {}
				if (!wasBlockedAsExecutable) {
					updateNotification(notifId, {
						title: `${filename} - Annulé`,
						dismissable: true,
					})
					addToHistory(downloadId, filename, "", url, partition, "cancelled", item.getTotalBytes())
				}
			} else {
				try {
					unlinkSync(tempPath)
				} catch {}
				updateNotification(notifId, {
					title: `${filename} - Échec`,
					message: "Interrompu",
					dismissable: true,
				})
				addToHistory(downloadId, filename, "", url, partition, "failed", item.getTotalBytes(), "Interrompu")
			}
		})
	})
}

async function handleCompletedDownload(
	downloadId: string,
	tempPath: string,
	finalPath: string,
	filename: string,
	url: string,
	partition: string,
	size: number,
	config: ResolvedDownloadConfig,
	earlyDetectionResult: Promise<FileDetectionResult> | null,
	originalPath: string | null,
) {
	const result = earlyDetectionResult ? await earlyDetectionResult : await detectFileType(tempPath)

	log.info(`Completed: ${filename} (mime: ${result.mime || "unknown"})`)
	checkOfficeMacroWarning(result.mime)

	if (result.executable.isExecutable) {
		try {
			unlinkSync(tempPath)
		} catch {}
		if (!config.allowExecutablesDownload) {
			addNotification("download", filename, `Fichier exécutable supprimé (${result.executable.name})`, {
				dismissable: true,
				autoDismiss: 5000,
			})
			addToHistory(downloadId, filename, "", url, partition, "blocked", size, `Exécutable (${result.executable.name})`)
		} else {
			try {
				renameSync(tempPath, finalPath)
			} catch {}
			addNotification("download", filename, `Téléchargement terminé (${result.executable.name} détecté)`, {
				dismissable: true,
				autoDismiss: 5000,
			})
			addToHistory(downloadId, filename, finalPath, url, partition, "completed", size, `Exécutable (${result.executable.name})`)
		}
		return
	}

	// Rename temp file to final path
	try {
		renameSync(tempPath, finalPath)
	} catch (err) {
		log.error(`Rename failed: ${filename}`, err)
		addToHistory(downloadId, filename, "", url, partition, "failed", size, "Erreur de renommage")
		return
	}

	// Check for duplicate files (only if file was renamed during save)
	if (!config.allowDuplicateDownloads && originalPath) {
		if (await isDuplicateOf(finalPath, originalPath)) {
			log.info(`Duplicate detected: ${filename}`)
			try {
				unlinkSync(finalPath)
			} catch {}

			// Remove previous entry for this file and add new one at top
			const history = downloadHistory$.get().filter((d) => d.savePath !== originalPath)
			const item: DownloadHistoryItem = {
				id: downloadId,
				filename: basename(originalPath),
				savePath: originalPath,
				url,
				partition,
				status: "duplicate",
				totalBytes: size,
				completedAt: Date.now(),
			}
			downloadHistory$.emit([item, ...history])
			downloadEvents$.emit({ type: "completed", id: downloadId })

			if (shouldAutoOpen(result, size, config)) {
				openFile(originalPath).then((error) => {
					if (error) log.error(`Open file failed: ${originalPath}`, error)
				})
			}
			return
		}
	}

	addToHistory(downloadId, filename, finalPath, url, partition, "completed", size)

	if (shouldAutoOpen(result, size, config)) {
		openFile(finalPath).then((error) => {
			if (error) log.error(`Open file failed: ${finalPath}`, error)
		})
	} else {
		addNotification("download", filename, "Téléchargement terminé", {
			dismissable: true,
			autoDismiss: 5000,
		})
	}
}

function shouldAutoOpen(result: FileDetectionResult, size: number, config: ResolvedDownloadConfig): boolean {
	// NEVER auto-open executables, even if MIME matches a wildcard pattern
	if (result.executable.isExecutable) return false

	if (result.mime && matchesMimePatterns(result.mime, config.autoOpenMimeTypes)) return true
	if (config.autoOpenMaxSize > 0 && size > 0 && size <= config.autoOpenMaxSize) return true
	return false
}

function matchesMimePatterns(mime: string, patterns: string[]): boolean {
	return patterns.some((pattern) => {
		if (pattern.endsWith("/*")) {
			return mime.startsWith(pattern.slice(0, -1))
		}
		return mime === pattern
	})
}

export function cancelDownload(id: string): boolean {
	const item = activeItems.get(id)
	if (item) {
		item.cancel()
		return true
	}
	return false
}

export function retryDownload(id: string): boolean {
	const historyItem = downloadHistory$.get().find((d) => d.id === id)
	if (!historyItem?.url) return false

	const sess = session.fromPartition(`persist:${historyItem.partition}`)
	sess.downloadURL(historyItem.url)

	// Remove from history since it will be re-added as a new download
	downloadHistory$.emit(downloadHistory$.get().filter((d) => d.id !== id))
	return true
}

export function removeFromHistory(id: string): boolean {
	const history = downloadHistory$.get()
	const exists = history.some((d) => d.id === id)
	if (exists) {
		downloadHistory$.emit(history.filter((d) => d.id !== id))
	}
	return exists
}
