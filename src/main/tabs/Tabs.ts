import { activeTab$, navState$, partition$, routing$, startUrl$, tabs$, userAgent$ } from "../states"
import { Tab } from "./Tab"

class TabManager {
	private unsubscribeNavState: (() => void) | null = null
	private pendingActivationId: string | null = null

	create(url?: string, activate = true, index?: number, parentId?: string): Tab {
		const tab = new Tab(
			partition$.get(),
			routing$.get(),
			url || startUrl$.get(),
			userAgent$.get(),
			parentId ?? null,
		)

		this.insertTab(tab, index)

		if (activate) {
			this.pendingActivationId = tab.id
		}

		tab.onReady(() => this.handleTabReady(tab))

		return tab
	}

	close(id: string) {
		const removedIndex = this.removeTab(id)
		if (removedIndex === -1) return

		if (activeTab$.get()?.id === id) {
			this.selectNextTab(removedIndex)
		}
	}

	activate(id: string) {
		const tab = tabs$.get().find((t) => t.id === id)
		if (!tab) return

		this.pendingActivationId = null
		this.subscribeToNavState(tab)
		activeTab$.emit(tab)
	}

	getIndex(id: string): number {
		return tabs$.get().findIndex((t) => t.id === id)
	}

	private insertTab(tab: Tab, index?: number) {
		const current = tabs$.get()
		const insertAt = index ?? current.length
		const updated = [...current.slice(0, insertAt), tab, ...current.slice(insertAt)]
		tabs$.emit(updated)
	}

	private removeTab(id: string): number {
		const list = tabs$.get()
		const index = list.findIndex((t) => t.id === id)
		if (index === -1) return -1

		tabs$.emit(list.filter((t) => t.id !== id))
		return index
	}

	private selectNextTab(removedIndex: number) {
		const list = tabs$.get()
		if (list.length === 0) {
			activeTab$.emit(null)
			return
		}

		const nextIndex = removedIndex > 0 ? removedIndex - 1 : 0
		this.activate(list[nextIndex].id)
	}

	private handleTabReady(tab: Tab) {
		if (this.pendingActivationId === tab.id) {
			this.activate(tab.id)
		} else {
			activeTab$.emit(activeTab$.get())
		}
	}

	private subscribeToNavState(tab: Tab) {
		this.unsubscribeNavState?.()
		this.unsubscribeNavState = tab.navState$.subscribe((state) => navState$.emit(state))
	}
}

export const tabManager = new TabManager()

export const createTab = tabManager.create.bind(tabManager)
export const closeTab = tabManager.close.bind(tabManager)
export const getTabIndex = tabManager.getIndex.bind(tabManager)
export const activateTab = tabManager.activate.bind(tabManager)
