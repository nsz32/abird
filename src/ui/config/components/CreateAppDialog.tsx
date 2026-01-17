import { Button, Dialog, HStack, Input, Text, VStack } from "@chakra-ui/react"
import { useTranslations } from "@ui/shared/hooks"
import { useState } from "react"

interface CreateAppDialogProps {
	isOpen: boolean
	onClose: () => void
	onCreate: (name: string, startUrl: string) => void
	existingNames: string[]
}

export function CreateAppDialog({ isOpen, onClose, onCreate, existingNames }: CreateAppDialogProps) {
	const { t } = useTranslations()
	const [name, setName] = useState("")
	const [startUrl, setStartUrl] = useState("")

	const nameExists = existingNames.includes(name)
	const isValid = name.trim() !== "" && startUrl.trim() !== "" && !nameExists

	const handleCreate = () => {
		if (!isValid) return
		onCreate(name.trim(), startUrl.trim())
		setName("")
		setStartUrl("")
	}

	const handleClose = () => {
		onClose()
		setName("")
		setStartUrl("")
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
								<Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("app.namePlaceholder")} autoFocus />
								{nameExists && (
									<Text fontSize="xs" color="red.500">
										Name already exists
									</Text>
								)}
							</VStack>
							<VStack align="stretch" gap={1}>
								<Text fontSize="sm">{t("app.startUrl")}</Text>
								<Input value={startUrl} onChange={(e) => setStartUrl(e.target.value)} placeholder={t("app.urlPlaceholder")} />
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
