import { HStack, Text } from "@chakra-ui/react"
import { DEFAULT_NAVBAR, type NavBarConfig } from "@shared/config.schema"
import { useTranslations } from "@ui/shared/hooks"
import { SegmentSelect } from "./SegmentSelect"
import { SwitchField } from "./SwitchField"
import { TriStateSegmentSelect } from "./TriStateSegmentSelect"
import { TriStateSwitch } from "./TriStateSwitch"

type NavBarConfigFormProps =
	| {
			mode: "global"
			config: Partial<NavBarConfig>
			onChange: (key: keyof NavBarConfig, value: boolean | string) => void
	  }
	| {
			mode: "app"
			config: Partial<NavBarConfig>
			defaults: Partial<NavBarConfig>
			onChange: (key: keyof NavBarConfig, value: boolean | string | undefined) => void
	  }

export function NavBarConfigForm(props: NavBarConfigFormProps) {
	const { t } = useTranslations()
	const { mode, config, onChange } = props

	const getDefault = (key: keyof NavBarConfig): boolean => {
		if (mode === "app") {
			return (props.defaults[key] ?? DEFAULT_NAVBAR[key]) as boolean
		}
		return DEFAULT_NAVBAR[key] as boolean
	}

	if (mode === "app") {
		return (
			<>
				<TriStateSegmentSelect
					label={t("navbar.position")}
					value={config.position}
					defaultValue={props.defaults.position || DEFAULT_NAVBAR.position}
					options={[
						{ value: "bottom", label: t("position.bottom") },
						{ value: "top", label: t("position.top") },
					]}
					onChange={(v) => onChange("position", v)}
				/>
				<TriStateSwitch
					label={t("navbar.visible")}
					value={config.visible}
					defaultValue={getDefault("visible")}
					onChange={(v) => onChange("visible", v)}
				/>
				<TriStateSwitch
					label={t("navbar.autoHide")}
					value={config.autoHide}
					defaultValue={getDefault("autoHide")}
					onChange={(v) => onChange("autoHide", v)}
				/>
				<TriStateSwitch
					label={t("navbar.allowUrlEdit")}
					value={config.allowUrlEdit}
					defaultValue={getDefault("allowUrlEdit")}
					onChange={(v) => onChange("allowUrlEdit", v)}
				/>
				<TriStateSwitch
					label={t("navbar.showBackButton")}
					value={config.showBackButton}
					defaultValue={getDefault("showBackButton")}
					onChange={(v) => onChange("showBackButton", v)}
				/>
				<TriStateSwitch
					label={t("navbar.showForwardButton")}
					value={config.showForwardButton}
					defaultValue={getDefault("showForwardButton")}
					onChange={(v) => onChange("showForwardButton", v)}
				/>
				<TriStateSwitch
					label={t("navbar.showRefreshButton")}
					value={config.showRefreshButton}
					defaultValue={getDefault("showRefreshButton")}
					onChange={(v) => onChange("showRefreshButton", v)}
				/>
				<TriStateSwitch
					label={t("navbar.showHomeButton")}
					value={config.showHomeButton}
					defaultValue={getDefault("showHomeButton")}
					onChange={(v) => onChange("showHomeButton", v)}
				/>
			</>
		)
	}

	return (
		<>
			<HStack justify="space-between" py={2}>
				<Text fontSize="sm">{t("navbar.position")}</Text>
				<SegmentSelect
					value={config.position || "bottom"}
					options={[
						{ value: "bottom", label: t("position.bottom") },
						{ value: "top", label: t("position.top") },
					]}
					onChange={(v) => onChange("position", v)}
				/>
			</HStack>
			<SwitchField label={t("navbar.visible")} checked={config.visible ?? true} onChange={(v) => onChange("visible", v)} />
			<SwitchField label={t("navbar.autoHide")} checked={config.autoHide ?? false} onChange={(v) => onChange("autoHide", v)} />
			<SwitchField label={t("navbar.allowUrlEdit")} checked={config.allowUrlEdit ?? false} onChange={(v) => onChange("allowUrlEdit", v)} />
			<SwitchField label={t("navbar.showBackButton")} checked={config.showBackButton ?? false} onChange={(v) => onChange("showBackButton", v)} />
			<SwitchField label={t("navbar.showForwardButton")} checked={config.showForwardButton ?? false} onChange={(v) => onChange("showForwardButton", v)} />
			<SwitchField label={t("navbar.showRefreshButton")} checked={config.showRefreshButton ?? false} onChange={(v) => onChange("showRefreshButton", v)} />
			<SwitchField label={t("navbar.showHomeButton")} checked={config.showHomeButton ?? true} onChange={(v) => onChange("showHomeButton", v)} />
		</>
	)
}
