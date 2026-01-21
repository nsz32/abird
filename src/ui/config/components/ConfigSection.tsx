import { Box, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import type { ReactNode } from "react"

interface ConfigSectionProps {
	title: string
	description?: string
	headerAction?: ReactNode
	children: ReactNode
}

export function ConfigSection({ title, description, headerAction, children }: ConfigSectionProps) {
	return (
		<Box bg="bg.panel" p={4} borderRadius="lg">
			<HStack justify="space-between" mb={description ? 1 : 4}>
				<Heading size="md">{title}</Heading>
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
