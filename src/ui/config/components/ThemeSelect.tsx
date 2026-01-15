import { NativeSelect } from "@chakra-ui/react"
import type { ThemeMode } from "@shared/config.schema"

interface ThemeSelectProps {
	value: ThemeMode
	onChange: (value: ThemeMode) => void
}

export function ThemeSelect({ value, onChange }: ThemeSelectProps) {
	return (
		<NativeSelect.Root size="sm" width="140px">
			<NativeSelect.Field value={value} onChange={(e) => onChange(e.target.value as ThemeMode)}>
				<option value="system">Système</option>
				<option value="light">Clair</option>
				<option value="dark">Sombre</option>
			</NativeSelect.Field>
			<NativeSelect.Indicator />
		</NativeSelect.Root>
	)
}
