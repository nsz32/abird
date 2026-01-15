import { SegmentGroup } from "@chakra-ui/react"
import type { ThemeMode } from "@shared/config.schema"

interface ThemeSelectProps {
	value: ThemeMode
	onChange: (value: ThemeMode) => void
}

export function ThemeSelect({ value, onChange }: ThemeSelectProps) {
	return (
		<SegmentGroup.Root size="sm" value={value} onValueChange={(e) => onChange(e.value as ThemeMode)}>
			<SegmentGroup.Indicator bg={{ base: "blue.100", _dark: "blue.800" }} />
			<SegmentGroup.Item value="system">
				<SegmentGroup.ItemText>Système</SegmentGroup.ItemText>
				<SegmentGroup.ItemHiddenInput />
			</SegmentGroup.Item>
			<SegmentGroup.Item value="light">
				<SegmentGroup.ItemText>Clair</SegmentGroup.ItemText>
				<SegmentGroup.ItemHiddenInput />
			</SegmentGroup.Item>
			<SegmentGroup.Item value="dark">
				<SegmentGroup.ItemText>Sombre</SegmentGroup.ItemText>
				<SegmentGroup.ItemHiddenInput />
			</SegmentGroup.Item>
		</SegmentGroup.Root>
	)
}
