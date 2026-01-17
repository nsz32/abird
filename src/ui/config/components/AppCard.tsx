import { Box, HStack, IconButton, Text } from "@chakra-ui/react"
import type { AppConfig } from "@shared/config.schema"
import { useTranslations } from "@ui/shared/hooks"

interface AppCardProps {
	name: string
	app: AppConfig
	onSelect: () => void
	onDelete: () => void
}

export function AppCard({ name, app, onSelect, onDelete }: AppCardProps) {
	const { t } = useTranslations()

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation()
		onDelete()
	}

	return (
		<HStack p={3} borderRadius="md" cursor="pointer" bg="bg.subtle" _hover={{ bg: "bg.muted" }} onClick={onSelect}>
			<Box flex={1} minW={0}>
				<Text fontWeight="medium" truncate>
					{name}
				</Text>
				<Text fontSize="xs" color="fg.muted" truncate>
					{app.startUrl}
				</Text>
			</Box>
			<IconButton aria-label={t("app.delete")} variant="ghost" size="sm" colorPalette="red" onClick={handleDelete}>
				×
			</IconButton>
		</HStack>
	)
}
