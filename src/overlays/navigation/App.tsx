import type { NavigationState } from "@shared/types"
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

	useEffect(() => {
		window.bird.navigation.getState().then(setState)
		const unsubscribe = window.bird.navigation.onStateChanged(setState)
		return unsubscribe
	}, [])

	return (
		<div className="navigation-bar">
			<NavButton onClick={() => window.bird.navigation.back()} disabled={!state.canGoBack}>
				&#8592;
			</NavButton>
			<NavButton onClick={() => window.bird.navigation.forward()} disabled={!state.canGoForward}>
				&#8594;
			</NavButton>
			<NavButton onClick={() => window.bird.navigation.reload()}>{state.isLoading ? "..." : "↻"}</NavButton>
			<span className="url-display">{state.url}</span>
		</div>
	)
}
