import { Badge, Button, HStack, Spinner, Text, VStack } from "@chakra-ui/react"
import type { BirdConfig, CacheCleanupConfig, PartitionConfig } from "@shared/config.schema"
import type { PartitionsState } from "@shared/types"
import { useTranslations } from "@ui/shared/hooks"
import { RotateCw, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { ConfigSection } from "../components/ConfigSection"
import { NumberField } from "../components/NumberField"
import { PageHeader } from "../components/PageHeader"
import { RenameDialog } from "../components/RenameDialog"
import { SwitchField } from "../components/SwitchField"
import { formatBytes } from "../utils/format"
import { getExistingPartitionNames } from "../utils/partitions"

interface PartitionPageProps {
	name: string
	config: BirdConfig
	partitionsState: PartitionsState
	activePartition: string | null
	onChange: (config: BirdConfig) => void
	onNavigate: (hash: string) => void
	reloadPartitions: () => Promise<void>
	onRename: (newName: string) => void
}

export function PartitionPage({ name, config, partitionsState, activePartition, onChange, onNavigate, reloadPartitions, onRename }: PartitionPageProps) {
	const { t } = useTranslations()
	const [cleaning, setCleaning] = useState(false)
	const [resetting, setResetting] = useState(false)
	const [showRenameDialog, setShowRenameDialog] = useState(false)

	const partition = partitionsState.partitions.find((p) => p.name === name)
	const isActive = name === activePartition
	const canCleanup = partition?.hasPhysical && !isActive
	const canReset = partition?.hasPhysical && !isActive
	const partitionConfig = config.partitions?.[name] as PartitionConfig | undefined
	const adBlockEnabled = partitionConfig?.adBlockEnabled !== false
	const cacheCleanup = partitionConfig?.cacheCleanup
	const cacheCleanupEnabled = cacheCleanup?.maxFileSizeMB !== undefined || cacheCleanup?.maxAgeDays !== undefined

	useEffect(() => {
		document.title = `Bird - ${name}`
	}, [name])

	const handleCleanup = async () => {
		if (!confirm(t("partition.confirmCleanup").replace("{name}", name))) return

		setCleaning(true)
		try {
			await window.bird.partition.cleanup(name)
		} catch (err) {
			console.error("Failed to cleanup partition:", err)
		} finally {
			setCleaning(false)
		}
	}

	const handleReset = async () => {
		if (!confirm(t("partition.confirmReset").replace("{name}", name))) return

		setResetting(true)
		try {
			await window.bird.partition.reset(name)
			reloadPartitions()
		} catch (err) {
			console.error("Failed to reset partition:", err)
		} finally {
			setResetting(false)
		}
	}

	const updatePartitionConfig = (updates: Partial<PartitionConfig>) => {
		const currentPartitionConfig = config.partitions?.[name] || {}
		onChange({
			...config,
			partitions: {
				...config.partitions,
				[name]: { ...currentPartitionConfig, ...updates },
			},
		})
	}

	const handleAdBlockChange = (enabled: boolean) => {
		updatePartitionConfig({ adBlockEnabled: enabled })
	}

	const handleCacheCleanupChange = (updates: Partial<CacheCleanupConfig>) => {
		const newCacheCleanup = { ...cacheCleanup, ...updates }
		const isEmpty = newCacheCleanup.maxFileSizeMB === undefined && newCacheCleanup.maxAgeDays === undefined
		updatePartitionConfig({ cacheCleanup: isEmpty ? undefined : newCacheCleanup })
	}

	if (!partition) {
		return (
			<ConfigSection title={name}>
				<Text>{t("partition.notFound")}</Text>
			</ConfigSection>
		)
	}

	const sizeInfo = partition.diskSize !== undefined ? formatBytes(partition.diskSize) : t("partition.notCreated")
	const existingPartitionNames = getExistingPartitionNames(config, partitionsState)

	const headerActions = (canCleanup || canReset) && (
		<HStack gap={2}>
			{canCleanup && (
				<Button variant="outline" size="sm" onClick={handleCleanup} disabled={cleaning}>
					{cleaning ? <Spinner size="sm" /> : <><Trash2 size={16} /> {t("partition.cleanup")}</>}
				</Button>
			)}
			{canReset && (
				<Button variant="ghost" size="sm" colorPalette="red" onClick={handleReset} disabled={resetting}>
					{resetting ? <Spinner size="sm" /> : <><RotateCw size={16} /> {t("partition.reset")}</>}
				</Button>
			)}
		</HStack>
	)

	return (
		<PageHeader
			title={name}
			leftInfo={sizeInfo}
			actions={headerActions}
			onRename={() => setShowRenameDialog(true)}
			renameLabel={t("partition.rename")}
		>
			<VStack align="stretch" gap={4}>
				<ConfigSection title={t("partition.details")}>
					<HStack gap={2} py={2}>
						{isActive && <Badge colorPalette="blue">{t("partition.active")}</Badge>}
						{partition.usedByApps.length === 0 && <Badge colorPalette="orange">{t("partition.orphan")}</Badge>}
						{!partition.hasPhysical && <Badge colorPalette="gray">{t("partition.notCreated")}</Badge>}
						{partition.isFragile && <Badge colorPalette="purple">{t("partition.fragile")}</Badge>}
					</HStack>

					{partition.usedByApps.length > 0 && (
						<VStack align="start" py={2} gap={1}>
							<Text fontSize="sm" fontWeight="medium">
								{t("partition.usedBy")}
							</Text>
							{partition.usedByApps.map((appName) => (
								<Text
									key={appName}
									fontSize="sm"
									color="blue.500"
									cursor="pointer"
									_hover={{ textDecoration: "underline" }}
									onClick={() => onNavigate(`#app/${appName}`)}
								>
									{appName}
								</Text>
							))}
						</VStack>
					)}

					<Text fontSize="xs" color="fg.muted" pt={2}>
						{t("partition.storagePath")}: {name}
					</Text>
				</ConfigSection>

				<ConfigSection title={t("partition.settings")}>
					<SwitchField label={t("partition.adBlockEnabled")} checked={adBlockEnabled} onChange={handleAdBlockChange} />
				</ConfigSection>

				<ConfigSection title={t("partition.cacheCleanup.title")} description={t("partition.cacheCleanup.description")}>
					<NumberField
						label={t("partition.cacheCleanup.maxFileSizeMB")}
						value={cacheCleanup?.maxFileSizeMB}
						onChange={(v) => handleCacheCleanupChange({ maxFileSizeMB: v })}
						placeholder="10"
					/>
					<NumberField
						label={t("partition.cacheCleanup.maxAgeDays")}
						value={cacheCleanup?.maxAgeDays}
						onChange={(v) => handleCacheCleanupChange({ maxAgeDays: v })}
						placeholder="30"
					/>
					{cacheCleanupEnabled && (
						<Text fontSize="xs" color="fg.muted" pt={2}>
							{t("partition.cacheCleanup.hint")}
						</Text>
					)}
				</ConfigSection>
			</VStack>

			<RenameDialog
				isOpen={showRenameDialog}
				title={t("partition.renameTitle")}
				currentName={name}
				existingNames={existingPartitionNames}
				onClose={() => setShowRenameDialog(false)}
				onRename={onRename}
			/>
		</PageHeader>
	)
}
