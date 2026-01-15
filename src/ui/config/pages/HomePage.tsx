import { useEffect } from "react"
import type { GlobalConfig } from "@shared/config.schema"
import { PositionSelect } from "../components/PositionSelect"
import { SwitchField } from "../components/SwitchField"
import { ThemeSelect } from "../components/ThemeSelect"

interface HomePageProps {
	config: GlobalConfig
	configPath: string
	onChange: (config: GlobalConfig) => void
	onNavigate: (hash: string) => void
}

export function HomePage({ config, configPath, onChange, onNavigate }: HomePageProps) {
	useEffect(() => {
		document.title = "Bird - Settings"
	}, [])

	const updateTheme = (theme: GlobalConfig["theme"]) => {
		onChange({ ...config, theme })
	}

	const updateNavBar = (key: string, value: boolean | string) => {
		onChange({
			...config,
			navBar: { ...config.navBar, [key]: value },
		})
	}

	const apps = Object.entries(config.apps)

	return (
		<>
			<section className="section">
				<h2>Apparence</h2>
				<div className="field">
					<span className="field-label">Thème</span>
					<ThemeSelect value={config.theme} onChange={updateTheme} />
				</div>
			</section>

			<section className="section">
				<h2>Barre de navigation (global)</h2>
				<div className="field">
					<span className="field-label">Position</span>
					<PositionSelect value={config.navBar?.position || "top"} onChange={(v) => updateNavBar("position", v)} />
				</div>
				<SwitchField
					label="Visible"
					checked={config.navBar?.visible ?? true}
					onChange={(v) => updateNavBar("visible", v)}
				/>
				<SwitchField
					label="Masquage automatique"
					checked={config.navBar?.autoHide ?? false}
					onChange={(v) => updateNavBar("autoHide", v)}
				/>
				<SwitchField
					label="URL modifiable"
					checked={config.navBar?.urlEditable ?? true}
					onChange={(v) => updateNavBar("urlEditable", v)}
				/>
				<SwitchField
					label="Boutons précédent/suivant"
					checked={config.navBar?.showBackForward ?? true}
					onChange={(v) => updateNavBar("showBackForward", v)}
				/>
				<SwitchField
					label="Bouton recharger"
					checked={config.navBar?.showReload ?? true}
					onChange={(v) => updateNavBar("showReload", v)}
				/>
			</section>

			<section className="section">
				<h2>Applications</h2>
				{apps.length === 0 ? (
					<p style={{ color: "#666", fontSize: 14 }}>Aucune application configurée</p>
				) : (
					<div className="app-list">
						{apps.map(([name, app]) => (
							<button key={name} type="button" className="app-item" onClick={() => onNavigate(`#app/${name}`)}>
								<div>
									<div className="app-name">{name}</div>
									<div className="app-url">{app.startUrl}</div>
								</div>
								<span>→</span>
							</button>
						))}
					</div>
				)}
			</section>

			<p className="config-path">Configuration : {configPath}</p>
		</>
	)
}
