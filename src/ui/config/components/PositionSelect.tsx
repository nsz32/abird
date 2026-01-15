import { SegmentGroup } from "@chakra-ui/react"

type Position = "top" | "bottom"

interface PositionSelectProps {
	value: Position
	onChange: (value: Position) => void
}

export function PositionSelect({ value, onChange }: PositionSelectProps) {
	return (
		<SegmentGroup.Root size="sm" value={value} onValueChange={(e) => onChange(e.value as Position)}>
			<SegmentGroup.Indicator bg={{ base: "blue.100", _dark: "blue.800" }} />
			<SegmentGroup.Item value="top">
				<SegmentGroup.ItemText>Haut</SegmentGroup.ItemText>
				<SegmentGroup.ItemHiddenInput />
			</SegmentGroup.Item>
			<SegmentGroup.Item value="bottom">
				<SegmentGroup.ItemText>Bas</SegmentGroup.ItemText>
				<SegmentGroup.ItemHiddenInput />
			</SegmentGroup.Item>
		</SegmentGroup.Root>
	)
}
