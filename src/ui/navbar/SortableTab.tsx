import type { AnimateLayoutChanges } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { TabInfo } from "@shared/types"
import { TabButton } from "./TabButton"

// Disable all layout animations (drag reordering uses transform, not layout)
const animateLayoutChanges: AnimateLayoutChanges = () => false

interface SortableTabProps {
	tab: TabInfo
	showClose: boolean
	showExternalIndicator: boolean
}

export function SortableTab({ tab, showClose, showExternalIndicator }: SortableTabProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: tab.id,
		animateLayoutChanges,
	})

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: 1,
		zIndex: isDragging ? 1 : 0,
	}

	return (
		<TabButton
			ref={setNodeRef}
			tab={tab}
			showClose={showClose}
			showExternalIndicator={showExternalIndicator}
			onActivate={() => window.abird.tabs.activate(tab.id)}
			onClose={() => window.abird.tabs.close(tab.id)}
			style={style}
			dragAttributes={attributes}
			dragListeners={listeners}
		/>
	)
}
