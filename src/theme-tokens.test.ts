import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const srcDir = import.meta.dirname;
const css = readFileSync(path.join(srcDir, "index.css"), "utf8");
const theme = readFileSync(path.resolve(srcDir, "../docs/architecture/tema.md"), "utf8");

function token(name: string): string {
  const value = new RegExp(`^\\s*${name}:\\s*([^;]+);`, "m").exec(css)?.[1].trim();
  if (!value) throw new Error(`Falta el token ${name}`);
  const alias = /^var\((--[a-z0-9-]+)\)$/.exec(value);
  return alias ? token(alias[1]) : value;
}

function luminance(name: string): number {
  const match = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(token(name));
  if (!match) throw new Error(`${name} debe ser un color OKLCH opaco`);
  const [, lightness, chroma, hue] = match;
  const radians = Number(hue) * Math.PI / 180;
  const a = Number(chroma) * Math.cos(radians);
  const b = Number(chroma) * Math.sin(radians);
  const l = (Number(lightness) + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (Number(lightness) - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (Number(lightness) - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  const red = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const green = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const blue = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first: string, second: string): number {
  const values = [luminance(first), luminance(second)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function filesIn(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}

describe("tema aprobado", () => {
  it("alcanza el contraste mínimo para borde de control y texto peligroso", () => {
    expect(contrast("--input", "--fondo")).toBeGreaterThanOrEqual(3);
    expect(contrast("--peligro", "--peligro-t")).toBeGreaterThanOrEqual(4.5);
    expect(theme).toContain(`\`${token("--peligro")}\` / \`${token("--peligro-t")}\``);
  });

  it("ignora los artefactos de dist incluso antes de generarlos", () => {
    const root = path.resolve(srcDir, "..");
    expect(spawnSync("git", ["check-ignore", "-q", "dist/probe.js"], { cwd: root }).status).toBe(0);
  });

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

  it("declara todos los tokens referenciados por componentes", () => {
    const declared = new Set([...css.matchAll(/(--[a-z][a-z0-9-]*):/g)].map((match) => match[1]));
    const sourceFiles = filesIn(srcDir).filter((file) => /\.(?:ts|tsx|css)$/.test(file) && !/\.test\.(?:ts|tsx)$/.test(file) && !file.endsWith("index.css"));
    for (const file of sourceFiles) {
      for (const match of readFileSync(file, "utf8").matchAll(/var\((--[a-z][a-z0-9-]*)\)/g)) {
        if (match[1].startsWith("--radix-")) continue;
        expect(declared.has(match[1]), `${path.relative(srcDir, file)} usa ${match[1]} sin declararlo`).toBe(true);
      }
    }
  });
});
