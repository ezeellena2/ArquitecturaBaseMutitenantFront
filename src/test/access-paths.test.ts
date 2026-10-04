import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const src = path.resolve(import.meta.dirname, "..");
const owner = path.join(src, "tenancy", "access.ts");

function productionFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "generated" || entry.name === "test" ? [] : productionFiles(item);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [item] : [];
  });
}

// F4: el inicio y la puerta de ingreso de cada acceso viven solo en tenancy/access.ts (homeOf, loginPathOf). Un acceso
// nuevo (el sitio de la organización en E7, la plataforma en E9) se suma en un solo lugar.
describe("rutas de cada acceso", () => {
  it("fuera de tenancy/access.ts no hay un literal \"/org\" ni \"/login/empresa\"", () => {
    const literal = /["'`]\/(?:org|login\/empresa)["'`]/;
    const offenders = productionFiles(src)
      .filter((file) => file !== owner)
      .flatMap((file) => readFileSync(file, "utf8").split(/\r?\n/)
        .map((line, index) => literal.test(line) ? `${path.relative(src, file).replaceAll("\\", "/")}:${index + 1}` : null)
        .filter((match): match is string => match !== null));

    expect(offenders).toEqual([]);
  });
});
