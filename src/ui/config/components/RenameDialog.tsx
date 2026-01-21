import { Button, Dialog, HStack, Input, Text, VStack } from "@chakra-ui/react"
import type { TranslationKey } from "@shared/i18n/translations"
import { useTranslations } from "@ui/shared/hooks"
import { useState } from "react"
import { validateFolderName } from "../utils/nameValidation"

type NameValidator = (name: string) => TranslationKey | null

interface RenameDialogProps {
	isOpen: boolean
	title: string
	currentName: string
	existingNames: string[]
	onClose: () => void
	onRename: (newName: string) => void
	validateName?: NameValidator
}

export function RenameDialog({ isOpen, title, currentName, existingNames, onClose, onRename, validateName = validateFolderName }: RenameDialogProps) {
	const { t } = useTranslations()
	const [name, setName] = useState(currentName)

	const trimmedName = name.trim()
	const nameExists = trimmedName !== currentName && existingNames.includes(trimmedName)
	const nameError = trimmedName !== "" ? validateName(trimmedName) : null
	const isValid = trimmedName !== "" && trimmedName !== currentName && !nameExists && !nameError
	const hasError = nameExists || nameError !== null

	const handleRename = () => {
		if (!isValid) return
		onRename(trimmedName)
		onClose()
	}

	const handleClose = () => {
		setName(currentName)
		onClose()
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && isValid) {
			handleRename()
		}
	}

	return (
		<Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && handleClose()} placement="center">
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>{title}</Dialog.Title>
					</Dialog.Header>
					<Dialog.Body>
						<VStack align="stretch" gap={1}>
							<Text fontSize="sm">{t("rename.newName")}</Text>
							<Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleKeyDown} data-invalid={hasError || undefined} autoFocus />
							{nameExists && (
								<Text fontSize="xs" color="red.500">
									{t("rename.nameExists")}
								</Text>
							)}
							{nameError && (
								<Text fontSize="xs" color="red.500">
									{t(nameError)}
								</Text>
							)}
						</VStack>
					</Dialog.Body>
					<Dialog.Footer>
						<HStack gap={2}>
							<Button variant="ghost" onClick={handleClose}>
								{t("app.cancel")}
							</Button>
							<Button colorPalette="blue" onClick={handleRename} disabled={!isValid}>
								{t("rename.confirm")}
							</Button>
						</HStack>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	)
}
