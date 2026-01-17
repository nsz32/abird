import { Container, Heading, Spinner } from "@chakra-ui/react"
import type { BirdConfig } from "@shared/config.schema"
import { useEffect, useState } from "react"
import { AppPage } from "./pages/AppPage"
import { HomePage } from "./pages/HomePage"
import { useHashRouter } from "./useHashRouter"
import { useTranslations } from "./useTranslations"

export function App() {
	const { route, navigate } = useHashRouter()
	const { t, ready } = useTranslations()
	const [config, setConfig] = useState<BirdConfig | null>(null)
	const [configPath, setConfigPath] = useState("")

	useEffect(() => {
		window.bird.settings.userconfig.read().then((result) => {
			setConfig(result.content as BirdConfig)
			setConfigPath(result.path)
		})
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

	return (
		<Container maxW="900px" py={6}>
			<Heading size="lg" mb={6}>
				{appName || t("settings.title")}
			</Heading>
			{appName ? (
				<AppPage name={appName} config={config} onChange={handleChange} onNavigate={navigate} />
			) : (
				<HomePage config={config} configPath={configPath} onChange={handleChange} onNavigate={navigate} />
			)}
		</Container>
	)
}
