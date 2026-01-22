/**
 * Detection of dangerous executable files by magic bytes.
 * More reliable than MIME type detection for security purposes.
 */
import { createLogger } from "./logger"

const log = createLogger("ExecutableDetection")

interface ExecutableSignature {
	name: string
	bytes: number[]
}

const EXECUTABLE_SIGNATURES: ExecutableSignature[] = [
	{ name: "DOS/Windows EXE", bytes: [0x4d, 0x5a] }, // MZ
	{ name: "ELF", bytes: [0x7f, 0x45, 0x4c, 0x46] }, // .ELF
	{ name: "Mach-O 32-bit", bytes: [0xce, 0xfa, 0xed, 0xfe] },
	{ name: "Mach-O 64-bit", bytes: [0xcf, 0xfa, 0xed, 0xfe] },
	{ name: "Mach-O Universal", bytes: [0xca, 0xfe, 0xba, 0xbe] },
	{ name: "Shebang", bytes: [0x23, 0x21] }, // #!
]

export interface ExecutableCheckResult {
	isExecutable: boolean
	name?: string
}

/**
 * Check if a buffer starts with known executable magic bytes.
 * Only needs the first few bytes of the file.
 */
export function isExecutableByMagic(buffer: Buffer): ExecutableCheckResult {
	for (const sig of EXECUTABLE_SIGNATURES) {
		if (buffer.length >= sig.bytes.length) {
			const matches = sig.bytes.every((byte, i) => buffer[i] === byte)
			if (matches) {
				return { isExecutable: true, name: sig.name }
			}
		}
	}
	return { isExecutable: false }
}

// Minimum bytes needed for magic detection (longest signature)
export const MIN_BYTES_FOR_MAGIC = Math.max(...EXECUTABLE_SIGNATURES.map((s) => s.bytes.length))

// MIME types that may contain macros (file-type can't distinguish macro-enabled versions)
const OFFICE_MIMES_WITH_POTENTIAL_MACROS = [
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx/xlsm
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx/docm
	"application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx/pptm
]

export function checkOfficeMacroWarning(mime: string | undefined): void {
	if (mime && OFFICE_MIMES_WITH_POTENTIAL_MACROS.includes(mime)) {
		// TODO: check for macros by opening ZIP and looking for vbaProject.bin
		log.warn(`Office file detected (${mime}) - macro check not implemented`)
	}
}
