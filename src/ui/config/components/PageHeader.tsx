import { Box, HStack, Heading, Text } from "@chakra-ui/react"
import type { ReactNode } from "react"

interface PageHeaderProps {
	title: string
	leftInfo: ReactNode
	rightInfo?: ReactNode
	children: ReactNode
}

export function PageHeader({ title, leftInfo, rightInfo, children }: PageHeaderProps) {
	return (
		<Box display="flex" flexDirection="column" h="100%">
			<Box pt={6} pb={4} flexShrink={0}>
				<Heading size="lg" mb={2}>
					{title}
				</Heading>
				<HStack justify="space-between" fontSize="sm" color="fg.muted">
					<Text>{leftInfo}</Text>
					{rightInfo && <Text>{rightInfo}</Text>}
				</HStack>
			</Box>

			<Box flex={1} overflowY="auto" pr={4} pb={6}>
				{children}
			</Box>
		</Box>
	)
}
