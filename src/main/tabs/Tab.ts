import type { RoutingConfig } from "@shared/types"
import { UrlRouter } from "../routing/UrlRouter"
import { activeTab$ } from "../states"
import { SiteView } from "../ui/SiteView"

let nextId = 1

export class Tab {
	readonly id: string
	readonly siteView: SiteView
	readonly initialUrl: string

	constructor(partition: string, routing: Partial<RoutingConfig> | null, url: string, userAgent: string) {
		this.id = `tab-${nextId++}`
		this.initialUrl = url
		const router = new UrlRouter(routing)
		this.siteView = new SiteView(partition, router, this.id, userAgent, () => {
			// Refresh navbar pour afficher le nouveau tab dans la liste
			activeTab$.emit(activeTab$.get())
		})
		this.siteView.loadURL(url)
	}
}
