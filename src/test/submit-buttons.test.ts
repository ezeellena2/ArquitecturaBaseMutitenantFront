import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const srcRoot = path.resolve(import.meta.dirname, "..");

// «Criterio · Botones» (formularios.md): un botón de envío no se apaga porque falte un dato o porque un dato esté mal; al
// tocarlo, el campo dice qué corregir. Al editar, «Guardar cambios» se apaga sin cambios; al crear («Crear …»,
// «Agregar …», «Invitar …», «Sumar …»), nunca. Lo que está guardando lo apaga `pending`, no `disabled`. Fuera de eso, se
// apaga solo mientras espera algo que no depende de lo escrito. Cada forma permitida, con su motivo:
const allowed: ReadonlyArray<readonly [RegExp, string]> = [
  [/^!(?:form\.formState\.)?isDirty$/, "«Guardar cambios» sin cambios"],
  [/^(?:Boolean\(\w+\)|mode === "roles") && !(?:form\.formState\.)?isDirty$/, "al editar, sin cambios; al crear, nunca"],
  [/^(?:\w+\.)?retry\.isRunning$/, "la cuenta regresiva de «Reintentá en…»"],
  [/^reauth\.retry\.isRunning \|\| \(!reauth\.proof && !reauth\.failure\)$/, "la cuenta regresiva o el código que se pide al abrir"],
  [/^isPending$/, "la sesión que se está leyendo"],
  [/^!(?:csrf|antiforgery\.data)\?\.requestToken$/, "la protección del envío que se está cargando"],
];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return directory === srcRoot && entry.name === "test" ? [] : sourceFiles(full);
    return entry.name.endsWith(".tsx") && !/\.(test|spec)\.tsx$/.test(entry.name) ? [full] : [];
  });
}

/// La etiqueta de apertura de cada botón (`<Button …>` o `<button …>`), con sus atributos entre llaves completos: termina
/// en el primer `>` que no está entre llaves ni entre comillas.
function buttonTags(source: string): string[] {
  const tags: string[] = [];
  for (const match of source.matchAll(/<(?:Button|button)\b/g)) {
    let depth = 0;
    let quote: string | null = null;
    for (let index = match.index + match[0].length; index < source.length; index += 1) {
      const char = source[index];
      if (quote) {
        if (char === quote && source[index - 1] !== "\\") quote = null;
      } else if (char === '"' || char === "'" || char === "`") {
        quote = char;
      } else if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
      } else if (char === ">" && depth === 0) {
        tags.push(source.slice(match.index, index + 1));
        break;
      }
    }
  }
  return tags;
}

/// Lo que dice el `disabled` de un botón, en una línea; `true` si va solo, sin valor.
function disabledOf(tag: string): string | null {
  const start = tag.search(/\sdisabled=\{/);
  if (start < 0) return /\sdisabled(?=[\s/>])/.test(tag) ? "true" : null;
  const open = tag.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < tag.length; index += 1) {
    if (tag[index] === "{") depth += 1;
    else if (tag[index] === "}" && --depth === 0) return tag.slice(open + 1, index).replace(/\s+/g, " ").trim();
  }
  return null;
}

/// Los `disabled` de los botones de envío que no son una de las formas permitidas.
function violations(source: string): string[] {
  return buttonTags(source).filter((tag) => /\stype="submit"/.test(tag)).flatMap((tag) => {
    const disabled = disabledOf(tag);
    return disabled === null || allowed.some(([pattern]) => pattern.test(disabled)) ? [] : [disabled];
  });
}

describe("botones de envío («Criterio · Botones»)", () => {
  it("detecta el botón de envío que se apaga porque falta algo o porque algo está mal", () => {
    expect(violations('<Button type="submit" disabled={!form.formState.isValid}>Crear empresa</Button>')).toEqual(["!form.formState.isValid"]);
    expect(violations('<Button type="submit" disabled={!name.trim()} pending={save.isPending}>Crear rol</Button>')).toEqual(["!name.trim()"]);
    expect(violations('<Button type="submit" form="x"\n  disabled={!isDirty || !companyId}>Guardar cambios</Button>')).toEqual(["!isDirty || !companyId"]);
    expect(violations('<Button type="submit" disabled>Invitar</Button>')).toEqual(["true"]);
    expect(violations('<button type="submit" disabled={!accepted}>Crear organización</button>')).toEqual(["!accepted"]);
  });

  it("deja apagar «Guardar cambios» sin cambios y lo que espera algo que no depende de lo escrito", () => {
    expect(violations('<Button type="submit" form="x" disabled={!isDirty} pending={save.isPending}>Guardar cambios</Button>')).toEqual([]);
    expect(violations('<Button type="submit" onClick={() => go(a > b)} disabled={Boolean(role) && !isDirty}>Guardar</Button>')).toEqual([]);
    expect(violations('<Button type="submit" disabled={retry.isRunning} pending={request.isPending}>Enviar código</Button>')).toEqual([]);
    expect(violations('<Button type="submit" pending={add.isPending}>Siguiente</Button>')).toEqual([]);
    expect(violations('<Button type="button" disabled={!ready}>Cancelar</Button>')).toEqual([]);
  });

  it("ningún botón de envío del código se apaga porque falta algo o porque algo está mal", () => {
    const files = sourceFiles(srcRoot);
    const problems = files.flatMap((file) => violations(readFileSync(file, "utf8"))
      .map((disabled) => `${path.relative(srcRoot, file).replaceAll("\\", "/")}: disabled={${disabled}}`));
    expect(files.some((file) => file.endsWith("CompanyDialog.tsx"))).toBe(true);
    expect(problems).toEqual([]);
  });
});
