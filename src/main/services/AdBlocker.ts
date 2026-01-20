/**
 * Service de blocage des publicités et traceurs
 * Utilise @ghostery/adblocker-electron pour filtrer les requêtes
 */
import { ElectronBlocker } from "@ghostery/adblocker-electron"
import type { Session } from "electron"

const blockers = new Map<string, ElectronBlocker>()
let sharedBlocker: ElectronBlocker | null = null

async function getBlocker(): Promise<ElectronBlocker> {
	if (!sharedBlocker) {
		sharedBlocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch)
	}
	return sharedBlocker
}

export async function enableAdBlock(session: Session, partitionName: string): Promise<void> {
	if (blockers.has(partitionName)) return

	const blocker = await getBlocker()
	blocker.enableBlockingInSession(session)
	blockers.set(partitionName, blocker)
	console.log(`[AdBlocker] enabled for partition: ${partitionName}`)
}

export function disableAdBlock(session: Session, partitionName: string): void {
	const blocker = blockers.get(partitionName)
	if (!blocker) return

	blocker.disableBlockingInSession(session)
	blockers.delete(partitionName)
	console.log(`[AdBlocker] disabled for partition: ${partitionName}`)
}

export function isAdBlockEnabled(partitionName: string): boolean {
	return blockers.has(partitionName)
}
