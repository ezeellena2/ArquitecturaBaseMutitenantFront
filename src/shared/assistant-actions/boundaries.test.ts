import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// ADR 0068: el módulo del asistente y las áreas se hablan solo por `shared/assistant-actions`, que no conoce a ninguno de
// los dos. Que el módulo no importe áreas lo vigila `src/test/structure.test.ts`, y que las áreas no importen el módulo,
// `src/shared/modules/boundaries.test.ts`.
const root = path.resolve(import.meta.dirname, "../..");
const folder = "shared/assistant-actions";

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : /\.tsx?$/.test(file) ? [file] : [];
  });
}

const relative = (file: string) => path.relative(root, file).replaceAll("\\", "/");

function importsOf(file: string, source = readFileSync(file, "utf8")): string[] {
  return [...source.matchAll(/(?:from\s*|import\s*\()\s*["']([^"']+)["']/g)].map((match) => match[1])
    .filter((target) => target.startsWith("@/") || target.startsWith("."))
    .map((target) => relative(target.startsWith("@/") ? path.resolve(root, target.slice(2)) : path.resolve(path.dirname(file), target)));
}

/** La única excepción: la cobertura lee la composición para comprobar un adaptador por acción del contrato (ADR 0068). */
const coverage = { file: `${folder}/coverage.test.ts`, target: "app/assistantActionComposition" };

/** Lo que rompe la frontera: desde adentro, un área, un módulo o la composición; desde afuera, un archivo interno. */
function violation(file: string, target: string): string | null {
  const inside = file.startsWith(`${folder}/`);
  if (inside && file === coverage.file && target === coverage.target) return null;
  if (inside) return /^(areas|modules|app)\//.test(target) ? `${file} importa ${target}` : null;
  const internal = target.startsWith(`${folder}/`) && target !== `${folder}/index`;
  return internal ? `${file} importa ${target}: va por @/shared/assistant-actions` : null;
}

describe("la frontera de shared/assistant-actions", () => {
  it("detecta lo que la rompe", () => {
    expect(violation(`${folder}/registry.ts`, "areas/business/users/components/InviteUserDialog")).not.toBeNull();
    expect(violation(`${folder}/useAssistantProposal.ts`, "modules/assistant/api/types")).not.toBeNull();
    expect(violation(`${folder}/registry.ts`, "app/assistantActionComposition")).not.toBeNull();
    expect(violation(`${folder}/coverage.test.ts`, "app/assistantActionComposition")).toBeNull();
    expect(violation(`${folder}/coverage.test.ts`, "areas/business/users/assistantActions")).not.toBeNull();
    expect(violation(`${folder}/registry.ts`, "shared/api/httpClient")).toBeNull();
    expect(violation("modules/assistant/components/AssistantActionCard.tsx", `${folder}/registry`)).not.toBeNull();
    expect(violation("areas/business/users/components/InviteUserDialog.tsx", `${folder}/useAssistantProposal`)).not.toBeNull();
    expect(violation("areas/business/users/components/InviteUserDialog.tsx", folder)).toBeNull();
    expect(violation("areas/business/users/components/InviteUserDialog.tsx", `${folder}/index`)).toBeNull();
  });

  it("lee los imports con alias y relativos", () => {
    const file = path.join(root, "areas/business/users/pages/UserDetailPage.tsx");
    expect(importsOf(file, 'import { useAssistantProposal } from "@/shared/assistant-actions";\nimport x from "../../../../shared/assistant-actions/operations";'))
      .toEqual([`${folder}`, `${folder}/operations`]);
  });

  it("adentro no importa áreas, módulos ni la composición, y afuera se usa solo por su índice", () => {
    const found = files(root).flatMap((file) => importsOf(file).map((target) => violation(relative(file), target)))
      .filter((problem): problem is string => problem !== null);
    expect(found).toEqual([]);
  });
});
