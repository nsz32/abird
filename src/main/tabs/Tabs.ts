import type { TabOrigin } from "@shared/types"
import { activeTab$, navState$, partition$, routing$, startUrl$, tabs$, userAgent$ } from "../states"
import { Tab } from "./Tab"

let unsubscribeNavState: (() => void) | null = null
let pendingActivationId: string | null = null

export function createTab(url?: string, origin: TabOrigin = "user", index?: number, parentId?: string): Tab {
	const tab = new Tab(
		partition$.get(),
		routing$.get(),
		url || startUrl$.get(),
		userAgent$.get(),
		parentId ?? null,
	)

	insertTab(tab, index)

	// "user" and "background" tabs are always proper (user-initiated)
	// "blank" tabs must be checked for content before becoming proper
	if (origin === "blank") {
		pendingActivationId = tab.id
		tab.onProper(() => handleTabProper(tab))
	} else {
		tab.proper = true
		if (origin === "user") {
			activateTab(tab.id)
		} else {
			notifyTabsChanged()
		}
	}

	return tab
}

export function closeTab(id: string) {
	const removedIndex = removeTab(id)
	if (removedIndex === -1) return

	if (activeTab$.get()?.id === id) {
		selectNextTab(removedIndex)
	}
}

export function activateTab(id: string) {
	const tab = tabs$.get().find((t) => t.id === id)
	if (!tab || !tab.proper) return

	pendingActivationId = null
	subscribeToNavState(tab)
	activeTab$.emit(tab)
}

export function getTabIndex(id: string): number {
	return tabs$.get().findIndex((t) => t.id === id)
}

function insertTab(tab: Tab, index?: number) {
	const current = tabs$.get()
	const insertAt = index ?? current.length
	const updated = [...current.slice(0, insertAt), tab, ...current.slice(insertAt)]
	tabs$.emit(updated)
}

function removeTab(id: string): number {
	const list = tabs$.get()
	const index = list.findIndex((t) => t.id === id)
	if (index === -1) return -1

	list[index].destroy()
	tabs$.emit(list.filter((t) => t.id !== id))
	return index
}

function selectNextTab(removedIndex: number) {
	const list = tabs$.get()
	if (list.length === 0) {
		activeTab$.emit(null)
		return
	}

	const nextIndex = removedIndex > 0 ? removedIndex - 1 : 0
	activateTab(list[nextIndex].id)
}

function handleTabProper(tab: Tab) {
	// Notify that tabs list changed (tab became proper)
	notifyTabsChanged()

	if (pendingActivationId === tab.id) {
		activateTab(tab.id)
	}
}

function notifyTabsChanged() {
	tabs$.emit([...tabs$.get()])
}

function subscribeToNavState(tab: Tab) {
	unsubscribeNavState?.()
	unsubscribeNavState = tab.navState$.subscribe((state) => navState$.emit(state))
}
