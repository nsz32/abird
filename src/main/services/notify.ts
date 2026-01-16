import type { Notification, NotificationType } from "@shared/types"
import { notifications$ } from "../core/states"

let nextId = 1

export function addNotification(
	type: NotificationType,
	title: string,
	message?: string,
	options: { dismissable?: boolean; autoDismiss?: number } = {},
): string {
	const id = `notif-${nextId++}`
	const notification: Notification = {
		id,
		type,
		title,
		message,
		dismissable: options.dismissable ?? true,
		createdAt: Date.now(),
	}

	notifications$.emit([...notifications$.get(), notification])

	if (options.autoDismiss) {
		setTimeout(() => dismissNotification(id), options.autoDismiss)
	}

	return id
}

export function dismissNotification(id: string) {
	notifications$.emit(notifications$.get().filter((n) => n.id !== id))
}

export function updateNotification(id: string, updates: Partial<Notification>) {
	notifications$.emit(notifications$.get().map((n) => (n.id === id ? { ...n, ...updates } : n)))
}
