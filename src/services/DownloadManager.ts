import { closeSync, existsSync, openSync, readSync, statSync, unlinkSync } from "node:fs"
import { basename, dirname, extname, join } from "node:path"
import type { ActiveDownload, DownloadConfig, DownloadHistoryItem, DownloadStatus, ResolvedDownloadConfig } from "@shared/types"
import type { Session } from "electron"
import { app } from "electron"
import { fileTypeFromFile } from "file-type"
import { activeDownloads$, downloadEvents$, downloadHistory$ } from "../main/core/states"
import { type ExecutableCheckResult, MIN_BYTES_FOR_MAGIC, checkOfficeMacroWarning, isExecutableByMagic } from "../main/utils/executableDetection"
import { parseSize } from "../main/utils/parseSize"
import { getFileMd5, openFile } from "../main/utils/platform"
import { addNotification, dismissNotification, updateNotification } from "./notify"

const MIN_BYTES_FOR_DETECTION = 4096

let nextDownloadId = 1

function generateDownloadId(): string {
	return `dl-${nextDownloadId++}`
}

function addActiveDownload(id: string, filename: string, totalBytes: number): void {
	const download: ActiveDownload = {
		id,
		filename,
		receivedBytes: 0,
		totalBytes,
		startedAt: Date.now(),
	}
	activeDownloads$.emit([download, ...activeDownloads$.get()])
	downloadEvents$.emit({ type: "started", id })
}

function updateActiveDownload(id: string, receivedBytes: number, totalBytes: number): void {
	const downloads = activeDownloads$.get()
	const updated = downloads.map((d) => (d.id === id ? { ...d, receivedBytes, totalBytes } : d))
	activeDownloads$.emit(updated)

	const progress = totalBytes > 0 ? Math.round((receivedBytes / totalBytes) * 100) : 0
	downloadEvents$.emit({ type: "progress", id, progress })
}

function removeActiveDownload(id: string): void {
	activeDownloads$.emit(activeDownloads$.get().filter((d) => d.id !== id))
}

function addToHistory(id: string, filename: string, status: DownloadStatus, message?: string): void {
	const item: DownloadHistoryItem = { id, filename, status, message, completedAt: Date.now() }
	downloadHistory$.emit([item, ...downloadHistory$.get()])
	downloadEvents$.emit({ type: status, id })
}

export function resolveDownloadConfig(config: DownloadConfig): ResolvedDownloadConfig {
	return {
		directory: config.directory || null,
		autoOpenMaxSize: parseSize(config.autoOpenMaxSize),
		autoOpenMimeTypes: config.autoOpenMimeTypes || [],
		allowExecutablesDownload: config.allowExecutablesDownload ?? false,
		preventDuplicateDownloads: config.preventDuplicateDownloads ?? false,
	}
}

const configuredSessions = new WeakSet<Session>()

interface UniquePathResult {
	path: string
	originalPath: string | null // null if no rename needed
}

function getDownloadUniquePath(basePath: string): UniquePathResult {
	if (!existsSync(basePath)) return { path: basePath, originalPath: null }

	const ext = extname(basePath)
	const name = basename(basePath, ext)
	const dir = dirname(basePath)

	let counter = 1
	let newPath: string
	do {
		newPath = join(dir, `${name} (${counter})${ext}`)
		counter++
	} while (existsSync(newPath))

	return { path: newPath, originalPath: basePath }
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

	session.on("will-download", (_event, item) => {
		const downloadId = generateDownloadId()
		const filename = item.getFilename()
		const { path: savePath, originalPath } = getDownloadUniquePath(join(downloadDir, filename))
		item.setSavePath(savePath)

		// Add to active downloads
		addActiveDownload(downloadId, filename, item.getTotalBytes())

		const notifId = addNotification("download", filename, "Téléchargement en cours...", {
			dismissable: false,
		})

		// Shared result: null = not checked yet
		let earlyDetectionResult: Promise<DetectionResult> | null = null
		let wasBlockedAsExecutable = false

		item.on("updated", (_e, state) => {
			if (state === "progressing" && !item.isPaused()) {
				const received = item.getReceivedBytes()
				const total = item.getTotalBytes()

				// Update active download progress
				updateActiveDownload(downloadId, received, total)

				// Early executable detection with retry
				if (!config.allowExecutablesDownload && !earlyDetectionResult && received >= MIN_BYTES_FOR_DETECTION) {
					earlyDetectionResult = detectWithRetry(savePath).then((result) => {
						if (result.executable.isExecutable) {
							console.log(`[Download] blocking executable: ${result.executable.name}`)
							wasBlockedAsExecutable = true
							item.cancel()
							console.log(`[Download] aborted: ${filename}`)
							try {
								unlinkSync(savePath)
							} catch {}
							updateNotification(notifId, {
								title: `${filename} - Bloqué`,
								message: `Fichier exécutable détecté (${result.executable.name})`,
								dismissable: true,
							})
							removeActiveDownload(downloadId)
							addToHistory(downloadId, filename, "blocked", `Exécutable (${result.executable.name})`)
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
				handleCompletedDownload(downloadId, savePath, filename, item.getTotalBytes(), config, earlyDetectionResult, originalPath)
			} else if (state === "cancelled") {
				// Notification already handled if blocked as executable
				if (!wasBlockedAsExecutable) {
					updateNotification(notifId, {
						title: `${filename} - Annulé`,
						dismissable: true,
					})
					addToHistory(downloadId, filename, "cancelled")
				}
			} else {
				updateNotification(notifId, {
					title: `${filename} - Échec`,
					message: "Interrompu",
					dismissable: true,
				})
				addToHistory(downloadId, filename, "failed", "Interrompu")
			}
		})
	})
}

const RETRY_DELAY_MS = 10
const MAX_RETRIES = 10

interface DetectionResult {
	mime?: string
	executable: ExecutableCheckResult
}

function readMagicBytes(filePath: string): Buffer | null {
	try {
		const fd = openSync(filePath, "r")
		const buffer = Buffer.alloc(MIN_BYTES_FOR_MAGIC)
		readSync(fd, buffer, 0, MIN_BYTES_FOR_MAGIC, 0)
		closeSync(fd)
		return buffer
	} catch {
		return null
	}
}

async function detectWithRetry(savePath: string): Promise<DetectionResult> {
	for (let i = 0; i < MAX_RETRIES; i++) {
		try {
			if (existsSync(savePath) && statSync(savePath).size >= MIN_BYTES_FOR_DETECTION) {
				// Check magic bytes for executable detection
				const magicBuffer = readMagicBytes(savePath)
				const executable = magicBuffer ? isExecutableByMagic(magicBuffer) : { isExecutable: false }

				// Get MIME type for other uses (auto-open, future icons)
				const detected = await fileTypeFromFile(savePath)

				return { mime: detected?.mime, executable }
			}
		} catch (err) {
			console.error("[Download] detectWithRetry error:", err)
		}
		await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
	}
	return { executable: { isExecutable: false } } // Will be detected on completion
}

async function detectFinal(savePath: string): Promise<DetectionResult> {
	const magicBuffer = readMagicBytes(savePath)
	const executable = magicBuffer ? isExecutableByMagic(magicBuffer) : { isExecutable: false }
	const detected = await fileTypeFromFile(savePath)
	return { mime: detected?.mime, executable }
}

async function handleCompletedDownload(
	downloadId: string,
	savePath: string,
	filename: string,
	size: number,
	config: ResolvedDownloadConfig,
	earlyDetectionResult: Promise<DetectionResult> | null,
	originalPath: string | null,
) {
	// Reuse early detection result if available, otherwise detect now
	const result = earlyDetectionResult ? await earlyDetectionResult : await detectFinal(savePath)

	console.log(`[Download] completed: ${filename}, mime: ${result.mime}, executable: ${result.executable.isExecutable}`)
	checkOfficeMacroWarning(result.mime)

	if (result.executable.isExecutable) {
		if (!config.allowExecutablesDownload) {
			try {
				unlinkSync(savePath)
			} catch {}
			addNotification("download", filename, `Fichier exécutable supprimé (${result.executable.name})`, {
				dismissable: true,
				autoDismiss: 5000,
			})
			addToHistory(downloadId, filename, "blocked", `Exécutable (${result.executable.name})`)
		} else {
			addNotification("download", filename, `Téléchargement terminé (${result.executable.name} détecté)`, {
				dismissable: true,
				autoDismiss: 5000,
			})
			addToHistory(downloadId, filename, "completed", `Exécutable (${result.executable.name})`)
		}
		return
	}

	// Check for duplicate files (only if file was renamed during save)
	if (config.preventDuplicateDownloads && originalPath) {
		if (await isDuplicateOf(savePath, originalPath)) {
			console.log(`[Download] duplicate detected: ${savePath} = ${originalPath}`)
			try {
				unlinkSync(savePath)
			} catch {}
			if (shouldAutoOpen(result, size, config)) {
				openFile(originalPath).then((error) => {
					if (error) console.error(`[Download] openFile failed: ${error}`)
					else console.log(`[Download] opened original: ${originalPath}`)
				})
			}
			return
		}
	}

	addToHistory(downloadId, filename, "completed")

	if (shouldAutoOpen(result, size, config)) {
		openFile(savePath).then((error) => {
			if (error) console.error(`[Download] openFile failed: ${error}`)
			else console.log(`[Download] opened: ${savePath}`)
		})
	} else {
		addNotification("download", filename, "Téléchargement terminé", {
			dismissable: true,
			autoDismiss: 5000,
		})
	}
}

function shouldAutoOpen(result: DetectionResult, size: number, config: ResolvedDownloadConfig): boolean {
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
