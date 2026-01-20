import { Button, Dialog, Flex, HStack, Image, Spinner, Text, VStack } from "@chakra-ui/react"
import type { IconResult } from "@shared/types"
import { useTranslations } from "@ui/shared/hooks"
import { useEffect, useState } from "react"

interface IconPickerDialogProps {
	isOpen: boolean
	startUrl: string
	partition?: string
	onClose: () => void
	onSelect: (base64: string) => void
}

type DialogState = "loading" | "empty" | "results"

export function IconPickerDialog({ isOpen, startUrl, partition, onClose, onSelect }: IconPickerDialogProps) {
	const { t } = useTranslations()
	const [state, setState] = useState<DialogState>("loading")
	const [icons, setIcons] = useState<IconResult[]>([])
	const [iconSizes, setIconSizes] = useState<Record<string, { w: number; h: number }>>({})

	useEffect(() => {
		if (!isOpen) return

		setState("loading")
		setIcons([])
		setIconSizes({})

		window.bird.icons.fetch(startUrl, partition).then((result) => {
			setIcons(result.icons)
			setState(result.icons.length > 0 ? "results" : "empty")
		})
	}, [isOpen, startUrl, partition])

	const handleImageLoad = (url: string, e: React.SyntheticEvent<HTMLImageElement>) => {
		const img = e.currentTarget
		setIconSizes((prev) => ({ ...prev, [url]: { w: img.naturalWidth, h: img.naturalHeight } }))
	}

	const handleSelect = (base64: string) => {
		onSelect(base64)
		onClose()
	}

	return (
		<Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} placement="center">
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content minWidth="400px">
					<Dialog.Header>
						<Dialog.Title>{t("app.selectIcon")}</Dialog.Title>
					</Dialog.Header>
					<Dialog.Body>
						{state === "loading" && (
							<VStack py={8} gap={3}>
								<Spinner size="lg" />
								<Text color="fg.muted">{t("app.loadingIcons")}</Text>
							</VStack>
						)}

						{state === "empty" && (
							<VStack py={8}>
								<Text color="fg.muted">{t("app.noIconsFound")}</Text>
							</VStack>
						)}

						{state === "results" && (
							<Flex wrap="wrap" gap={3} justify="center">
								{icons.map((icon) => {
									const size = iconSizes[icon.url]
									return (
										<VStack
											key={icon.url}
											gap={1}
											p={2}
											borderRadius="md"
											border="1px solid"
											borderColor="border.subtle"
											cursor="pointer"
											_hover={{ borderColor: "blue.500" }}
											onClick={() => handleSelect(icon.url)}
										>
											<Image src={icon.url} alt={icon.source} maxH="64px" onLoad={(e) => handleImageLoad(icon.url, e)} />
											<Text fontSize="xs" color="fg.muted">
												{size ? `${size.w}x${size.h}` : "..."}
											</Text>
										</VStack>
									)
								})}
							</Flex>
						)}
					</Dialog.Body>
					<Dialog.Footer>
						<HStack gap={2}>
							<Button variant="ghost" onClick={onClose}>
								{t("app.cancel")}
							</Button>
						</HStack>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	)
}
