import { HStack, IconButton, Text } from "@chakra-ui/react"
import { useTranslations } from "@ui/shared/hooks"
import { SegmentSelect } from "./SegmentSelect"

interface TriStateSegmentSelectProps {
	label: string
	value: string | undefined
	defaultValue: string
	options: Array<{ value: string; label: string }>
	onChange: (value: string | undefined) => void
}

export function TriStateSegmentSelect({ label, value, defaultValue, options, onChange }: TriStateSegmentSelectProps) {
	const { t } = useTranslations()
	const isInherited = value === undefined
	const effectiveValue = isInherited ? defaultValue : value

	const handleChange = (newValue: string) => {
		onChange(newValue)
	}

	const handleReset = () => {
		onChange(undefined)
	}

	return (
		<HStack justify="space-between" py={2}>
			<HStack gap={1}>
				<Text fontSize="sm">{label}</Text>
				{isInherited && (
					<Text fontSize="xs" color="fg.muted">
						{t("inherit.inherited")}
					</Text>
				)}
			</HStack>
			<HStack gap={2}>
				{!isInherited && (
					<IconButton aria-label={t("inherit.reset")} variant="ghost" size="xs" onClick={handleReset} title={t("inherit.reset")}>
						↺
					</IconButton>
				)}
				<SegmentSelect value={effectiveValue} options={options} onChange={handleChange} opacity={isInherited ? 0.5 : 1} />
			</HStack>
		</HStack>
	)
}
