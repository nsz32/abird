import { ArrowLeft, ArrowRight, HousePlus, RotateCw, X } from "lucide-react"
import { TabButton } from "./TabButton"
import { useNavbarState } from "./useNavbarState"

export function App() {
	const { navState, config, tabs, externalTabIds, containerRef } = useNavbarState()

	if (!config) return null

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
				<NavButton
					onClick={() => (navState.isLoading ? window.bird.navigation.stop() : window.bird.navigation.reload())}
				>
					{navState.isLoading ? <X size={16} strokeWidth={2.5} /> : <RotateCw size={16} />}
				</NavButton>
			)}

			<NavButton onClick={() => window.bird.tabs.create(0)}>
				<HousePlus size={16} />
			</NavButton>

			<div className="tabs-list">
				{tabs.map((tab) => (
					<TabButton
						key={tab.id}
						tab={tab}
						showClose={tabs.length > 1}
						showExternalIndicator={externalTabIds.has(tab.id)}
						onActivate={() => window.bird.tabs.activate(tab.id)}
						onClose={() => window.bird.tabs.close(tab.id)}
					/>
				))}
			</div>
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
