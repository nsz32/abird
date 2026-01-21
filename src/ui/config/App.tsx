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
	const { route, navigate, replace } = useHashRouter()
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

	const handleRenameApp = async (oldName: string, newName: string) => {
		const app = config.apps[oldName]
		if (!app) return

		const { [oldName]: _, ...restApps } = config.apps
		const newConfig: BirdConfig = {
			...config,
			apps: {
				...restApps,
				[newName]: app,
			},
		}

		await handleChange(newConfig)
		await reloadPartitions()
		replace(`#app/${newName}`)
	}

	const handleRenamePartition = async (oldName: string, newName: string) => {
		// Renommer le dossier physique d'abord (peut échouer si partition active)
		await window.bird.partition.rename(oldName, newName)

		const partitionConfig = config.partitions?.[oldName]

		// Mettre à jour toutes les apps qui utilisent cette partition
		const updatedApps = { ...config.apps }
		for (const [appName, appConfig] of Object.entries(updatedApps)) {
			if (appConfig.partition === oldName) {
				updatedApps[appName] = { ...appConfig, partition: newName }
			}
		}

		// Renommer la partition dans config.partitions
		const { [oldName]: _, ...restPartitions } = config.partitions || {}
		const newPartitions = partitionConfig ? { ...restPartitions, [newName]: partitionConfig } : { ...restPartitions, [newName]: {} }

		const newConfig: BirdConfig = {
			...config,
			apps: updatedApps,
			partitions: newPartitions,
		}

		await handleChange(newConfig)
		await reloadPartitions()
		replace(`#partition/${newName}`)
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
			return (
				<AppPage
					name={appName}
					config={config}
					partitionsState={partitionsState}
					onChange={handleChange}
					reloadPartitions={reloadPartitions}
					onRename={(newName) => handleRenameApp(appName, newName)}
				/>
			)
		}
		if (partitionName) {
			return (
				<PartitionPage
					name={partitionName}
					config={config}
					partitionsState={partitionsState}
					activePartition={effectiveConfig.partition}
					onChange={handleChange}
					onNavigate={navigate}
					reloadPartitions={reloadPartitions}
					onRename={(newName) => handleRenamePartition(partitionName, newName)}
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

	return <div style={{ maxWidth: "1000px", height: "100vh", margin: "0 auto" }}>{renderPage()}</div>
}
