import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const srcDir = import.meta.dirname;
const css = readFileSync(path.join(srcDir, "index.css"), "utf8");
const theme = readFileSync(path.resolve(srcDir, "../docs/architecture/tema.md"), "utf8");

function filesIn(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}

describe("tema aprobado", () => {
  it("declara todos los tokens de color de tema.md", () => {
    const colorsSection = theme.split("## Colores")[1]?.split("## Forma")[0] ?? "";
    const tokens = colorsSection
      .split("\n")
      .filter((line) => line.startsWith("| `--"))
      .flatMap((line) => [...line.split("|")[1].matchAll(/`(--[a-z][a-z0-9-]*)`/g)].map((match) => match[1]));

    expect(tokens.length).toBeGreaterThan(20);
    for (const token of tokens) {
      expect(css, `Falta ${token} de tema.md`).toContain(`${token}:`);
    }
  });

  it("usa los nombres del tema en lugar de colores literales", () => {
    const sourceFiles = filesIn(srcDir).filter(
      (file) => /\.(?:ts|tsx|css)$/.test(file) && !/\.test\.(?:ts|tsx)$/.test(file) && !file.endsWith("index.css"),
    );
    const literalColor = /#[\da-f]{3,8}\b|\b(?:oklch|rgba?|hsla?)\s*\(/i;
    const paletteClass = /(?:^|[^\w-])(?:bg|text|border|ring|fill|stroke)-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})(?=[^\w-]|$)/;

    for (const file of sourceFiles) {
      const source = readFileSync(file, "utf8");
      expect(source, `Color literal en ${path.relative(srcDir, file)}`).not.toMatch(literalColor);
      expect(source, `Clase de paleta en ${path.relative(srcDir, file)}`).not.toMatch(paletteClass);
      expect(source, `Token viejo en ${path.relative(srcDir, file)}`).not.toMatch(/--color-[a-z]/);
    }
  });

  it("limita las variables de Tailwind de shadcn a alias", () => {
    for (const match of css.matchAll(/^\s*(--color-[\w-]+):\s*([^;]+);/gm)) {
      expect(match[2], `${match[1]} debe ser un alias`).toMatch(/^var\(--[a-z][a-z0-9-]*\)$/);
    }

    for (const file of filesIn(path.resolve(srcDir, "../docs/rules")).filter((file) => file.endsWith(".md"))) {
      expect(readFileSync(file, "utf8"), `Token viejo en ${file}`).not.toMatch(/--color-[a-z]/);
    }
  });
});
