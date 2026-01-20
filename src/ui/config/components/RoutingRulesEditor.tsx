import { Box, Button, HStack, IconButton, Input, NativeSelect, Text, VStack } from "@chakra-ui/react"
import type { RoutingAction } from "@shared/config.schema"
import { useTranslations } from "@ui/shared/hooks"
import { useState } from "react"

interface RoutingRulesEditorProps {
	rules: Record<string, RoutingAction>
	onChange: (rules: Record<string, RoutingAction>) => void
}

const ACTIONS: RoutingAction[] = ["internal", "download", "external", "ignore"]

function isValidRegex(pattern: string): boolean {
	try {
		new RegExp(pattern)
		return true
	} catch {
		return false
	}
}

export function RoutingRulesEditor({ rules, onChange }: RoutingRulesEditorProps) {
	const { t } = useTranslations()
	const [newPattern, setNewPattern] = useState("")
	const [newAction, setNewAction] = useState<RoutingAction>("internal")

	const entries = Object.entries(rules)
	const isNewPatternValid = newPattern.trim() !== "" && isValidRegex(newPattern) && !(newPattern in rules)

	const handleAdd = () => {
		if (!isNewPatternValid) return
		onChange({ ...rules, [newPattern]: newAction })
		setNewPattern("")
		setNewAction("internal")
	}

	const handleRemove = (pattern: string) => {
		const { [pattern]: _, ...rest } = rules
		onChange(rest)
	}

	const handleChangeAction = (pattern: string, action: RoutingAction) => {
		onChange({ ...rules, [pattern]: action })
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleAdd()
		}
	}

	return (
		<VStack align="stretch" gap={2}>
			{entries.length === 0 && (
				<Text fontSize="sm" color="fg.muted" py={2}>
					{t("routing.noRules")}
				</Text>
			)}

			{entries.map(([pattern, action]) => (
				<HStack key={pattern} gap={2}>
					<Input
						size="sm"
						flex={1}
						fontFamily="mono"
						value={pattern}
						readOnly
						bg="bg.subtle"
						borderColor={isValidRegex(pattern) ? undefined : "red.500"}
					/>
					<NativeSelect.Root size="sm" width="120px">
						<NativeSelect.Field value={action} onChange={(e) => handleChangeAction(pattern, e.target.value as RoutingAction)}>
							{ACTIONS.map((a) => (
								<option key={a} value={a}>
									{t(`routing.${a}`)}
								</option>
							))}
						</NativeSelect.Field>
					</NativeSelect.Root>
					<IconButton size="sm" variant="ghost" colorPalette="red" onClick={() => handleRemove(pattern)} aria-label="Remove">
						✕
					</IconButton>
				</HStack>
			))}

			<Box borderTop="1px solid" borderColor="border.subtle" pt={3} mt={1}>
				<HStack gap={2}>
					<Input
						size="sm"
						flex={1}
						fontFamily="mono"
						value={newPattern}
						onChange={(e) => setNewPattern(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="^https://example\.com"
						borderColor={newPattern && !isValidRegex(newPattern) ? "red.500" : undefined}
					/>
					<NativeSelect.Root size="sm" width="120px">
						<NativeSelect.Field value={newAction} onChange={(e) => setNewAction(e.target.value as RoutingAction)}>
							{ACTIONS.map((a) => (
								<option key={a} value={a}>
									{t(`routing.${a}`)}
								</option>
							))}
						</NativeSelect.Field>
					</NativeSelect.Root>
					<Button size="sm" colorPalette="blue" onClick={handleAdd} disabled={!isNewPatternValid}>
						+
					</Button>
				</HStack>
				{newPattern && !isValidRegex(newPattern) && (
					<Text fontSize="xs" color="red.500" mt={1}>
						{t("routing.invalidPattern")}
					</Text>
				)}
			</Box>
		</VStack>
	)
}
