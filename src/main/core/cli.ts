interface CliOption {
	name: string
	hasValue: boolean
	description: string
}

const CLI_OPTIONS: CliOption[] = [
	{ name: "--app", hasValue: true, description: "Name of the app to launch" },
	{ name: "--config", hasValue: true, description: "Path to config file" },
	{ name: "--userAgent", hasValue: true, description: "User agent preset (omit value to list)" },
	{ name: "--kiosk", hasValue: true, description: "Enable kiosk mode with exit shortcut" },
	{ name: "--help", hasValue: false, description: "Show this help message" },
]

const KNOWN_OPTIONS = new Set(CLI_OPTIONS.map((o) => o.name))

export interface CliArgs {
	appName: string | null
	configPath: string | null
	browserUrl: string | null
	userAgent: string | null
	listUserAgents: boolean
	kioskShortcut: string | null
	showHelp: boolean
}

export function parseCliArgs(argv: string[] = process.argv.slice(2)): CliArgs | null {
	const unknownOptions = findUnknownOptions(argv)
	if (unknownOptions.length > 0) {
		for (const opt of unknownOptions) {
			console.error(`Unknown option: ${opt}`)
		}
		console.error("\nUse --help to see available options.")
		return null
	}

	return {
		appName: getOptionValue(argv, "--app"),
		configPath: getOptionValue(argv, "--config"),
		browserUrl: extractBrowserUrl(argv),
		userAgent: getOptionValue(argv, "--userAgent"),
		listUserAgents: hasOptionWithoutValue(argv, "--userAgent"),
		kioskShortcut: extractKioskShortcut(argv),
		showHelp: argv.includes("--help"),
	}
}

export function printHelp(): void {
	console.log("Usage: bird [URL] [options]\n")
	console.log("Options:")
	for (const opt of CLI_OPTIONS) {
		const valueHint = opt.hasValue ? " <value>" : ""
		console.log(`  ${opt.name}${valueHint}`.padEnd(24) + opt.description)
	}
}

export function findConfigModeConflicts(args: CliArgs): string[] {
	const conflicts: string[] = []

	if (args.userAgent !== null || args.listUserAgents) conflicts.push("--userAgent")
	if (args.kioskShortcut !== null) conflicts.push("--kiosk")

	return conflicts
}

function findUnknownOptions(argv: string[]): string[] {
	return argv.filter((arg) => arg.startsWith("--") && !KNOWN_OPTIONS.has(arg))
}

function getOptionValue(argv: string[], option: string): string | null {
	const index = argv.indexOf(option)
	if (index === -1) return null

	const value = argv[index + 1]
	return value && !value.startsWith("--") ? value : null
}

/**
 * Extract --config path from argv (for early bootstrap before app.whenReady)
 */
export function getConfigPathFromArgs(argv: string[] = process.argv.slice(2)): string | null {
	return getOptionValue(argv, "--config")
}

function hasOptionWithoutValue(argv: string[], option: string): boolean {
	const index = argv.indexOf(option)
	if (index === -1) return false

	const nextArg = argv[index + 1]
	return !nextArg || nextArg.startsWith("--")
}

function extractBrowserUrl(argv: string[]): string | null {
	const firstArg = argv[0]
	return firstArg?.match(/^https?:\/\//) ? firstArg : null
}

function extractKioskShortcut(argv: string[]): string | null {
	const index = argv.indexOf("--kiosk")
	if (index === -1) return null

	const nextArg = argv[index + 1]
	return nextArg && !nextArg.startsWith("--") ? nextArg : ""
}
