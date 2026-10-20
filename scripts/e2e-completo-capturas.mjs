import { open, realpath } from "node:fs/promises";
import path from "node:path";

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const unread = (reason) => ({ captureNote: `Captura no inspeccionada: ${reason}. No se pudo comprobar su tamaño real.` });
const within = (root, candidate) => {
  const relative = path.relative(root, candidate);
  return relative !== ".." && !relative.startsWith(".." + path.sep) && !path.isAbsolute(relative);
};

async function capturesRoot(output) {
  if (typeof output !== "string" || output.includes("\0") || !path.isAbsolute(output)) return null;
  let root = path.resolve(output);
  while (true) {
    const design = path.dirname(root); const docs = path.dirname(design);
    if (path.basename(root).toLowerCase() === "capturas" && path.basename(design).toLowerCase() === "design" && path.basename(docs).toLowerCase() === "docs") break;
    const parent = path.dirname(root); if (parent === root) return null; root = parent;
  }
  try {
    const physical = await realpath(root);
    return within(root, physical) ? physical : null;
  } catch { return null; }
}

/** Lee exclusivamente los 24 bytes iniciales: firma, IHDR y dimensiones; no valida el resto del PNG. */
async function pngSize(file) {
  const handle = await open(file, "r");
  try {
    const bytes = Buffer.alloc(24);
    const { bytesRead } = await handle.read(bytes, 0, 24, 0);
    if (bytesRead !== 24 || !bytes.subarray(0, 8).equals(signature) || bytes.readUInt32BE(8) !== 13 || bytes.toString("ascii", 12, 16) !== "IHDR") return null;
    const width = bytes.readUInt32BE(16); const height = bytes.readUInt32BE(20);
    return width > 0 && height > 0 && width <= 0x7fffffff && height <= 0x7fffffff ? { width, height } : null;
  } finally { await handle.close(); }
}

async function inspectCapture(image, output, root) {
  if (!root) return unread("el directorio de salida no permite resolver docs/design/capturas");
  if (typeof image !== "string" || image.includes("\0") || path.posix.isAbsolute(image) || path.win32.isAbsolute(image) || /^[a-z][a-z0-9+.-]*:/iu.test(image) || path.extname(image).toLowerCase() !== ".png") return unread("la referencia no es una ruta PNG relativa permitida");
  const file = path.resolve(output, image.replaceAll("\\", path.sep));
  // Se comprueba primero la ruta léxica, antes de resolver cualquier enlace fuera del árbol permitido.
  if (!within(root, file)) return unread("la referencia está fuera del árbol permitido de capturas");
  try {
    const physical = await realpath(file);
    if (!within(root, physical)) return unread("el enlace apunta fuera del árbol permitido de capturas");
    const size = await pngSize(physical);
    return size ? { captureSize: size } : unread("la cabecera PNG está incompleta o es inválida");
  } catch (error) {
    return unread(["ENOENT", "ENOTDIR"].includes(error.code) ? "no se encontró el archivo PNG" : "no se pudo leer la cabecera PNG");
  }
}

/** Anota sólo resultados actuales; no modifica hechos, estados, anchos nominales ni intentos históricos. */
export async function annotateCaptureDimensions(executions = [], { output } = {}) {
  const root = await capturesRoot(output); const cache = new Map(); const annotated = [];
  for (const entry of executions) {
    if (!Array.isArray(entry?.results)) { annotated.push(entry); continue; }
    const results = [];
    for (const result of entry.results) {
      if (!result || !Object.hasOwn(result, "image")) { results.push(result); continue; }
      if (!cache.has(result.image)) cache.set(result.image, await inspectCapture(result.image, output, root));
      const inspected = cache.get(result.image); const next = { ...result };
      delete next.captureSize; delete next.captureNote; Object.assign(next, inspected);
      if (inspected.captureSize && Number.isInteger(result.width) && result.width > 0 && inspected.captureSize.width !== result.width) {
        const { width, height } = inspected.captureSize;
        next.captureNote = `Captura de ${width} × ${height} px; viewport nominal de ${result.width} px; fullPage puede ampliarse; no hubo medición de scrollWidth en ese momento; no permite inferir una causa persistente o transitoria.`;
      }
      results.push(next);
    }
    annotated.push({ ...entry, results });
  }
  return annotated;
}
