import type { TabInfo, TabOrigin } from "@shared/types"
import { app } from "electron"
import { activeTab$, config$, findBarVisible$, findState$, navState$, tabs$ } from "../core/states"
import { Tab } from "./Tab"

let unsubscribeNavState: (() => void) | null = null
let pendingActivationId: string | null = null

export function createTab(url?: string, origin: TabOrigin = "user", index?: number, parentId?: string): Tab {
	console.log(`[Tabs] createTab origin=${origin}`)
	const config = config$.get()
	const tab = new Tab(config.partition, config.routing, url || config.startUrl, config.userAgent, parentId ?? null, config.preload)

	insertTab(tab, index)

	// "user" and "background" tabs are always valid (user-initiated)
	// "blank" tabs must be checked for content before becoming valid
	if (origin === "blank") {
		pendingActivationId = tab.id
		tab.onValid(() => handleTabValid(tab))
		tab.scheduleValidation()
	} else {
		tab.isValid = true
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

	const hasValidTabs = tabs$.get().some((t) => t.isValid)
	if (!hasValidTabs) {
		app.quit()
	}
}

export function activateTab(id: string) {
	const tab = tabs$.get().find((t) => t.id === id)
	if (!tab || !tab.isValid) return

	pendingActivationId = null
	subscribeToNavState(tab)
	activeTab$.emit(tab)

	// Restore find state for this tab
	findBarVisible$.emit(tab.findBarVisible)
	findState$.emit(tab.findState)
}

export function getTabIndex(id: string): number {
	return tabs$.get().findIndex((t) => t.id === id)
}

export function getTabsList(): TabInfo[] {
	const allTabs = tabs$.get()
	const activeId = activeTab$.get()?.id
	const hasInvalidChild = (id: string) => allTabs.some((t) => !t.isValid && t.parentId === id)

	return allTabs
		.filter((t) => t.isValid)
		.map((t) => ({
			id: t.id,
			title: t.navState$.get().title,
			url: t.navState$.get().url || t.initialUrl,
			favicon: t.favicon,
			isActive: t.id === activeId,
			isLoading: t.navState$.get().isLoading || hasInvalidChild(t.id),
		}))
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

function handleTabValid(tab: Tab) {
	// Notify that tabs list changed (tab became valid)
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
