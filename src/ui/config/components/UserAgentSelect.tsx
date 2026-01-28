import { Button, Menu, Portal, Text } from "@chakra-ui/react"
import type { UserAgentPresets } from "@shared/types"
import { useEffect, useState } from "react"

interface UserAgentSelectProps {
	value: string | undefined
	onChange: (value: string | undefined) => void
}

export function UserAgentSelect({ value, onChange }: UserAgentSelectProps) {
	const [presets, setPresets] = useState<UserAgentPresets | null>(null)

	useEffect(() => {
		window.abird.settings.getUserAgents().then(setPresets)
	}, [])

	const defaultKey = presets?.defaultKey || ""
	const effectiveValue = value || defaultKey

	const handleSelect = (newValue: string) => {
		onChange(newValue === defaultKey ? undefined : newValue)
	}

	return (
		<Menu.Root>
			<Menu.Trigger asChild>
				<Button size="sm" variant="outline" width="320px" justifyContent="space-between">
					<Text truncate>{effectiveValue || "…"}</Text>
					<Menu.Indicator>▼</Menu.Indicator>
				</Button>
			</Menu.Trigger>
			<Portal>
				<Menu.Positioner>
					<Menu.Content minWidth="320px" maxHeight="400px" overflowY="auto">
						{presets?.keys.map((key) => (
							<Menu.Item key={key} value={key} onSelect={() => handleSelect(key)} fontWeight={key === effectiveValue ? "medium" : undefined}>
								{key}
							</Menu.Item>
						))}
					</Menu.Content>
				</Menu.Positioner>
			</Portal>
		</Menu.Root>
	)
}
