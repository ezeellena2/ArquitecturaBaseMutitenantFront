// Presupuesto del peso inicial (docs/rules/estructura-y-features.md, «Peso inicial»): suma en gzip la entrada y los
// modulepreload de dist/index.html, lo que baja cualquier pantalla al abrirse, también la portada. Corre al final de
// `npm run build`, igual en local y en CI; si pasa el tope, el build falla.
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

/** El tope en KiB de gzip (nivel 9): apenas por encima de los 318 KiB que quedaron al sacar lo privado (2026-11). */
export const initialLoadBudgetKiB = 325;

/** Los archivos JS que el HTML baja de entrada: el script del módulo principal y sus modulepreload. */
export function initialScripts(html) {
  const entry = [...html.matchAll(/<script\b[^>]*\btype="module"[^>]*\bsrc="\/([^"]+)"/g)].map((match) => match[1]);
  const preloads = [...html.matchAll(/<link\b[^>]*\brel="modulepreload"[^>]*\bhref="\/([^"]+)"/g)].map((match) => match[1]);
  return [...new Set([...entry, ...preloads])];
}

export function initialLoadKiB(dist) {
  const files = initialScripts(readFileSync(path.join(dist, "index.html"), "utf8"));
  if (files.length === 0) throw new Error("dist/index.html no tiene una entrada de módulo.");
  const bytes = files.reduce((total, file) => total + gzipSync(readFileSync(path.join(dist, file)), { level: 9 }).length, 0);
  return { files, kib: bytes / 1024 };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = path.resolve(process.argv[2] ?? "dist");
  const { files, kib } = initialLoadKiB(dist);
  const summary = `Peso inicial: ${kib.toFixed(1)} KiB gzip en ${files.length} archivos (tope ${initialLoadBudgetKiB} KiB).`;
  if (kib > initialLoadBudgetKiB) {
    console.error(`${summary}\nAlgo que sólo usa un área privada entró en la carga inicial: importalo con lazy en el punto justo.`);
    process.exit(1);
  }
  console.log(summary);
}
