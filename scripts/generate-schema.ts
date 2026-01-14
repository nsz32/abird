import { writeFileSync } from "node:fs"
import { join } from "node:path"
import { zodToJsonSchema } from "zod-to-json-schema"
import { GlobalConfigSchema } from "../src/shared/config.schema"

const jsonSchema = zodToJsonSchema(GlobalConfigSchema, {
	name: "BirdConfig",
	$refStrategy: "none",
})

const outputPath = join(import.meta.dirname, "..", "bird.config.schema.json")
writeFileSync(outputPath, JSON.stringify(jsonSchema, null, "\t"))

console.log(`JSON Schema generated: ${outputPath}`)
