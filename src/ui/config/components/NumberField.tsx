import { HStack, Input, Text } from "@chakra-ui/react"

interface NumberFieldProps {
	label: string
	hint?: string
	value: number | undefined
	onChange: (value: number | undefined) => void
	placeholder?: string
	min?: number
}

export function NumberField({ label, hint, value, onChange, placeholder, min = 0 }: NumberFieldProps) {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value
		if (raw === "") {
			onChange(undefined)
			return
		}

		const num = Number.parseInt(raw, 10)
		if (!Number.isNaN(num) && num >= min) {
			onChange(num)
		}
	}

	return (
		<HStack justify="space-between" py={2}>
			<HStack gap={1}>
				<Text fontSize="sm">{label}</Text>
				{hint && (
					<Text fontSize="xs" color="fg.muted">
						{hint}
					</Text>
				)}
			</HStack>
			<Input size="sm" maxW="100px" type="number" min={min} placeholder={placeholder} value={value ?? ""} onChange={handleChange} />
		</HStack>
	)
}
