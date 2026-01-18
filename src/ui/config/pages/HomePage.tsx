import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react"
import type { BirdConfig, NavBarConfig } from "@shared/config.schema"
import { useTranslations } from "@ui/shared/hooks"
import { useEffect, useState } from "react"
import { AppList } from "../components/AppList"
import { ConfigSection } from "../components/ConfigSection"
import { CreateAppDialog } from "../components/CreateAppDialog"
import { NavBarConfigForm } from "../components/NavBarConfigForm"
import { ThemeSelect } from "../components/ThemeSelect"

interface HomePageProps {
	config: BirdConfig
	configPath: string
	onChange: (config: BirdConfig) => void
	onNavigate: (hash: string) => void
}

export function HomePage({ config, configPath, onChange, onNavigate }: HomePageProps) {
	const { t } = useTranslations()
	const [showCreateDialog, setShowCreateDialog] = useState(false)

	useEffect(() => {
		document.title = t("settings.title")
	}, [t])

	const updateTheme = (theme: BirdConfig["theme"]) => {
		onChange({ ...config, theme })
	}

	const updateNavBar = (key: keyof NavBarConfig, value: boolean | string) => {
		onChange({
			...config,
			navBar: { ...config.navBar, [key]: value },
		})
	}

	const handleCreateApp = (name: string, startUrl: string) => {
		onChange({
			...config,
			apps: {
				...config.apps,
				[name]: { partition: name, startUrl },
			},
		})
		setShowCreateDialog(false)
		onNavigate(`#app/${name}`)
	}

	const handleDeleteApp = (name: string) => {
		const { [name]: _, ...rest } = config.apps
		onChange({ ...config, apps: rest })
	}

	return (
		<>
			<HStack align="start" gap={6}>
				<VStack flex={1} align="stretch" gap={4}>
					<ConfigSection title={t("settings.appearance")}>
						<HStack justify="space-between" py={2}>
							<Text fontSize="sm">{t("settings.theme")}</Text>
							<ThemeSelect value={config.theme} onChange={updateTheme} />
						</HStack>
					</ConfigSection>

					<ConfigSection title={t("settings.navbar")}>
						<NavBarConfigForm mode="global" config={config.navBar || {}} onChange={updateNavBar} />
					</ConfigSection>

					<ConfigSection title={t("settings.partitions")}>
						<HStack justify="space-between" py={2}>
							<Text fontSize="sm">{t("settings.managePartitions")}</Text>
							<Button size="sm" variant="outline" onClick={() => onNavigate("#partitions")}>
								{t("settings.openPartitions")}
							</Button>
						</HStack>
					</ConfigSection>

					<Text fontSize="xs" color="fg.muted">
						{t("settings.configPath")} : {configPath}
					</Text>
				</VStack>

				<Box flex={1}>
					<ConfigSection title={t("settings.apps")}>
						<AppList
							apps={config.apps}
							onSelect={(name) => onNavigate(`#app/${name}`)}
							onCreate={() => setShowCreateDialog(true)}
							onDelete={handleDeleteApp}
						/>
					</ConfigSection>
				</Box>
			</HStack>

			<CreateAppDialog
				isOpen={showCreateDialog}
				onClose={() => setShowCreateDialog(false)}
				onCreate={handleCreateApp}
				existingNames={Object.keys(config.apps)}
			/>
		</>
	)
}
