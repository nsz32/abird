import { Button, HStack, IconButton, Text, VStack } from "@chakra-ui/react"
import type { DownloadConfig } from "@shared/config.schema"
import { useTranslations } from "@ui/shared/hooks"
import { Pencil, RotateCcw } from "lucide-react"
import { useState } from "react"
import { DirectoryPicker } from "./DirectoryPicker"
import { MimeTypesDialog } from "./MimeTypesDialog"
import { SwitchField } from "./SwitchField"
import { TriStateSwitch } from "./TriStateSwitch"

const STANDARD_MIME_TYPES = [
	"application/msword",
	"application/vnd.ms-*",
	"application/vnd.openxmlformats-officedocument.*",
	"application/vnd.oasis.opendocument.*",
	"application/pdf",
	"image/*",
	"video/*",
	"audio/*",
]

type DownloadsConfigFormProps =
	| {
			mode: "global"
			config: Partial<DownloadConfig>
			onChange: (key: keyof DownloadConfig, value: string | string[] | boolean | undefined) => void
	  }
	| {
			mode: "app"
			config: Partial<DownloadConfig>
			defaults: Partial<DownloadConfig>
			onChange: (key: keyof DownloadConfig, value: string | string[] | boolean | undefined) => void
	  }

export function DownloadsConfigForm(props: DownloadsConfigFormProps) {
	const { t } = useTranslations()
	const { mode, config, onChange } = props
	const [showMimeDialog, setShowMimeDialog] = useState(false)

	const getDefault = <K extends keyof DownloadConfig>(key: K): DownloadConfig[K] | undefined => {
		if (mode === "app") {
			return props.defaults[key]
		}
		return undefined
	}

	const getMimeTypes = (): string[] => {
		return config.autoOpenMimeTypes ?? getDefault("autoOpenMimeTypes") ?? []
	}

	const formatMimeTypes = (types: string[]): string => {
		if (types.length === 0) return t("downloads.none")
		return types.join(", ")
	}

	if (mode === "app") {
		const mimeTypesInherited = config.autoOpenMimeTypes === undefined
		const mimeTypes = getMimeTypes()

		return (
			<>
				<DirectoryPicker
					label={t("downloads.directory")}
					value={config.directory}
					defaultValue={getDefault("directory")}
					onChange={(v) => onChange("directory", v)}
					showInheritance
				/>

				<VStack align="stretch" gap={1} py={2}>
					<HStack justify="space-between">
						<HStack gap={1}>
							<Text fontSize="sm">{t("downloads.autoOpenMimeTypes")}</Text>
							{mimeTypesInherited && (
								<Text fontSize="xs" color="fg.muted">
									{t("inherit.inherited")}
								</Text>
							)}
						</HStack>
						<HStack gap={1}>
							{!mimeTypesInherited && (
								<IconButton
									aria-label={t("inherit.reset")}
									variant="ghost"
									size="xs"
									onClick={() => onChange("autoOpenMimeTypes", undefined)}
									title={t("inherit.reset")}
								>
									<RotateCcw size={14} />
								</IconButton>
							)}
							<Button size="xs" variant="ghost" onClick={() => onChange("autoOpenMimeTypes", [])}>
								{t("downloads.mimeNone")}
							</Button>
							<Button
								size="xs"
								variant="ghost"
								title={t("downloads.mimeStandardHint")}
								onClick={() => onChange("autoOpenMimeTypes", STANDARD_MIME_TYPES)}
							>
								{t("downloads.mimeStandard")}
							</Button>
							<IconButton aria-label={t("common.edit")} variant="ghost" size="xs" onClick={() => setShowMimeDialog(true)}>
								<Pencil size={14} />
							</IconButton>
						</HStack>
					</HStack>
					<Text fontSize="xs" fontFamily="mono" color="fg.muted">
						{formatMimeTypes(mimeTypes)}
					</Text>
				</VStack>

				<TriStateSwitch
					label={t("downloads.allowExecutablesDownload")}
					hint={t("downloads.executablesHint")}
					value={config.allowExecutablesDownload}
					defaultValue={getDefault("allowExecutablesDownload") ?? false}
					onChange={(v) => onChange("allowExecutablesDownload", v)}
				/>

				<TriStateSwitch
					label={t("downloads.allowDuplicateDownloads")}
					value={config.allowDuplicateDownloads}
					defaultValue={getDefault("allowDuplicateDownloads") ?? false}
					onChange={(v) => onChange("allowDuplicateDownloads", v)}
				/>

				<MimeTypesDialog
					isOpen={showMimeDialog}
					value={mimeTypes}
					onClose={() => setShowMimeDialog(false)}
					onSave={(v) => onChange("autoOpenMimeTypes", v.length > 0 ? v : undefined)}
				/>
			</>
		)
	}

	// Mode global
	const mimeTypes = config.autoOpenMimeTypes ?? []

	return (
		<>
			<DirectoryPicker label={t("downloads.directory")} value={config.directory} onChange={(v) => onChange("directory", v)} />

			<VStack align="stretch" gap={1} py={2}>
				<HStack justify="space-between">
					<Text fontSize="sm">{t("downloads.autoOpenMimeTypes")}</Text>
					<HStack gap={1}>
						<Button size="xs" variant="ghost" onClick={() => onChange("autoOpenMimeTypes", undefined)}>
							{t("downloads.mimeNone")}
						</Button>
						<Button
							size="xs"
							variant="ghost"
							title={t("downloads.mimeStandardHint")}
							onClick={() => onChange("autoOpenMimeTypes", STANDARD_MIME_TYPES)}
						>
							{t("downloads.mimeStandard")}
						</Button>
						<IconButton aria-label={t("common.edit")} variant="ghost" size="xs" onClick={() => setShowMimeDialog(true)}>
							<Pencil size={14} />
						</IconButton>
					</HStack>
				</HStack>
				<Text fontSize="xs" fontFamily="mono" color="fg.muted">
					{formatMimeTypes(mimeTypes)}
				</Text>
			</VStack>

			<SwitchField
				label={t("downloads.allowExecutablesDownload")}
				hint={t("downloads.executablesHint")}
				checked={config.allowExecutablesDownload ?? false}
				onChange={(v) => onChange("allowExecutablesDownload", v)}
			/>

			<SwitchField
				label={t("downloads.allowDuplicateDownloads")}
				checked={config.allowDuplicateDownloads ?? false}
				onChange={(v) => onChange("allowDuplicateDownloads", v)}
			/>

			<MimeTypesDialog
				isOpen={showMimeDialog}
				value={mimeTypes}
				onClose={() => setShowMimeDialog(false)}
				onSave={(v) => onChange("autoOpenMimeTypes", v.length > 0 ? v : undefined)}
			/>
		</>
	)
}
