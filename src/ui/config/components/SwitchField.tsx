import { Switch } from "radix-ui"

interface SwitchFieldProps {
	label: string
	checked: boolean
	onChange: (checked: boolean) => void
}

export function SwitchField({ label, checked, onChange }: SwitchFieldProps) {
	return (
		<div className="field">
			<span className="field-label">{label}</span>
			<Switch.Root className="switch-root" checked={checked} onCheckedChange={onChange}>
				<Switch.Thumb className="switch-thumb" />
			</Switch.Root>
		</div>
	)
}
