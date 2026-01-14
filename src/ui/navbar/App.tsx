import { ArrowLeft, ArrowRight, Download, Home, HousePlus, Loader2, RotateCw, X } from "lucide-react"
import { type KeyboardEvent, useEffect, useState } from "react"
import { TabButton } from "./TabButton"
import { useNavbarState } from "./useNavbarState"

export function App() {
	const { navState, config, tabs, externalTabIds, containerRef, isUrlMode, urlInputRef, exitUrlMode } = useNavbarState()
	const [hasDownloads, setHasDownloads] = useState(false)
	const [hasActiveDownloads, setHasActiveDownloads] = useState(false)
	const [ctrlPressed, setCtrlPressed] = useState(false)

	useEffect(() => {
		// Check for any downloads (active or history)
		Promise.all([window.bird.downloads.getActive(), window.bird.downloads.getHistory()]).then(([active, history]) => {
			setHasActiveDownloads(active.length > 0)
			setHasDownloads(active.length > 0 || history.length > 0)
		})
		const unsubActive = window.bird.downloads.onActiveChanged((items) => {
			setHasActiveDownloads(items.length > 0)
			if (items.length > 0) setHasDownloads(true)
		})
		const unsubHistory = window.bird.downloads.onHistoryChanged((items) => {
			if (items.length > 0) setHasDownloads(true)
		})
		return () => {
			unsubActive()
			unsubHistory()
		}
	}, [])

	useEffect(() => {
		return window.bird.keyboard.onCtrlChanged(setCtrlPressed)
	}, [])

	if (!config) return null

	const handleUrlKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Escape") {
			exitUrlMode()
		} else if (e.key === "Enter") {
			const url = urlInputRef.current?.value.trim()
			if (url) {
				window.bird.navigation.goTo(url)
			}
			exitUrlMode()
		}
	}

	return (
		<div ref={containerRef} className="navigation-bar">
			{config.showBackForward && (
				<>
					<NavButton onClick={() => window.bird.navigation.back()} disabled={!navState.canGoBack}>
						<ArrowLeft size={16} />
					</NavButton>
					<NavButton onClick={() => window.bird.navigation.forward()} disabled={!navState.canGoForward}>
						<ArrowRight size={16} />
					</NavButton>
				</>
			)}

			{config.showReload && (
				<NavButton onClick={() => (navState.isLoading ? window.bird.navigation.stop() : window.bird.navigation.reload())}>
					{navState.isLoading ? <X size={16} strokeWidth={2.5} /> : <RotateCw size={16} />}
				</NavButton>
			)}

			<NavButton onClick={() => (ctrlPressed ? window.bird.navigation.goHome() : window.bird.tabs.create(0))}>
				{ctrlPressed ? <Home size={16} /> : <HousePlus size={16} />}
			</NavButton>

			{isUrlMode && config.urlEditable ? (
				<input ref={urlInputRef} type="text" className="url-input" defaultValue={navState.url} onKeyDown={handleUrlKeyDown} onBlur={exitUrlMode} />
			) : (
				<div className="tabs-list">
					{tabs.map((tab) => (
						<TabButton
							key={tab.id}
							tab={tab}
							showClose={config.allowSingleTabClose || tabs.length > 1}
							showExternalIndicator={externalTabIds.has(tab.id)}
							onActivate={() => window.bird.tabs.activate(tab.id)}
							onClose={() => window.bird.tabs.close(tab.id)}
						/>
					))}
				</div>
			)}

			{hasDownloads && (
				<NavButton onClick={() => window.bird.downloads.toggle()}>
					{hasActiveDownloads ? <Loader2 size={16} className="spinning" /> : <Download size={16} />}
				</NavButton>
			)}
		</div>
	)
}

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
