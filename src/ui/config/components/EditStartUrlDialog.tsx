import { Button, Checkbox, Dialog, Group, HStack, Input, InputAddon, Text, VStack } from "@chakra-ui/react"
import type { RoutingAction } from "@shared/config.schema"
import { deriveInternalPattern } from "@shared/routing"
import { useTranslations } from "@ui/shared/hooks"
import { useEffect, useState } from "react"

interface EditStartUrlDialogProps {
	isOpen: boolean
	currentUrl: string
	rules: Record<string, RoutingAction>
	onClose: () => void
	onSave: (newUrl: string, newRules: Record<string, RoutingAction>) => void
}

function isValidUrl(urlPath: string): boolean {
	if (!urlPath.trim()) return false
	try {
		new URL(`https://${urlPath}`)
		return true
	} catch {
		return false
	}
}

export function EditStartUrlDialog({ isOpen, currentUrl, rules, onClose, onSave }: EditStartUrlDialogProps) {
	const { t } = useTranslations()

	const currentUrlPath = currentUrl.replace(/^https?:\/\//, "")
	const currentPattern = deriveInternalPattern(currentUrl)
	const patternExistsInRules = currentPattern in rules

	const [urlPath, setUrlPath] = useState(currentUrlPath)
	const [updatePattern, setUpdatePattern] = useState(patternExistsInRules)

	useEffect(() => {
		if (isOpen) {
			setUrlPath(currentUrlPath)
			setUpdatePattern(patternExistsInRules)
		}
	}, [isOpen, currentUrlPath, patternExistsInRules])

	const trimmedUrlPath = urlPath.trim()
	const isUrlValid = isValidUrl(trimmedUrlPath)
	const hasChanged = trimmedUrlPath !== currentUrlPath
	const isValid = isUrlValid && hasChanged

	const handleUrlChange = (value: string) => {
		setUrlPath(value.replace(/^https?:\/\//, ""))
	}

	const handleSave = () => {
		if (!isValid) return

		const newUrl = `https://${trimmedUrlPath}`
		const newPattern = deriveInternalPattern(newUrl)
		let newRules = { ...rules }

		if (updatePattern && newPattern !== currentPattern) {
			// Supprimer l'ancien pattern s'il existe
			if (currentPattern in newRules) {
				const { [currentPattern]: _, ...rest } = newRules
				newRules = rest
			}

			// Ajouter le nouveau pattern en premier
			newRules = { [newPattern]: "internal" as RoutingAction, ...newRules }
		}

		onSave(newUrl, newRules)
		onClose()
	}

	const handleClose = () => {
		setUrlPath(currentUrlPath)
		setUpdatePattern(patternExistsInRules)
		onClose()
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && isValid) {
			handleSave()
		}
	}

	return (
		<Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && handleClose()} placement="center">
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>{t("app.editUrlTitle")}</Dialog.Title>
					</Dialog.Header>
					<Dialog.Body>
						<VStack align="stretch" gap={4}>
							<VStack align="stretch" gap={1}>
								<Text fontSize="sm">{t("app.startUrl")}</Text>
								<Group attached>
									<InputAddon>https://</InputAddon>
									<Input
										value={urlPath}
										onChange={(e) => handleUrlChange(e.target.value)}
										onKeyDown={handleKeyDown}
										placeholder={t("app.urlPlaceholder")}
										data-invalid={(urlPath.trim() !== "" && !isUrlValid) || undefined}
										autoFocus
									/>
								</Group>
							</VStack>

							<Checkbox.Root checked={updatePattern} onCheckedChange={(e) => setUpdatePattern(!!e.checked)}>
								<Checkbox.HiddenInput />
								<Checkbox.Control>
									<Checkbox.Indicator />
								</Checkbox.Control>
								<Checkbox.Label>
									<Text fontSize="sm">{t("app.updateDefaultPattern")}</Text>
								</Checkbox.Label>
							</Checkbox.Root>
						</VStack>
					</Dialog.Body>
					<Dialog.Footer>
						<HStack gap={2}>
							<Button variant="ghost" onClick={handleClose}>
								{t("app.cancel")}
							</Button>
							<Button colorPalette="blue" onClick={handleSave} disabled={!isValid}>
								{t("app.save")}
							</Button>
						</HStack>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	)
}
