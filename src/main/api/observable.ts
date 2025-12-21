/**
 * Pattern Observable minimaliste
 */

type Listener<T> = (value: T) => void

export interface Observable<T> {
	subscribe(listener: Listener<T>): () => void
	emit(value: T): void
}

export interface StateObservable<T> extends Observable<T> {
	get(): T
}

export function createObservable<T>(): Observable<T> {
	const listeners = new Set<Listener<T>>()

	return {
		subscribe(listener: Listener<T>): () => void {
			listeners.add(listener)
			return () => listeners.delete(listener)
		},
		emit(value: T): void {
			for (const listener of listeners) {
				listener(value)
			}
		},
	}
}

/**
 * Observable avec état - stocke la dernière valeur
 * Les subscribers reçoivent la valeur courante immédiatement
 */
export function createStateObservable<T>(initial: T): StateObservable<T> {
	let current = initial
	const listeners = new Set<Listener<T>>()

	return {
		subscribe(listener: Listener<T>): () => void {
			listeners.add(listener)
			// Émettre immédiatement la valeur courante
			listener(current)
			return () => listeners.delete(listener)
		},
		emit(value: T): void {
			current = value
			for (const listener of listeners) {
				listener(value)
			}
		},
		get(): T {
			return current
		},
	}
}
