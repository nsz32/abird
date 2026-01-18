import { Alert, Box, Spinner, Text, VStack } from "@chakra-ui/react"
import type { PartitionsState } from "@shared/types"
import { useTranslations } from "@ui/shared/hooks"
import { useEffect, useState } from "react"
import { ConfigSection } from "../components/ConfigSection"
import { PartitionCard } from "../components/PartitionCard"

interface PartitionsPageProps {
	activePartition: string
}

export function PartitionsPage({ activePartition }: PartitionsPageProps) {
	const { t } = useTranslations()
	const [partitions, setPartitions] = useState<PartitionsState | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		document.title = `Bird - ${t("settings.partitions")}`
		loadPartitions()
	}, [t])

	const loadPartitions = async () => {
		setLoading(true)
		try {
			const state = await window.bird.partition.list()
			setPartitions(state)
		} catch (err) {
			console.error("Failed to load partitions:", err)
		} finally {
			setLoading(false)
		}
	}

	const handleReset = async (name: string) => {
		await window.bird.partition.reset(name)
		await loadPartitions()
	}

	const handleDelete = async (name: string) => {
		await window.bird.partition.delete(name)
		await loadPartitions()
	}

	if (loading) {
		return (
			<Box textAlign="center" py={8}>
				<Spinner />
			</Box>
		)
	}

	if (!partitions) {
		return null
	}

	const orphans = partitions.partitions.filter((p) => p.isOrphan)
	const used = partitions.partitions.filter((p) => !p.isOrphan)

	return (
		<VStack align="stretch" gap={4}>
			{orphans.length > 0 && (
				<Alert.Root status="warning">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>{t("partition.orphanWarning").replace("{count}", String(orphans.length))}</Alert.Title>
					</Alert.Content>
				</Alert.Root>
			)}

			{orphans.length > 0 && (
				<ConfigSection title={t("partition.orphanSection")}>
					<VStack align="stretch" gap={2}>
						{orphans.map((partition) => (
							<PartitionCard
								key={partition.name}
								partition={partition}
								isActive={partition.name === activePartition}
								onReset={() => handleReset(partition.name)}
								onDelete={() => handleDelete(partition.name)}
							/>
						))}
					</VStack>
				</ConfigSection>
			)}

			<ConfigSection title={t("partition.inUseSection")}>
				{used.length === 0 ? (
					<Text fontSize="sm" color="fg.muted" py={2}>
						{t("partition.noPartitions")}
					</Text>
				) : (
					<VStack align="stretch" gap={2}>
						{used.map((partition) => (
							<PartitionCard
								key={partition.name}
								partition={partition}
								isActive={partition.name === activePartition}
								onReset={() => handleReset(partition.name)}
								onDelete={() => handleDelete(partition.name)}
							/>
						))}
					</VStack>
				)}
			</ConfigSection>

			<Text fontSize="xs" color="fg.muted">
				{t("partition.storagePath")}: {partitions.physicalPath}
			</Text>
		</VStack>
	)
}
