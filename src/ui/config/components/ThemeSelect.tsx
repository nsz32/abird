import { SegmentGroup } from "@chakra-ui/react"
import type { ThemeMode } from "@shared/config.schema"
import { useTranslations } from "@ui/shared/hooks"

interface ThemeSelectProps {
	value: ThemeMode
	onChange: (value: ThemeMode) => void
}

export function ThemeSelect({ value, onChange }: ThemeSelectProps) {
	const { t } = useTranslations()
	return (
		<SegmentGroup.Root size="sm" value={value} onValueChange={(e) => onChange(e.value as ThemeMode)}>
			<SegmentGroup.Indicator bg={{ base: "blue.100", _dark: "blue.800" }} />
			<SegmentGroup.Item value="system">
				<SegmentGroup.ItemText>{t("theme.system")}</SegmentGroup.ItemText>
				<SegmentGroup.ItemHiddenInput />
			</SegmentGroup.Item>
			<SegmentGroup.Item value="light">
				<SegmentGroup.ItemText>{t("theme.light")}</SegmentGroup.ItemText>
				<SegmentGroup.ItemHiddenInput />
			</SegmentGroup.Item>
			<SegmentGroup.Item value="dark">
				<SegmentGroup.ItemText>{t("theme.dark")}</SegmentGroup.ItemText>
				<SegmentGroup.ItemHiddenInput />
			</SegmentGroup.Item>
		</SegmentGroup.Root>
	)
}
