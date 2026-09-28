import { describe, expect, it } from "vitest";

const resources = import.meta.glob<Record<string, unknown>>("./*/*.json", { eager: true, import: "default" });

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
