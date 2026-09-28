import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { contractPaths, renderContracts } from "./generate-contracts.mjs";

export async function checkContracts({ source, target }, ci = process.env.CI === "true") {
  const backendRoot = path.dirname(path.dirname(path.dirname(source)));
  if (!existsSync(backendRoot) && ci) {
    console.warn(`AVISO: se omite contracts:check porque falta el repo hermano: ${backendRoot}`);
    return;
  }
  if (!existsSync(source)) throw new Error(`OpenAPI contract not found: ${source}`);
  if (!existsSync(target)) throw new Error(`Generated TypeScript schema not found: ${target}`);

  const expected = await renderContracts(source);
  const actual = readFileSync(target, "utf8");
  if (actual !== expected) throw new Error("Generated schema.d.ts is stale. Run npm run contracts.");
  console.log("Generated TypeScript schema matches OpenAPI.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await checkContracts(contractPaths());
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
