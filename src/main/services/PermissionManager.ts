import type { Session } from "electron"

const ALLOWED_PERMISSIONS = new Set(["midi", "midiSysex", "fullscreen", "pointerLock", "keyboardLock", "idle-detection"])

export function setupPermissionHandlers(session: Session) {
	session.setPermissionRequestHandler((_webContents, permission, callback) => {
		callback(ALLOWED_PERMISSIONS.has(permission))
	})

	session.setPermissionCheckHandler((_webContents, permission) => {
		return ALLOWED_PERMISSIONS.has(permission)
	})
}
