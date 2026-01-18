import { Badge, Button, HStack, Spinner, Text, VStack } from "@chakra-ui/react"
import type { PartitionState } from "@shared/types"
import { useTranslations } from "@ui/shared/hooks"
import { useState } from "react"

interface PartitionCardProps {
	partition: PartitionState
	isActive: boolean
	onReset: () => Promise<void>
	onDelete: () => Promise<void>
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B"
	const k = 1024
	const sizes = ["B", "KB", "MB", "GB"]
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}

export function PartitionCard({ partition, isActive, onReset, onDelete }: PartitionCardProps) {
	const { t } = useTranslations()
	const [size, setSize] = useState<number | null>(null)
	const [loadingSize, setLoadingSize] = useState(false)
	const [resetting, setResetting] = useState(false)
	const [deleting, setDeleting] = useState(false)

	const loadSize = async () => {
		setLoadingSize(true)
		try {
			const bytes = await window.bird.partition.getSize(partition.name)
			setSize(bytes)
		} catch (err) {
			console.error("Failed to get partition size:", err)
		} finally {
			setLoadingSize(false)
		}
	}

	const handleReset = async () => {
		if (!confirm(t("partition.confirmReset").replace("{name}", partition.name))) return
		setResetting(true)
		try {
			await onReset()
		} finally {
			setResetting(false)
			setSize(null)
		}
	}

	const handleDelete = async () => {
		if (!confirm(t("partition.confirmDelete").replace("{name}", partition.name))) return
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
			bg={partition.isOrphan ? { base: "orange.50", _dark: "orange.900/30" } : { base: "gray.50", _dark: "gray.800" }}
			justify="space-between"
			align="flex-start"
		>
			<VStack align="start" gap={1}>
				<HStack gap={2}>
					<Text fontWeight="medium">{partition.name}</Text>
					{partition.isOrphan && (
						<Badge size="sm" colorPalette="orange">
							{t("partition.orphan")}
						</Badge>
					)}
					{isActive && (
						<Badge size="sm" colorPalette="blue">
							{t("partition.active")}
						</Badge>
					)}
				</HStack>

				{partition.usedByApps.length > 0 && (
					<Text fontSize="xs" color="fg.muted">
						{t("partition.usedBy")}: {partition.usedByApps.join(", ")}
					</Text>
				)}

				{!partition.hasPhysical && (
					<Text fontSize="xs" color="fg.muted">
						{t("partition.notCreated")}
					</Text>
				)}

				{size !== null && (
					<Text fontSize="xs" color="fg.muted">
						{formatBytes(size)}
					</Text>
				)}
			</VStack>

			<HStack gap={2}>
				{size === null && partition.hasPhysical && (
					<Button size="xs" variant="ghost" onClick={loadSize} disabled={loadingSize}>
						{loadingSize ? <Spinner size="xs" /> : t("partition.showSize")}
					</Button>
				)}

				{partition.hasPhysical && !isActive && (
					<Button size="xs" variant="ghost" onClick={handleReset} disabled={resetting}>
						{resetting ? <Spinner size="xs" /> : t("partition.reset")}
					</Button>
				)}

				{partition.isOrphan && (
					<Button size="xs" colorPalette="red" variant="ghost" onClick={handleDelete} disabled={deleting}>
						{deleting ? <Spinner size="xs" /> : t("partition.delete")}
					</Button>
				)}
			</HStack>
		</HStack>
	)
}
