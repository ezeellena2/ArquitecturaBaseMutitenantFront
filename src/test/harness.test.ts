import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { areStagesClosed, ClosedStages, HarnessStage, isStageClosed } from "./HarnessStage";

const root = path.resolve(import.meta.dirname, "../..");
const src = path.join(root, "src");
const rules = path.join(root, "docs/rules");
const arnes = readFileSync(path.join(root, "docs/architecture/arbol.md"), "utf8");

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
  const map = section(arnes, "Mapa de carpetas → punteros");
  const patterns = map.split("\n").flatMap((line) => {
    const firstCell = line.split("|")[1] ?? "";
    return [...firstCell.matchAll(/`(src\/[^`]*)`/g)].map((match) => match[1]);
  });
  const active = [src, ...allDirectories(src)].filter((directory) => allFiles(directory).length > 0);

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
    expect(closedStages).toContain(5);
    expect(closedStages).toContain(6);
    expect(ClosedStages).toEqual(closedStages);
    expect(HarnessStage).toBe(Math.max(...closedStages));
    expect(isStageClosed(5)).toBe(true);
  });

  it("pone punteros breves en cada carpeta activa del mapa", () => {
    const folders = mappedDirectories();
    expect(folders.length).toBeGreaterThan(0);
    const relativeFolders = folders.map((folder) => path.relative(root, folder).replaceAll("\\", "/"));
    for (const stageZeroFolder of ["src/shared", "src/areas/business", "src/modules/assistant"]) {
      expect(relativeFolders, `${stageZeroFolder} debe figurar en el mapa`).toContain(stageZeroFolder);
    }
    for (const folder of folders) {
      const agent = path.join(folder, "AGENTS.md");
      const claude = path.join(folder, "CLAUDE.md");
      expect(existsSync(agent), `Falta ${path.relative(root, agent)}`).toBe(true);
      expect(existsSync(claude), `Falta ${path.relative(root, claude)}`).toBe(true);
      if (existsSync(agent)) {
        const lines = readFileSync(agent, "utf8").trimEnd().split(/\r?\n/);
        expect(lines.length, `${path.relative(root, agent)} debe tener de 1 a 3 líneas`).toBeGreaterThanOrEqual(1);
        expect(lines.length, `${path.relative(root, agent)} debe tener de 3 a 8 líneas`).toBeLessThanOrEqual(3);
      }
      if (existsSync(claude)) expect(readFileSync(claude, "utf8").trim()).toBe("@AGENTS.md");
    }
  });

  it("solo las raíces del mapa llevan punteros", () => {
    const folders = new Set(mappedDirectories());
    const extras = allFiles(src).filter(file => /(?:AGENTS|CLAUDE)\.md$/.test(file) && !folders.has(path.dirname(file)));
    expect(extras.map(file => path.relative(root, file))).toEqual([]);
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

  // accesibilidad.md (ADR 0029): cada test de pantalla corre axe y falla con cualquier violación.
  it("cada test de pantalla corre axe", () => {
    const pageTests = allFiles(src)
      .map((file) => path.relative(root, file).replaceAll("\\", "/"))
      .filter((file) => /\/pages\/[^/]+Page\.test\.tsx$/.test(file));
    expect(pageTests.length).toBeGreaterThan(0);
    const withoutAxe = pageTests.filter((file) => {
      const source = readFileSync(path.join(root, file), "utf8");
      return !/\baxe\(/.test(source) || !source.includes("toHaveNoViolations()");
    });
    expect(withoutAxe, "tests de pantalla sin axe").toEqual([]);
  });

  // Revisión de la alineación al lienzo, Paquete 6: las capturas se comparan siempre con el lienzo vigente
  // (docs/design/lienzo), con sus props y sus pasos. Ningún generador apunta a una copia vieja (lienzo-v35) ni le
  // reescribe el código al tablero para inyectarle un estado.
  it("las capturas se comparan con el lienzo vigente, sin copias ni estados inyectados", () => {
    const scripts = readdirSync(path.join(root, "scripts"))
      .filter((name) => /^capturar-.+\.mjs$/.test(name) && !name.endsWith(".test.mjs"));
    expect(scripts.length).toBeGreaterThan(0);
    const offenders = scripts.filter((name) => {
      const source = readFileSync(path.join(root, "scripts", name), "utf8");
      return /lienzo-v\d+/.test(source) || source.includes("__dcUpdate(");
    });
    expect(offenders, "generadores de capturas que no usan el lienzo vigente").toEqual([]);
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
