import type { BirdConfig } from "@shared/config.schema"
import type { EffectiveConfig, PartitionsState } from "@shared/types"
import { useEffect, useState } from "react"
import { AppPage } from "./pages/AppPage"
import { HomePage } from "./pages/HomePage"
import { PartitionPage } from "./pages/PartitionPage"
import { useHashRouter } from "./useHashRouter"
import { useTranslations } from "./useTranslations"

interface AppState {
	config: BirdConfig
	configPath: string
	effectiveConfig: EffectiveConfig
	partitionsState: PartitionsState
}

export function App() {
	const { route, navigate } = useHashRouter()
	const { ready } = useTranslations()
	const [state, setState] = useState<AppState | null>(null)

	useEffect(() => {
		loadAll()
	}, [])

	const loadAll = async () => {
		const [userConfig, effectiveConfig, partitionsState] = await Promise.all([
			window.bird.settings.userconfig.read(),
			window.bird.config.get(),
			window.bird.partition.list(),
		])

		setState({
			config: userConfig.content as BirdConfig,
			configPath: userConfig.path,
			effectiveConfig,
			partitionsState,
		})
	}

	const reloadPartitions = async () => {
		const partitionsState = await window.bird.partition.list()
		setState((prev) => (prev ? { ...prev, partitionsState } : null))
	}

	const handleChange = async (newConfig: BirdConfig) => {
		setState((prev) => (prev ? { ...prev, config: newConfig } : null))
		const result = await window.bird.settings.userconfig.write(newConfig)
		if (!result.success) {
			console.error("Failed to save config:", result.errors)
		}
	}

	if (!state || !ready) {
		return null
	}

	const { config, configPath, effectiveConfig, partitionsState } = state

	const appMatch = route.match(/^#app\/(.+)$/)
	const appName = appMatch?.[1]
	const partitionMatch = route.match(/^#partition\/(.+)$/)
	const partitionName = partitionMatch?.[1]

	const renderPage = () => {
		if (appName) {
			return <AppPage name={appName} config={config} partitionsState={partitionsState} onChange={handleChange} reloadPartitions={reloadPartitions} />
		}
		if (partitionName) {
			return (
				<PartitionPage
					name={partitionName}
					partitionsState={partitionsState}
					activePartition={effectiveConfig.partition}
					onNavigate={navigate}
					reloadPartitions={reloadPartitions}
				/>
			)
		}
		return (
			<HomePage
				config={config}
				configPath={configPath}
				partitionsState={partitionsState}
				activePartition={effectiveConfig.partition}
				onChange={handleChange}
				onNavigate={navigate}
				reloadPartitions={reloadPartitions}
			/>
		)
	}

	return <div style={{ maxWidth: "900px", height: "100vh", margin: "0 auto" }}>{renderPage()}</div>
}
