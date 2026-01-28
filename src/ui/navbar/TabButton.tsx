import type { DraggableAttributes } from "@dnd-kit/core"
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities"
import type { TabInfo } from "@shared/types"
import { ChevronsRight, LoaderCircle, X } from "lucide-react"
import type { CSSProperties } from "react"
import { forwardRef } from "react"

interface TabButtonProps {
	tab: TabInfo
	showClose: boolean
	showExternalIndicator: boolean
	onActivate: () => void
	onClose: () => void
	style?: CSSProperties
	dragAttributes?: DraggableAttributes
	dragListeners?: SyntheticListenerMap
}

export const TabButton = forwardRef<HTMLButtonElement, TabButtonProps>(
	({ tab, showClose, showExternalIndicator, onActivate, onClose, style, dragAttributes, dragListeners }, ref) => {
		const classes = ["tab-button", tab.isActive && "active", tab.isCurrent && "current", showExternalIndicator && "external-wave"].filter(Boolean).join(" ")

		return (
			<button ref={ref} type="button" className={classes} onClick={onActivate} style={style} {...dragAttributes} {...dragListeners}>
				<TabFavicon tab={tab} />
				<span className="tab-title">{tab.title || tab.url}</span>
				<TabAction showExternalIndicator={showExternalIndicator} showClose={showClose} onClose={onClose} />
			</button>
		)
	},
)

function TabFavicon({ tab }: { tab: TabInfo }) {
	if (tab.isLoading) {
		return <LoaderCircle className="tab-favicon spinning" />
	}
	if (tab.favicon) {
		return <img className="tab-favicon" src={tab.favicon} alt="" />
	}
	return <span className="tab-favicon" />
}

interface TabActionProps {
	showExternalIndicator: boolean
	showClose: boolean
	onClose: () => void
}

function TabAction({ showExternalIndicator, showClose, onClose }: TabActionProps) {
	if (showExternalIndicator) {
		return <ChevronsRight className="tab-external-indicator" />
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
				<X strokeWidth={2.5} />
			</button>
		)
	}

	return <span className="tab-placeholder" />
}
