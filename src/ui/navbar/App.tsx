import { ArrowLeft, ArrowRight, Download, Home, HousePlus, RotateCw, X } from "lucide-react"
import { type KeyboardEvent, useEffect, useRef, useState } from "react"
import type { ActiveDownload } from "../../shared/types"
import { DownloadProgressIcon } from "./DownloadProgressIcon"
import { TabButton } from "./TabButton"
import { useNavbarState } from "./useNavbarState"

export function App() {
	const { navState, config, tabs, externalTabIds, containerRef, isUrlMode, urlInputRef, exitUrlMode } = useNavbarState()
	const [hasDownloads, setHasDownloads] = useState(false)
	const [activeDownloads, setActiveDownloads] = useState<ActiveDownload[]>([])
	const [ctrlPressed, setCtrlPressed] = useState(false)
	const [bump, setBump] = useState(false)
	const [highlighted, setHighlighted] = useState(false)
	const prevActiveCount = useRef(0)

	useEffect(() => {
		Promise.all([window.bird.downloads.getActive(), window.bird.downloads.getHistory()]).then(([active, history]) => {
			setActiveDownloads(active)
			setHasDownloads(active.length > 0 || history.length > 0)
			prevActiveCount.current = active.length
		})

		const unsubActive = window.bird.downloads.onActiveChanged((items) => {
			setActiveDownloads(items)
			if (items.length > 0) setHasDownloads(true)

			if (prevActiveCount.current > 0 && items.length === 0) {
				setBump(true)
			}
			prevActiveCount.current = items.length
		})

		const unsubHistory = window.bird.downloads.onHistoryChanged((items) => {
			if (items.length > 0) setHasDownloads(true)
		})

		const unsubEvent = window.bird.downloads.onEvent((event) => {
			if (event.type === "completed" && event.autoOpened === false) {
				setHighlighted(true)
			}
		})

		return () => {
			unsubActive()
			unsubHistory()
			unsubEvent()
		}
	}, [])

	useEffect(() => {
		if (navState?.isDownloadsPanelActive) setHighlighted(false)
	}, [navState?.isDownloadsPanelActive])

	useEffect(() => {
		return window.bird.keyboard.onCtrlChanged(setCtrlPressed)
	}, [])

	if (!config || !navState || !tabs) return null

	const { navBar } = config

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

	const navDisabled = navState.isStandalonePanel

	const downloadButtonClass = [highlighted && "highlighted", bump && "bump"].filter(Boolean).join(" ") || undefined

	return (
		<div ref={containerRef} className="navigation-bar">
			{navBar.showBackButton && (
				<NavButton onClick={() => window.bird.navigation.back()} disabled={navDisabled || !navState.canGoBack}>
					<ArrowLeft />
				</NavButton>
			)}
			{navBar.showForwardButton && (
				<NavButton onClick={() => window.bird.navigation.forward()} disabled={navDisabled || !navState.canGoForward}>
					<ArrowRight />
				</NavButton>
			)}
			{navBar.showRefreshButton && (
				<NavButton onClick={() => (navState.isLoading ? window.bird.navigation.stop() : window.bird.navigation.reload())} disabled={navDisabled}>
					{navState.isLoading ? <X strokeWidth={2.5} /> : <RotateCw />}
				</NavButton>
			)}
			{navBar.showHomeButton && (
				<NavButton onClick={() => (ctrlPressed ? window.bird.navigation.goHome() : window.bird.tabs.create(0))}>
					{ctrlPressed ? <Home /> : <HousePlus />}
				</NavButton>
			)}
			{isUrlMode && navBar.allowUrlEdit ? (
				<input ref={urlInputRef} type="text" className="url-input" defaultValue={navState.url} onKeyDown={handleUrlKeyDown} onBlur={exitUrlMode} />
			) : (
				<div className="tabs-list">
					{tabs.map((tab) => (
						<TabButton
							key={tab.id}
							tab={tab}
							showClose={navBar.allowSingleTabClose || tabs.length > 1}
							showExternalIndicator={externalTabIds.has(tab.id)}
							onActivate={() => window.bird.tabs.activate(tab.id)}
							onClose={() => window.bird.tabs.close(tab.id)}
						/>
					))}
				</div>
			)}
			{hasDownloads && (
				<NavButton
					onClick={() => window.bird.downloads.toggle()}
					active={navState.isDownloadsPanelActive}
					className={downloadButtonClass}
					onAnimationEnd={() => setBump(false)}
				>
					{activeDownloads.length > 0 ? <DownloadProgressIcon downloads={activeDownloads} /> : <Download />}
				</NavButton>
			)}
		</div>
	)
}

interface NavButtonProps {
	onClick: () => void
	disabled?: boolean
	active?: boolean
	className?: string
	onAnimationEnd?: () => void
	children: React.ReactNode
}

function NavButton({ onClick, disabled, active, className, onAnimationEnd, children }: NavButtonProps) {
	const classes = ["nav-button", active && "active", className].filter(Boolean).join(" ")
	return (
		<button type="button" className={classes} onClick={onClick} disabled={disabled} onAnimationEnd={onAnimationEnd}>
			{children}
		</button>
	)
}
