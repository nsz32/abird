import { Button, Dialog, Group, HStack, Input, InputAddon, Text, VStack } from "@chakra-ui/react"
import { useTranslations } from "@ui/shared/hooks"
import { useState } from "react"
import { validateFolderName } from "../utils/nameValidation"

interface CreateAppDialogProps {
	isOpen: boolean
	onClose: () => void
	onCreate: (name: string, startUrl: string) => void
	existingNames: string[]
}

export function CreateAppDialog({ isOpen, onClose, onCreate, existingNames }: CreateAppDialogProps) {
	const { t } = useTranslations()
	const [name, setName] = useState("")
	const [urlPath, setUrlPath] = useState("")

	const trimmedName = name.trim()
	const trimmedUrlPath = urlPath.trim()
	const nameExists = existingNames.includes(trimmedName)
	const folderError = trimmedName !== "" ? validateFolderName(trimmedName) : null
	const isValid = trimmedName !== "" && trimmedUrlPath !== "" && !nameExists && !folderError
	const hasNameError = nameExists || folderError !== null

	const handleUrlChange = (value: string) => {
		setUrlPath(value.replace(/^https?:\/\//, ""))
	}

	const handleCreate = () => {
		if (!isValid) return
		onCreate(trimmedName, `https://${trimmedUrlPath}`)
		setName("")
		setUrlPath("")
	}

	const handleClose = () => {
		onClose()
		setName("")
		setUrlPath("")
	}

	return (
		<Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && handleClose()} placement="center">
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>{t("app.create")}</Dialog.Title>
					</Dialog.Header>
					<Dialog.Body>
						<VStack align="stretch" gap={4}>
							<VStack align="stretch" gap={1}>
								<Text fontSize="sm">{t("app.name")}</Text>
								<Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("app.namePlaceholder")} invalid={hasNameError} autoFocus />
								{nameExists && (
									<Text fontSize="xs" color="red.500">
										{t("rename.nameExists")}
									</Text>
								)}
								{folderError && (
									<Text fontSize="xs" color="red.500">
										{t(folderError)}
									</Text>
								)}
							</VStack>
							<VStack align="stretch" gap={1}>
								<Text fontSize="sm">{t("app.startUrl")}</Text>
								<Group attached>
									<InputAddon>https://</InputAddon>
									<Input value={urlPath} onChange={(e) => handleUrlChange(e.target.value)} placeholder={t("app.urlPlaceholder")} />
								</Group>
							</VStack>
						</VStack>
					</Dialog.Body>
					<Dialog.Footer>
						<HStack gap={2}>
							<Button variant="ghost" onClick={handleClose}>
								{t("app.cancel")}
							</Button>
							<Button colorPalette="blue" onClick={handleCreate} disabled={!isValid}>
								{t("app.create")}
							</Button>
						</HStack>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	)
}
