import { Button, Dialog, Flex, HStack, Image, Spinner, Text, VStack } from "@chakra-ui/react"
import type { IconResult } from "@shared/types"
import { useTranslations } from "@ui/shared/hooks"
import { useEffect, useState } from "react"

const CHECKERBOARD_BG = {
	backgroundImage: `
		linear-gradient(45deg, #555 25%, transparent 25%),
		linear-gradient(-45deg, #555 25%, transparent 25%),
		linear-gradient(45deg, transparent 75%, #555 75%),
		linear-gradient(-45deg, transparent 75%, #555 75%)
	`,
	backgroundSize: "12px 12px",
	backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0",
	backgroundColor: "#999",
}

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
							<Flex wrap="wrap" gap={3} justify="center" p={3} borderRadius="md" css={CHECKERBOARD_BG}>
								{icons.map((icon) => {
									const size = iconSizes[icon.url]
									return (
										<VStack
											key={icon.url}
											gap={1}
											p={2}
											borderRadius="md"
											cursor="pointer"
											_hover={{ backgroundColor: "#aaa" }}
											onClick={() => handleSelect(icon.url)}
										>
											<Image
												src={icon.url}
												alt={icon.source}
												w="64px"
												h="64px"
												objectFit="contain"
												onLoad={(e) => handleImageLoad(icon.url, e)}
											/>
											<Text
												fontSize="s"
												fontWeight="bold"
												color="white"
												mt="auto"
												css={{
													textShadow:
														"-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black, 0 -1px 0 black, 0 1px 0 black, -1px 0 0 black, 1px 0 0 black",
												}}
											>
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
