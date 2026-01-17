import { Box, Heading, VStack } from "@chakra-ui/react"
import type { ReactNode } from "react"

interface ConfigSectionProps {
	title: string
	children: ReactNode
}

export function ConfigSection({ title, children }: ConfigSectionProps) {
	return (
		<Box bg="bg.panel" p={4} borderRadius="lg">
			<Heading size="md" mb={4}>
				{title}
			</Heading>
			<VStack align="stretch" gap={0}>
				{children}
			</VStack>
		</Box>
	)
}
