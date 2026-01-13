import { extname, join } from "node:path"
import type { DownloadConfig, ResolvedDownloadConfig } from "@shared/types"
import type { DownloadItem, Session } from "electron"
import { app } from "electron"
import { addNotification, dismissNotification, updateNotification } from "../notifications/notify"
import { parseSize } from "../utils/parseSize"
import { openFile } from "../utils/platform"

export function resolveDownloadConfig(config: DownloadConfig): ResolvedDownloadConfig {
	return {
		directory: config.directory || null,
		autoOpenMaxSize: parseSize(config.autoOpenMaxSize),
		autoOpenExtensions: config.autoOpenExtensions || [],
	}
}

const configuredSessions = new WeakSet<Session>()

export function setupDownloads(session: Session, config: ResolvedDownloadConfig) {
	if (configuredSessions.has(session)) return
	configuredSessions.add(session)
	const downloadDir = config.directory || app.getPath("downloads")

	session.on("will-download", (_event, item) => {
		const filename = item.getFilename()
		const savePath = join(downloadDir, filename)
		item.setSavePath(savePath)

		const notifId = addNotification("download", filename, "Téléchargement en cours...", {
			dismissable: false,
		})

		item.on("updated", (_e, state) => {
			if (state === "progressing" && !item.isPaused()) {
				const received = item.getReceivedBytes()
				const total = item.getTotalBytes()
				const progress = total > 0 ? Math.round((received / total) * 100) : undefined
				updateNotification(notifId, { progress })
			}
		})

		item.once("done", (_e, state) => {
			if (state === "completed") {
				dismissNotification(notifId)
				if (shouldAutoOpen(item, config)) {
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
			} else {
				updateNotification(notifId, {
					title: `${filename} - Échec`,
					message: state === "cancelled" ? "Annulé" : "Interrompu",
					dismissable: true,
				})
			}
		})
	})
}

function shouldAutoOpen(item: DownloadItem, config: ResolvedDownloadConfig): boolean {
	const ext = extname(item.getFilename()).toLowerCase()
	const size = item.getTotalBytes()

	console.log(`[Download] shouldAutoOpen: ext=${ext}, size=${size}, config=`, config)

	if (config.autoOpenExtensions.includes(ext)) return true
	if (config.autoOpenMaxSize > 0 && size > 0 && size <= config.autoOpenMaxSize) return true

	return false
}
