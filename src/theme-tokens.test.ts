import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const srcDir = import.meta.dirname;
// Una clonación con `core.autocrlf=true` trae los archivos con CRLF: se leen con LF para cortarlos por renglones.
const readText = (file: string) => readFileSync(file, "utf8").replace(/\r\n/g, "\n");
const css = readText(path.join(srcDir, "index.css"));
const theme = readText(path.resolve(srcDir, "../docs/architecture/tema.md"));

function token(name: string): string {
  const value = new RegExp(`^\\s*${name}:\\s*([^;]+);`, "m").exec(css)?.[1].trim();
  if (!value) throw new Error(`Falta el token ${name}`);
  const alias = /^var\((--[a-z0-9-]+)\)$/.exec(value);
  return alias ? token(alias[1]) : value;
}

function luminance(name: string): number {
  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(token(name))?.[1];
  if (hex) {
    const digits = hex.length === 3 ? [...hex].map((digit) => digit + digit) : hex.match(/../g)!;
    const [red, green, blue] = digits.map((pair) => {
      const channel = parseInt(pair, 16) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  }
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

  // «Lo elegido, sin dudas» (142): la elegida se distingue de las otras con 3:1 y su letra se lee con 4,5:1; la barra de
  // la fila o la conversación abierta, con 3:1 contra su tinte.
  it("distingue lo elegido con 3:1 y deja su letra en 4,5:1", () => {
    expect(contrast("--marca", "--superficie")).toBeGreaterThanOrEqual(3);
    expect(contrast("--superficie", "--marca")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("--t2", "--superficie")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("--marca-tx", "--marca-t")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("--marca", "--marca-t")).toBeGreaterThanOrEqual(3);
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
    // En una clase de Tailwind, `_` separa los valores (`shadow-[0_8px_oklch(...)]`) y es carácter de palabra: `\b` no lo ve.
    const literalColor = /#[\da-f]{3,8}\b|(?<![a-z\d-])(?:oklch|rgba?|hsla?)\s*\(/i;
    expect("shadow-[0_8px_24px_-12px_oklch(0.24_0.012_60/0.25)]").toMatch(literalColor);
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

  // La raíz de la compu achica lo que mide en rem: una medida en px quedaría grande al lado de todo lo demás.
  it("mide en rem para que la raíz de la compu achique la app entera", () => {
    expect(css).toMatch(/@media \(min-width: 64rem\) and \(pointer: fine\) \{\s*html \{\s*font-size: 75%;/);
    const sourceFiles = filesIn(srcDir).filter((file) => /\.(?:ts|tsx|css)$/.test(file) && !/\.test\.(?:ts|tsx)$/.test(file)
      && !file.includes(`${path.sep}test${path.sep}`) && !file.endsWith("schema.d.ts"));
    const comments = /\/\*[\s\S]*?\*\/|(?<![:"'`])\/\/.*$/gm;
    // Siguen en px los cortes, que no cambian con la raíz, los anillos, que no se afinan, y la barra de 3 de lo abierto
    // (142), que es una línea como un borde: los tableros la dibujan en 3 también en la compu.
    const allowed = /@media[^\n]*|useMediaQuery\([^)]*\)|ring-\[3px\]|shadow-\[(?:inset_)?0_0_0_[^\]\s]*\]|shadow-\[inset_3px_0_0_var\(--marca\)\]/g;

    for (const file of sourceFiles) {
      const source = readFileSync(file, "utf8").replace(comments, "").replace(allowed, "");
      const fixed = [...source.matchAll(/(\d*\.?\d+)px(?![a-z\d])/gi)].filter((match) => Number(match[1]) > 2).map((match) => match[0]);
      expect(fixed, `Medidas en px en ${path.relative(srcDir, file)}: van en rem o en la escala de Tailwind (w-55)`).toEqual([]);
      expect(source, `Ícono de tamaño fijo en ${path.relative(srcDir, file)}: va con size-4`).not.toMatch(/\bsize=\{\d/);
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

  // 173 («Criterio · Marco», Que no parezca plantilla): sin sombras salvo en menús, desplegables y tooltips, y sin degradés
  // en las piezas. Un anillo o un borde dibujado con box-shadow (`0 0 0 1px`, `inset`) no es una sombra.
  it("deja las sombras solo en menús, desplegables y tooltips, y saca los degradés de las piezas", () => {
    const sourceFiles = filesIn(srcDir).filter((file) => /\.(?:ts|tsx)$/.test(file) && !/\.test\.(?:ts|tsx)$/.test(file));
    const allowedShadow = /^shadow-(?:none|\[var\(--sombra-menu\)\]|\[inset_[^\]]*\]|\[0_0_0_[^\]]*\])$/;
    for (const file of sourceFiles) {
      const source = readFileSync(file, "utf8");
      const shadows = [...source.matchAll(/(?<![\w-])(?:[a-z-]+:)*(shadow-(?:\[[^\]\s"]+\]|xs|sm|md|lg|xl|2xl))/g)].map((match) => match[1]);
      expect(shadows.filter((shadow) => !allowedShadow.test(shadow)), `Sombra en ${path.relative(srcDir, file)}`).toEqual([]);
      expect(source, `Sombra en línea en ${path.relative(srcDir, file)}`).not.toMatch(/boxShadow/);
      expect(source, `Degradé en ${path.relative(srcDir, file)}`).not.toMatch(/linear-gradient|bg-gradient-|bg-linear-/);
    }
    for (const gone of ["--marca-2", "--marca-sombra", "--auth-panel-", "--lado-activo", "--shadow-card", "--brillo:", "--sombra-dialogo", "--sombra-hoja",
      "--sombra-aviso", "--sombra-franja", "--sombra-fab", "--sombra-tarjeta", "--sombra-directorio", "--sombra-flecha", "--sombra-segmento"]) {
      expect(css, `${gone} salió con la base de la 12`).not.toContain(gone);
    }
    expect(css).toMatch(/\.auth-brand-panel \{\s*background: var\(--marca\);\s*\}/);
  });

  // 180 («Criterio · Marco», La escala): en la compu, la letra a × 0,82 de la nominal sin bajar de 10,5 y las esquinas en 3
  // como mucho. Cada clase de letra y de esquina que usa el código tiene su regla generada en index.css.
  it("cubre con la escala de la compu cada letra y cada esquina que usa el código", () => {
    const scale = css.split("/* 180 · La escala de ArquitecturaBase en la compu")[1] ?? "";
    expect(scale).toMatch(/^[\s\S]*@media \(min-width: 64rem\) and \(pointer: fine\)/);
    expect(scale).toContain('[class~="text-[0.8125rem]"] { font-size: 0.8883rem; }');
    expect(scale).toContain('[class~="text-[0.75rem]"] { font-size: 0.875rem; }');
    expect(scale).toContain('[class~="rounded-[0.5rem]"] { border-radius: 0.25rem; }');
    const sourceFiles = filesIn(srcDir).filter((file) => /\.(?:ts|tsx)$/.test(file) && !/\.(?:test|d)\.(?:ts|tsx)$/.test(file));
    const texts = /(?<![\w:\-[])((?:md|lg):)?text-(\[(?:\d*\.)?\d+rem\]|xs|sm|base|lg|xl|2xl|3xl)(?![\w\-\]])/g;
    const corners = /(?<![\w:\-[])((?:md|lg):)?rounded(-(?:t|b|l|r|tl|tr|bl|br))?-(\[(?:\d*\.)?\d+rem\]|sm|md|lg|xl|2xl|3xl)(?![\w\-\]])/g;
    const missing = new Set<string>();
    for (const file of sourceFiles) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(texts)) if (!scale.includes(`[class~="${match[0]}"]`)) missing.add(match[0]);
      for (const match of source.matchAll(corners)) {
        const size = match[3].startsWith("[") ? Number(match[3].slice(1, -4)) : 1;
        if (size > 0.25 && !scale.includes(`[class~="${match[0]}"]`)) missing.add(match[0]);
      }
    }
    expect([...missing], "Falta su medida en la escala de la compu: volvé a generarla").toEqual([]);
  });

  // 187: a 390, lo que se toca sigue en 44 × 44. La raíz al 75 % y la escala de letras y esquinas viven solo en la compu
  // (pantalla ancha y mouse): no cambian un alto, un ancho ni un relleno, y el teléfono y la tablet conservan sus medidas.
  it("deja el teléfono con sus medidas: lo que se toca sigue en 44 × 44", () => {
    expect(css.match(/font-size: 75%/g)).toHaveLength(1);
    const scale = css.split("/* 180 · La escala de ArquitecturaBase en la compu")[1]?.split("\n}\n")[0] ?? "";
    expect(scale).toMatch(/^[^@]*@media \(min-width: 64rem\) and \(pointer: fine\) \{/);
    const properties = [...scale.matchAll(/\{([^{}]*)\}/g)]
      .flatMap((block) => block[1].split(";"))
      .map((declaration) => declaration.split(":")[0].trim())
      .filter(Boolean);
    expect(properties.length).toBeGreaterThan(40);
    expect(properties.filter((property) => !/^(?:font-size|--radius-(?:card|control)|border(?:-(?:top|bottom)-(?:left|right))?-radius)$/.test(property)))
      .toEqual([]);
  });
});
