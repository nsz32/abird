import { HStack, IconButton, Text } from "@chakra-ui/react"
import { useTranslations } from "@ui/shared/hooks"
import { RotateCcw } from "lucide-react"
import { SegmentSelect } from "./SegmentSelect"

const COMMON_PRESETS = ["desktop:bird", "desktop:chrome", "desktop:firefox", "mobile:chrome", "mobile:safari"] as const
type CommonPreset = (typeof COMMON_PRESETS)[number]

interface UserAgentSelectProps {
	value: string | undefined
	onChange: (value: string | undefined) => void
}

export function UserAgentSelect({ value, onChange }: UserAgentSelectProps) {
	const { t } = useTranslations()

	const isInherited = value === undefined
	const effectiveValue = value || "desktop:bird"

	const isCommonPreset = (v: string): v is CommonPreset => COMMON_PRESETS.includes(v as CommonPreset)
	const currentIsCommon = isCommonPreset(effectiveValue)

	const handleChange = (newValue: string) => {
		onChange(newValue === "desktop:bird" ? undefined : newValue)
	}

	const handleReset = () => {
		onChange(undefined)
	}

	const options = COMMON_PRESETS.map((preset) => ({
		value: preset,
		label: formatPresetLabel(preset),
	}))

	return (
		<HStack gap={2}>
			{!isInherited && (
				<IconButton aria-label={t("inherit.reset")} variant="ghost" size="xs" onClick={handleReset} title={t("inherit.reset")}>
					<RotateCcw size={14} />
				</IconButton>
			)}

			{isInherited && (
				<Text fontSize="xs" color="fg.muted">
					{t("inherit.inherited")}
				</Text>
			)}

			<SegmentSelect value={currentIsCommon ? effectiveValue : "desktop:bird"} options={options} onChange={handleChange} />
		</HStack>
	)
}

function formatPresetLabel(preset: string): string {
	const parts = preset.split(":")
	if (parts.length < 2) return preset

	const [platform, browser] = parts
	const platformIcon = platform === "mobile" ? "M" : "D"
	const browserName = browser.charAt(0).toUpperCase() + browser.slice(1)

	return `${platformIcon}:${browserName}`
}
