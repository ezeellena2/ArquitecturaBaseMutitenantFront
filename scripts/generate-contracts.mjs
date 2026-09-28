import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";

const root = path.resolve(import.meta.dirname, "..");

export function contractPaths(args = process.argv.slice(2)) {
  const values = new Map();
  for (let index = 0; index < args.length; index += 2) {
    if (!args[index]?.startsWith("--") || args[index + 1] === undefined) {
      throw new Error("Expected --source or --target followed by a path.");
    }
    values.set(args[index], args[index + 1]);
  }
  return {
    source: path.resolve(values.get("--source") ?? path.join(root, "../ArquitecturaBaseMutitenant/docs/contracts/openapi.json")),
    target: path.resolve(values.get("--target") ?? path.join(root, "src/shared/api/generated/schema.d.ts")),
  };
}

export async function renderContracts(source) {
  if (!existsSync(source)) throw new Error(`OpenAPI contract not found: ${source}`);
  const schema = JSON.parse(readFileSync(source, "utf8"));
  const generated = astToString(await openapiTS(schema));
  return generated.endsWith("\n") ? generated : `${generated}\n`;
}

export async function generateContracts({ source, target }) {
  const generated = await renderContracts(source);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, generated, "utf8");
  return target;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const target = await generateContracts(contractPaths());
    console.log(`Types generated: ${target}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
