import type { ActiveDownload, DownloadHistoryItem } from "@shared/types"
import { AlertCircle, CheckCircle, Download, Loader2, ShieldX, XCircle } from "lucide-react"
import { useEffect, useRef, useState } from "react"

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
			<Loader2 size={16} className="download-icon spinning" />
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
			<Download size={16} className="download-icon" />
			<div className="download-content">
				<div className="download-filename">{item.filename}</div>
				<div className="download-status">
					<Icon size={12} />
					<span>{item.message || config.label}</span>
				</div>
			</div>
		</div>
	)
}

export function App() {
	const [active, setActive] = useState<ActiveDownload[]>([])
	const [history, setHistory] = useState<DownloadHistoryItem[]>([])
	const containerRef = useRef<HTMLDivElement>(null)

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

	useEffect(() => {
		const container = containerRef.current
		if (!container) {
			window.bird.downloads.panelResize(0, 0)
			return
		}

		const observer = new ResizeObserver((entries) => {
			const { width, height } = entries[0].contentRect
			window.bird.downloads.panelResize(Math.ceil(width), Math.ceil(height))
		})

		observer.observe(container)
		return () => observer.disconnect()
	})

	const isEmpty = active.length === 0 && history.length === 0

	return (
		<div ref={containerRef} className="download-panel">
			<div className="download-header">
				<Download size={16} />
				<span>Téléchargements</span>
			</div>
			{isEmpty ? (
				<div className="download-empty">Aucun téléchargement</div>
			) : (
				<div className="download-list">
					{active.map((item) => (
						<ActiveDownloadItem key={item.id} item={item} />
					))}
					{history.map((item) => (
						<HistoryDownloadItem key={item.id} item={item} />
					))}
				</div>
			)}
		</div>
	)
}
