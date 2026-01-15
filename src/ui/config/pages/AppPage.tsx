import { Box, Heading, HStack, Input, Text, VStack } from "@chakra-ui/react"
import type { AppConfig, GlobalConfig } from "@shared/config.schema"
import { useEffect } from "react"
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
			<Box bg="bg.panel" p={4} borderRadius="lg">
				<Text>Application "{name}" non trouvée</Text>
			</Box>
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
		<VStack align="stretch" gap={4}>
			<Box bg="bg.panel" p={4} borderRadius="lg">
				<Heading size="md" mb={4}>Général</Heading>
				<HStack justify="space-between" py={2}>
					<Text fontSize="sm">URL de démarrage</Text>
					<Input size="sm" width="200px" value={app.startUrl} onChange={(e) => updateApp({ startUrl: e.target.value })} />
				</HStack>
				<HStack justify="space-between" py={2}>
					<Text fontSize="sm">Partition</Text>
					<Input size="sm" width="200px" value={app.partition} onChange={(e) => updateApp({ partition: e.target.value })} />
				</HStack>
				<HStack justify="space-between" py={2}>
					<Text fontSize="sm">Thème</Text>
					<ThemeSelect value={app.theme || "system"} onChange={(v) => updateApp({ theme: v })} />
				</HStack>
			</Box>

			<Box bg="bg.panel" p={4} borderRadius="lg">
				<Heading size="md" mb={4}>Barre de navigation</Heading>
				<HStack justify="space-between" py={2}>
					<Text fontSize="sm">Position</Text>
					<PositionSelect value={app.navBar?.position || "top"} onChange={(v) => updateNavBar("position", v)} />
				</HStack>
				<SwitchField label="Visible" checked={app.navBar?.visible ?? true} onChange={(v) => updateNavBar("visible", v)} />
				<SwitchField label="Masquage automatique" checked={app.navBar?.autoHide ?? false} onChange={(v) => updateNavBar("autoHide", v)} />
				<SwitchField label="URL modifiable" checked={app.navBar?.urlEditable ?? true} onChange={(v) => updateNavBar("urlEditable", v)} />
				<SwitchField label="Boutons précédent/suivant" checked={app.navBar?.showBackForward ?? true} onChange={(v) => updateNavBar("showBackForward", v)} />
				<SwitchField label="Bouton recharger" checked={app.navBar?.showReload ?? true} onChange={(v) => updateNavBar("showReload", v)} />
			</Box>
		</VStack>
	)
}
