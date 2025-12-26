import type { Notification } from "@shared/types"
import { AlertCircle, Download, ExternalLink, Info, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const iconMap = {
	info: Info,
	"external-link": ExternalLink,
	error: AlertCircle,
	download: Download,
}

function NotificationItem({ notification, onDismiss }: { notification: Notification; onDismiss: () => void }) {
	const Icon = iconMap[notification.type]

	return (
		<div className={`notification notification-${notification.type}`}>
			<Icon size={18} className="notification-icon" />
			<div className="notification-content">
				<div className="notification-title">{notification.title}</div>
				{notification.message && <div className="notification-message">{notification.message}</div>}
				{notification.progress !== undefined && (
					<div className="notification-progress">
						<div className="notification-progress-bar" style={{ width: `${notification.progress}%` }} />
					</div>
				)}
			</div>
			{notification.dismissable && (
				<button type="button" className="notification-dismiss" onClick={onDismiss}>
					<X size={16} />
				</button>
			)}
		</div>
	)
}

export function App() {
	const [notifications, setNotifications] = useState<Notification[]>([])
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		window.bird.notifications.getList().then(setNotifications)
		const unsubscribe = window.bird.notifications.onListChanged(setNotifications)
		return unsubscribe
	}, [])

	useEffect(() => {
		const container = containerRef.current
		if (!container) {
			window.bird.notifications.resize(0, 0)
			return
		}

		const observer = new ResizeObserver((entries) => {
			const { width, height } = entries[0].contentRect
			window.bird.notifications.resize(Math.ceil(width), Math.ceil(height))
		})

		observer.observe(container)
		return () => observer.disconnect()
	})

	if (notifications.length === 0) return null

	return (
		<div ref={containerRef} className="notification-center">
			{notifications.map((notif) => (
				<NotificationItem key={notif.id} notification={notif} onDismiss={() => window.bird.notifications.dismiss(notif.id)} />
			))}
		</div>
	)
}
