import { ArrowLeft, ArrowRight, Download, Home, HousePlus, RotateCw, X } from "lucide-react"
import { type KeyboardEvent, useEffect, useRef, useState } from "react"
import type { ActiveDownload } from "../../shared/types"
import { getAppClass } from "../shared/viewContext"
import { DownloadProgressIcon } from "./DownloadProgressIcon"
import { TabButton } from "./TabButton"
import { useNavbarState } from "./useNavbarState"

const rootClass = ["navbar", getAppClass()].filter(Boolean).join(" ")

export function App() {
	const { navState, config, tabs, externalTabIds, containerRef, isUrlMode, urlInputRef, exitUrlMode } = useNavbarState()
	const [hasDownloads, setHasDownloads] = useState(false)
	const [activeDownloads, setActiveDownloads] = useState<ActiveDownload[]>([])
	const [ctrlPressed, setCtrlPressed] = useState(false)
	const [bump, setBump] = useState(false)
	const [highlighted, setHighlighted] = useState(false)
	const prevActiveCount = useRef(0)

	useEffect(() => {
		Promise.all([window.abird.downloads.getActive(), window.abird.downloads.getHistory()]).then(([active, history]) => {
			setActiveDownloads(active)
			setHasDownloads(active.length > 0 || history.length > 0)
			prevActiveCount.current = active.length
		})

		const unsubActive = window.abird.downloads.onActiveChanged((items) => {
			setActiveDownloads(items)
			if (items.length > 0) setHasDownloads(true)

			if (prevActiveCount.current > 0 && items.length === 0) {
				setBump(true)
			}
			prevActiveCount.current = items.length
		})

		const unsubHistory = window.abird.downloads.onHistoryChanged((items) => {
			if (items.length > 0) setHasDownloads(true)
		})

		const unsubEvent = window.abird.downloads.onEvent((event) => {
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
		return window.abird.keyboard.onCtrlChanged(setCtrlPressed)
	}, [])

	if (!config || !navState || !tabs) return null

	const { navBar } = config

	const handleUrlKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Escape") {
			exitUrlMode()
		} else if (e.key === "Enter") {
			const url = urlInputRef.current?.value.trim()
			if (url) {
				window.abird.navigation.goTo(url)
			}
			exitUrlMode()
		}
	}

	const navDisabled = navState.isStandalonePanel

	const downloadButtonClass = [highlighted && "highlighted", bump && "bump"].filter(Boolean).join(" ") || undefined

	return (
		<div ref={containerRef} className={rootClass}>
			{navBar.showBackButton && (
				<NavButton onClick={() => window.abird.navigation.back()} disabled={navDisabled || !navState.canGoBack}>
					<ArrowLeft />
				</NavButton>
			)}
			{navBar.showForwardButton && (
				<NavButton onClick={() => window.abird.navigation.forward()} disabled={navDisabled || !navState.canGoForward}>
					<ArrowRight />
				</NavButton>
			)}
			{navBar.showRefreshButton && (
				<NavButton onClick={() => (navState.isLoading ? window.abird.navigation.stop() : window.abird.navigation.reload())} disabled={navDisabled}>
					{navState.isLoading ? <X strokeWidth={2.5} /> : <RotateCw />}
				</NavButton>
			)}
			{navBar.showHomeButton && (
				<NavButton onClick={() => (ctrlPressed ? window.abird.navigation.goHome() : window.abird.tabs.create(0))}>
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
							onActivate={() => window.abird.tabs.activate(tab.id)}
							onClose={() => window.abird.tabs.close(tab.id)}
						/>
					))}
				</div>
			)}
			{hasDownloads && (
				<NavButton
					onClick={() => window.abird.downloads.toggle()}
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
