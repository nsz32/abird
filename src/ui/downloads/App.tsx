import type { ActiveDownload, DownloadHistoryItem } from "@shared/types"
import { AlertCircle, CheckCircle, Download, Loader2, ShieldX, XCircle } from "lucide-react"
import { useEffect, useState } from "react"

const statusConfig = {
	completed: { icon: CheckCircle, label: "Terminé", className: "completed" },
	cancelled: { icon: XCircle, label: "Annulé", className: "cancelled" },
	failed: { icon: AlertCircle, label: "Échec", className: "failed" },
	blocked: { icon: ShieldX, label: "Bloqué", className: "blocked" },
}

function ActiveDownloadItem({ item }: { item: ActiveDownload }) {
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
					<span>{hasProgress ? `${progress}%` : "En cours..."}</span>
				</div>
			</div>
		</div>
	)
}

function HistoryDownloadItem({ item }: { item: DownloadHistoryItem }) {
	const config = statusConfig[item.status]
	const Icon = config.icon

	return (
		<div className={`download-item ${config.className}`}>
			<Download size={20} className="download-icon" />
			<div className="download-content">
				<div className="download-filename">{item.filename}</div>
				<div className="download-status">
					<Icon size={14} />
					<span>{item.message || config.label}</span>
				</div>
			</div>
		</div>
	)
}

export function App() {
	const [active, setActive] = useState<ActiveDownload[]>([])
	const [history, setHistory] = useState<DownloadHistoryItem[]>([])

	useEffect(() => {
		window.bird.downloads.getActive().then(setActive)
		window.bird.downloads.getHistory().then(setHistory)
		const unsubActive = window.bird.downloads.onActiveChanged(setActive)
		const unsubHistory = window.bird.downloads.onHistoryChanged(setHistory)
		return () => {
			unsubActive()
			unsubHistory()
		}
	}, [])

	const isEmpty = active.length === 0 && history.length === 0

	return (
		<div className="downloads-page">
			<div className="downloads-container">
				<div className="downloads-header">
					<Download size={24} />
					<span>Téléchargements</span>
				</div>
				{isEmpty ? (
					<div className="downloads-empty">Aucun téléchargement</div>
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
