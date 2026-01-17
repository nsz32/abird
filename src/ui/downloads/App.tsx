import type { ActiveDownload, DownloadHistoryItem, DownloadStatus } from "@shared/types"
import { useBirdState, useTranslations } from "@ui/shared/hooks"
import { AlertCircle, CheckCircle, Download, FileText, FolderOpen, Loader2, RefreshCw, ShieldX, X, XCircle } from "lucide-react"

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

function formatSpeed(bytesPerSecond: number): string {
	if (bytesPerSecond < 1024) return `${bytesPerSecond} B/s`
	if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
	return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`
}

function ActiveDownloadItem({ item }: { item: ActiveDownload }) {
	const { t } = useTranslations()
	const progress = item.totalBytes > 0 ? Math.round((item.receivedBytes / item.totalBytes) * 100) : 0
	const hasProgress = item.totalBytes > 0

	return (
		<div className="download-item active">
			<Loader2 size={20} className="download-icon spinning" />
			<div className="download-content">
				<div className="download-filename">{item.filename}</div>
				{hasProgress && (
					<div className="download-progress-bar">
						<div className="download-progress-fill" style={{ width: `${progress}%` }} />
					</div>
				)}
				<div className="download-status">
					<span>
						{hasProgress ? `${progress}%` : t("downloads.inProgress")}
						{item.bytesPerSecond > 0 && ` · ${formatSpeed(item.bytesPerSecond)}`}
					</span>
				</div>
			</div>
			<div className="download-actions">
				<button type="button" className="action-btn" onClick={() => window.bird.downloads.cancel(item.id)} title={t("downloads.cancel")}>
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
	const sizeText = formatSize(item.totalBytes)

	return (
		<div className={`download-item ${item.status}`}>
			<Download size={20} className="download-icon" />
			<div className="download-content">
				<div className="download-filename">{item.filename}</div>
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
					<button type="button" className="action-btn" onClick={() => window.bird.downloads.openFile(item.id)} title={t("downloads.openFile")}>
						<FileText size={16} />
					</button>
					<button type="button" className="action-btn" onClick={() => window.bird.downloads.openFolder(item.id)} title={t("downloads.openFolder")}>
						<FolderOpen size={16} />
					</button>
				</div>
			)}
			{canRetry && (
				<div className="download-actions">
					<button type="button" className="action-btn" onClick={() => window.bird.downloads.retry(item.id)} title={t("downloads.retry")}>
						<RefreshCw size={16} />
					</button>
				</div>
			)}
		</div>
	)
}

export function App() {
	const { t, ready } = useTranslations()
	const active = useBirdState(window.bird.downloads.getActive, window.bird.downloads.onActiveChanged, [])
	const history = useBirdState(window.bird.downloads.getHistory, window.bird.downloads.onHistoryChanged, [])

	if (!ready) return null

	const isEmpty = active.length === 0 && history.length === 0

	return (
		<div className="downloads-page">
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
