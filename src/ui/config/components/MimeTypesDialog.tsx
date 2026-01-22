import { Button, Dialog, HStack, Portal, Textarea } from "@chakra-ui/react"
import { useTranslations } from "@ui/shared/hooks"
import { useEffect, useState } from "react"

interface MimeTypesDialogProps {
	isOpen: boolean
	value: string[]
	onClose: () => void
	onSave: (value: string[]) => void
}

export function MimeTypesDialog({ isOpen, value, onClose, onSave }: MimeTypesDialogProps) {
	const { t } = useTranslations()
	const [text, setText] = useState("")

	useEffect(() => {
		if (isOpen) {
			setText(value.join("\n"))
		}
	}, [isOpen, value])

	const handleSave = () => {
		const mimeTypes = text
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0)
		onSave(mimeTypes)
		onClose()
	}

	return (
		<Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>{t("downloads.autoOpenMimeTypes")}</Dialog.Title>
						</Dialog.Header>
						<Dialog.Body>
							<Textarea
								value={text}
								onChange={(e) => setText(e.target.value)}
								placeholder={t("downloads.mimeTypesPlaceholder")}
								rows={8}
								fontFamily="mono"
								fontSize="sm"
							/>
						</Dialog.Body>
						<Dialog.Footer>
							<HStack gap={2}>
								<Button variant="ghost" onClick={onClose}>
									{t("common.cancel")}
								</Button>
								<Button colorPalette="blue" onClick={handleSave}>
									{t("common.save")}
								</Button>
							</HStack>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	)
}
