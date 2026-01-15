import { HStack, Switch, Text } from "@chakra-ui/react"

interface SwitchFieldProps {
	label: string
	checked: boolean
	onChange: (checked: boolean) => void
}

export function SwitchField({ label, checked, onChange }: SwitchFieldProps) {
	return (
		<HStack justify="space-between" py={2}>
			<Text fontSize="sm">{label}</Text>
			<Switch.Root checked={checked} onCheckedChange={(e) => onChange(e.checked)}>
				<Switch.HiddenInput />
				<Switch.Control>
					<Switch.Thumb />
				</Switch.Control>
			</Switch.Root>
		</HStack>
	)
}
