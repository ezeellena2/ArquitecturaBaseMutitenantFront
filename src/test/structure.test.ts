import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const areas = path.resolve(import.meta.dirname, "../areas");
const modules = path.resolve(import.meta.dirname, "../modules");

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

// estructura-y-features.md: un módulo opcional se enchufa al núcleo por `shared/modules` y la composición
// (`app/moduleComposition.ts`, que vigila `boundaries.test.ts`). Usa `shared/`, la sesión, el acceso y el marco, pero
// nunca otro módulo ni un área: así se puede sacar entero.
function moduleViolation(sourceFile: string, imported: string): string | null {
  const target = imported.startsWith("@/")
    ? path.resolve(areas, "..", imported.slice(2))
    : imported.startsWith(".")
      ? path.resolve(path.dirname(sourceFile), imported)
      : null;
  if (!target) return null;

  const origin = path.relative(modules, sourceFile).replaceAll("\\", "/").split("/");
  if (origin[0] === "..") return null;
  const toArea = path.relative(areas, target).replaceAll("\\", "/").split("/");
  if (toArea[0] !== "..") return `módulo ${origin[0]} → área ${toArea[0]}`;
  const toModule = path.relative(modules, target).replaceAll("\\", "/").split("/");
  if (toModule[0] !== ".." && toModule[0] !== origin[0]) return `módulo ${origin[0]} → módulo ${toModule[0]}`;
  return null;
}

// Los tests y sus apoyos componen a propósito el núcleo con un módulo (la portada con el Asistente, la navegación con los
// dos módulos): la regla es para el código que se publica.
const productionFile = (file: string) => !/\.test\.tsx?$|[\\/]test[\\/]|[Tt]estSupport\.tsx?$/.test(file);

describe("estructura de áreas y features", () => {
  it("no importa de un módulo a otro ni de un módulo a un área", () => {
    for (const file of sourceFiles(modules).filter(productionFile)) {
      for (const imported of importedModules(readFileSync(file, "utf8"))) {
        expect(moduleViolation(file, imported), `${path.relative(modules, file)} importa ${imported}`).toBeNull();
      }
    }
  });

  it("detecta los imports de un módulo a otro módulo o a un área", () => {
    const file = path.join(modules, "whatsapp/chats/pages/ChatsPage.tsx");
    expect(moduleViolation(file, "@/modules/assistant/registration")).toBe("módulo whatsapp → módulo assistant");
    expect(moduleViolation(file, "../../../assistant/api/assistant")).toBe("módulo whatsapp → módulo assistant");
    expect(moduleViolation(file, "@/areas/business/home/pages/BusinessHomePage")).toBe("módulo whatsapp → área business");
    expect(moduleViolation(file, "../../../../areas/platform/tenants/api/tenants")).toBe("módulo whatsapp → área platform");
    expect(moduleViolation(file, "@/modules/whatsapp/api/types")).toBeNull();
    expect(moduleViolation(file, "../components/ChatComposer")).toBeNull();
    expect(moduleViolation(file, "@/shared/modules/registry")).toBeNull();
    expect(moduleViolation(file, "@/layouts/navigation")).toBeNull();
    expect(moduleViolation(file, "react-router")).toBeNull();
    expect(productionFile(path.join(modules, "assistant/composition.test.tsx"))).toBe(false);
    expect(productionFile(path.join(modules, "whatsapp/test/gallery.ts"))).toBe(false);
    expect(productionFile(path.join(modules, "assistant/settings/settingsTestSupport.tsx"))).toBe(false);
    expect(productionFile(path.join(modules, "assistant/pages/AssistantHome.tsx"))).toBe(true);
  });

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
