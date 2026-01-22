import { Button, Menu, Portal, Text } from "@chakra-ui/react"

const USER_AGENT_PRESETS = [
	"desktop:bird",
	"desktop:chrome",
	"desktop:firefox",
	"desktop:safari",
	"desktop:edge",
	"desktop:opera",
	"mobile:chrome",
	"mobile:safari",
	"mobile:firefox",
	"tablet:chrome",
	"tablet:safari",
	"desktop:ie11",
	"desktop:ie6",
] as const

interface UserAgentSelectProps {
	value: string | undefined
	onChange: (value: string | undefined) => void
}

export function UserAgentSelect({ value, onChange }: UserAgentSelectProps) {
	const effectiveValue = value || "desktop:bird"

	const handleSelect = (newValue: string) => {
		onChange(newValue === "desktop:bird" ? undefined : newValue)
	}

	return (
		<Menu.Root>
			<Menu.Trigger asChild>
				<Button size="sm" variant="outline" width="160px" justifyContent="space-between">
					<Text truncate>{effectiveValue}</Text>
					<Menu.Indicator>▼</Menu.Indicator>
				</Button>
			</Menu.Trigger>
			<Portal>
				<Menu.Positioner>
					<Menu.Content minWidth="160px" maxHeight="300px" overflowY="auto">
						{USER_AGENT_PRESETS.map((preset) => (
							<Menu.Item
								key={preset}
								value={preset}
								onSelect={() => handleSelect(preset)}
								fontWeight={preset === effectiveValue ? "medium" : undefined}
							>
								{preset}
							</Menu.Item>
						))}
					</Menu.Content>
				</Menu.Positioner>
			</Portal>
		</Menu.Root>
	)
}
