import { HStack, IconButton, Switch, Text } from "@chakra-ui/react"
import { useTranslations } from "@ui/shared/hooks"

interface TriStateSwitchProps {
	label: string
	value: boolean | undefined
	defaultValue: boolean
	onChange: (value: boolean | undefined) => void
}

export function TriStateSwitch({ label, value, defaultValue, onChange }: TriStateSwitchProps) {
	const { t } = useTranslations()
	const isInherited = value === undefined
	const effectiveValue = isInherited ? defaultValue : value

	const handleToggle = () => {
		if (isInherited) {
			onChange(!defaultValue)
		} else {
			onChange(!value)
		}
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
				<Switch.Root colorPalette={isInherited ? "gray" : "blue"} checked={effectiveValue} onCheckedChange={handleToggle}>
					<Switch.HiddenInput />
					<Switch.Control opacity={isInherited ? 0.5 : 1}>
						<Switch.Thumb />
					</Switch.Control>
				</Switch.Root>
			</HStack>
		</HStack>
	)
}
