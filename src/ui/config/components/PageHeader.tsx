import { Box, HStack, Heading, IconButton, Text } from "@chakra-ui/react"
import { Pencil } from "lucide-react"
import type { ReactNode } from "react"

interface PageHeaderProps {
	title: string
	leftInfo: ReactNode
	rightInfo?: ReactNode
	actions?: ReactNode
	onRename?: () => void
	renameLabel?: string
	noScroll?: boolean
	children: ReactNode
}

export function PageHeader({ title, leftInfo, rightInfo, actions, onRename, renameLabel, noScroll, children }: PageHeaderProps) {
	return (
		<Box display="flex" flexDirection="column" h="100%">
			<Box pt={6} pb={4} flexShrink={0}>
				<HStack justify="space-between" mb={2}>
					<HStack gap={2}>
						<Heading size="lg">{title}</Heading>
						{onRename && (
							<IconButton aria-label={renameLabel || "Rename"} variant="ghost" size="sm" onClick={onRename}>
								<Pencil size={16} />
							</IconButton>
						)}
					</HStack>
					{actions}
				</HStack>
				<HStack justify="space-between" fontSize="sm" color="fg.muted">
					<Text>{leftInfo}</Text>
					{rightInfo}
				</HStack>
			</Box>

			<Box flex={1} minH={0} overflowY={noScroll ? "hidden" : "auto"} pb={4}>
				{children}
			</Box>
		</Box>
	)
}
