import { Button, HStack, IconButton, Text, VStack } from "@chakra-ui/react"
import { useTranslations } from "@ui/shared/hooks"
import { Folder, RotateCcw } from "lucide-react"
import { useEffect, useState } from "react"

interface DirectoryPickerProps {
	label: string
	value: string | undefined
	defaultValue?: string
	onChange: (value: string | undefined) => void
	showInheritance?: boolean
}

export function DirectoryPicker({ label, value, defaultValue, onChange, showInheritance = false }: DirectoryPickerProps) {
	const { t } = useTranslations()
	const [systemDefault, setSystemDefault] = useState<string>("")

	useEffect(() => {
		window.abird.settings.getDefaultDownloadsPath().then(setSystemDefault)
	}, [])

	const isInherited = showInheritance && value === undefined
	const displayPath = value ?? defaultValue ?? systemDefault

	const handleSelect = async () => {
		const selected = await window.abird.settings.selectDirectory(displayPath || undefined)
		if (selected) {
			onChange(selected)
		}
	}

	const handleReset = () => {
		onChange(undefined)
	}

	return (
		<VStack align="stretch" gap={1} py={2}>
			<HStack justify="space-between">
				<HStack gap={1}>
					<Text fontSize="sm">{label}</Text>
					{isInherited && (
						<Text fontSize="xs" color="fg.muted">
							{t("inherit.inherited")}
						</Text>
					)}
				</HStack>
				<HStack gap={2}>
					{showInheritance && !isInherited && (
						<IconButton aria-label={t("inherit.reset")} variant="ghost" size="xs" onClick={handleReset} title={t("inherit.reset")}>
							<RotateCcw size={14} />
						</IconButton>
					)}
					<Button size="sm" variant="outline" onClick={handleSelect}>
						<Folder size={14} />
					</Button>
				</HStack>
			</HStack>
			<Text fontSize="xs" fontFamily="mono" color="fg.muted">
				{displayPath || t("downloads.systemDefault")}
			</Text>
		</VStack>
	)
}
