import type { NavBarConfig, NavigationState } from "@shared/types"
import { useEffect, useState } from "react"

interface NavButtonProps {
	onClick: () => void
	disabled?: boolean
	children: React.ReactNode
}

function NavButton({ onClick, disabled, children }: NavButtonProps) {
	return (
		<button type="button" className="nav-button" onClick={onClick} disabled={disabled}>
			{children}
		</button>
	)
}

export function App() {
	const [state, setState] = useState<NavigationState>({
		url: "",
		title: "",
		canGoBack: false,
		canGoForward: false,
		isLoading: false,
	})

	const [config, setConfig] = useState<NavBarConfig | null>(null)
	const [inputUrl, setInputUrl] = useState("")
	const [isEditing, setIsEditing] = useState(false)

	useEffect(() => {
		window.bird.config.getNavBar().then(setConfig)
		window.bird.navigation.getState().then((s) => {
			setState(s)
			setInputUrl(s.url)
		})
		const unsubscribe = window.bird.navigation.onStateChanged((s) => {
			setState(s)
			if (!isEditing) {
				setInputUrl(s.url)
			}
		})
		return unsubscribe
	}, [isEditing])

	const handleUrlSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (inputUrl.trim()) {
			window.bird.navigation.goTo(inputUrl.trim())
			setIsEditing(false)
		}
	}

	const handleInputFocus = () => {
		setIsEditing(true)
	}

	const handleInputBlur = () => {
		setIsEditing(false)
		setInputUrl(state.url)
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			setIsEditing(false)
			setInputUrl(state.url)
			;(e.target as HTMLInputElement).blur()
		}
	}

	if (!config) return null

	return (
		<div className="navigation-bar">
			{config.showBackForward && (
				<>
					<NavButton onClick={() => window.bird.navigation.back()} disabled={!state.canGoBack}>
						&#8592;
					</NavButton>
					<NavButton onClick={() => window.bird.navigation.forward()} disabled={!state.canGoForward}>
						&#8594;
					</NavButton>
				</>
			)}
			{config.showReload && (
				<NavButton onClick={() => window.bird.navigation.reload()}>{state.isLoading ? "..." : "↻"}</NavButton>
			)}
			{config.urlEditable ? (
				<form className="url-form" onSubmit={handleUrlSubmit}>
					<input
						type="text"
						className="url-input"
						value={inputUrl}
						onChange={(e) => setInputUrl(e.target.value)}
						onFocus={handleInputFocus}
						onBlur={handleInputBlur}
						onKeyDown={handleKeyDown}
						spellCheck={false}
					/>
				</form>
			) : (
				<span className="url-display">{state.url}</span>
			)}
		</div>
	)
}
