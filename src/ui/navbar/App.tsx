import type { NavBarConfig, NavigationState, TabInfo } from "@shared/types"
import { ArrowLeft, ArrowRight, HousePlus, LoaderCircle, RotateCw, X } from "lucide-react"
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
	const [tabs, setTabs] = useState<TabInfo[]>([])

	useEffect(() => {
		window.bird.config.getNavBar().then(setConfig)
		window.bird.navigation.getState().then((s) => {
			setState(s)
			setInputUrl(s.url)
		})
		window.bird.tabs.getList().then(setTabs)
		const unsubscribeNav = window.bird.navigation.onStateChanged((s) => {
			setState(s)
			if (!isEditing) setInputUrl(s.url)
		})
		const unsubscribeTabs = window.bird.tabs.onListChanged(setTabs)
		return () => {
			unsubscribeNav()
			unsubscribeTabs()
		}
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
						<ArrowLeft size={16} />
					</NavButton>
					<NavButton onClick={() => window.bird.navigation.forward()} disabled={!state.canGoForward}>
						<ArrowRight size={16} />
					</NavButton>
				</>
			)}
			{config.showReload && (
				state.isLoading ? (
					<NavButton onClick={() => window.bird.navigation.stop()}>
						<X size={16} strokeWidth={2.5} />
					</NavButton>
				) : (
					<NavButton onClick={() => window.bird.navigation.reload()}>
						<RotateCw size={16} />
					</NavButton>
				)
			)}
			<NavButton onClick={() => window.bird.tabs.create("start")}>
				<HousePlus size={16} />
			</NavButton>
			<div className="tabs-list">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						type="button"
						className={`tab-button ${tab.isActive ? "active" : ""}`}
						onClick={() => window.bird.tabs.activate(tab.id)}
					>
						{tab.isLoading ? (
							<LoaderCircle size={16} className="tab-favicon spinning" />
						) : (
							tab.favicon && <img className="tab-favicon" src={tab.favicon} alt="" />
						)}
						<span className="tab-title">{tab.title || tab.url}</span>
						{tabs.length > 1 && (
							<span
								className="tab-close"
								onClick={(e) => {
									e.stopPropagation()
									window.bird.tabs.close(tab.id)
								}}
							>
								<X size={16} strokeWidth={2.5} />
							</span>
						)}
					</button>
				))}
			</div>
		</div>
	)
}
