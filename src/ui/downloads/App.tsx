import type { ActiveDownload, DownloadHistoryItem, DownloadStatus } from "@shared/types"
import { useBirdState, useTranslations } from "@ui/shared/hooks"
import { AlertCircle, CheckCircle, Download, Loader2, ShieldX, XCircle } from "lucide-react"

const statusIcons: Record<DownloadStatus, typeof CheckCircle> = {
	completed: CheckCircle,
	cancelled: XCircle,
	failed: AlertCircle,
	blocked: ShieldX,
}

function ActiveDownloadItem({ item, t }: { item: ActiveDownload; t: ReturnType<typeof useTranslations>["t"] }) {
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
					<span>{hasProgress ? `${progress}%` : t("downloads.inProgress")}</span>
				</div>
			</div>
		</div>
	)
}

function HistoryDownloadItem({ item, t }: { item: DownloadHistoryItem; t: ReturnType<typeof useTranslations>["t"] }) {
	const Icon = statusIcons[item.status]

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
							<ActiveDownloadItem key={item.id} item={item} t={t} />
						))}
						{history.map((item) => (
							<HistoryDownloadItem key={item.id} item={item} t={t} />
						))}
					</div>
				)}
			</div>
		</div>
	)
}
