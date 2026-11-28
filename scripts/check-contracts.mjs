import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { assistantActionsSource, assistantActionsTarget, contractPaths, renderAssistantActions, renderContracts, renderValidationContracts, validationTarget } from "./generate-contracts.mjs";

export async function checkContracts({ source, target }, ci = process.env.CI === "true") {
  const backendRoot = path.dirname(path.dirname(path.dirname(source)));
  if (!existsSync(backendRoot) && ci) {
    console.warn(`AVISO: se omite contracts:check porque falta el repo hermano: ${backendRoot}`);
    return;
  }
  if (!existsSync(source)) throw new Error(`OpenAPI contract not found: ${source}`);
  if (!existsSync(target)) throw new Error(`Generated TypeScript schema not found: ${target}`);

  const expected = await renderContracts(source);
  // Una copia nueva en Windows (core.autocrlf) trae el schema con CRLF: se comparan los tipos, no los finales de línea.
  const actual = readFileSync(target, "utf8").replace(/\r\n/g, "\n");
  if (actual !== expected) throw new Error("Generated schema.d.ts is stale. Run npm run contracts.");
  const validation = readFileSync(validationTarget(target), "utf8").replace(/\r\n/g, "\n");
  if (validation !== renderValidationContracts(source)) throw new Error("Generated validation.ts is stale. Run npm run contracts.");
  if (existsSync(assistantActionsSource(source))) {
    const actionsTarget = assistantActionsTarget(target);
    const actions = existsSync(actionsTarget) ? readFileSync(actionsTarget, "utf8").replace(/\r\n/g, "\n") : "";
    if (actions !== renderAssistantActions(assistantActionsSource(source))) throw new Error("Generated assistant-actions.ts is stale. Run npm run contracts.");
  }
  const { checked, problems } = checkContractExamples(source);
  if (problems.length) throw new Error(`Exported contract examples don't match openapi.json:\n${problems.join("\n")}`);
  console.log(`Generated TypeScript schema matches OpenAPI${checked ? `, and ${checked} exported examples match their schemas` : ""}.`);
}

/** Los ejemplos de una corrida real que el back exporta junto al OpenAPI (api-http, desde la E12). */
export function contractExamplesSource(source) {
  return path.join(path.dirname(source), "examples");
}

// Un archivo de ejemplos es `{ "examples": [{ name?, method, path, status, body? }] }`: cada respuesta grabada con la ruta
// tal como la escribe openapi.json (`/api/organization/forms/catalogs/{id}`) y su estado. El cuerpo se valida contra el
// esquema de esa respuesta, en `application/json` o en `application/problem+json`.
const exampleEntry = z.strictObject({
  name: z.string().optional(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  path: z.string().startsWith("/"),
  status: z.number().int().min(100).max(599),
  body: z.unknown().optional(),
});
const exampleFile = z.strictObject({ examples: z.array(exampleEntry).min(1) });

// identity.json (E8, a mano) no graba respuestas: son los trozos con que IdentityContractContributor arma los ejemplos del
// registro en openapi.json. Cada clave se valida contra la propiedad del mismo nombre de este esquema.
const fragmentExamples = { "identity.json": "SignupHttpRequest" };

/** Valida cada ejemplo exportado contra su esquema de openapi.json, estricto y con zod; devuelve los problemas, uno por línea. */
export function checkContractExamples(source) {
  const directory = contractExamplesSource(source);
  if (!existsSync(directory)) return { checked: 0, problems: [] };
  const openapi = JSON.parse(readFileSync(source, "utf8"));
  const toZod = openApiToZod(openapi);
  const problems = [];
  let checked = 0;
  for (const file of readdirSync(directory).filter((name) => name.endsWith(".json")).sort()) {
    let content;
    try { content = JSON.parse(readFileSync(path.join(directory, file), "utf8")); } catch (error) {
      problems.push(`${file}: invalid JSON (${error instanceof Error ? error.message : error})`);
      continue;
    }
    if (Object.hasOwn(fragmentExamples, file)) {
      const name = fragmentExamples[file];
      const properties = openapi.components?.schemas?.[name]?.properties;
      if (!properties) { problems.push(`${file}: schema ${name} not found in openapi.json`); continue; }
      const fragments = z.strictObject(Object.fromEntries(Object.entries(properties).map(([key, property]) => [key, toZod(property).optional()])));
      problems.push(...issuesOf(fragments.safeParse(content), `${file} (${name})`));
      checked++;
      continue;
    }
    const parsed = exampleFile.safeParse(content);
    if (!parsed.success) { problems.push(...issuesOf(parsed, `${file}: expected { "examples": [{ name?, method, path, status, body? }] }`)); continue; }
    parsed.data.examples.forEach((example, index) => {
      const label = `${file} #${index + 1}${example.name ? ` (${example.name})` : ""} ${example.method} ${example.path} ${example.status}`;
      const response = openapi.paths?.[example.path]?.[example.method.toLowerCase()]?.responses?.[String(example.status)];
      if (!response) { problems.push(`${label}: openapi.json doesn't declare this response`); return; }
      const schema = Object.values(response.content ?? {}).find((content) => content?.schema)?.schema;
      if (!schema) {
        if (example.body !== undefined) problems.push(`${label}: openapi.json declares this response without a body`);
        return;
      }
      problems.push(...issuesOf(toZod(schema).safeParse(example.body), label));
      checked++;
    });
  }
  return { checked, problems };
}

function issuesOf(result, label) {
  if (result.success) return [];
  return result.error.issues.map((issue) => `${label}: ${issue.path.length ? issue.path.join(".") : "(root)"}: ${issue.message}`);
}

const integerFormats = { int32: [-(2 ** 31), 2 ** 31 - 1], uint32: [0, 2 ** 32 - 1] };

/**
 * Pasa un esquema de openapi.json a zod, recorriendo `components.schemas` como `renderValidationContracts`. Es estricto:
 * un objeto no admite campos que no declara (aunque el esquema no diga `additionalProperties: false`), un enum solo sus
 * valores, y cada formato, tope y nulo es el del contrato. Las reglas de un pedido entre campos (`oneOf` con `required`
 * y `not` junto a `properties`) las valida el back; acá valen los campos.
 */
export function openApiToZod(openapi) {
  const named = new Map();
  const byRef = (ref) => {
    if (!named.has(ref)) {
      const definition = openapi.components?.schemas?.[ref.replace("#/components/schemas/", "")];
      if (!definition) throw new Error(`Schema not found in openapi.json: ${ref}`);
      let built;
      named.set(ref, z.lazy(() => (built ??= convert(definition))));
    }
    return named.get(ref);
  };

  function convert(definition) {
    if (definition.$ref) return byRef(definition.$ref);
    const types = Array.isArray(definition.type) ? definition.type : definition.type ? [definition.type] : [];
    const nullable = types.includes("null") || (Array.isArray(definition.enum) && definition.enum.includes(null));
    const [type, ...others] = types.filter((value) => value !== "null");
    // Varios tipos (el valor de un campo de una opción: texto o sí/no, E13): vale cualquiera de ellos, cada uno con sus topes.
    if (others.length) {
      const union = z.union([type, ...others].map((single) => convert({ ...definition, type: single })));
      return nullable ? union.nullable() : union;
    }
    const branches = definition.oneOf ?? definition.anyOf;
    if (branches && !definition.properties) {
      const options = branches.map(convert);
      return options.length === 1 ? options[0] : z.union(options);
    }
    if (definition.allOf && !definition.properties) throw new Error("Unsupported schema: allOf without properties");
    let base;
    if (Array.isArray(definition.enum)) {
      const values = definition.enum.filter((value) => value !== null);
      base = values.length ? z.literal(values) : z.null();
    } else if (types.length && !type) {
      return z.null();
    } else {
      switch (type) {
        case "string": base = stringOf(definition); break;
        case "integer": base = numberOf(definition, z.number().int()); break;
        case "number": base = numberOf(definition, z.number()); break;
        case "boolean": base = z.boolean(); break;
        case "array": base = arrayOf(definition); break;
        case "object": base = objectOf(definition); break;
        case undefined: base = definition.properties || definition.additionalProperties !== undefined ? objectOf(definition) : z.unknown(); break;
        default: throw new Error(`Unsupported schema type: ${type}`);
      }
    }
    return nullable ? base.nullable() : base;
  }

  function stringOf(definition) {
    let schema = definition.format === "uuid" ? z.guid()
      : definition.format === "date-time" ? z.iso.datetime({ offset: true })
        : definition.format === "date" ? z.iso.date() : z.string();
    if (definition.minLength !== undefined) schema = schema.min(definition.minLength);
    if (definition.maxLength !== undefined) schema = schema.max(definition.maxLength);
    if (definition.pattern !== undefined) schema = schema.regex(new RegExp(definition.pattern));
    return schema;
  }

  function numberOf(definition, schema) {
    const [minimum, maximum] = integerFormats[definition.format] ?? [];
    const min = definition.minimum ?? minimum;
    const max = definition.maximum ?? maximum;
    if (min !== undefined) schema = schema.gte(min);
    if (max !== undefined) schema = schema.lte(max);
    if (typeof definition.exclusiveMinimum === "number") schema = schema.gt(definition.exclusiveMinimum);
    if (typeof definition.exclusiveMaximum === "number") schema = schema.lt(definition.exclusiveMaximum);
    return schema;
  }

  function arrayOf(definition) {
    let schema = z.array(definition.items ? convert(definition.items) : z.unknown());
    if (definition.minItems !== undefined) schema = schema.min(definition.minItems);
    if (definition.maxItems !== undefined) schema = schema.max(definition.maxItems);
    if (definition.uniqueItems) schema = schema.refine((values) => new Set(values.map((value) => JSON.stringify(value))).size === values.length, "Repeated items");
    return schema;
  }

  function objectOf(definition) {
    const extra = definition.additionalProperties;
    // `{ type: object }` sin campos (un IFormFile): cualquier objeto. Un diccionario: sus claves, con el esquema del valor.
    if (!definition.properties && (extra === undefined || extra === true)) return z.record(z.string(), z.unknown());
    if (!definition.properties && typeof extra === "object") {
      const record = z.record(z.string(), convert(extra));
      const max = definition.maxProperties;
      return max === undefined ? record : record.refine((value) => Object.keys(value).length <= max, `Too many properties (more than ${max})`);
    }
    const required = new Set(definition.required ?? []);
    const shape = Object.fromEntries(Object.entries(definition.properties ?? {})
      .map(([key, property]) => [key, required.has(key) ? convert(property) : convert(property).optional()]));
    if (typeof extra === "object") return z.object(shape).catchall(convert(extra));
    return extra === true ? z.looseObject(shape) : z.strictObject(shape);
  }

  return convert;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await checkContracts(contractPaths());
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
