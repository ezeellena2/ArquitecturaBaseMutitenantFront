import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const srcRoot = path.resolve(import.meta.dirname, "..");

// textos-y-traducciones.md: todo texto de la interfaz sale de i18n. `react/jsx-no-literals` de oxlint mira solo el texto
// entre etiquetas; este test mira los props que el usuario lee o el lector de pantalla dice.
const textProps = ["placeholder", "aria-label", "aria-description", "aria-placeholder", "aria-roledescription", "aria-valuetext", "title", "alt", "label"];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    // Las carpetas `test/` (la raíz y las de cada módulo) son fixtures y galerías de pruebas, no pantallas.
    if (entry.isDirectory()) return entry.name === "test" ? [] : sourceFiles(full);
    return /\.tsx$/.test(entry.name) && !/\.(test|spec)\.tsx$/.test(entry.name) ? [full] : [];
  });
}

/**
 * Un texto para una persona: una frase («Cerrar menú»), una palabra con mayúscula («Guardar») o con tilde. No lo son una
 * clave (`title`), un identificador (`default`, `OrganizationUserState`), una máscara (`XXXX-XXXX`), una sigla ni un
 * separador (`, `).
 */
function isHumanText(text: string): boolean {
  if (!/\p{L}{2,}/u.test(text) || /^\s*\p{L}+(?:\p{Lu}\p{L}*)+\s*$/u.test(text)) return false;
  return /\p{L}\s+\p{L}/u.test(text) || /^\s*\p{Lu}\p{Ll}/u.test(text) || /[áéíóúñü¿¡]/i.test(text);
}

/** El final de una expresión `{…}` de JSX que empieza en `start` (la llave de apertura), contando llaves y saltando textos. */
function expressionEnd(source: string, start: number): number {
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"' || char === "'" || char === "`") {
      index = stringEnd(source, index);
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}" && --depth === 0) return index;
  }
  return source.length;
}

function stringEnd(source: string, start: number): number {
  const quote = source[start];
  for (let index = start + 1; index < source.length; index += 1) {
    if (source[index] === "\\") index += 1;
    else if (quote === "`" && source.startsWith("${", index)) index = expressionEnd(source, index + 1);
    else if (source[index] === quote) return index;
  }
  return source.length;
}

/**
 * Los textos fijos de una expresión: las comillas y las partes fijas de un template. No cuentan el primer argumento de una
 * llamada (la clave de `t()`, el enum de `formatEnum()`), un valor que se compara (`type === "Google"`) ni una clase.
 */
function literalsIn(expression: string): string[] {
  const withoutKeys = expression
    .replace(/([\w$)\]]\s*\(\s*)(["'`])(?:\\.|(?!\2)[^\\])*\2/g, "$1''")
    .replace(/([!=]==?\s*)(["'`])(?:\\.|(?!\2)[^\\])*\2/g, "$1''")
    .replace(/(["'`])(?:\\.|(?!\1)[^\\])*\1(\s*[!=]==?)/g, "''$2")
    .replace(/\bclassName=(["'])(?:(?!\1).)*\1/g, "");
  const literals: string[] = [];
  for (let index = 0; index < withoutKeys.length; index += 1) {
    const char = withoutKeys[index];
    if (char !== '"' && char !== "'" && char !== "`") continue;
    const end = stringEnd(withoutKeys, index);
    const body = withoutKeys.slice(index + 1, end);
    literals.push(char === "`" ? body.replace(/\$\{[\s\S]*?\}/g, " ") : body);
    index = end;
  }
  return literals;
}

function violations(source: string): string[] {
  const found: string[] = [];
  const prop = new RegExp(`(?<=[\\s{])(${textProps.join("|")})=(["'{])`, "g");
  for (const match of source.matchAll(prop)) {
    const start = match.index + match[0].length - 1;
    const literals = match[2] === "{"
      ? literalsIn(source.slice(start + 1, expressionEnd(source, start)))
      : [source.slice(start + 1, stringEnd(source, start))];
    for (const text of literals.filter(isHumanText)) found.push(`${match[1]}="${text.trim()}": va con t()`);
  }
  return found;
}

describe("los textos de los props salen de i18n", () => {
  it("detecta un texto fijo en un prop que se lee", () => {
    expect(violations('<input placeholder="Buscar usuario" />')).not.toEqual([]);
    expect(violations('<IconButton aria-label="Cerrar" />')).not.toEqual([]);
    expect(violations("<img alt='Logo de la organización' />")).not.toEqual([]);
    expect(violations('<Section title={"Datos"} />')).not.toEqual([]);
    expect(violations('<Page title={open ? t("roles:title") : "Roles"} />')).not.toEqual([]);
    expect(violations("<Button aria-label={`Acciones de ${name}`} />")).not.toEqual([]);
    expect(violations('<FormField label="Teléfono" />')).not.toEqual([]);
    expect(violations('<IconButton aria-label={t("actions.close")} />')).toEqual([]);
    expect(violations('<Page title={t("title", { name })} label={t(`kinds.${kind}`)} />')).toEqual([]);
    expect(violations("<span aria-label={`${label} ${index + 1}`} />")).toEqual([]);
    expect(violations('<img alt="" /><input placeholder="XXXX-XXXX" />')).toEqual([]);
    expect(violations('<Field label={labels[kind ?? "default"]} title={value} />')).toEqual([]);
    expect(violations('<Page className="flex items-center" variant="Outline" />')).toEqual([]);
    expect(violations('<Dialog title={<span className="sr-only">{t("x")}</span>} />')).toEqual([]);
    expect(violations('<InfoTip title={format.formatEnum("TenantStatus", status)} />')).toEqual([]);
    expect(violations('<Item title={method.type === "Google" ? t("google") : value} label={"Trial" !== state ? a : b} />')).toEqual([]);
    expect(violations('<StatusDot label="Active" />')).not.toEqual([]);
  });

  it("mantiene las reglas en el código de producción", () => {
    const problems = sourceFiles(srcRoot).flatMap((file) => violations(readFileSync(file, "utf8"))
      .map((problem) => `${path.relative(srcRoot, file).replaceAll("\\", "/")}: ${problem}`));
    expect(problems).toEqual([]);
  });
});
