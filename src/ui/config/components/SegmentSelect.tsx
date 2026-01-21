import { SegmentGroup } from "@chakra-ui/react"

export interface SegmentOption<T extends string = string> {
	value: T
	label: string
}

interface SegmentSelectProps<T extends string = string> {
	value: T
	options: SegmentOption<T>[]
	onChange: (value: T) => void
	opacity?: number
}

export function SegmentSelect<T extends string>({ value, options, onChange, opacity }: SegmentSelectProps<T>) {
	return (
		<SegmentGroup.Root size="sm" value={value} onValueChange={(e) => onChange(e.value as T)} opacity={opacity}>
			<SegmentGroup.Indicator bg={{ base: "blue.100", _dark: "blue.800" }} />
			{options.map((option) => (
				<SegmentGroup.Item key={option.value} value={option.value} cursor={value === option.value ? "default" : "pointer"}>
					<SegmentGroup.ItemText>{option.label}</SegmentGroup.ItemText>
					<SegmentGroup.ItemHiddenInput />
				</SegmentGroup.Item>
			))}
		</SegmentGroup.Root>
	)
}
