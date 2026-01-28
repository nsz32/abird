import type { ActiveDownload, DownloadHistoryItem, DownloadStatus } from "@shared/types"
import { useBirdState, useTranslations } from "@ui/shared/hooks"
import { getAppClass } from "@ui/shared/viewContext"
import { AlertCircle, CheckCircle, Download, ExternalLink, FolderOpen, Loader2, RefreshCw, ShieldX, Trash2, X, XCircle } from "lucide-react"

const rootClass = ["downloads", getAppClass()].filter(Boolean).join(" ")

const statusIcons: Record<DownloadStatus, typeof CheckCircle> = {
	completed: CheckCircle,
	cancelled: XCircle,
	failed: AlertCircle,
	blocked: ShieldX,
	duplicate: CheckCircle,
}

function formatSize(bytes: number): string {
	if (bytes <= 0) return ""
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatRemainingTime(remainingBytes: number, bytesPerSecond: number): string | null {
	if (bytesPerSecond <= 0 || remainingBytes <= 0) return null

	const seconds = Math.ceil(remainingBytes / bytesPerSecond)
	if (seconds < 60) return `${seconds}s`
	if (seconds < 3600) return `${Math.ceil(seconds / 60)} min`

	const hours = Math.floor(seconds / 3600)
	const minutes = Math.ceil((seconds % 3600) / 60)
	return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`
}

function ActiveDownloadItem({ item }: { item: ActiveDownload }) {
	const { t } = useTranslations()
	const progress = item.totalBytes > 0 ? Math.round((item.receivedBytes / item.totalBytes) * 100) : 0
	const hasProgress = item.totalBytes > 0
	const remainingTime = hasProgress ? formatRemainingTime(item.totalBytes - item.receivedBytes, item.bytesPerSecond) : null

	return (
		<div className="download-item active">
			<Loader2 size={32} className="download-icon spinning" />
			<div className="download-content">
				<div className="download-filename-row">
					<span className="download-filename">{item.filename}</span>
					{hasProgress && (
						<div className="download-progress-bar">
							<div className="download-progress-fill" style={{ width: `${progress}%` }} />
						</div>
					)}
				</div>
				<div className="download-status">
					<span>{hasProgress ? `${progress}%` : t("downloads.inProgress")}</span>
					{remainingTime && <span>· {remainingTime}</span>}
					<span className="download-size">
						{formatSize(item.receivedBytes)}
						{hasProgress && ` / ${formatSize(item.totalBytes)}`}
						{item.bytesPerSecond > 0 && ` · ${formatSize(item.bytesPerSecond)}/s`}
					</span>
				</div>
			</div>
			<div className="download-actions">
				<button type="button" className="action-btn" onClick={() => window.abird.downloads.cancel(item.id)} title={t("downloads.cancel")}>
					<X size={16} />
				</button>
			</div>
		</div>
	)
}

function HistoryDownloadItem({ item }: { item: DownloadHistoryItem }) {
	const { t } = useTranslations()
	const Icon = statusIcons[item.status]
	const canOpen = (item.status === "completed" || item.status === "duplicate") && item.savePath
	const canRetry = (item.status === "cancelled" || item.status === "failed") && item.url
	const canRemove = item.status === "cancelled"
	const sizeText = formatSize(item.totalBytes)

	return (
		<div className={`download-item ${item.status}`}>
			<Download size={32} className="download-icon" />
			<div className="download-content">
				<div className="download-filename-row">
					<span className="download-filename">{item.filename}</span>
				</div>
				<div className="download-status">
					<Icon size={14} />
					<span>
						{item.message || t(`downloads.status.${item.status}`)}
						{sizeText && ` · ${sizeText}`}
					</span>
				</div>
			</div>
			{canOpen && (
				<div className="download-actions">
					<button type="button" className="action-btn" onClick={() => window.abird.downloads.openFile(item.id)} title={t("downloads.openFile")}>
						<ExternalLink size={16} />
					</button>
					<button type="button" className="action-btn" onClick={() => window.abird.downloads.openFolder(item.id)} title={t("downloads.openFolder")}>
						<FolderOpen size={16} />
					</button>
				</div>
			)}
			{canRetry && (
				<div className="download-actions">
					<button type="button" className="action-btn" onClick={() => window.abird.downloads.retry(item.id)} title={t("downloads.retry")}>
						<RefreshCw size={16} />
					</button>
					{canRemove && (
						<button type="button" className="action-btn" onClick={() => window.abird.downloads.remove(item.id)} title={t("downloads.remove")}>
							<Trash2 size={16} />
						</button>
					)}
				</div>
			)}
		</div>
	)
}

export function App() {
	const { t, ready } = useTranslations()
	const active = useBirdState(window.abird.downloads.getActive, window.abird.downloads.onActiveChanged, [])
	const history = useBirdState(window.abird.downloads.getHistory, window.abird.downloads.onHistoryChanged, [])

	if (!ready) return null

	const isEmpty = active.length === 0 && history.length === 0

	return (
		<div className={rootClass}>
			<div className="downloads-container">
				<div className="downloads-header">
					<Download size={24} />
					<span>{t("downloads.title")}</span>
				</div>
				{isEmpty ? (
					<div className="downloads-empty">{t("downloads.empty")}</div>
				) : (
					<div className="downloads-list">
						{active.map((item) => (
							<ActiveDownloadItem key={item.id} item={item} />
						))}
						{history.map((item) => (
							<HistoryDownloadItem key={item.id} item={item} />
						))}
					</div>
				)}
			</div>
		</div>
	)
}
