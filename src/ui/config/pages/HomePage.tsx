import { Box, Button, HStack, Heading, Text, VStack } from "@chakra-ui/react"
import type { BirdConfig } from "@shared/config.schema"
import { useTranslations } from "@ui/shared/hooks"
import { useEffect } from "react"
import { PositionSelect } from "../components/PositionSelect"
import { SwitchField } from "../components/SwitchField"
import { ThemeSelect } from "../components/ThemeSelect"

interface HomePageProps {
	config: BirdConfig
	configPath: string
	onChange: (config: BirdConfig) => void
	onNavigate: (hash: string) => void
}

export function HomePage({ config, configPath, onChange, onNavigate }: HomePageProps) {
	const { t } = useTranslations()
	useEffect(() => {
		document.title = t("settings.title")
	}, [t])

	const updateTheme = (theme: BirdConfig["theme"]) => {
		onChange({ ...config, theme })
	}

	const updateNavBar = (key: string, value: boolean | string) => {
		onChange({
			...config,
			navBar: { ...config.navBar, [key]: value },
		})
	}

	const apps = Object.entries(config.apps)

	return (
		<VStack align="stretch" gap={4}>
			<Box bg="bg.panel" p={4} borderRadius="lg">
				<Heading size="md" mb={4}>
					{t("settings.appearance")}
				</Heading>
				<HStack justify="space-between">
					<Text fontSize="sm">{t("settings.theme")}</Text>
					<ThemeSelect value={config.theme} onChange={updateTheme} />
				</HStack>
			</Box>

			<Box bg="bg.panel" p={4} borderRadius="lg">
				<Heading size="md" mb={4}>
					{t("settings.navbar")}
				</Heading>
				<HStack justify="space-between" py={2}>
					<Text fontSize="sm">{t("navbar.position")}</Text>
					<PositionSelect value={config.navBar?.position || "top"} onChange={(v) => updateNavBar("position", v)} />
				</HStack>
				<SwitchField label={t("navbar.visible")} checked={config.navBar?.visible ?? true} onChange={(v) => updateNavBar("visible", v)} />
				<SwitchField label={t("navbar.autoHide")} checked={config.navBar?.autoHide ?? false} onChange={(v) => updateNavBar("autoHide", v)} />
				<SwitchField label={t("navbar.urlEditable")} checked={config.navBar?.urlEditable ?? true} onChange={(v) => updateNavBar("urlEditable", v)} />
				<SwitchField
					label={t("navbar.showBackForward")}
					checked={config.navBar?.showBackForward ?? true}
					onChange={(v) => updateNavBar("showBackForward", v)}
				/>
				<SwitchField label={t("navbar.showReload")} checked={config.navBar?.showReload ?? true} onChange={(v) => updateNavBar("showReload", v)} />
			</Box>

			<Box bg="bg.panel" p={4} borderRadius="lg">
				<Heading size="md" mb={4}>
					{t("settings.apps")}
				</Heading>
				{apps.length === 0 ? (
					<Text fontSize="sm" color="fg.muted">
						{t("settings.noApps")}
					</Text>
				) : (
					<VStack align="stretch" gap={2}>
						{apps.map(([name, app]) => (
							<Button key={name} variant="ghost" justifyContent="space-between" onClick={() => onNavigate(`#app/${name}`)}>
								<Box textAlign="left">
									<Text fontWeight="medium">{name}</Text>
									<Text fontSize="xs" color="fg.muted">
										{app.startUrl}
									</Text>
								</Box>
								<Text>→</Text>
							</Button>
						))}
					</VStack>
				)}
			</Box>

			<Text fontSize="xs" color="fg.muted">
				{t("settings.configPath")} : {configPath}
			</Text>
		</VStack>
	)
}
