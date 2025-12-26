import type { TabInfo } from "@shared/types"
import { ChevronsRight, LoaderCircle, X } from "lucide-react"

interface TabButtonProps {
	tab: TabInfo
	showClose: boolean
	showExternalIndicator: boolean
	onActivate: () => void
	onClose: () => void
}

export function TabButton({ tab, showClose, showExternalIndicator, onActivate, onClose }: TabButtonProps) {
	const classes = [
		"tab-button",
		tab.isActive && "active",
		showExternalIndicator && "external-wave",
	].filter(Boolean).join(" ")

	return (
		<button type="button" className={classes} onClick={onActivate}>
			<TabFavicon tab={tab} />
			<span className="tab-title">{tab.title || tab.url}</span>
			<TabAction
				showExternalIndicator={showExternalIndicator}
				showClose={showClose}
				onClose={onClose}
			/>
		</button>
	)
}

function TabFavicon({ tab }: { tab: TabInfo }) {
	if (tab.isLoading) {
		return <LoaderCircle size={16} className="tab-favicon spinning" />
	}
	if (tab.favicon) {
		return <img className="tab-favicon" src={tab.favicon} alt="" />
	}
	return null
}

interface TabActionProps {
	showExternalIndicator: boolean
	showClose: boolean
	onClose: () => void
}

function TabAction({ showExternalIndicator, showClose, onClose }: TabActionProps) {
	if (showExternalIndicator) {
		return <ChevronsRight size={16} className="tab-external-indicator" />
	}

	if (showClose) {
		return (
			<button
				type="button"
				className="tab-close"
				onClick={(e) => {
					e.stopPropagation()
					onClose()
				}}
			>
				<X size={16} strokeWidth={2.5} />
			</button>
		)
	}

	return <span className="tab-placeholder" />
}
