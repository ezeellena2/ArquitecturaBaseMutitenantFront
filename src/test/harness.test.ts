import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { areStagesClosed, ClosedStages, HarnessStage, isStageClosed } from "./HarnessStage";

const root = path.resolve(import.meta.dirname, "../..");
const src = path.join(root, "src");
const rules = path.join(root, "docs/rules");
const arnes = readFileSync(path.join(root, "docs/architecture/arnes.md"), "utf8");

function allFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const item = path.join(directory, entry.name);
    return entry.isDirectory() ? allFiles(item) : [item];
  });
}

function allDirectories(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (!entry.isDirectory()) return [];
    const item = path.join(directory, entry.name);
    return [item, ...allDirectories(item)];
  });
}

function section(markdown: string, title: string): string {
  return markdown.split(`## ${title}`)[1]?.split(/^## /m)[0] ?? "";
}

function mappedDirectories(): string[] {
  const map = section(arnes, "2. Mapa de carpetas → punteros");
  const patterns = map.split("\n").flatMap((line) => {
    const firstCell = line.split("|")[1] ?? "";
    return [...firstCell.matchAll(/`(src\/[^`]+\/)`/g)].map((match) => match[1]);
  });
  const active = allDirectories(src).filter((directory) => allFiles(directory).length > 0);

  return active.filter((directory) => {
    const relative = `${path.relative(root, directory).replaceAll("\\", "/")}/`;
    return patterns.some((pattern) => {
      const expression = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/<[^>]+>/g, "[^/]+");
      return new RegExp(`^${expression}$`).test(relative);
    });
  });
}

function slug(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[`*_~]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

function headingAnchors(markdown: string): Set<string> {
  const anchors = new Set<string>();
  const counts = new Map<string, number>();
  for (const match of markdown.matchAll(/^#{1,6}\s+(.+?)(?:\s+#+)?\s*$/gm)) {
    const base = slug(match[1]);
    const count = counts.get(base) ?? 0;
    anchors.add(count === 0 ? base : `${base}-${count}`);
    counts.set(base, count + 1);
  }
  return anchors;
}

function closedMarker(marker: string): boolean {
  const match = marker.match(/^\(E(\d+)(?:\s*[–-]\s*E?(\d+))?\)$/);
  return match ? areStagesClosed(Number(match[1]), Number(match[2] ?? match[1])) : false;
}

function brokenLinks(file: string): string[] {
  const markdown = readFileSync(file, "utf8");
  const broken: string[] = [];
  for (const match of markdown.matchAll(/\]\(([^)]+)\)/g)) {
    const nextLine = markdown.slice(match.index + match[0].length).split("\n", 1)[0];
    const marker = nextLine.match(/^\s*(\(E\d+(?:\s*[–-]\s*E?\d+)?\))/)?.[1] ?? "";
    if (marker && !closedMarker(marker)) continue;
    const href = match[1].split(/\s+"/)[0];
    if (/^(?:https?:|mailto:|data:)/i.test(href)) continue;
    const [rawTarget, rawAnchor] = href.split("#", 2);
    const target = path.resolve(path.dirname(file), decodeURIComponent(rawTarget || "."));
    const sibling = path.resolve(root, "../ArquitecturaBaseMutitenant");
    if (target.startsWith(`${sibling}${path.sep}`) && !existsSync(sibling)) continue;
    if (!existsSync(target)) {
      broken.push(href);
      continue;
    }
    if (rawAnchor && statSync(target).isFile() && target.endsWith(".md")) {
      const anchor = decodeURIComponent(rawAnchor);
      if (!headingAnchors(readFileSync(target, "utf8")).has(anchor)) broken.push(href);
    }
  }
  return broken;
}

const ficheFiles = readdirSync(rules)
  .filter((name) => name.endsWith(".md") && name !== "README.md")
  .map((name) => path.join(rules, name));

describe("arnés de reglas", () => {
  it("tiene una etapa cerrada válida", () => {
    expect(Number.isInteger(HarnessStage)).toBe(true);
    expect(HarnessStage).toBeGreaterThanOrEqual(0);
    const stageSource = readFileSync(path.join(root, "src/test/HarnessStage.ts"), "utf8");
    const declaration = stageSource.match(/ClosedStages\s*=\s*\[(?<stages>[^\]]*)\]/);
    expect(declaration, "HarnessStage debe enumerar etapas para permitir saltos").not.toBeNull();
    const closedStages = [...(declaration?.groups?.stages ?? "").matchAll(/\d+/g)].map((match) => Number(match[0]));
    expect(closedStages).toContain(4);
    expect(closedStages).not.toContain(5);
    expect(ClosedStages).toEqual(closedStages);
    expect(HarnessStage).toBe(Math.max(...closedStages));
    expect(isStageClosed(5)).toBe(false);
  });

  it("pone punteros breves en cada carpeta activa del mapa", () => {
    const folders = mappedDirectories();
    expect(folders.length).toBeGreaterThan(0);
    const relativeFolders = folders.map((folder) => path.relative(root, folder).replaceAll("\\", "/"));
    for (const stageZeroFolder of ["src/shared/hooks", "src/shared/ui", "src/test"]) {
      expect(relativeFolders, `${stageZeroFolder} debe figurar en el mapa`).toContain(stageZeroFolder);
    }
    for (const folder of folders) {
      const agent = path.join(folder, "AGENTS.md");
      const claude = path.join(folder, "CLAUDE.md");
      expect(existsSync(agent), `Falta ${path.relative(root, agent)}`).toBe(true);
      expect(existsSync(claude), `Falta ${path.relative(root, claude)}`).toBe(true);
      if (existsSync(agent)) {
        const lines = readFileSync(agent, "utf8").trimEnd().split(/\r?\n/);
        expect(lines.length, `${path.relative(root, agent)} debe tener de 3 a 8 líneas`).toBeGreaterThanOrEqual(3);
        expect(lines.length, `${path.relative(root, agent)} debe tener de 3 a 8 líneas`).toBeLessThanOrEqual(8);
      }
      if (existsSync(claude)) expect(readFileSync(claude, "utf8").trim()).toBe("@AGENTS.md");
    }
  });

  it("mantiene vivos los enlaces de punteros y fichas", () => {
    const pointers = mappedDirectories().map((directory) => path.join(directory, "AGENTS.md"));
    for (const file of [...pointers, ...ficheFiles]) {
      if (existsSync(file)) expect(brokenLinks(file), path.relative(root, file)).toEqual([]);
    }

    const backRoot = path.resolve(root, "../ArquitecturaBaseMutitenant");
    const rolesFeature = path.join(backRoot, "docs/features/roles.md");
    if (existsSync(rolesFeature)) {
      const feature = readFileSync(rolesFeature, "utf8");
      const folders = [...feature.matchAll(/^\| `(src\/[^`]+)` \|/gm)].map((match) => match[1]);
      expect(folders.length).toBeGreaterThan(0);
      expect(feature).toContain("docs/guides/agregar-un-area.md");
      expect(feature).toContain("docs/guides/permiso-nuevo.md");
      for (const folder of folders) {
        const directory = path.join(backRoot, folder);
        expect(existsSync(directory), `Falta carpeta de Roles ${folder}`).toBe(true);
      }
      const rolesPointers = [
        "src/ArquitecturaBaseMultitenant.Domain/Authorization",
        "src/ArquitecturaBaseMultitenant.Application/Models/Roles",
        "src/ArquitecturaBaseMultitenant.Application/Services/Roles",
        "src/ArquitecturaBaseMultitenant.Application/Validation/Roles",
        "src/ArquitecturaBaseMultitenant.Application/Interfaces/Integrations/Caching",
        "src/ArquitecturaBaseMultitenant.Api/Authorization",
        "src/ArquitecturaBaseMultitenant.Api/Contracts/Organization",
        "src/ArquitecturaBaseMultitenant.Api/Controllers/Organization",
        "tests/ArquitecturaBaseMultitenant.Domain.UnitTests/Authorization",
        "tests/ArquitecturaBaseMultitenant.Application.UnitTests/Services/Roles",
        "tests/ArquitecturaBaseMultitenant.Api.IntegrationTests/Organization",
      ];
      for (const folder of rolesPointers) {
        const agent = path.join(backRoot, folder, "AGENTS.md");
        const claude = path.join(backRoot, folder, "CLAUDE.md");
        expect(existsSync(agent), `Falta ${folder}/AGENTS.md`).toBe(true);
        expect(existsSync(claude), `Falta ${folder}/CLAUDE.md`).toBe(true);
        if (existsSync(agent)) expect(readFileSync(agent, "utf8")).toContain("docs/features/roles.md");
        if (existsSync(claude)) expect(readFileSync(claude, "utf8").trim()).toBe("@AGENTS.md");
      }
    }
  });

  it("mantiene completas todas las fichas", () => {
    expect(ficheFiles.length).toBeGreaterThan(0);
    for (const file of ficheFiles) {
      const content = readFileSync(file, "utf8");
      for (const required of [
        /^# .+/m,
        /^\*\*Regla:\*\* .+/m,
        /^## Cómo se hace$/m,
        /^## Prohibido$/m,
        /^## Copiá de$/m,
        /^## Lo verifica$/m,
        /^## Detalle$/m,
      ]) {
        expect(content, `${path.basename(file)} no tiene ${required}`).toMatch(required);
      }
    }
  });

  it("exige los Copiá de y tests de etapas cerradas", () => {
    const sourceFiles = allFiles(src);
    for (const file of ficheFiles) {
      const markdown = readFileSync(file, "utf8");
      for (const line of section(markdown, "Copiá de").split("\n")) {
        for (const segment of line.split(" · ")) {
          const paths = [...segment.matchAll(/`((?:src|docs)\/[^`]+)`/g)].map((match) => match[1]);
          const markers = [...segment.matchAll(/\(E\d+(?:\s*[–-]\s*E?\d+)?\)/g)];
          if (markers.length === 0) continue;
          const range = markers.length === 1 && markers[0][0].match(/^\(E(\d+)\s*[–-]\s*E?(\d+)\)$/);
          for (const [index, reference] of paths.entries()) {
            const marker = range && paths.length === 2
              ? `(E${index === 0 ? range[1] : range[2]})`
              : markers[Math.min(index, markers.length - 1)][0];
            if (!closedMarker(marker)) continue;
            expect(existsSync(path.join(root, reference)), `${path.basename(file)}: falta ${reference}`).toBe(true);
          }
        }
      }
      for (const line of section(markdown, "Lo verifica").split("\n")) {
        for (const match of line.matchAll(/`([^`/]+\.test\.tsx?)`\s*(\(E\d+(?:\s*[–-]\s*E?\d+)?\))/g)) {
          if (!closedMarker(match[2])) continue;
          expect(
            sourceFiles.some((sourceFile) => path.basename(sourceFile) === match[1]),
            `${path.basename(file)}: falta ${match[1]}`,
          ).toBe(true);
        }
      }
    }
  });
});
