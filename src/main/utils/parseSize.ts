/**
 * Parse a size string like "512k", "10M" or a number to bytes
 */
export function parseSize(value: number | string | undefined): number {
	if (value === undefined) return 0
	if (typeof value === "number") return value

	const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*([kKmMgG])?[bB]?$/)
	if (!match) return 0

	const num = Number.parseFloat(match[1])
	const unit = match[2]?.toLowerCase()

	switch (unit) {
		case "k":
			return Math.floor(num * 1024)
		case "m":
			return Math.floor(num * 1024 * 1024)
		case "g":
			return Math.floor(num * 1024 * 1024 * 1024)
		default:
			return Math.floor(num)
	}
}
