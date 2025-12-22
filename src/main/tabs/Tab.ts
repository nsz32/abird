import type { RoutingConfig } from "@shared/types"
import { activeTab$ } from "../states"
import { SiteView } from "../ui/SiteView"
import { activateTab } from "./Tabs"

let nextId = 1

export class Tab {
	readonly id: string
	readonly siteView: SiteView

	constructor(partition: string, routing: RoutingConfig | null, url: string, shouldActivate: boolean) {
		this.id = `tab-${nextId++}`
		this.siteView = new SiteView(partition, routing, this.id, () => {
			if (shouldActivate) {
				activateTab(this.id)
			} else {
				// Refresh navbar pour afficher le nouveau tab
				activeTab$.emit(activeTab$.get())
			}
		})
		this.siteView.loadURL(url)
	}
}
