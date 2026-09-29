import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const resources = import.meta.glob<Record<string, unknown>>("./*/*.json", { eager: true, import: "default" });
const cultureSource = path.resolve(import.meta.dirname,
  "../../../ArquitecturaBaseMutitenant/src/ArquitecturaBaseMultitenant.Infrastructure/Persistence/Seed/ReferenceData/cultures.json");
const hasCultureSource = existsSync(cultureSource);

if (!hasCultureSource && !process.env.CI) {
  throw new Error("El repo hermano ArquitecturaBaseMutitenant es obligatorio para comprobar culturas habilitadas.");
}
if (!hasCultureSource) {
  console.warn("Se omite la paridad cruzada de culturas en CI: falta el repo hermano ArquitecturaBaseMutitenant.");
}

function languages(): string[] {
  return [...new Set(Object.keys(resources).map((path) => path.split("/")[1]))].sort();
}

function namespaces(language: string): string[] {
  return Object.keys(resources)
    .filter((path) => path.startsWith(`./${language}/`))
    .map((path) => path.slice(`./${language}/`.length).replace(/\.json$/, ""))
    .sort();
}

function flatten(value: unknown, prefix = ""): Map<string, string> {
  if (typeof value === "string") return new Map([[prefix, value]]);
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`La traducción ${prefix} debe ser texto`);
  }
  return new Map(
    Object.entries(value).flatMap(([key, child]) => [
      ...flatten(child, prefix === "" ? key : `${prefix}.${key}`),
    ]),
  );
}

function placeholders(value: string): string[] {
  return [...new Set([...value.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((match) => match[1]))].sort();
}

describe("paridad de traducciones", () => {
  it.skipIf(!hasCultureSource)("incluye textos para cada idioma habilitado por Cultures", () => {
    const source = JSON.parse(readFileSync(cultureSource, "utf8")) as {
      Cultures: Array<{ Code: string; LanguageCode: string; IsEnabled: boolean }>;
    };
    const required = [...new Set(source.Cultures.filter((row) => row.IsEnabled).map((row) => row.LanguageCode))].sort();
    expect(required.length).toBeGreaterThan(0);
    expect(languages()).toEqual(expect.arrayContaining(required));
    for (const language of required) {
      expect(namespaces(language), language).toEqual(expect.arrayContaining(["common", "errors", "enums"]));
    }
  });

  it("incluye common, errors y enums para cada idioma disponible", () => {
    expect(languages().length).toBeGreaterThan(0);
    for (const language of languages()) {
      expect(namespaces(language)).toEqual(expect.arrayContaining(["common", "errors", "enums"]));
    }
  });

  it("mantiene los mismos namespaces, claves y placeholders", () => {
    const [reference, ...others] = languages();
    const referenceNamespaces = namespaces(reference);

    for (const language of others) {
      expect(namespaces(language), language).toEqual(referenceNamespaces);
      for (const namespace of referenceNamespaces) {
        const source = flatten(resources[`./${reference}/${namespace}.json`]);
        const target = flatten(resources[`./${language}/${namespace}.json`]);
        expect([...target.keys()].sort(), `${language}/${namespace}`).toEqual([...source.keys()].sort());
        for (const [key, text] of source) {
          expect(placeholders(target.get(key) ?? ""), `${language}/${namespace}:${key}`).toEqual(placeholders(text));
        }
      }
    }
  });
});
