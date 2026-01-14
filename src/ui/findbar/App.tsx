import type { FindState } from "@shared/types"
import { ChevronDown, ChevronUp, X } from "lucide-react"
import { type KeyboardEvent, useEffect, useRef, useState } from "react"

const DEBOUNCE_MS = 250

export function App() {
	const [findState, setFindState] = useState<FindState>({ text: "", activeMatch: 0, totalMatches: 0 })
	const [inputValue, setInputValue] = useState("")
	const inputRef = useRef<HTMLInputElement>(null)
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

	useEffect(() => {
		const unsubOpen = window.bird.find.onOpen(() => {
			inputRef.current?.focus()
			inputRef.current?.select()
		})

		const unsubState = window.bird.find.onStateChanged((state) => {
			setFindState(state)
			setInputValue(state.text)
		})

		return () => {
			unsubOpen()
			unsubState()
		}
	}, [])

	const handleSearch = (text: string) => {
		setInputValue(text)
		if (debounceRef.current) clearTimeout(debounceRef.current)
		debounceRef.current = setTimeout(() => window.bird.find.search(text), DEBOUNCE_MS)
	}

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Escape") {
			handleClose()
		} else if (e.key === "Enter") {
			if (e.shiftKey) {
				window.bird.find.prev()
			} else {
				window.bird.find.next()
			}
		}
	}

	const handleClose = () => {
		if (debounceRef.current) clearTimeout(debounceRef.current)
		setInputValue("")
		window.bird.find.close()
	}

	const handleBlur = () => {
		if (!inputValue) handleClose()
	}

	// Don't show results until search for current text is complete
	const isStale = inputValue !== findState.text
	const hasResults = findState.totalMatches > 0
	const noResults = !isStale && inputValue.length > 0 && findState.totalMatches === 0

	return (
		<div className="find-bar">
			<input
				ref={inputRef}
				type="text"
				className={`find-input ${noResults ? "no-results" : ""}`}
				placeholder="Rechercher..."
				value={inputValue}
				onChange={(e) => handleSearch(e.target.value)}
				onKeyDown={handleKeyDown}
				onBlur={handleBlur}
			/>
			<span className={`find-count ${noResults ? "no-results" : ""}`}>
				{inputValue.length > 0 && !isStale ? (hasResults ? `${findState.activeMatch} / ${findState.totalMatches}` : "0") : ""}
			</span>
			<button type="button" className="find-button" onClick={() => window.bird.find.prev()} disabled={!hasResults} title="Précédent (Shift+Enter)">
				<ChevronUp size={16} />
			</button>
			<button type="button" className="find-button" onClick={() => window.bird.find.next()} disabled={!hasResults} title="Suivant (Enter)">
				<ChevronDown size={16} />
			</button>
			<button type="button" className="find-button close" onClick={handleClose} title="Fermer (Échap)">
				<X size={16} />
			</button>
		</div>
	)
}
