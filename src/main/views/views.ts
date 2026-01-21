/**
 * View registry - provides access to view instances
 * Similar to Tabs.ts pattern for accessing tabs
 */
import type { NavBar } from "./NavBar"

let navBar: NavBar | null = null

export function setNavBar(instance: NavBar) {
	navBar = instance
}

export function getNavBar(): NavBar | null {
	return navBar
}
