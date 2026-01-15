import type { GlobalConfig } from "@shared/config.schema"
import { useEffect, useState } from "react"
import { AppPage } from "./pages/AppPage"
import { HomePage } from "./pages/HomePage"
import { useHashRouter } from "./useHashRouter"
import "./styles.css"

export function App() {
	const { route, navigate, goBack } = useHashRouter()
	const [config, setConfig] = useState<GlobalConfig | null>(null)
	const [configPath, setConfigPath] = useState("")

	useEffect(() => {
		window.bird.settings.userconfig.read().then((result) => {
			setConfig(result.content as GlobalConfig)
			setConfigPath(result.path)
		})
	}, [])

	const handleChange = async (newConfig: GlobalConfig) => {
		setConfig(newConfig)
		const result = await window.bird.settings.userconfig.write(newConfig)
		if (!result.success) {
			console.error("Failed to save config:", result.errors)
		}
	}

	if (!config) {
		return <div className="container">Chargement...</div>
	}

	const isHome = route === "" || route === "#"
	const appMatch = route.match(/^#app\/(.+)$/)
	const appName = appMatch?.[1]

	const renderPage = () => {
		if (appName) {
			return <AppPage name={appName} config={config} onChange={handleChange} />
		}
		return <HomePage config={config} configPath={configPath} onChange={handleChange} onNavigate={navigate} />
	}

	return (
		<div className="container">
			<div className="header">
				{!isHome && (
					<button type="button" className="back-button" onClick={goBack}>
						←
					</button>
				)}
				<h1>{appName ? appName : "Bird Settings"}</h1>
			</div>
			{renderPage()}
		</div>
	)
}
