// Forbidden characters on Windows: < > : " / \ | ? *
// Windows reserved names: CON, PRN, AUX, NUL, COM1-9, LPT1-9

const INVALID_CHARS = /[<>:"/\\|?*\x00-\x1f]/
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i

export type NameValidationError = "name.invalidChars" | "name.reserved" | "name.tooLong" | "name.invalidFormat"

export function validateFolderName(name: string): NameValidationError | null {
	if (INVALID_CHARS.test(name)) {
		return "name.invalidChars"
	}

	if (WINDOWS_RESERVED.test(name)) {
		return "name.reserved"
	}

	if (name.length > 255) {
		return "name.tooLong"
	}

	if (name.startsWith(".") || name.endsWith(".") || name.endsWith(" ")) {
		return "name.invalidFormat"
	}

	return null
}
