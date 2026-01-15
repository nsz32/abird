import { SegmentGroup } from "@chakra-ui/react"
import type { TranslationKey } from "@shared/i18n/translations"

type Position = "top" | "bottom"

interface PositionSelectProps {
	value: Position
	onChange: (value: Position) => void
	t: (key: TranslationKey) => string
}

export function PositionSelect({ value, onChange, t }: PositionSelectProps) {
	return (
		<SegmentGroup.Root size="sm" value={value} onValueChange={(e) => onChange(e.value as Position)}>
			<SegmentGroup.Indicator bg={{ base: "blue.100", _dark: "blue.800" }} />
			<SegmentGroup.Item value="top">
				<SegmentGroup.ItemText>{t("position.top")}</SegmentGroup.ItemText>
				<SegmentGroup.ItemHiddenInput />
			</SegmentGroup.Item>
			<SegmentGroup.Item value="bottom">
				<SegmentGroup.ItemText>{t("position.bottom")}</SegmentGroup.ItemText>
				<SegmentGroup.ItemHiddenInput />
			</SegmentGroup.Item>
		</SegmentGroup.Root>
	)
}
