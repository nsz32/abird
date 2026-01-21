import type { WebContents } from "electron"

type Listener<T> = (value: T) => void

// Observable sources that can be combined (StateObservable or CombinedObservable)
// biome-ignore lint/suspicious/noExplicitAny: necessary for type inference
type ObservableSource<T = any> = { get(): T; subscribe(l: Listener<T>): () => void }
// biome-ignore lint/suspicious/noExplicitAny: necessary for type inference
type Combined<T extends readonly ObservableSource<any>[]> = { [K in keyof T]: T[K] extends ObservableSource<infer U> ? U : never }

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

export class BroadcastObservable<T> extends StateObservable<T> {
	private webContents = new Set<WebContents>()

	constructor(
		state: T,
		private channel: string,
	) {
		super(state)
	}

	register(wc: WebContents) {
		this.webContents.add(wc)
		wc.once("destroyed", () => this.webContents.delete(wc))
		// Envoie l'état initial
		if (!wc.isDestroyed()) wc.send(this.channel, this.get())
	}

	override emit(state: T) {
		super.emit(state)
		for (const wc of this.webContents) {
			if (!wc.isDestroyed()) wc.send(this.channel, state)
		}
	}
}

// Event broadcaster (no state, just broadcasts events)
export class BroadcastEvent<T> {
	private webContents = new Set<WebContents>()

	constructor(private channel: string) {}

	register(wc: WebContents) {
		this.webContents.add(wc)
		wc.once("destroyed", () => this.webContents.delete(wc))
	}

	emit(event: T) {
		for (const wc of this.webContents) {
			if (!wc.isDestroyed()) wc.send(this.channel, event)
		}
	}
}

// biome-ignore lint/suspicious/noExplicitAny: necessary for type inference
export class CombinedObservable<const T extends readonly ObservableSource<any>[], U> {
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
