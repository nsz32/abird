import { Box, Button, HStack, IconButton, Image, Menu, Portal, Switch, Text, VStack } from "@chakra-ui/react"
import type { AppConfig, BirdConfig, NavBarConfig, RoutingAction } from "@shared/config.schema"
import { deriveInternalPattern } from "@shared/routing"
import type { PartitionsState } from "@shared/types"
import { useTranslations } from "@ui/shared/hooks"
import { ChevronDown, ExternalLink, Pencil } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { ConfigSection } from "../components/ConfigSection"
import { EditStartUrlDialog } from "../components/EditStartUrlDialog"
import { IconPickerDialog } from "../components/IconPickerDialog"
import { NavBarConfigForm } from "../components/NavBarConfigForm"
import { PageHeader } from "../components/PageHeader"
import { PartitionSelect } from "../components/PartitionSelect"
import { RenameDialog } from "../components/RenameDialog"
import { RoutingRulesEditor } from "../components/RoutingRulesEditor"
import { ThemeSelect } from "../components/ThemeSelect"

const DEFAULT_ICON = "/favicon.png"

interface AppPageProps {
	name: string
	config: BirdConfig
	partitionsState: PartitionsState
	onChange: (config: BirdConfig) => void
	reloadPartitions: () => Promise<void>
	onRename: (newName: string) => void
}

export function AppPage({ name, config, partitionsState, onChange, reloadPartitions, onRename }: AppPageProps) {
	const { t } = useTranslations()
	const [showRenameDialog, setShowRenameDialog] = useState(false)
	const [showEditUrlDialog, setShowEditUrlDialog] = useState(false)
	const [showIconPicker, setShowIconPicker] = useState(false)

	const [deploySupported, setDeploySupported] = useState(false)
	const [deployed, setDeployed] = useState(false)
	const [deploying, setDeploying] = useState(false)
	const [launchSupported, setLaunchSupported] = useState(false)
	const prevIconRef = useRef<string | undefined>(undefined)

	const [iconData, setIconData] = useState<string | null>(null)
	const [iconSize, setIconSize] = useState<{ w: number; h: number } | null>(null)

	const app = config.apps[name]

	useEffect(() => {
		document.title = `Bird - ${name}`
		prevIconRef.current = undefined
		setIconData(null)
		setIconSize(null)
	}, [name])

	useEffect(() => {
		if (app?.icon) {
			window.bird.icons.getData(app.icon).then(setIconData)
		} else {
			setIconData(null)
		}
	}, [app?.icon])

	useEffect(() => {
		window.bird.deploy.isSupported().then(setDeploySupported)
		window.bird.app.isLaunchSupported().then(setLaunchSupported)
	}, [])

	useEffect(() => {
		if (deploySupported) {
			window.bird.deploy.getStatus(name).then(setDeployed)
		}
	}, [name, deploySupported])

	// Auto-redeploy when icon changes
	const appIcon = app?.icon
	useEffect(() => {
		if (!deployed) return

		const prevIcon = prevIconRef.current
		prevIconRef.current = appIcon

		if (prevIcon === undefined) return
		if (prevIcon === appIcon) return

		window.bird.deploy.deploy(name).catch((err) => {
			console.error("Failed to redeploy after icon change:", err)
		})
	}, [appIcon, deployed, name])

	if (!app) {
		return (
			<ConfigSection title={name}>
				<Text>{t("app.notFound")}</Text>
			</ConfigSection>
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

	const handleStartUrlSave = (newUrl: string, newRules: Record<string, RoutingAction>) => {
		const hasRules = Object.keys(newRules).length > 0
		updateApp({
			startUrl: newUrl,
			routing: hasRules ? { rules: newRules } : undefined,
		})
	}

	const handlePartitionChange = async (newPartition: string) => {
		const isNewPartition = !partitionsState.partitions.some((p) => p.name === newPartition)
		if (isNewPartition) {
			await window.bird.partition.markFragile(newPartition)
		}

		updateApp({ partition: newPartition })
		await reloadPartitions()
	}

	const updateNavBar = (key: keyof NavBarConfig, value: boolean | string | undefined) => {
		const newNavBar = { ...app.navBar, [key]: value }

		if (value === undefined) {
			delete newNavBar[key]
		}

		const hasValues = Object.keys(newNavBar).length > 0
		updateApp({ navBar: hasValues ? newNavBar : undefined })
	}

	const updateRoutingRules = (rules: Record<string, RoutingAction>) => {
		const hasRules = Object.keys(rules).length > 0
		updateApp({ routing: hasRules ? { rules } : undefined })
	}

	const handleSelectIcon = async (base64: string) => {
		try {
			const filename = await window.bird.icons.save(name, base64, app.icon)
			updateApp({ icon: filename })
		} catch (err) {
			console.error("Failed to save icon:", err)
		}
	}

	const handleImportIcon = async () => {
		try {
			const filename = await window.bird.icons.importFile(name, app.icon)
			if (filename) {
				updateApp({ icon: filename })
			}
		} catch (err) {
			console.error("Failed to import icon:", err)
		}
	}

	const handleRemoveIcon = async () => {
		if (app.icon) {
			await window.bird.icons.delete(app.icon)
		}
		updateApp({ icon: undefined })
	}

	const handleIconLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
		const img = e.currentTarget
		setIconSize({ w: img.naturalWidth, h: img.naturalHeight })
	}

	const handleDeploy = async () => {
		if (deploying) return
		setDeploying(true)
		try {
			await window.bird.deploy.deploy(name)
			setDeployed(true)
		} catch (err) {
			console.error("Failed to deploy:", err)
		} finally {
			setDeploying(false)
		}
	}

	const handleUndeploy = async () => {
		if (deploying) return
		setDeploying(true)
		try {
			await window.bird.deploy.undeploy(name)
			setDeployed(false)
		} catch (err) {
			console.error("Failed to undeploy:", err)
		} finally {
			setDeploying(false)
		}
	}

	const handleLaunch = async () => {
		if (!launchSupported) {
			alert(t("app.launchNotSupported"))
			return
		}
		try {
			await window.bird.app.launch(name)
		} catch (err) {
			console.error("Failed to launch app:", err)
		}
	}

	// Partitions disponibles : depuis l'état + depuis la config des apps
	const getAvailablePartitions = (): string[] => {
		const partitions = new Set<string>()

		for (const p of partitionsState.partitions) {
			partitions.add(p.name)
		}

		for (const appConfig of Object.values(config.apps)) {
			partitions.add(appConfig.partition)
		}

		return [...partitions].sort()
	}

	// Map partition -> apps qui l'utilisent
	const getPartitionUsage = (): Map<string, string[]> => {
		const usage = new Map<string, string[]>()
		for (const [appName, appConfig] of Object.entries(config.apps)) {
			const partition = appConfig.partition
			if (!usage.has(partition)) {
				usage.set(partition, [])
			}
			usage.get(partition)?.push(appName)
		}
		return usage
	}

	const existingNames = [...Object.keys(config.apps), ...Object.keys(config.partitions || {})]

	const headerActions = (
		<Button variant="outline" size="sm" onClick={handleLaunch}>
			<ExternalLink size={16} />
			{t("app.launch")}
		</Button>
	)

	const rightInfo = deploySupported && (
		<HStack gap={2}>
			<Switch.Root colorPalette="blue" checked={deployed} disabled={deploying} onCheckedChange={(e) => (e.checked ? handleDeploy() : handleUndeploy())}>
				<Switch.HiddenInput />
				<Switch.Control>
					<Switch.Thumb />
				</Switch.Control>
			</Switch.Root>
			<Text>{deployed ? t("app.shortcutCreated") : t("app.shortcutNotCreated")}</Text>
		</HStack>
	)

	const defaultPattern = deriveInternalPattern(app.startUrl)

	return (
		<PageHeader
			title={name}
			leftInfo={app.startUrl}
			rightInfo={rightInfo}
			actions={headerActions}
			onRename={() => setShowRenameDialog(true)}
			renameLabel={t("app.rename")}
		>
			<VStack align="stretch" gap={4}>
				<ConfigSection title={t("app.general")}>
					<HStack justify="space-between" py={2}>
						<Text fontSize="sm">{t("app.startUrl")}</Text>
						<HStack gap={2}>
							<Text fontSize="sm" fontFamily="mono">
								{app.startUrl}
							</Text>
							<IconButton aria-label={t("app.editUrl")} variant="ghost" size="xs" onClick={() => setShowEditUrlDialog(true)}>
								<Pencil size={14} />
							</IconButton>
						</HStack>
					</HStack>
					<HStack justify="space-between" py={2}>
						<Text fontSize="sm">{t("app.partition")}</Text>
						<PartitionSelect
							value={app.partition}
							partitions={getAvailablePartitions()}
							partitionUsage={getPartitionUsage()}
							currentAppName={name}
							onChange={handlePartitionChange}
						/>
					</HStack>
					<HStack justify="space-between" py={2}>
						<Text fontSize="sm">{t("app.icon")}</Text>
						<HStack gap={3}>
							<HStack gap={2}>
								<Box w="32px" h="32px" borderRadius="md" overflow="hidden">
									<Image src={iconData || DEFAULT_ICON} alt="App icon" title={app.icon} w="32px" h="32px" objectFit="contain" onLoad={handleIconLoad} />
								</Box>
								{app.icon && iconSize && (
									<Text fontSize="xs" color="fg.muted">
										{iconSize.w}x{iconSize.h}
									</Text>
								)}
							</HStack>

							<Menu.Root>
								<Menu.Trigger asChild>
									<Button size="sm" variant="outline">
										<ChevronDown size={16} />
									</Button>
								</Menu.Trigger>
								<Portal>
									<Menu.Positioner>
										<Menu.Content minWidth="180px">
											<Menu.Item value="fetch" onSelect={() => setShowIconPicker(true)} disabled={!app.startUrl}>
												{t("app.fetchIcons")}
											</Menu.Item>
											<Menu.Item value="import" onSelect={handleImportIcon}>
												{t("app.importIcon")}
											</Menu.Item>
											{app.icon && (
												<>
													<Menu.Separator />
													<Menu.Item value="remove" onSelect={handleRemoveIcon}>
														{t("app.useDefaultIcon")}
													</Menu.Item>
												</>
											)}
										</Menu.Content>
									</Menu.Positioner>
								</Portal>
							</Menu.Root>
						</HStack>
					</HStack>
				</ConfigSection>

				<ConfigSection title={t("app.routing")}>
					<RoutingRulesEditor rules={app.routing?.rules || {}} onChange={updateRoutingRules} defaultPattern={defaultPattern} />
				</ConfigSection>

				<ConfigSection title={t("settings.appearance")}>
					<HStack justify="space-between" py={2}>
						<HStack gap={1}>
							<Text fontSize="sm">{t("settings.theme")}</Text>
							{!app.theme && (
								<Text fontSize="xs" color="fg.muted">
									{t("inherit.inherited")}
								</Text>
							)}
						</HStack>
						<HStack gap={2}>
							{app.theme && (
								<IconButton
									aria-label={t("inherit.reset")}
									variant="ghost"
									size="xs"
									onClick={() => updateApp({ theme: undefined })}
									title={t("inherit.reset")}
								>
									↺
								</IconButton>
							)}
							<ThemeSelect value={app.theme || config.theme || "system"} onChange={(v) => updateApp({ theme: v })} />
						</HStack>
					</HStack>
				</ConfigSection>

				<ConfigSection title={t("app.navbar")}>
					<NavBarConfigForm mode="app" config={app.navBar || {}} defaults={config.navBar || {}} onChange={updateNavBar} />
				</ConfigSection>
			</VStack>

			<EditStartUrlDialog
				isOpen={showEditUrlDialog}
				currentUrl={app.startUrl}
				rules={app.routing?.rules || {}}
				onClose={() => setShowEditUrlDialog(false)}
				onSave={handleStartUrlSave}
			/>

			<RenameDialog
				isOpen={showRenameDialog}
				title={t("app.renameTitle")}
				currentName={name}
				existingNames={existingNames}
				onClose={() => setShowRenameDialog(false)}
				onRename={onRename}
			/>

			<IconPickerDialog
				isOpen={showIconPicker}
				startUrl={app.startUrl}
				partition={app.partition}
				onClose={() => setShowIconPicker(false)}
				onSelect={handleSelectIcon}
			/>
		</PageHeader>
	)
}
