import { Box, Button, HStack, IconButton, Input, NativeSelect, Text, VStack } from "@chakra-ui/react"
import type { RoutingAction } from "@shared/config.schema"
import { useTranslations } from "@ui/shared/hooks"
import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"

interface RoutingRulesEditorProps {
	rules: Record<string, RoutingAction>
	onChange: (rules: Record<string, RoutingAction>) => void
	defaultPattern?: string
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

export function RoutingRulesEditor({ rules, onChange, defaultPattern }: RoutingRulesEditorProps) {
	const { t } = useTranslations()
	const [newPattern, setNewPattern] = useState("")
	const [newAction, setNewAction] = useState<RoutingAction>("internal")

	const entries = Object.entries(rules)
	const isNewPatternValid = newPattern.trim() !== "" && isValidRegex(newPattern) && !(newPattern in rules)
	const showDefaultPatternWarning = defaultPattern && !(defaultPattern in rules)

	const handleAddDefaultPattern = () => {
		if (defaultPattern) {
			onChange({ ...rules, [defaultPattern]: "internal" })
		}
	}

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
			{showDefaultPatternWarning && (
				<VStack align="stretch" gap={2} py={2}>
					<Text fontSize="sm" color="orange.500">
						{t("routing.missingDefaultWarning")}
					</Text>
					<Button size="sm" variant="outline" onClick={handleAddDefaultPattern} alignSelf="flex-start">
						{t("routing.addDefault")}
					</Button>
				</VStack>
			)}

			{entries.length === 0 && (
				<Text fontSize="sm" color="fg.muted" py={2}>
					{t("routing.noRules")}
				</Text>
			)}

			{entries.map(([pattern, action]) => (
				<HStack key={pattern} gap={2}>
					<NativeSelect.Root size="sm" width="120px" disabled={pattern === defaultPattern}>
						<NativeSelect.Field value={action} onChange={(e) => handleChangeAction(pattern, e.target.value as RoutingAction)}>
							{ACTIONS.map((a) => (
								<option key={a} value={a}>
									{t(`routing.${a}`)}
								</option>
							))}
						</NativeSelect.Field>
					</NativeSelect.Root>
					<Text flex={1} fontSize="sm" fontFamily="mono" color={isValidRegex(pattern) ? undefined : "red.500"}>
						{pattern}
					</Text>
					<IconButton size="sm" variant="ghost" colorPalette="red" onClick={() => handleRemove(pattern)} aria-label={t("routing.remove")}>
						<Trash2 size={16} />
					</IconButton>
				</HStack>
			))}

			<Box borderTop="1px solid" borderColor="border.subtle" pt={3} mt={1}>
				<HStack gap={2}>
					<NativeSelect.Root size="sm" width="120px">
						<NativeSelect.Field value={newAction} onChange={(e) => setNewAction(e.target.value as RoutingAction)}>
							{ACTIONS.map((a) => (
								<option key={a} value={a}>
									{t(`routing.${a}`)}
								</option>
							))}
						</NativeSelect.Field>
					</NativeSelect.Root>
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
					<IconButton size="sm" variant="ghost" onClick={handleAdd} disabled={!isNewPatternValid} aria-label={t("routing.add")}>
						<Plus size={16} />
					</IconButton>
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
