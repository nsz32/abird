import { activeTab$, navState$, partition$, routing$, startUrl$, tabs$, userAgent$ } from "../states"
import { Tab } from "./Tab"

let unsubscribeNavState: (() => void) | null = null

export function createTab(url?: string, activate = true): Tab {
	const tab = new Tab(partition$.get(), routing$.get(), url || startUrl$.get(), userAgent$.get(), activate)
	tabs$.emit([...tabs$.get(), tab])
	return tab
}

export function closeTab(id: string) {
	const list = tabs$.get()
	const index = list.findIndex((t) => t.id === id)
	if (index === -1) return

	const newList = list.filter((t) => t.id !== id)
	tabs$.emit(newList)

	if (activeTab$.get()?.id === id) {
		if (newList.length > 0) {
			activateTab(newList[Math.min(index, newList.length - 1)].id)
		} else {
			activeTab$.emit(null)
		}
	}
}

export function activateTab(id: string) {
	const tab = tabs$.get().find((t) => t.id === id)
	if (!tab) return

	// Désabonner l'ancien
	if (unsubscribeNavState) unsubscribeNavState()

	// Abonner le nouveau
	unsubscribeNavState = tab.siteView.navState$.subscribe((state) => navState$.emit(state))

	activeTab$.emit(tab)
}
