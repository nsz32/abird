import { Button, Flex, Group, HStack, Image, Input, InputAddon, Spinner, Switch, Text, VStack } from "@chakra-ui/react"
import { ExternalLink } from "lucide-react"
import type { AppConfig, BirdConfig, NavBarConfig, RoutingAction } from "@shared/config.schema"
import type { IconResult, PartitionsState } from "@shared/types"
import { useTranslations } from "@ui/shared/hooks"
import { useEffect, useRef, useState } from "react"
import { ConfigSection } from "../components/ConfigSection"
import { NavBarConfigForm } from "../components/NavBarConfigForm"
import { PageHeader } from "../components/PageHeader"
import { PartitionSelect } from "../components/PartitionSelect"
import { RenameDialog } from "../components/RenameDialog"
import { RoutingRulesEditor } from "../components/RoutingRulesEditor"
import { ThemeSelect } from "../components/ThemeSelect"

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
	const [icons, setIcons] = useState<IconResult[]>([])
	const [iconSizes, setIconSizes] = useState<Record<string, { w: number; h: number }>>({})
	const [fetchingIcons, setFetchingIcons] = useState(false)
	const [savingIcon, setSavingIcon] = useState(false)
	const [showRenameDialog, setShowRenameDialog] = useState(false)

	const [deploySupported, setDeploySupported] = useState(false)
	const [deployed, setDeployed] = useState(false)
	const [deploying, setDeploying] = useState(false)
	const [launchSupported, setLaunchSupported] = useState(false)
	const prevIconRef = useRef<string | undefined>(undefined)

	const app = config.apps[name]

	useEffect(() => {
		document.title = `Bird - ${name}`
		setIcons([])
		setIconSizes({})
		prevIconRef.current = undefined
	}, [name])

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

	const urlPath = app.startUrl.replace(/^https?:\/\//, "")

	const handleUrlChange = (value: string) => {
		const clean = value.replace(/^https?:\/\//, "")
		updateApp({ startUrl: `https://${clean}` })
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

	const handleFetchIcons = async () => {
		if (!app.startUrl) return
		setFetchingIcons(true)
		setIcons([])
		try {
			const result = await window.bird.icons.fetch(app.startUrl, app.partition)
			setIcons(result.icons)
		} catch (err) {
			console.error("Failed to fetch icons:", err)
		} finally {
			setFetchingIcons(false)
		}
	}

	const handleSelectIcon = async (base64: string) => {
		if (savingIcon) return
		setSavingIcon(true)
		try {
			const filename = await window.bird.icons.save(name, base64, app.icon)
			updateApp({ icon: filename })
		} catch (err) {
			console.error("Failed to save icon:", err)
		} finally {
			setSavingIcon(false)
		}
	}

	const handleImportIcon = async () => {
		if (savingIcon) return
		setSavingIcon(true)
		try {
			const filename = await window.bird.icons.importFile(name, app.icon)
			if (filename) {
				updateApp({ icon: filename })
			}
		} catch (err) {
			console.error("Failed to import icon:", err)
		} finally {
			setSavingIcon(false)
		}
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

	const handleImageLoad = (url: string, e: React.SyntheticEvent<HTMLImageElement>) => {
		const img = e.currentTarget
		setIconSizes((prev) => ({ ...prev, [url]: { w: img.naturalWidth, h: img.naturalHeight } }))
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
			<Switch.Root
				colorPalette="blue"
				checked={deployed}
				disabled={deploying}
				onCheckedChange={(e) => (e.checked ? handleDeploy() : handleUndeploy())}
			>
				<Switch.HiddenInput />
				<Switch.Control>
					<Switch.Thumb />
				</Switch.Control>
			</Switch.Root>
			<Text>{deployed ? t("app.shortcutCreated") : t("app.shortcutNotCreated")}</Text>
		</HStack>
	)

	return (
		<PageHeader title={name} leftInfo={app.startUrl} rightInfo={rightInfo} actions={headerActions} onRename={() => setShowRenameDialog(true)} renameLabel={t("app.rename")}>
			<VStack align="stretch" gap={4}>
				<ConfigSection title={t("app.general")}>
					<HStack justify="space-between" py={2}>
						<Text fontSize="sm">{t("app.startUrl")}</Text>
						<Group attached width="280px">
							<InputAddon>https://</InputAddon>
							<Input size="sm" value={urlPath} onChange={(e) => handleUrlChange(e.target.value)} placeholder={t("app.urlPlaceholder")} />
						</Group>
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
						<Text fontSize="sm">{t("settings.theme")}</Text>
						<ThemeSelect value={app.theme || "system"} onChange={(v) => updateApp({ theme: v })} />
					</HStack>
					<HStack justify="space-between" py={2} align="flex-start">
						<Text fontSize="sm">{t("app.icon")}</Text>
						<VStack align="flex-end" gap={2}>
							<HStack gap={2}>
								<Button size="sm" onClick={handleFetchIcons} disabled={fetchingIcons || savingIcon || !app.startUrl}>
									{fetchingIcons ? <Spinner size="sm" /> : t("app.fetchIcons")}
								</Button>
								<Button size="sm" variant="outline" onClick={handleImportIcon} disabled={savingIcon}>
									{savingIcon ? <Spinner size="sm" /> : t("app.importIcon")}
								</Button>
							</HStack>
							{icons.length > 0 && (
								<Flex wrap="wrap" gap={3}>
									{icons.map((icon) => {
										const size = iconSizes[icon.url]
										return (
											<VStack
												key={icon.url}
												gap={1}
												p={2}
												borderRadius="md"
												border="1px solid"
												borderColor="border.subtle"
												cursor={savingIcon ? "wait" : "pointer"}
												_hover={{ borderColor: "blue.500" }}
												onClick={() => handleSelectIcon(icon.url)}
												opacity={savingIcon ? 0.5 : 1}
											>
												<Image src={icon.url} alt={icon.source} onLoad={(e) => handleImageLoad(icon.url, e)} />
												<Text fontSize="xs" color="fg.muted">
													{size ? `${size.w}x${size.h}` : "..."}
												</Text>
											</VStack>
										)
									})}
								</Flex>
							)}
							{app.icon && (
								<Text fontSize="xs" color="fg.muted">
									{app.icon}
								</Text>
							)}
						</VStack>
					</HStack>
				</ConfigSection>

				<ConfigSection title={t("app.navbar")}>
					<NavBarConfigForm mode="app" config={app.navBar || {}} defaults={config.navBar || {}} onChange={updateNavBar} />
				</ConfigSection>

				<ConfigSection title={t("app.routing")}>
					<RoutingRulesEditor rules={app.routing?.rules || {}} onChange={updateRoutingRules} />
				</ConfigSection>
			</VStack>

			<RenameDialog
				isOpen={showRenameDialog}
				title={t("app.renameTitle")}
				currentName={name}
				existingNames={existingNames}
				onClose={() => setShowRenameDialog(false)}
				onRename={onRename}
			/>
		</PageHeader>
	)
}
