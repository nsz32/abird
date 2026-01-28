import { writeFileSync } from "node:fs"
import { join } from "node:path"
import { zodToJsonSchema } from "zod-to-json-schema"
import { BirdConfigSchema } from "../src/shared/config.schema"
import { PARTITION_NAME_PATTERN } from "../src/shared/partition"

const jsonSchema = zodToJsonSchema(BirdConfigSchema, {
	name: "BirdConfig",
	$refStrategy: "none",
}) as { definitions: { BirdConfig: { properties: { partitions: Record<string, unknown> } } } }

// Add propertyNames constraint to validate partition keys
jsonSchema.definitions.BirdConfig.properties.partitions.propertyNames = {
	pattern: PARTITION_NAME_PATTERN.source,
}

const outputPath = join(import.meta.dirname, "..", "abird.config.schema.json")
writeFileSync(outputPath, JSON.stringify(jsonSchema, null, "\t"))

console.log(`JSON Schema generated: ${outputPath}`)
