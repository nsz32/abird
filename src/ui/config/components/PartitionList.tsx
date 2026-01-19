import { Text, VStack } from "@chakra-ui/react"
import type { PartitionState } from "@shared/types"
import { useTranslations } from "@ui/shared/hooks"
import { PartitionCard } from "./PartitionCard"

interface PartitionListProps {
	partitions: PartitionState[]
	activePartition: string
	onSelect: (name: string) => void
	onDelete: (name: string) => Promise<void>
}

export function PartitionList({ partitions, activePartition, onSelect, onDelete }: PartitionListProps) {
	const { t } = useTranslations()

	const sortedPartitions = [...partitions].sort((a, b) => {
		if (a.name === "browsermode") return 1
		if (b.name === "browsermode") return -1
		return 0
	})

	if (partitions.length === 0) {
		return (
			<Text fontSize="sm" color="fg.muted" textAlign="center" py={4}>
				{t("partition.noPartitions")}
			</Text>
		)
	}

	return (
		<VStack align="stretch" gap={2}>
			{sortedPartitions.map((partition) => (
				<PartitionCard
					key={partition.name}
					partition={partition}
					isActive={partition.name === activePartition}
					onSelect={() => onSelect(partition.name)}
					onDelete={() => onDelete(partition.name)}
				/>
			))}
		</VStack>
	)
}
