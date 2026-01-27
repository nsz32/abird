import { Button, HStack, IconButton, Text, VStack } from "@chakra-ui/react"
import type { BirdConfig, DownloadConfig, NavBarConfig } from "@shared/config.schema"
import { normalizePartitionName } from "@shared/partition"
import { deriveInternalPattern } from "@shared/routing"
import type { DeployState, PartitionsState } from "@shared/types"
import { useTranslations } from "@ui/shared/hooks"
import { BrushCleaning, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import { AppList } from "../components/AppList"
import { ConfigSection } from "../components/ConfigSection"
import { CreateAppDialog } from "../components/CreateAppDialog"
import { DownloadsConfigForm } from "../components/DownloadsConfigForm"
import { NavBarConfigForm } from "../components/NavBarConfigForm"
import { PageHeader } from "../components/PageHeader"
import { PartitionList } from "../components/PartitionList"
import { SegmentSelect } from "../components/SegmentSelect"

interface HomePageProps {
	config: BirdConfig
	configPath: string
	partitionsState: PartitionsState
	deployState: DeployState
	activePartition: string | null
	onChange: (config: BirdConfig) => void
	onNavigate: (hash: string) => void
	reloadPartitions: () => Promise<void>
}

export function HomePage({ config, configPath, partitionsState, deployState, activePartition, onChange, onNavigate, reloadPartitions }: HomePageProps) {
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

	const updateDownloads = (key: keyof DownloadConfig, value: string | string[] | boolean | undefined) => {
		const newDownloads = { ...config.downloads, [key]: value }
		if (value === undefined) {
			delete newDownloads[key]
		}
		onChange({ ...config, downloads: newDownloads })
	}

	const handleCreateApp = async (name: string, startUrl: string) => {
		const internal = deriveInternalPattern(startUrl)
		const partitionName = normalizePartitionName(name)

		const newConfig: BirdConfig = {
			...config,
			apps: {
				...config.apps,
				[name]: { partition: partitionName, startUrl, routing: { rules: { [internal]: "internal" } } },
			},
		}

		// Ensure consistency: partition must exist in JSON
		if (!config.partitions?.[partitionName]) {
			newConfig.partitions = {
				...config.partitions,
				[partitionName]: {},
			}
		}

		onChange(newConfig)

		await reloadPartitions()
		setShowCreateDialog(false)
		onNavigate(`#app/${name}`)
	}

	const handleDeleteApp = async (name: string) => {
		const app = config.apps[name]

		await window.bird.deploy.undeploy(name)
		if (app.icon) {
			await window.bird.icons.delete(app.icon)
		}

		const { [name]: _, ...rest } = config.apps
		onChange({ ...config, apps: rest })
		reloadPartitions()
	}

	const handleDeletePartition = async (name: string) => {
		await window.bird.partition.delete(name)

		if (config.partitions[name]) {
			const { [name]: _, ...rest } = config.partitions
			onChange({ ...config, partitions: rest })
		}

		reloadPartitions()
	}

	const handleCleanAll = () => {
		if (!confirm(t("settings.cleanAllConfirm"))) return
		window.bird.app.cleanAll()
	}

	const appCount = Object.keys(config.apps).length
	const partitionCount = partitionsState.partitions.length

	const scrollColumnStyles = {
		overflowY: "auto" as const,
		minH: 0,
		pb: 6,
		pr: 2,
		css: {
			"&:not(:hover)": { scrollbarColor: "transparent transparent" },
		},
	}

	return (
		<PageHeader
			title={t("settings.title")}
			titleBadge={`v${__APP_VERSION__}`}
			leftInfo={t("settings.stats", { apps: appCount, partitions: partitionCount })}
			rightInfo={
				<HStack>
					{config.projectName && (
						<Text>
							{t("settings.project")} : {config.projectName}
						</Text>
					)}
					<Button variant="ghost" size="xs" colorPalette="red" onClick={handleCleanAll}>
						<BrushCleaning size={14} />
						{t("settings.cleanAll")}
					</Button>
				</HStack>
			}
			actions={
				<Text fontSize="sm" color="fg.muted">
					{configPath}
				</Text>
			}
			noScroll
		>
			<HStack align="stretch" gap={4} h="100%">
				<VStack flex={1} align="stretch" gap={4} {...scrollColumnStyles}>
					<ConfigSection title={t("settings.appearance")}>
						<HStack justify="space-between" py={2}>
							<Text fontSize="sm">{t("settings.theme")}</Text>
							<SegmentSelect
								value={config.theme}
								options={[
									{ value: "system", label: t("theme.system") },
									{ value: "light", label: t("theme.light") },
									{ value: "dark", label: t("theme.dark") },
								]}
								onChange={updateTheme}
							/>
						</HStack>
					</ConfigSection>

					<ConfigSection title={t("settings.navbar")}>
						<NavBarConfigForm mode="global" config={config.navBar || {}} onChange={updateNavBar} />
					</ConfigSection>

					<ConfigSection title={t("settings.downloads")}>
						<DownloadsConfigForm mode="global" config={config.downloads || {}} onChange={updateDownloads} />
					</ConfigSection>
				</VStack>

				<VStack flex={1} align="stretch" gap={4} {...scrollColumnStyles}>
					<ConfigSection title={t("settings.apps")}>
						<AppList
							apps={config.apps}
							deployState={deployState}
							onSelect={(name) => onNavigate(`#app/${name}`)}
							onCreate={() => setShowCreateDialog(true)}
							onDelete={handleDeleteApp}
						/>
					</ConfigSection>

					<ConfigSection
						title={t("settings.partitions")}
						hint={t("settings.partitionsHint")}
						headerAction={
							<IconButton aria-label={t("settings.reloadPartitions")} variant="ghost" size="xs" onClick={reloadPartitions}>
								<RefreshCw size={14} />
							</IconButton>
						}
					>
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
