import { Box, HStack, Heading, Text, VStack } from "@chakra-ui/react"
import { CircleHelp } from "lucide-react"
import type { ReactNode } from "react"

interface ConfigSectionProps {
	title: string
	hint?: string
	description?: string
	headerAction?: ReactNode
	children: ReactNode
}

export function ConfigSection({ title, hint, description, headerAction, children }: ConfigSectionProps) {
	return (
		<Box bg="bg.panel" p={4} borderRadius="lg">
			<HStack justify="space-between" mb={description ? 1 : 4}>
				<HStack gap={2}>
					<Heading size="md">{title}</Heading>
					{hint && (
						<span title={hint}>
							<CircleHelp size={16} color="var(--chakra-colors-fg-muted)" />
						</span>
					)}
				</HStack>
				{headerAction}
			</HStack>
			{description && (
				<Text fontSize="sm" color="fg.muted" mb={4}>
					{description}
				</Text>
			)}
			<VStack align="stretch" gap={0}>
				{children}
			</VStack>
		</Box>
	)
}
