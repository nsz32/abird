import type { RoutingConfig } from "@shared/types"
import { SiteView } from "../ui/SiteView"

let nextId = 1

export class Tab {
	readonly id: string
	readonly siteView: SiteView

	constructor(partition: string, routing: RoutingConfig | null, url: string) {
		this.id = `tab-${nextId++}`
		this.siteView = new SiteView(partition, routing, this.id)
		this.siteView.loadURL(url)
	}
}
