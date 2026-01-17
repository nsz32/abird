import type { ActiveDownload, DownloadHistoryItem, DownloadStatus } from "@shared/types"
import { useBirdState, useTranslations } from "@ui/shared/hooks"
import { AlertCircle, CheckCircle, Download, FileText, FolderOpen, Loader2, ShieldX, XCircle } from "lucide-react"

const statusIcons: Record<DownloadStatus, typeof CheckCircle> = {
	completed: CheckCircle,
	cancelled: XCircle,
	failed: AlertCircle,
	blocked: ShieldX,
	duplicate: CheckCircle,
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
		</div>
	)
}

function HistoryDownloadItem({ item }: { item: DownloadHistoryItem }) {
	const { t } = useTranslations()
	const Icon = statusIcons[item.status]
	const canOpen = (item.status === "completed" || item.status === "duplicate") && item.savePath

	return (
		<div className={`download-item ${item.status}`}>
			<Download size={20} className="download-icon" />
			<div className="download-content">
				<div className="download-filename">{item.filename}</div>
				<div className="download-status">
					<Icon size={14} />
					<span>{item.message || t(`downloads.status.${item.status}`)}</span>
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
