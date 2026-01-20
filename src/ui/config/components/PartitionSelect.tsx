import { Badge, Box, Button, HStack, Input, Menu, Portal, Text } from "@chakra-ui/react"
import { useTranslations } from "@ui/shared/hooks"
import { useEffect, useRef, useState } from "react"
import { validateFolderName } from "../utils/nameValidation"

interface PartitionSelectProps {
	value: string
	partitions: string[]
	partitionUsage: Map<string, string[]>
	currentAppName: string
	onChange: (value: string) => void
}

export function PartitionSelect({ value, partitions, partitionUsage, currentAppName, onChange }: PartitionSelectProps) {
	const { t } = useTranslations()
	const [isCreating, setIsCreating] = useState(false)
	const [newName, setNewName] = useState("")
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (isCreating && inputRef.current) {
			inputRef.current.focus()
		}
	}, [isCreating])

	const handleSelect = (partition: string) => {
		onChange(partition)
		resetCreating()
	}

	const handleCreate = () => {
		if (isNameValid) {
			handleSelect(trimmedNewName)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleCreate()
		} else if (e.key === "Escape") {
			resetCreating()
		}
		e.stopPropagation()
	}

	const resetCreating = () => {
		setIsCreating(false)
		setNewName("")
	}

	const getUsageCount = (partition: string): number => {
		const apps = partitionUsage.get(partition) || []
		return apps.filter((app) => app !== currentAppName).length
	}

	const trimmedNewName = newName.trim()
	const folderError = trimmedNewName !== "" ? validateFolderName(trimmedNewName) : null
	const isNameValid = trimmedNewName !== "" && !partitions.includes(trimmedNewName) && !folderError

	return (
		<Menu.Root onOpenChange={({ open }) => !open && resetCreating()}>
			<Menu.Trigger asChild>
				<Button size="sm" variant="outline" width="200px" justifyContent="space-between">
					<Text truncate>{value}</Text>
					<Menu.Indicator>▼</Menu.Indicator>
				</Button>
			</Menu.Trigger>
			<Portal>
				<Menu.Positioner>
					<Menu.Content minWidth="200px" maxHeight="300px" overflowY="auto">
						{partitions.map((partition) => {
							const usageCount = getUsageCount(partition)
							return (
								<Menu.Item key={partition} value={partition} onSelect={() => handleSelect(partition)} justifyContent="space-between">
									<Text fontWeight={partition === value ? "medium" : undefined}>{partition}</Text>
									{usageCount > 0 && (
										<Badge size="sm" colorPalette="gray">
											{usageCount}
										</Badge>
									)}
								</Menu.Item>
							)
						})}

						<Menu.Separator />

						{isCreating ? (
							<Box px={3} py={2} onClick={(e) => e.stopPropagation()}>
								<HStack gap={2}>
									<Input
										ref={inputRef}
										size="sm"
										value={newName}
										onChange={(e) => setNewName(e.target.value)}
										onKeyDown={handleKeyDown}
										placeholder={t("partition.namePlaceholder")}
										invalid={folderError !== null}
										flex={1}
									/>
									<Button size="sm" colorPalette="blue" onClick={handleCreate} disabled={!isNameValid}>
										OK
									</Button>
								</HStack>
							</Box>
						) : (
							<Box px={3} py={2} cursor="pointer" _hover={{ bg: { base: "gray.100", _dark: "gray.700" } }} onClick={() => setIsCreating(true)}>
								<Text fontSize="sm" color="blue.500">
									+ {t("partition.createNew")}
								</Text>
							</Box>
						)}
					</Menu.Content>
				</Menu.Positioner>
			</Portal>
		</Menu.Root>
	)
}
