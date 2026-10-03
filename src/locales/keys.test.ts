import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Una clave inexistente no rompe nada: i18next muestra la clave cruda («states.saving», «back»).
// Este test recorre el código y exige que cada clave escrita a mano exista en los textos.
const resources = import.meta.glob<Record<string, unknown>>("./es/*.json", { eager: true, import: "default" });
const sourceRoot = path.resolve(import.meta.dirname, "..");
const namespaces = new Map(Object.entries(resources).map(([file, content]) => [file.slice("./es/".length, -".json".length), content]));
const pluralSuffixes = ["_zero", "_one", "_two", "_few", "_many", "_other"];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "generated" ? [] : sourceFiles(item);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [item] : [];
  });
}

function lookup(namespace: string, key: string): unknown {
  let node: unknown = namespaces.get(namespace);
  for (const part of key.split(".")) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

function hasText(namespace: string, key: string): boolean {
  if (typeof lookup(namespace, key) === "string") return true;
  const parent = key.includes(".") ? key.slice(0, key.lastIndexOf(".")) : "";
  const leaf = key.slice(key.lastIndexOf(".") + 1);
  return pluralSuffixes.some((suffix) => typeof lookup(namespace, parent ? `${parent}.${leaf}${suffix}` : `${leaf}${suffix}`) === "string");
}

function hasGroup(namespace: string, prefix: string): boolean {
  const group = lookup(namespace, prefix);
  return group !== null && typeof group === "object";
}

function split(key: string, fallback: readonly string[]): Array<[string, string]> {
  const match = /^(\w+):(.+)$/.exec(key);
  if (match && namespaces.has(match[1])) return [[match[1], match[2]]];
  return fallback.map((namespace) => [namespace, key]);
}

// Primer namespace de cada useTranslation del archivo; sin argumentos es common.
function defaultNamespaces(source: string): string[] {
  const found = [...source.matchAll(/useTranslation\(\s*(?:\[\s*)?(?:["'](\w+)["'])?/g)].map((match) => match[1] ?? "common");
  return found.length === 0 ? ["common"] : [...new Set(found)];
}

function missingKeys(source: string): string[] {
  const fallback = defaultNamespaces(source);
  const missing = new Set<string>();
  const check = (key: string, candidates: readonly string[]) => {
    if (!split(key, candidates).some(([namespace, path]) => hasText(namespace, path))) missing.add(key);
  };

  for (const match of source.matchAll(/\bt\(\s*"([^"]+)"(\s*,\s*\{[^}]*?\bns:\s*"(\w+)")?/g)) {
    check(match[1], match[3] ? [match[3]] : fallback);
  }
  for (const match of source.matchAll(/i18nKey=(?:"([^"]+)"|\{([^}]*)\})/g)) {
    // Dentro de una expresión solo cuentan los literales con forma de clave: un "Expired" de una comparación no lo es.
    const keys = match[1] ? [match[1]] : [...match[2].matchAll(/"([^"]+)"/g)].map((literal) => literal[1]).filter((key) => /[.:]/.test(key));
    for (const key of keys) check(key, fallback);
  }
  // Claves con namespace escritas en cualquier lugar: ternarios, configuraciones de columnas, filtros.
  for (const match of source.matchAll(/"(\w+):([\w.]+)"/g)) {
    if (namespaces.has(match[1])) check(`${match[1]}:${match[2]}`, []);
  }
  // Claves armadas con una parte fija: el grupo fijo tiene que existir.
  for (const match of source.matchAll(/\bt\(\s*`((?:\w+:)?[\w.]+\.)\$\{/g)) {
    const prefix = match[1].slice(0, -1);
    if (!split(prefix, fallback).some(([namespace, group]) => hasGroup(namespace, group))) missing.add(`${match[1]}…`);
  }
  return [...missing];
}

describe("claves de traducción usadas en el código", () => {
  it("existen en los textos", () => {
    const problems = sourceFiles(sourceRoot).flatMap((file) =>
      missingKeys(readFileSync(file, "utf8")).map((key) => `${path.relative(sourceRoot, file).replaceAll("\\", "/")}: ${key}`));
    expect(problems).toEqual([]);
  });

  it("detecta claves inexistentes con namespace, sin namespace, plurales y grupos dinámicos", () => {
    expect(missingKeys('const { t } = useTranslation(["users", "common"]); t("common:states.loading"); t("title");')).toEqual([]);
    expect(missingKeys('const { t } = useTranslation(["users", "common"]); t("users:noExiste"); t("tampocoExiste");')).toEqual(["users:noExiste", "tampocoExiste"]);
    expect(missingKeys('const { t } = useTranslation(); t("code.attemptsLeft", { count: 2 });')).toEqual([]);
    expect(missingKeys('i18n.t("network", { ns: "errors" }); i18n.t("noExiste", { ns: "errors" });')).toEqual(["noExiste"]);
    expect(missingKeys('const label = cond ? "users:actions.enable" : "users:actions.prender";')).toEqual(["users:actions.prender"]);
    expect(missingKeys('const { t } = useTranslation("users"); <Trans i18nKey={state === "Expired" ? "detail.expiredOn" : "detail.nada"} />')).toEqual(["detail.nada"]);
    expect(missingKeys('const { t } = useTranslation("users"); t(`states.${x}`); t(`nada.${x}`);')).toEqual(["nada.…"]);
  });
});
