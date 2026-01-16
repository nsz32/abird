import { closeSync, existsSync, openSync, readSync, statSync } from "node:fs"
import { fileTypeFromFile } from "file-type"
import { type ExecutableCheckResult, MIN_BYTES_FOR_MAGIC, isExecutableByMagic } from "./executableDetection"

export interface FileDetectionResult {
	mime?: string
	executable: ExecutableCheckResult
}

export function readMagicBytes(filePath: string): Buffer | null {
	try {
		const fd = openSync(filePath, "r")
		const buffer = Buffer.alloc(MIN_BYTES_FOR_MAGIC)
		readSync(fd, buffer, 0, MIN_BYTES_FOR_MAGIC, 0)
		closeSync(fd)
		return buffer
	} catch {
		return null
	}
}

export async function detectFileType(filePath: string): Promise<FileDetectionResult> {
	const magicBuffer = readMagicBytes(filePath)
	const executable = magicBuffer ? isExecutableByMagic(magicBuffer) : { isExecutable: false }
	const detected = await fileTypeFromFile(filePath)
	return { mime: detected?.mime, executable }
}

const DEFAULT_MIN_SIZE = 4096
const DEFAULT_RETRY_DELAY = 10
const DEFAULT_MAX_RETRIES = 10

interface DetectWithRetryOptions {
	minSize?: number
	retryDelay?: number
	maxRetries?: number
}

export async function detectFileTypeWithRetry(filePath: string, options: DetectWithRetryOptions = {}): Promise<FileDetectionResult> {
	const minSize = options.minSize ?? DEFAULT_MIN_SIZE
	const retryDelay = options.retryDelay ?? DEFAULT_RETRY_DELAY
	const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES

	for (let i = 0; i < maxRetries; i++) {
		try {
			if (existsSync(filePath) && statSync(filePath).size >= minSize) {
				return await detectFileType(filePath)
			}
		} catch (err) {
			console.error("[fileDetection] detectWithRetry error:", err)
		}
		await new Promise((r) => setTimeout(r, retryDelay))
	}

	return { executable: { isExecutable: false } }
}
