import type { RoutingConfig } from "@shared/types"
import { activeTab$ } from "../states"
import { SiteView } from "../ui/SiteView"
import { activateTab } from "./Tabs"

let nextId = 1

export class Tab {
	readonly id: string
	readonly siteView: SiteView
	readonly initialUrl: string

	constructor(partition: string, routing: RoutingConfig | null, url: string, userAgent: string) {
		this.id = `tab-${nextId++}`
		this.initialUrl = url
		this.siteView = new SiteView(partition, routing, this.id, userAgent, () => {
			// Refresh navbar pour afficher le nouveau tab dans la liste
			activeTab$.emit(activeTab$.get())
		})
		this.siteView.loadURL(url)
	}
}
