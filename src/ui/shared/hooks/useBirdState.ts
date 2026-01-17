import { useEffect, useRef, useState } from "react"

/**
 * Hook for synchronizing React state with main process state.
 * Handles initial fetch + subscription to changes with automatic cleanup.
 *
 * Note: Functions are captured once on mount - no need for stable references.
 */
export function useBirdState<T>(getInitial: () => Promise<T>, subscribe: (callback: (data: T) => void) => () => void): T | null
export function useBirdState<T>(getInitial: () => Promise<T>, subscribe: (callback: (data: T) => void) => () => void, initialValue: T): T
export function useBirdState<T>(getInitial: () => Promise<T>, subscribe: (callback: (data: T) => void) => () => void, initialValue?: T | null): T | null {
	const [state, setState] = useState<T | null>(initialValue ?? null)
	const fnRef = useRef({ getInitial, subscribe })

	useEffect(() => {
		fnRef.current.getInitial().then(setState)
		return fnRef.current.subscribe(setState)
	}, [])

	return state
}
