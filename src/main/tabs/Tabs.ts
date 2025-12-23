import { activeTab$, navState$, partition$, routing$, startUrl$, tabs$, userAgent$ } from "../states"
import { Tab } from "./Tab"

class TabManager {
	private unsubscribeNavState: (() => void) | null = null

	create(url?: string, activate = true, index?: number): Tab {
		const tab = new Tab(partition$.get(), routing$.get(), url || startUrl$.get(), userAgent$.get())
		const currentTabs = tabs$.get()
		const insertAt = index ?? currentTabs.length
		const newTabs = [...currentTabs.slice(0, insertAt), tab, ...currentTabs.slice(insertAt)]
		tabs$.emit(newTabs)
		if (activate) {
			this.activate(tab.id)
		}
		return tab
	}

	close(id: string) {
		const list = tabs$.get()
		const index = list.findIndex((t) => t.id === id)
		if (index === -1) return

		const newList = list.filter((t) => t.id !== id)
		tabs$.emit(newList)

		if (activeTab$.get()?.id === id) {
			if (newList.length > 0) {
				const newIndex = index > 0 ? index - 1 : 0
				this.activate(newList[newIndex].id)
			} else {
				activeTab$.emit(null)
			}
		}
	}

	getIndex(id: string): number {
		return tabs$.get().findIndex((t) => t.id === id)
	}

	activate(id: string) {
		const tab = tabs$.get().find((t) => t.id === id)
		if (!tab) return

		if (this.unsubscribeNavState) {
			this.unsubscribeNavState()
		}

		this.unsubscribeNavState = tab.siteView.navState$.subscribe((state) => navState$.emit(state))
		activeTab$.emit(tab)
	}
}

export const tabManager = new TabManager()

// Exports pour compatibilité
export const createTab = tabManager.create.bind(tabManager)
export const closeTab = tabManager.close.bind(tabManager)
export const getTabIndex = tabManager.getIndex.bind(tabManager)
export const activateTab = tabManager.activate.bind(tabManager)
