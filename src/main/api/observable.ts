type Listener<T> = (value: T) => void
// biome-ignore lint/suspicious/noExplicitAny: necessary for type inference
type Combined<T extends readonly StateObservable<any>[]> = { [K in keyof T]: T[K] extends StateObservable<infer U> ? U : never }

export class Observable<T> {
	private listeners = new Set<Listener<T>>()

	subscribe(l: Listener<T>) {
		this.listeners.add(l)
		return () => this.listeners.delete(l)
	}
	emit(value: T) {
		for (const listener of this.listeners) listener(value)
	}
}

export class StateObservable<T> {
	private listeners = new Set<Listener<T>>()

	constructor(private state: T) {}

	subscribe(l: Listener<T>) {
		this.listeners.add(l)
		l(this.state)
		return () => this.listeners.delete(l)
	}
	emit(state: T) {
		this.state = state
		for (const listener of this.listeners) listener(state)
	}
	get() {
		return this.state
	}
}

// biome-ignore lint/suspicious/noExplicitAny: necessary for type inference
export class CombinedObservable<const T extends readonly StateObservable<any>[], U> {
	private listeners = new Set<Listener<U>>()
	private unsubscribers: Array<() => void> = []

	constructor(
		private observables: T,
		private combine: (...values: Combined<T>) => U,
	) {
		for (const obs of observables)
			this.unsubscribers.push(
				obs.subscribe(() => {
					const value = this.combine(...(this.observables.map((o) => o.get()) as Combined<T>))
					for (const listener of this.listeners) listener(value)
				}),
			)
	}

	subscribe(l: Listener<U>) {
		this.listeners.add(l)
		return () => this.listeners.delete(l)
	}
	get() {
		return this.combine(...(this.observables.map((o) => o.get()) as Combined<T>))
	}
	dispose() {
		for (const unsub of this.unsubscribers) unsub()
		this.listeners.clear()
	}
}
