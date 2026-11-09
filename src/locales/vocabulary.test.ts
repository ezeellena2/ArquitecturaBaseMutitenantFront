import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const srcDir = path.resolve(import.meta.dirname, "..");

function filesIn(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}

function texts(value: unknown, at: string): { at: string; text: string }[] {
  if (typeof value === "string") return [{ at, text: value }];
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, child]) => texts(child, `${at}.${key}`));
  return [];
}

// Los textos en español del núcleo y de los módulos.
const spanish = filesIn(srcDir)
  .filter((file) => file.endsWith(".json") && /[\\/]locales[\\/]es[\\/]/.test(file))
  .flatMap((file) => texts(JSON.parse(readFileSync(file, "utf8")), path.relative(srcDir, file).replaceAll("\\", "/")));

// Base de la 12, «Las palabras» (F6): «Dar de baja» y «Reactivar», con el estado «De baja», «Dados de baja» o «Dadas de baja»;
// «Borrar», nunca «Eliminar»; borrar la cuenta propia dice «Borrar mi cuenta», con el estado «Por borrar»; y las altas
// dicen «Agregar …»: en Usuario, «Agregar empresa» y «Agregar». Salen «Deshabilitar», «Inactivar» y, en los miembros de una
// empresa, «Volver a sumar».
const banned: readonly [RegExp, string][] = [
  [/deshabilit/i, "«Deshabilitar» o «Deshabilitado»: va «Dar de baja» o «De baja»"],
  [/inactiv/i, "«Inactivar» o «Inactivo»: va «Dar de baja» o «De baja»"],
  [/elimin/i, "«Eliminar»: va «Borrar»"],
  [/bajas? pedidas?/i, "«Baja pedida»: va «Por borrar»"],
  [/volver a sumar|volvimos a sumar/i, "«Volver a sumar»: va «Reactivar»"],
  [/^Sumar( empresa)?$/, "«Sumar empresa» o «Sumar»: va «Agregar empresa» o «Agregar»"],
  [/(dar|dando|dimos) de baja (mi|tu|la) cuenta|darte de baja/i, "la cuenta se borra: va «Borrar mi cuenta» o «Borrar la cuenta»"],
];

describe("las palabras de la base de la 12", () => {
  it("lee los textos en español del núcleo y de los módulos", () => {
    expect(spanish.length).toBeGreaterThan(500);
    expect(spanish.some(({ at }) => at.startsWith("modules/"))).toBe(true);
  });

  it("no usa ninguna de las palabras viejas", () => {
    const found = spanish.flatMap(({ at, text }) => banned.filter(([pattern]) => pattern.test(text)).map(([, why]) => `${at}: «${text}» (${why})`));
    expect(found).toEqual([]);
  });
});
