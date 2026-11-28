import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
      components: { schemas: { Source: { type: "string", enum: ["Plan", "Manual", "Trial"] }, LegalContent: { type: "object", properties: { text: { type: "string", maxLength: 4321 } } },
        Settings: { type: "object", properties: { kind: { type: "string", enum: ["Image", "Document"] }, count: { type: "integer", minimum: 2, maximum: 17 }, tariff: { type: "number", exclusiveMinimum: 0, exclusiveMaximum: 12345 }, signed: { type: "integer", format: "int32" }, narrowed: { type: "integer", format: "int32", minimum: 1, maximum: 20 }, preview: { type: "array", maxItems: 7, items: { type: "string" } }, tags: { type: "array", maxItems: 10, items: { type: "string", maxLength: 40 } } } } } },
      "x-organization-audit-categories": ["new-category"] };
    writeFileSync(source, JSON.stringify(schema));
    await generateContracts({ source, target });
    const runtime = readFileSync(validationTarget(target), "utf8");
    assert.match(runtime, /"maxLength": 4321/);
    assert.match(runtime, /export const schemaEnumValues = \{\s*"Settings": \{\s*"kind": \[\s*"Image",\s*"Document"/);
    // Un enum con nombre propio va entero y en el orden del back, el de su circuito (264), no el del abecedario.
    assert.match(runtime, /export const schemaEnums = \{\s*"Source": \[\s*"Plan",\s*"Manual",\s*"Trial"\s*\]\s*\}/);
    assert.match(runtime, /"minimum": 2/);
    assert.match(runtime, /"signed": \{\s*"minimum": -2147483648,\s*"maximum": 2147483647/);
    assert.match(runtime, /"narrowed": \{\s*"minimum": 1,\s*"maximum": 20/);
    assert.match(runtime, /"maximum": 17/);
    assert.match(runtime, /"tariff": \{\s*"exclusiveMinimum": 0,\s*"exclusiveMaximum": 12345/);
    assert.match(runtime, /"maxItems": 7/);
    // Los límites de cada elemento de una lista (el largo de cada etiqueta) van en `items`; sin límites, no hay `items`.
    assert.match(runtime, /"tags": \{\s*"maxItems": 10,\s*"items": \{\s*"maxLength": 40\s*\}/);
    assert.match(runtime, /"preview": \{\s*"maxItems": 7\s*\}/);
    assert.match(runtime, /\["new-category"\]/);
    await checkContracts({ source, target }, false);
    schema.components.schemas.LegalContent.properties.text.maxLength = 5432;
    schema.components.schemas.Settings.properties.preview.maxItems = 9;
    writeFileSync(source, JSON.stringify(schema));
    assert.notEqual(renderValidationContracts(source), runtime);
    await assert.rejects(checkContracts({ source, target }, false), /stale/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

// api-http (E12): cada ejemplo de una corrida real que el back exporta en docs/contracts/examples/ se valida contra el
// esquema de su respuesta en openapi.json, estricto y con zod (en ArquitecturaBase, el back mandaba `pending` y el front
// esperaba `Pending`).
test("contracts:check rejects an exported example with an undeclared field or a value outside its enum", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "contract-examples-"));
  try {
    const source = path.join(directory, "openapi.json");
    const target = path.join(directory, "schema.d.ts");
    const json = (ref) => ({ schema: { $ref: `#/components/schemas/${ref}` } });
    const schema = { openapi: "3.1.0", info: { title: "Fixture", version: "1" },
      paths: { "/api/things/{id}": { get: { responses: { 200: { description: "OK", content: { "application/json": json("Thing") } },
        409: { description: "Conflict", content: { "application/problem+json": json("ProblemDetails") } } } } } },
      components: { schemas: {
        Kind: { enum: ["Plain", "Fancy"], type: "string" },
        Thing: { required: ["id", "kind", "counts"], type: "object", properties: { id: { type: "string", format: "uuid" }, kind: { $ref: "#/components/schemas/Kind" },
          note: { type: ["null", "string"] }, parent: { oneOf: [{ type: "null" }, { $ref: "#/components/schemas/Thing" }] }, modifiedAtUtc: { type: "string", format: "date-time" },
          counts: { required: ["total"], type: "object", properties: { total: { type: "integer", format: "int32" } } }, tags: { maxItems: 3, type: ["null", "array"], items: { type: "string" } } } },
        ProblemDetails: { required: ["code", "traceId"], type: "object", properties: { code: { type: "string" }, traceId: { type: "string" },
          errors: { type: "object", additionalProperties: { type: "array", items: { type: "string" } } } } } } } };
    writeFileSync(source, JSON.stringify(schema));
    await generateContracts({ source, target });
    mkdirSync(path.join(directory, "examples"));
    const thing = { id: "0b6f3c5e-8a1d-4f2b-9c3e-5d7a1b2c3d4e", kind: "Fancy", note: null, modifiedAtUtc: "2026-11-27T13:45:10.1234567Z", counts: { total: 2 }, tags: ["a"],
      parent: { id: "1c7e4d6f-9b2e-4a3c-8d4f-6e8b2c3d4e5f", kind: "Plain", counts: { total: 0 } } };
    const write = (examples) => writeFileSync(path.join(directory, "examples", "things.json"), JSON.stringify({ examples }));
    const detail = (body) => ({ name: "detalle", method: "GET", path: "/api/things/{id}", status: 200, body });
    const conflict = { name: "General.ConcurrencyConflict", method: "GET", path: "/api/things/{id}", status: 409,
      body: { code: "General.ConcurrencyConflict", traceId: "00-abc", errors: { version: ["Otra persona cambió esto."] } } };
    write([detail(thing), conflict]);
    await checkContracts({ source, target }, false);

    // Un campo que el esquema no declara, también en un objeto anidado, rompe el chequeo.
    write([detail({ ...thing, extra: 1 })]);
    await assert.rejects(checkContracts({ source, target }, false), /things\.json.*detalle.*extra/s);
    write([detail({ ...thing, parent: { ...thing.parent, stray: true } })]);
    await assert.rejects(checkContracts({ source, target }, false), /parent.*stray/s);
    // Un valor fuera de su enum (`pending` en lugar de `Plain`), igual.
    write([detail({ ...thing, kind: "plain" })]);
    await assert.rejects(checkContracts({ source, target }, false), /things\.json.*kind/s);
    // Una respuesta que el contrato no declara no tiene esquema contra qué validarse.
    write([{ ...conflict, status: 422 }]);
    await assert.rejects(checkContracts({ source, target }, false), /422/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

// E13: el valor de un campo de una opción es texto o sí/no (`type: ["boolean", "string"]`), y en el delta del `PUT`, también
// `null`, que lo limpia. Un valor de varios tipos acepta cada uno de ellos y nada más.
test("contracts:check validates a value of several types against each of them", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "contract-examples-"));
  try {
    const source = path.join(directory, "openapi.json");
    const target = path.join(directory, "schema.d.ts");
    const schema = { openapi: "3.1.0", info: { title: "Fixture", version: "1" },
      paths: { "/api/rows": { get: { responses: { 200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Row" } } } } } } } },
      components: { schemas: {
        Row: { required: ["fields"], type: "object", properties: {
          fields: { type: "object", additionalProperties: { type: ["boolean", "string"] } },
          delta: { maxProperties: 100, type: ["null", "object"], additionalProperties: { type: ["null", "boolean", "string"] } } } } } } };
    writeFileSync(source, JSON.stringify(schema));
    await generateContracts({ source, target });
    mkdirSync(path.join(directory, "examples"));
    const write = (body) => writeFileSync(path.join(directory, "examples", "rows.json"), JSON.stringify({ examples: [{ name: "fila", method: "GET", path: "/api/rows", status: 200, body }] }));
    const field = "0b6f3c5e-8a1d-4f2b-9c3e-5d7a1b2c3d4e";
    write({ fields: { [field]: "12.50", other: true }, delta: { [field]: null, other: false, third: "2026-11-28" } });
    await checkContracts({ source, target }, false);

    // Un número no es ni texto ni sí/no: el número va como texto, para no perder precisión.
    write({ fields: { [field]: 12.5 } });
    await assert.rejects(checkContracts({ source, target }, false), /rows\.json.*fields/s);
    // `null` vale solo donde el contrato lo dice: en el delta, no en lo leído.
    write({ fields: { [field]: null } });
    await assert.rejects(checkContracts({ source, target }, false), /rows\.json.*fields/s);
    // Y el delta tiene su tope de claves.
    write({ fields: {}, delta: Object.fromEntries(Array.from({ length: 101 }, (_, index) => [`f${index}`, "x"])) });
    await assert.rejects(checkContracts({ source, target }, false), /rows\.json.*delta/s);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
