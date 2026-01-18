import { ArrowDown } from "lucide-react"
import type { ActiveDownload } from "../../shared/types"

interface DownloadProgressIconProps {
	downloads: ActiveDownload[]
}

/**
 * Circular progress indicator for active downloads.
 * Displays overlapping arcs (one per download) that fill clockwise.
 * Uses 1/√n opacity formula for natural visual density.
 */
export function DownloadProgressIcon({ downloads }: DownloadProgressIconProps) {
	const radius = 10
	const circumference = 2 * Math.PI * radius
	const opacity = 1 / Math.sqrt(downloads.length)

	return (
		<div className="download-progress-wrapper">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
				{/* Track circle */}
				<circle cx="12" cy="12" r={radius} className="download-progress-track" />
				{/* Progress arcs */}
				{downloads.map((download) => {
					const progress = download.totalBytes > 0 ? download.receivedBytes / download.totalBytes : 0
					const offset = circumference * (1 - progress)
					return (
						<circle
							key={download.id}
							cx="12"
							cy="12"
							r={radius}
							className="download-progress-arc"
							style={{
								strokeDasharray: circumference,
								strokeDashoffset: offset,
								opacity,
							}}
							transform="rotate(-90 12 12)"
						/>
					)
				})}
			</svg>
			<ArrowDown className="download-progress-icon" />
		</div>
	)
}
