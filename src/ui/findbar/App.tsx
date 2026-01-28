import type { FindState } from "@shared/types"
import { useTranslations } from "@ui/shared/hooks"
import { getAppClass } from "@ui/shared/viewContext"
import { ChevronDown, ChevronUp, X } from "lucide-react"
import { type KeyboardEvent, useEffect, useRef, useState } from "react"

const rootClass = ["findbar", getAppClass()].filter(Boolean).join(" ")

const DEBOUNCE_MS = 250

export function App() {
	const { t } = useTranslations()
	const [findState, setFindState] = useState<FindState>({ text: "", activeMatch: 0, totalMatches: 0 })
	const [inputValue, setInputValue] = useState("")
	const inputRef = useRef<HTMLInputElement>(null)
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

	useEffect(() => {
		const unsubOpen = window.abird.find.onOpen(() => {
			inputRef.current?.focus()
			inputRef.current?.select()
		})

		const unsubState = window.abird.find.onStateChanged((state) => {
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
		debounceRef.current = setTimeout(() => window.abird.find.search(text), DEBOUNCE_MS)
	}

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Escape") {
			handleClose()
		} else if (e.key === "Enter") {
			if (e.shiftKey) {
				window.abird.find.prev()
			} else {
				window.abird.find.next()
			}
		}
	}

	const handleClose = () => {
		if (debounceRef.current) clearTimeout(debounceRef.current)
		setInputValue("")
		window.abird.find.close()
	}

	const handleBlur = () => {
		if (!inputValue) handleClose()
	}

	const isStale = inputValue !== findState.text
	const hasResults = findState.totalMatches > 0
	const noResults = !isStale && inputValue.length > 0 && findState.totalMatches === 0

	return (
		<div className={rootClass}>
			<input
				ref={inputRef}
				type="text"
				className={`find-input ${noResults ? "no-results" : ""}`}
				placeholder={t("find.placeholder")}
				value={inputValue}
				onChange={(e) => handleSearch(e.target.value)}
				onKeyDown={handleKeyDown}
				onBlur={handleBlur}
			/>
			<span className={`find-count ${noResults ? "no-results" : ""}`}>
				{inputValue.length > 0 && !isStale ? (hasResults ? `${findState.activeMatch} / ${findState.totalMatches}` : "0") : ""}
			</span>
			<button type="button" className="find-button" onClick={() => window.abird.find.prev()} disabled={!hasResults} title={t("find.previous")}>
				<ChevronUp size={16} />
			</button>
			<button type="button" className="find-button" onClick={() => window.abird.find.next()} disabled={!hasResults} title={t("find.next")}>
				<ChevronDown size={16} />
			</button>
			<button type="button" className="find-button close" onClick={handleClose} title={t("find.close")}>
				<X size={16} />
			</button>
		</div>
	)
}
