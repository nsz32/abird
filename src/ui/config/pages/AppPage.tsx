import { Box, Button, Flex, HStack, Heading, Image, Input, Spinner, Text, VStack } from "@chakra-ui/react"
import type { AppConfig, GlobalConfig } from "@shared/config.schema"
import type { TranslationKey } from "@shared/i18n/translations"
import type { IconResult } from "@shared/types"
import { useEffect, useState } from "react"
import { PositionSelect } from "../components/PositionSelect"
import { SwitchField } from "../components/SwitchField"
import { ThemeSelect } from "../components/ThemeSelect"

interface AppPageProps {
	name: string
	config: GlobalConfig
	onChange: (config: GlobalConfig) => void
	t: (key: TranslationKey) => string
}

export function AppPage({ name, config, onChange, t }: AppPageProps) {
	const [icons, setIcons] = useState<IconResult[]>([])
	const [iconSizes, setIconSizes] = useState<Record<string, { w: number; h: number }>>({})
	const [fetchingIcons, setFetchingIcons] = useState(false)
	const [savingIcon, setSavingIcon] = useState(false)

	useEffect(() => {
		document.title = `Bird - ${name}`
		setIcons([]) // Reset icons when app changes
		setIconSizes({})
	}, [name])

	const handleImageLoad = (url: string, e: React.SyntheticEvent<HTMLImageElement>) => {
		const img = e.currentTarget
		setIconSizes((prev) => ({ ...prev, [url]: { w: img.naturalWidth, h: img.naturalHeight } }))
	}

	const handleSelectIcon = async (base64: string) => {
		if (savingIcon) return
		setSavingIcon(true)
		try {
			const filename = await window.bird.icons.save(name, base64, app.icon)
			updateApp({ icon: filename })
		} catch (err) {
			console.error("Failed to save icon:", err)
		} finally {
			setSavingIcon(false)
		}
	}

	const app = config.apps[name]

	if (!app) {
		return (
			<Box bg="bg.panel" p={4} borderRadius="lg">
				<Text>Application "{name}" non trouvée</Text>
			</Box>
		)
	}

	const updateApp = (updates: Partial<AppConfig>) => {
		onChange({
			...config,
			apps: {
				...config.apps,
				[name]: { ...app, ...updates },
			},
		})
	}

	const updateNavBar = (key: string, value: boolean | string) => {
		updateApp({
			navBar: { ...app.navBar, [key]: value },
		})
	}

	const handleFetchIcons = async () => {
		if (!app.startUrl) return
		setFetchingIcons(true)
		setIcons([])
		try {
			const result = await window.bird.icons.fetch(app.startUrl, app.partition)
			setIcons(result.icons)
		} catch (err) {
			console.error("Failed to fetch icons:", err)
		} finally {
			setFetchingIcons(false)
		}
	}

	return (
		<VStack align="stretch" gap={4}>
			<Box bg="bg.panel" p={4} borderRadius="lg">
				<Heading size="md" mb={4}>
					Général
				</Heading>
				<HStack justify="space-between" py={2}>
					<Text fontSize="sm">URL de démarrage</Text>
					<Input size="sm" width="200px" value={app.startUrl} onChange={(e) => updateApp({ startUrl: e.target.value })} />
				</HStack>
				<HStack justify="space-between" py={2}>
					<Text fontSize="sm">Partition</Text>
					<Input size="sm" width="200px" value={app.partition} onChange={(e) => updateApp({ partition: e.target.value })} />
				</HStack>
				<HStack justify="space-between" py={2}>
					<Text fontSize="sm">Thème</Text>
					<ThemeSelect value={app.theme || "system"} onChange={(v) => updateApp({ theme: v })} t={t} />
				</HStack>
				<HStack justify="space-between" py={2} align="flex-start">
					<Text fontSize="sm">Icône</Text>
					<VStack align="flex-end" gap={2}>
						<Button size="sm" onClick={handleFetchIcons} disabled={fetchingIcons || !app.startUrl}>
							{fetchingIcons ? <Spinner size="sm" /> : "Obtenir icônes"}
						</Button>
						{icons.length > 0 && (
							<Flex wrap="wrap" gap={3}>
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
											cursor={savingIcon ? "wait" : "pointer"}
											_hover={{ borderColor: "blue.500" }}
											onClick={() => handleSelectIcon(icon.url)}
											opacity={savingIcon ? 0.5 : 1}
										>
											<Image
												src={icon.url}
												alt={icon.source}
												onLoad={(e) => handleImageLoad(icon.url, e)}
												fallback={<Box boxSize="32px" bg="bg.subtle" />}
											/>
											<Text fontSize="xs" color="fg.muted">
												{size ? `${size.w}x${size.h}` : "..."}
											</Text>
										</VStack>
									)
								})}
							</Flex>
						)}
						{app.icon && (
							<Text fontSize="xs" color="fg.muted">
								Icône : {app.icon}
							</Text>
						)}
					</VStack>
				</HStack>
			</Box>

			<Box bg="bg.panel" p={4} borderRadius="lg">
				<Heading size="md" mb={4}>
					Barre de navigation
				</Heading>
				<HStack justify="space-between" py={2}>
					<Text fontSize="sm">Position</Text>
					<PositionSelect value={app.navBar?.position || "top"} onChange={(v) => updateNavBar("position", v)} t={t} />
				</HStack>
				<SwitchField label="Visible" checked={app.navBar?.visible ?? true} onChange={(v) => updateNavBar("visible", v)} />
				<SwitchField label="Masquage automatique" checked={app.navBar?.autoHide ?? false} onChange={(v) => updateNavBar("autoHide", v)} />
				<SwitchField label="URL modifiable" checked={app.navBar?.urlEditable ?? true} onChange={(v) => updateNavBar("urlEditable", v)} />
				<SwitchField
					label="Boutons précédent/suivant"
					checked={app.navBar?.showBackForward ?? true}
					onChange={(v) => updateNavBar("showBackForward", v)}
				/>
				<SwitchField label="Bouton recharger" checked={app.navBar?.showReload ?? true} onChange={(v) => updateNavBar("showReload", v)} />
			</Box>
		</VStack>
	)
}
