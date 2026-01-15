import { NativeSelect } from "@chakra-ui/react"

type Position = "top" | "bottom"

interface PositionSelectProps {
	value: Position
	onChange: (value: Position) => void
}

export function PositionSelect({ value, onChange }: PositionSelectProps) {
	return (
		<NativeSelect.Root size="sm" width="140px">
			<NativeSelect.Field value={value} onChange={(e) => onChange(e.target.value as Position)}>
				<option value="top">Haut</option>
				<option value="bottom">Bas</option>
			</NativeSelect.Field>
			<NativeSelect.Indicator />
		</NativeSelect.Root>
	)
}
