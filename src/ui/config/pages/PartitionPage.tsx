import { Badge, Button, HStack, Spinner, Text, VStack } from "@chakra-ui/react"
import type { PartitionsState } from "@shared/types"
import { useTranslations } from "@ui/shared/hooks"
import { useEffect, useState } from "react"
import { ConfigSection } from "../components/ConfigSection"
import { PageHeader } from "../components/PageHeader"

interface PartitionPageProps {
	name: string
	partitionsState: PartitionsState
	activePartition: string
	onNavigate: (hash: string) => void
	reloadPartitions: () => Promise<void>
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B"
	const k = 1024
	const sizes = ["B", "KB", "MB", "GB"]
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}

export function PartitionPage({ name, partitionsState, activePartition, onNavigate, reloadPartitions }: PartitionPageProps) {
	const { t } = useTranslations()
	const [size, setSize] = useState<number | null>(null)
	const [loadingSize, setLoadingSize] = useState(false)
	const [resetting, setResetting] = useState(false)

	const partition = partitionsState.partitions.find((p) => p.name === name)
	const isActive = name === activePartition
	const canReset = partition?.hasPhysical && !isActive

	useEffect(() => {
		document.title = `Bird - ${name}`
		setSize(null)
	}, [name])

	const handleLoadSize = async () => {
		setLoadingSize(true)
		try {
			const bytes = await window.bird.partition.getSize(name)
			setSize(bytes)
		} catch (err) {
			console.error("Failed to get partition size:", err)
		} finally {
			setLoadingSize(false)
		}
	}

	const handleReset = async () => {
		if (!confirm(t("partition.confirmReset").replace("{name}", name))) return

		setResetting(true)
		try {
			await window.bird.partition.reset(name)
			setSize(null)
			reloadPartitions()
		} catch (err) {
			console.error("Failed to reset partition:", err)
		} finally {
			setResetting(false)
		}
	}

	if (!partition) {
		return (
			<ConfigSection title={name}>
				<Text>{t("partition.notFound")}</Text>
			</ConfigSection>
		)
	}

	const sizeInfo = !partition.hasPhysical ? t("partition.notCreated") : size !== null ? formatBytes(size) : undefined

	return (
		<PageHeader title={name} leftInfo={sizeInfo ?? t("partition.sizeUnknown")}>
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

					{partition.hasPhysical && (
						<HStack justify="space-between" py={2}>
							<Text fontSize="sm">{t("partition.showSize")}</Text>
							{size !== null ? (
								<Text fontSize="sm" fontWeight="medium">
									{formatBytes(size)}
								</Text>
							) : (
								<Button size="sm" variant="outline" onClick={handleLoadSize} disabled={loadingSize}>
									{loadingSize ? <Spinner size="sm" /> : t("partition.showSize")}
								</Button>
							)}
						</HStack>
					)}

					<Text fontSize="xs" color="fg.muted" pt={2}>
						{t("partition.storagePath")}: {name}
					</Text>
				</ConfigSection>

				{canReset && (
					<ConfigSection title={t("partition.actions")}>
						<Button variant="outline" size="sm" onClick={handleReset} disabled={resetting}>
							{resetting ? <Spinner size="sm" /> : t("partition.reset")}
						</Button>
					</ConfigSection>
				)}
			</VStack>
		</PageHeader>
	)
}
