import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const areas = path.resolve(import.meta.dirname, "../areas");

function sourceFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const item = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(item) : /\.tsx?$/.test(item) ? [item] : [];
  });
}

function importedModules(source: string): string[] {
  return [...source.matchAll(/\b(?:from\s*|import\s*(?:\(|))\s*["']([^"']+)["']/g)].map((match) => match[1]);
}

function violation(sourceFile: string, imported: string): string | null {
  const target = imported.startsWith("@/")
    ? path.resolve(areas, "..", imported.slice(2))
    : imported.startsWith(".")
      ? path.resolve(path.dirname(sourceFile), imported)
      : null;
  if (!target) return null;

  const origin = path.relative(areas, sourceFile).replaceAll("\\", "/").split("/");
  const destination = path.relative(areas, target).replaceAll("\\", "/").split("/");
  if (origin[0] === ".." || destination[0] === "..") return null;
  if (origin[0] !== destination[0]) return `área ${origin[0]} → ${destination[0]}`;
  if (origin[1] && destination[1] && origin[1] !== destination[1]) {
    return `feature ${origin[1]} → ${destination[1]}`;
  }
  return null;
}

describe("estructura de áreas y features", () => {
  it("no importa entre features ni entre áreas", () => {
    for (const file of sourceFiles(areas)) {
      for (const imported of importedModules(readFileSync(file, "utf8"))) {
        expect(violation(file, imported), `${path.relative(areas, file)} importa ${imported}`).toBeNull();
      }
    }
  });

  it("detecta imports cruzados por alias y ruta relativa", () => {
    const file = path.join(areas, "business/roles/pages/RolesPage.tsx");
    expect(violation(file, "@/areas/business/users/api/users")).toContain("feature");
    expect(violation(file, "@/areas/personal/account/pages/AccountPage")).toContain("área");
    expect(violation(file, "../../users/api/users")).toContain("feature");
    expect(violation(file, "@/shared/ui/button")).toBeNull();
    expect(violation(file, "../api/roles")).toBeNull();
    expect(importedModules('import { x } from "@/areas/business/users"')).toContain("@/areas/business/users");
  });
});
