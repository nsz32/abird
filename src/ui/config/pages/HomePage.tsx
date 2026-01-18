import { HStack, Text, VStack } from "@chakra-ui/react"
import type { BirdConfig, NavBarConfig } from "@shared/config.schema"
import type { EffectiveConfig, PartitionsState } from "@shared/types"
import { useTranslations } from "@ui/shared/hooks"
import { useEffect, useState } from "react"
import { AppList } from "../components/AppList"
import { ConfigSection } from "../components/ConfigSection"
import { CreateAppDialog } from "../components/CreateAppDialog"
import { NavBarConfigForm } from "../components/NavBarConfigForm"
import { PartitionList } from "../components/PartitionList"
import { ThemeSelect } from "../components/ThemeSelect"

interface HomePageProps {
	config: BirdConfig
	configPath: string
	effectiveConfig: EffectiveConfig | null
	onChange: (config: BirdConfig) => void
	onNavigate: (hash: string) => void
}

export function HomePage({ config, configPath, effectiveConfig, onChange, onNavigate }: HomePageProps) {
	const { t } = useTranslations()
	const [showCreateDialog, setShowCreateDialog] = useState(false)
	const [partitionsState, setPartitionsState] = useState<PartitionsState | null>(null)

	useEffect(() => {
		document.title = t("settings.title")
	}, [t])

	useEffect(() => {
		loadPartitions()
	}, [])

	const loadPartitions = async () => {
		const state = await window.bird.partition.list()
		setPartitionsState(state)
	}

	const updateTheme = (theme: BirdConfig["theme"]) => {
		onChange({ ...config, theme })
	}

	const updateNavBar = (key: keyof NavBarConfig, value: boolean | string) => {
		onChange({
			...config,
			navBar: { ...config.navBar, [key]: value },
		})
	}

	const handleCreateApp = async (name: string, startUrl: string) => {
		const isNewPartition = !partitionsState?.partitions.some((p) => p.name === name)
		if (isNewPartition) {
			await window.bird.partition.markFragile(name)
		}

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
		loadPartitions()
	}

	const handleDeletePartition = async (name: string) => {
		await window.bird.partition.delete(name)
		loadPartitions()
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

					<Text fontSize="xs" color="fg.muted">
						{t("settings.configPath")} : {configPath}
					</Text>
				</VStack>

				<VStack flex={1} align="stretch" gap={4}>
					<ConfigSection title={t("settings.apps")}>
						<AppList
							apps={config.apps}
							onSelect={(name) => onNavigate(`#app/${name}`)}
							onCreate={() => setShowCreateDialog(true)}
							onDelete={handleDeleteApp}
						/>
					</ConfigSection>

					<ConfigSection title={t("settings.partitions")}>
						{partitionsState && (
							<PartitionList
								partitions={partitionsState.partitions}
								activePartition={effectiveConfig?.partition || ""}
								onSelect={(name) => onNavigate(`#partition/${name}`)}
								onDelete={handleDeletePartition}
							/>
						)}
					</ConfigSection>
				</VStack>
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
