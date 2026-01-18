import { Badge, Box, HStack, IconButton, Spinner, Text } from "@chakra-ui/react"
import type { PartitionState } from "@shared/types"
import { useTranslations } from "@ui/shared/hooks"
import { Trash2 } from "lucide-react"
import { useState } from "react"

interface PartitionCardProps {
	partition: PartitionState
	isActive: boolean
	onSelect: () => void
	onDelete: () => Promise<void>
}

export function PartitionCard({ partition, isActive, onSelect, onDelete }: PartitionCardProps) {
	const { t } = useTranslations()
	const [deleting, setDeleting] = useState(false)

	const isUnused = partition.usedByApps.length === 0
	const canDelete = isUnused && !isActive

	const handleDelete = async (e: React.MouseEvent) => {
		e.stopPropagation()

		if (partition.hasPhysical) {
			if (!confirm(t("partition.confirmDelete").replace("{name}", partition.name))) {
				return
			}
		}

		setDeleting(true)
		try {
			await onDelete()
		} finally {
			setDeleting(false)
		}
	}

	return (
		<HStack
			p={3}
			borderRadius="md"
			cursor="pointer"
			bg={isUnused ? { base: "orange.50", _dark: "orange.900/30" } : "bg.subtle"}
			_hover={{ bg: isUnused ? { base: "orange.100", _dark: "orange.900/50" } : "bg.muted" }}
			onClick={onSelect}
		>
			<Box flex={1} minW={0}>
				<HStack gap={2} mb={1}>
					<Text fontWeight="medium" truncate>
						{partition.name}
					</Text>

					{isActive && (
						<Badge size="sm" colorPalette="blue">
							{t("partition.active")}
						</Badge>
					)}

					{isUnused && (
						<Badge size="sm" colorPalette="orange">
							{t("partition.orphan")}
						</Badge>
					)}

					{!partition.hasPhysical && (
						<Badge size="sm" colorPalette="gray">
							{t("partition.notCreated")}
						</Badge>
					)}
				</HStack>

				{partition.usedByApps.length > 0 && (
					<Text fontSize="xs" color="fg.muted" truncate>
						{t("partition.usedBy")}: {partition.usedByApps.join(", ")}
					</Text>
				)}
			</Box>

			{canDelete && (
				<IconButton
					aria-label={t("partition.delete")}
					variant="ghost"
					size="sm"
					colorPalette="red"
					onClick={handleDelete}
					disabled={deleting}
				>
					{deleting ? <Spinner size="xs" /> : <Trash2 size={16} />}
				</IconButton>
			)}
		</HStack>
	)
}
