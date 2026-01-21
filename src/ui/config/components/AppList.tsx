import { Button, Text, VStack } from "@chakra-ui/react"
import type { AppConfig } from "@shared/config.schema"
import type { DeployState } from "@shared/types"
import { useTranslations } from "@ui/shared/hooks"
import { AppCard } from "./AppCard"

interface AppListProps {
	apps: Record<string, AppConfig>
	deployState: DeployState
	onSelect: (name: string) => void
	onCreate: () => void
	onDelete: (name: string) => void
}

export function AppList({ apps, deployState, onSelect, onCreate, onDelete }: AppListProps) {
	const { t } = useTranslations()
	const entries = Object.entries(apps)

	return (
		<VStack align="stretch" gap={3}>
			<Button variant="outline" size="sm" onClick={onCreate}>
				+ {t("app.create")}
			</Button>

			{entries.length === 0 ? (
				<Text fontSize="sm" color="fg.muted" textAlign="center" py={4}>
					{t("settings.noApps")}
				</Text>
			) : (
				entries.map(([name, app]) => (
					<AppCard
						key={name}
						name={name}
						app={app}
						isDeployed={deployState.supported && deployState.apps[name]}
						onSelect={() => onSelect(name)}
						onDelete={() => onDelete(name)}
					/>
				))
			)}
		</VStack>
	)
}
