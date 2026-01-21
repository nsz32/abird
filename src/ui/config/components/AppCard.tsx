import { Badge, Box, HStack, IconButton, Image, Text } from "@chakra-ui/react"
import type { AppConfig } from "@shared/config.schema"
import { useTranslations } from "@ui/shared/hooks"
import { Check, ChevronRight, Trash2 } from "lucide-react"
import { useAppIcon } from "../hooks"

const DEFAULT_ICON = "/favicon.png"

interface AppCardProps {
	name: string
	app: AppConfig
	isDeployed?: boolean
	onSelect: () => void
	onDelete: () => void
}

export function AppCard({ name, app, isDeployed, onSelect, onDelete }: AppCardProps) {
	const { t } = useTranslations()
	const icon = useAppIcon(app.icon)

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (!confirm(t("app.deleteConfirm"))) return
		onDelete()
	}

	return (
		<HStack p={3} borderRadius="md" cursor="pointer" bg="bg.subtle" _hover={{ bg: "bg.muted" }} onClick={onSelect}>
			<Image src={icon.iconData || DEFAULT_ICON} w="16px" h="16px" flexShrink={0} borderRadius="sm" />
			<Box flex={1} minW={0}>
				<HStack gap={2}>
					<Text fontWeight="medium" truncate>
						{name}
					</Text>
				</HStack>
				<Text fontSize="xs" color="fg.muted" truncate>
					{app.startUrl}
				</Text>
			</Box>
			{isDeployed && (
				<Badge colorPalette="green" size="sm" variant="subtle">
					<Check size={12} />
					{t("app.deployed")}
				</Badge>
			)}
			<IconButton aria-label={t("app.delete")} variant="ghost" size="sm" colorPalette="red" onClick={handleDelete}>
				<Trash2 size={16} />
			</IconButton>
			<ChevronRight size={16} color="#777" />
		</HStack>
	)
}
