import { Select } from "radix-ui"

type Position = "top" | "bottom"

interface PositionSelectProps {
	value: Position
	onChange: (value: Position) => void
}

const options: { value: Position; label: string }[] = [
	{ value: "top", label: "Haut" },
	{ value: "bottom", label: "Bas" },
]

export function PositionSelect({ value, onChange }: PositionSelectProps) {
	return (
		<Select.Root value={value} onValueChange={(v) => onChange(v as Position)}>
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
