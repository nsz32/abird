import { Box, Heading, HStack, VStack } from "@chakra-ui/react"
import type { ReactNode } from "react"

interface ConfigSectionProps {
	title: string
	headerAction?: ReactNode
	children: ReactNode
}

export function ConfigSection({ title, headerAction, children }: ConfigSectionProps) {
	return (
		<Box bg="bg.panel" p={4} borderRadius="lg">
			<HStack justify="space-between" mb={4}>
				<Heading size="md">{title}</Heading>
				{headerAction}
			</HStack>
			<VStack align="stretch" gap={0}>
				{children}
			</VStack>
		</Box>
	)
}
