import type { PermissionsConfig } from "@shared/config.schema"
import type { Session } from "electron"
import { getBirdConfig } from "../config"
import { getPartitionConfig } from "./PartitionManager"

const PERMISSION_MAP: Record<string, keyof PermissionsConfig> = {
	midi: "allowMidi",
	midiSysex: "allowMidiSysex",
	fullscreen: "allowFullscreen",
	pointerLock: "allowPointerLock",
	keyboardLock: "allowKeyboardLock",
	"idle-detection": "allowIdleDetection",
	notifications: "allowNotifications",
}

function resolvePermission(configKey: keyof PermissionsConfig, partitionName: string): boolean {
	const partitionValue = getPartitionConfig(partitionName)?.permissions?.[configKey]
	if (partitionValue !== undefined) return partitionValue

	const baseValue = getBirdConfig().permissions?.[configKey]
	if (baseValue !== undefined) return baseValue

	return true
}

function isPermissionAllowed(permission: string, partitionName: string): boolean {
	const configKey = PERMISSION_MAP[permission]
	if (!configKey) return false

	// midiSysex requires midi to be allowed
	if (configKey === "allowMidiSysex") {
		return resolvePermission(configKey, partitionName) && isPermissionAllowed("midi", partitionName)
	}

	return resolvePermission(configKey, partitionName)
}

export function setupPermissionHandlers(session: Session, partitionName: string) {
	session.setPermissionRequestHandler((_webContents, permission, callback) => {
		callback(isPermissionAllowed(permission, partitionName))
	})

	session.setPermissionCheckHandler((_webContents, permission) => {
		return isPermissionAllowed(permission, partitionName)
	})
}
