import { Select } from "radix-ui"
import type { ThemeMode } from "@shared/config.schema"

interface ThemeSelectProps {
	value: ThemeMode
	onChange: (value: ThemeMode) => void
}

const options: { value: ThemeMode; label: string }[] = [
	{ value: "system", label: "Système" },
	{ value: "light", label: "Clair" },
	{ value: "dark", label: "Sombre" },
]

export function ThemeSelect({ value, onChange }: ThemeSelectProps) {
	return (
		<Select.Root value={value} onValueChange={(v) => onChange(v as ThemeMode)}>
			<Select.Trigger className="select-trigger">
				<Select.Value />
				<Select.Icon>▼</Select.Icon>
			</Select.Trigger>
			<Select.Portal>
				<Select.Content className="select-content" position="popper" sideOffset={4}>
					<Select.Viewport>
						{options.map((opt) => (
							<Select.Item key={opt.value} value={opt.value} className="select-item">
								<Select.ItemText>{opt.label}</Select.ItemText>
							</Select.Item>
						))}
					</Select.Viewport>
				</Select.Content>
			</Select.Portal>
		</Select.Root>
	)
}
