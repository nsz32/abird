import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import type { TabInfo } from "@shared/types"
import { useCallback, useMemo, useRef, useState } from "react"

export function useSortableTabs(serverTabs: TabInfo[]) {
	const [activeId, setActiveId] = useState<string | null>(null)
	const [optimisticOrder, setOptimisticOrder] = useState<string[] | null>(null)
	const lastServerOrderRef = useRef<string>("")

	// Detect server changes and clear optimistic state
	const serverOrder = serverTabs.map((t) => t.id).join(",")
	if (serverOrder !== lastServerOrderRef.current) {
		lastServerOrderRef.current = serverOrder
		if (optimisticOrder !== null) {
			setOptimisticOrder(null)
		}
	}

	// Apply optimistic order to tabs
	const tabs = useMemo(() => {
		if (!optimisticOrder) return serverTabs
		const tabMap = new Map(serverTabs.map((t) => [t.id, t]))
		return optimisticOrder.map((id) => tabMap.get(id)).filter((t): t is TabInfo => t !== undefined)
	}, [serverTabs, optimisticOrder])

	const tabIds = useMemo(() => tabs.map((t) => t.id), [tabs])

	const handleDragStart = useCallback((event: DragStartEvent) => {
		setActiveId(String(event.active.id))
	}, [])

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event
			setActiveId(null)

			if (!over || active.id === over.id) return

			const activeIdStr = String(active.id)
			const overIdStr = String(over.id)
			const oldIndex = tabIds.indexOf(activeIdStr)
			const newIndex = tabIds.indexOf(overIdStr)

			if (oldIndex !== -1 && newIndex !== -1) {
				setOptimisticOrder(arrayMove(tabIds, oldIndex, newIndex))
				window.abird.tabs.move(activeIdStr, newIndex)
			}
		},
		[tabIds],
	)

	const handleDragCancel = useCallback(() => {
		setActiveId(null)
	}, [])

	return {
		tabs,
		tabIds,
		activeId,
		handleDragStart,
		handleDragEnd,
		handleDragCancel,
	}
}
