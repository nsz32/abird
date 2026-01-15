import { Box, Button, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import type { GlobalConfig } from "@shared/config.schema"
import { useEffect } from "react"
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
		<VStack align="stretch" gap={4}>
			<Box bg="bg.panel" p={4} borderRadius="lg">
				<Heading size="md" mb={4}>Apparence</Heading>
				<HStack justify="space-between">
					<Text fontSize="sm">Thème</Text>
					<ThemeSelect value={config.theme} onChange={updateTheme} />
				</HStack>
			</Box>

			<Box bg="bg.panel" p={4} borderRadius="lg">
				<Heading size="md" mb={4}>Barre de navigation (global)</Heading>
				<HStack justify="space-between" py={2}>
					<Text fontSize="sm">Position</Text>
					<PositionSelect value={config.navBar?.position || "top"} onChange={(v) => updateNavBar("position", v)} />
				</HStack>
				<SwitchField label="Visible" checked={config.navBar?.visible ?? true} onChange={(v) => updateNavBar("visible", v)} />
				<SwitchField label="Masquage automatique" checked={config.navBar?.autoHide ?? false} onChange={(v) => updateNavBar("autoHide", v)} />
				<SwitchField label="URL modifiable" checked={config.navBar?.urlEditable ?? true} onChange={(v) => updateNavBar("urlEditable", v)} />
				<SwitchField label="Boutons précédent/suivant" checked={config.navBar?.showBackForward ?? true} onChange={(v) => updateNavBar("showBackForward", v)} />
				<SwitchField label="Bouton recharger" checked={config.navBar?.showReload ?? true} onChange={(v) => updateNavBar("showReload", v)} />
			</Box>

			<Box bg="bg.panel" p={4} borderRadius="lg">
				<Heading size="md" mb={4}>Applications</Heading>
				{apps.length === 0 ? (
					<Text fontSize="sm" color="fg.muted">Aucune application configurée</Text>
				) : (
					<VStack align="stretch" gap={2}>
						{apps.map(([name, app]) => (
							<Button key={name} variant="ghost" justifyContent="space-between" onClick={() => onNavigate(`#app/${name}`)}>
								<Box textAlign="left">
									<Text fontWeight="medium">{name}</Text>
									<Text fontSize="xs" color="fg.muted">{app.startUrl}</Text>
								</Box>
								<Text>→</Text>
							</Button>
						))}
					</VStack>
				)}
			</Box>

			<Text fontSize="xs" color="fg.muted">Configuration : {configPath}</Text>
		</VStack>
	)
}
