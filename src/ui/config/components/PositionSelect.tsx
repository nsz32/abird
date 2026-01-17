import { SegmentGroup } from "@chakra-ui/react"
import { useTranslations } from "@ui/shared/hooks"

type Position = "top" | "bottom"

interface PositionSelectProps {
	value: Position
	onChange: (value: Position) => void
}

export function PositionSelect({ value, onChange }: PositionSelectProps) {
	const { t } = useTranslations()
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
