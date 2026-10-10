import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "../..");
function files(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(folder, entry.name);
    return entry.isDirectory() ? files(file) : /\.tsx?$/.test(file) ? [file] : [];
  });
}
function expectImportsInComposition(importOwners: string[]) {
  expect(importOwners.filter((file) => file !== "app/moduleComposition.ts")).toEqual([]);
}
describe("frontera del registro de módulos", () => {
  it.each([
    { scenario: "ningún módulo registrado", owners: [] },
    { scenario: "dos módulos registrados", owners: ["app/moduleComposition.ts", "app/moduleComposition.ts"] },
  ])("admite $scenario", ({ owners }) => {
    expectImportsInComposition(owners);
  });

  it("rechaza un import concreto fuera de la composición", () => {
    expect(() => expectImportsInComposition(["app/moduleComposition.ts", "layouts/PrivateLayoutFrame.tsx"])).toThrow();
  });

  it("los imports concretos del núcleo están sólo en app/moduleComposition.ts", () => {
    const imports = files(root).filter((file) => !path.relative(root, file).startsWith("modules"))
      .flatMap((file) => [...readFileSync(file, "utf8").matchAll(/(?:from\s*|import\s*\()\s*["']([^"']+)["']/g)]
        .map((match) => ({ file, target: match[1].startsWith("@/") ? path.resolve(root, match[1].slice(2)) : path.resolve(path.dirname(file), match[1]) })))
      .filter(({ target }) => path.relative(root, target).replaceAll("\\", "/").startsWith("modules/"));
    expectImportsInComposition(imports.map(({ file }) => path.relative(root, file).replaceAll("\\", "/")));
  });
});
