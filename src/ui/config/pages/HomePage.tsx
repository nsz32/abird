import { HStack, Text, VStack } from "@chakra-ui/react"
import type { BirdConfig, NavBarConfig } from "@shared/config.schema"
import { deriveInternalPattern } from "@shared/routing"
import type { PartitionsState } from "@shared/types"
import { useTranslations } from "@ui/shared/hooks"
import { useEffect, useState } from "react"
import { AppList } from "../components/AppList"
import { ConfigSection } from "../components/ConfigSection"
import { CreateAppDialog } from "../components/CreateAppDialog"
import { NavBarConfigForm } from "../components/NavBarConfigForm"
import { PageHeader } from "../components/PageHeader"
import { PartitionList } from "../components/PartitionList"
import { ThemeSelect } from "../components/ThemeSelect"

interface HomePageProps {
	config: BirdConfig
	configPath: string
	partitionsState: PartitionsState
	activePartition: string
	onChange: (config: BirdConfig) => void
	onNavigate: (hash: string) => void
	reloadPartitions: () => Promise<void>
}

export function HomePage({ config, configPath, partitionsState, activePartition, onChange, onNavigate, reloadPartitions }: HomePageProps) {
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

	const handleCreateApp = async (name: string, startUrl: string) => {
		const isNewPartition = !partitionsState.partitions.some((p) => p.name === name)
		if (isNewPartition) {
			await window.bird.partition.markFragile(name)
		}

		const internal = deriveInternalPattern(startUrl)

		const newConfig: BirdConfig = {
			...config,
			apps: {
				...config.apps,
				[name]: { partition: name, startUrl, routing: { rules: { [internal]: "internal" } } },
			},
		}

		// Assurer la cohérence : la partition doit exister dans le JSON
		if (!config.partitions?.[name]) {
			newConfig.partitions = {
				...config.partitions,
				[name]: {},
			}
		}

		onChange(newConfig)

		await reloadPartitions()
		setShowCreateDialog(false)
		onNavigate(`#app/${name}`)
	}

	const handleDeleteApp = (name: string) => {
		const { [name]: _, ...rest } = config.apps
		onChange({ ...config, apps: rest })
		reloadPartitions()
	}

	const handleDeletePartition = async (name: string) => {
		await window.bird.partition.delete(name)

		if (config.partitions?.[name]) {
			const { [name]: _, ...rest } = config.partitions
			onChange({ ...config, partitions: Object.keys(rest).length > 0 ? rest : undefined })
		}

		reloadPartitions()
	}

	const appCount = Object.keys(config.apps).length
	const partitionCount = partitionsState.partitions.length

	return (
		<PageHeader title={t("settings.title")} leftInfo={`${appCount} apps · ${partitionCount} partitions`} rightInfo={configPath}>
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
						<PartitionList
							partitions={partitionsState.partitions}
							activePartition={activePartition}
							onSelect={(name) => onNavigate(`#partition/${name}`)}
							onDelete={handleDeletePartition}
						/>
					</ConfigSection>
				</VStack>
			</HStack>

			<CreateAppDialog
				isOpen={showCreateDialog}
				onClose={() => setShowCreateDialog(false)}
				onCreate={handleCreateApp}
				existingNames={Object.keys(config.apps)}
			/>
		</PageHeader>
	)
}
