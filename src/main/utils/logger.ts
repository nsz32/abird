/**
 * Centralized logging utility for the main process.
 * Provides consistent prefixes and log levels.
 */

type LogLevel = "debug" | "info" | "warn" | "error"

const LOG_LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
}

// Set to "info" in production, "debug" for development
const CURRENT_LEVEL: LogLevel = process.env.NODE_ENV === "development" ? "debug" : "info"

function shouldLog(level: LogLevel): boolean {
	return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LEVEL]
}

function formatMessage(module: string, message: string): string {
	return `[${module}] ${message}`
}

export interface Logger {
	debug: (message: string, ...args: unknown[]) => void
	info: (message: string, ...args: unknown[]) => void
	warn: (message: string, ...args: unknown[]) => void
	error: (message: string, ...args: unknown[]) => void
}

export function createLogger(module: string): Logger {
	return {
		debug: (message: string, ...args: unknown[]) => {
			if (shouldLog("debug")) {
				console.log(formatMessage(module, message), ...args)
			}
		},
		info: (message: string, ...args: unknown[]) => {
			if (shouldLog("info")) {
				console.log(formatMessage(module, message), ...args)
			}
		},
		warn: (message: string, ...args: unknown[]) => {
			if (shouldLog("warn")) {
				console.warn(formatMessage(module, message), ...args)
			}
		},
		error: (message: string, ...args: unknown[]) => {
			if (shouldLog("error")) {
				console.error(formatMessage(module, message), ...args)
			}
		},
	}
}
