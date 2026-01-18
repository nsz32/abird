import { Container, Heading, Spinner } from "@chakra-ui/react"
import type { BirdConfig } from "@shared/config.schema"
import type { EffectiveConfig } from "@shared/types"
import { useEffect, useState } from "react"
import { AppPage } from "./pages/AppPage"
import { HomePage } from "./pages/HomePage"
import { PartitionPage } from "./pages/PartitionPage"
import { useHashRouter } from "./useHashRouter"
import { useTranslations } from "./useTranslations"

export function App() {
	const { route, navigate } = useHashRouter()
	const { t, ready } = useTranslations()
	const [config, setConfig] = useState<BirdConfig | null>(null)
	const [configPath, setConfigPath] = useState("")
	const [effectiveConfig, setEffectiveConfig] = useState<EffectiveConfig | null>(null)

	useEffect(() => {
		window.bird.settings.userconfig.read().then((result) => {
			setConfig(result.content as BirdConfig)
			setConfigPath(result.path)
		})
		window.bird.config.get().then(setEffectiveConfig)
	}, [])

	const handleChange = async (newConfig: BirdConfig) => {
		setConfig(newConfig)
		const result = await window.bird.settings.userconfig.write(newConfig)
		if (!result.success) {
			console.error("Failed to save config:", result.errors)
		}
	}

	if (!config || !ready) {
		return (
			<Container centerContent py={10}>
				<Spinner />
			</Container>
		)
	}

	const appMatch = route.match(/^#app\/(.+)$/)
	const appName = appMatch?.[1]
	const partitionMatch = route.match(/^#partition\/(.+)$/)
	const partitionName = partitionMatch?.[1]

	const getTitle = () => {
		if (appName) return appName
		if (partitionName) return partitionName
		return t("settings.title")
	}

	const renderPage = () => {
		if (appName) {
			return <AppPage name={appName} config={config} onChange={handleChange} onNavigate={navigate} />
		}
		if (partitionName) {
			return (
				<PartitionPage
					name={partitionName}
					activePartition={effectiveConfig?.partition || ""}
					onNavigate={navigate}
				/>
			)
		}
		return (
			<HomePage
				config={config}
				configPath={configPath}
				effectiveConfig={effectiveConfig}
				onChange={handleChange}
				onNavigate={navigate}
			/>
		)
	}

	return (
		<Container maxW="900px" py={6}>
			<Heading size="lg" mb={6}>
				{getTitle()}
			</Heading>
			{renderPage()}
		</Container>
	)
}
