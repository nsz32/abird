import { useEffect } from "react"
import type { AppConfig, GlobalConfig } from "@shared/config.schema"
import { PositionSelect } from "../components/PositionSelect"
import { SwitchField } from "../components/SwitchField"
import { ThemeSelect } from "../components/ThemeSelect"

interface AppPageProps {
	name: string
	config: GlobalConfig
	onChange: (config: GlobalConfig) => void
}

export function AppPage({ name, config, onChange }: AppPageProps) {
	useEffect(() => {
		document.title = `Bird - ${name}`
	}, [name])

	const app = config.apps[name]

	if (!app) {
		return (
			<div className="section">
				<p>Application "{name}" non trouvée</p>
			</div>
		)
	}

	const updateApp = (updates: Partial<AppConfig>) => {
		onChange({
			...config,
			apps: {
				...config.apps,
				[name]: { ...app, ...updates },
			},
		})
	}

	const updateNavBar = (key: string, value: boolean | string) => {
		updateApp({
			navBar: { ...app.navBar, [key]: value },
		})
	}

	return (
		<>
			<section className="section">
				<h2>Général</h2>
				<div className="field">
					<span className="field-label">URL de démarrage</span>
					<input
						type="text"
						className="input"
						value={app.startUrl}
						onChange={(e) => updateApp({ startUrl: e.target.value })}
					/>
				</div>
				<div className="field">
					<span className="field-label">Partition</span>
					<input
						type="text"
						className="input"
						value={app.partition}
						onChange={(e) => updateApp({ partition: e.target.value })}
					/>
				</div>
				<div className="field">
					<span className="field-label">Thème</span>
					<ThemeSelect value={app.theme || "system"} onChange={(v) => updateApp({ theme: v })} />
				</div>
			</section>

			<section className="section">
				<h2>Barre de navigation</h2>
				<div className="field">
					<span className="field-label">Position</span>
					<PositionSelect value={app.navBar?.position || "top"} onChange={(v) => updateNavBar("position", v)} />
				</div>
				<SwitchField
					label="Visible"
					checked={app.navBar?.visible ?? true}
					onChange={(v) => updateNavBar("visible", v)}
				/>
				<SwitchField
					label="Masquage automatique"
					checked={app.navBar?.autoHide ?? false}
					onChange={(v) => updateNavBar("autoHide", v)}
				/>
				<SwitchField
					label="URL modifiable"
					checked={app.navBar?.urlEditable ?? true}
					onChange={(v) => updateNavBar("urlEditable", v)}
				/>
				<SwitchField
					label="Boutons précédent/suivant"
					checked={app.navBar?.showBackForward ?? true}
					onChange={(v) => updateNavBar("showBackForward", v)}
				/>
				<SwitchField
					label="Bouton recharger"
					checked={app.navBar?.showReload ?? true}
					onChange={(v) => updateNavBar("showReload", v)}
				/>
			</section>
		</>
	)
}
