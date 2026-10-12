import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { checkContracts } from "./check-contracts.mjs";
import { generateContracts, renderValidationContracts, validationTarget } from "./generate-contracts.mjs";

test("generates changed nested-input lengths, numeric ranges and audit options from OpenAPI", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "validation-contract-"));
  try {
    const source = path.join(directory, "openapi.json");
    const target = path.join(directory, "schema.d.ts");
    const schema = { openapi: "3.1.0", info: { title: "Fixture", version: "1" }, paths: {},
      components: { schemas: { LegalContent: { type: "object", properties: { text: { type: "string", maxLength: 4321 } } },
        Settings: { type: "object", properties: { count: { type: "integer", minimum: 2, maximum: 17 }, signed: { type: "integer", format: "int32" }, narrowed: { type: "integer", format: "int32", minimum: 1, maximum: 20 }, preview: { type: "array", maxItems: 7, items: { type: "string" } } } } } },
      "x-organization-audit-categories": ["new-category"] };
    writeFileSync(source, JSON.stringify(schema));
    await generateContracts({ source, target });
    const runtime = readFileSync(validationTarget(target), "utf8");
    assert.match(runtime, /"maxLength": 4321/);
    assert.match(runtime, /"minimum": 2/);
    assert.match(runtime, /"signed": \{\s*"minimum": -2147483648,\s*"maximum": 2147483647/);
    assert.match(runtime, /"narrowed": \{\s*"minimum": 1,\s*"maximum": 20/);
    assert.match(runtime, /"maximum": 17/);
    assert.match(runtime, /"maxItems": 7/);
    assert.match(runtime, /\["new-category"\]/);
    await checkContracts({ source, target }, false);
    schema.components.schemas.LegalContent.properties.text.maxLength = 5432;
    schema.components.schemas.Settings.properties.preview.maxItems = 9;
    writeFileSync(source, JSON.stringify(schema));
    assert.notEqual(renderValidationContracts(source), runtime);
    await assert.rejects(checkContracts({ source, target }, false), /stale/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
