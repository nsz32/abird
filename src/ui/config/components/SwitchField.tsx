import { HStack, Switch, Text } from "@chakra-ui/react"
import { CircleHelp } from "lucide-react"

interface SwitchFieldProps {
	label: string
	checked: boolean
	onChange: (checked: boolean) => void
	hint?: string
}

export function SwitchField({ label, checked, onChange, hint }: SwitchFieldProps) {
	return (
		<HStack justify="space-between" py={2}>
			<HStack gap={1}>
				<Text fontSize="sm">{label}</Text>
				{hint && (
					<span title={hint}>
						<CircleHelp size={14} color="var(--chakra-colors-fg-muted)" />
					</span>
				)}
			</HStack>
			<Switch.Root colorPalette="blue" checked={checked} onCheckedChange={(e) => onChange(e.checked)}>
				<Switch.HiddenInput />
				<Switch.Control>
					<Switch.Thumb />
				</Switch.Control>
			</Switch.Root>
		</HStack>
	)
}
