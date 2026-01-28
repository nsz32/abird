import type { TabInfo, TabOrigin } from "@shared/types"
import { app } from "electron"
import { ViewManager } from "../core/ViewManager"
import { activeContentId$, activeTabId$, config$, findBarVisible$, findState$, navState$, tabs$ } from "../core/states"
import { createLogger } from "../utils/logger"
import { Tab } from "./Tab"

const log = createLogger("Tabs")

let unsubscribeNavState: (() => void) | null = null
let pendingActivationId: string | null = null

export function createTab(url?: string, origin: TabOrigin = "user", index?: number, parentId?: string): Tab {
	log.debug(`Creating tab (origin=${origin})`)
	const config = config$.get()
	const tab = new Tab(config.partition, config.routing, url || config.startUrl, config.userAgent, parentId ?? null)

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
	const wasSelected = activeTabId$.get() === id
	const removedIndex = removeTab(id)
	if (removedIndex === -1) return

	if (wasSelected) {
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
	activeTabId$.emit(id)
	ViewManager.get().showContent(id)

	findBarVisible$.emit(tab.findBarVisible)
	findState$.emit(tab.findState)
}

export function getTabIndex(id: string): number {
	return tabs$.get().findIndex((t) => t.id === id)
}

export function moveTab(id: string, toIndex: number) {
	const list = tabs$.get()
	const fromIndex = list.findIndex((t) => t.id === id)
	if (fromIndex === -1 || fromIndex === toIndex) return

	const [tab] = list.splice(fromIndex, 1)
	list.splice(toIndex, 0, tab)
	tabs$.emit([...list])
}

export function isTabActive(id: string): boolean {
	return activeContentId$.get() === id
}

export function getActiveTab(): Tab | null {
	const activeId = activeContentId$.get()
	return tabs$.get().find((t) => t.id === activeId) ?? null
}

export function getTabsList(): TabInfo[] {
	const allTabs = tabs$.get()
	const selectedId = activeTabId$.get()
	const visibleId = activeContentId$.get()
	const hasInvalidChild = (id: string) => allTabs.some((t) => !t.isValid && t.parentId === id)

	return allTabs
		.filter((t) => t.isValid)
		.map((t) => ({
			id: t.id,
			title: t.navState$.get().title,
			url: t.navState$.get().url || t.initialUrl,
			favicon: t.favicon,
			isActive: t.id === selectedId,
			isCurrent: t.id === visibleId,
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
		ViewManager.get().hideAllContent()
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
