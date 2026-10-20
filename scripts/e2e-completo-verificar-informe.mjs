import { open, readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { renderCompleteReport, summarizeCases } from "./e2e-completo-informe.mjs";

const widths = [1440, 390];
const statuses = new Set(["passed", "failed", "blocked", "manual"]);
const within = (root, target) => {
  const relative = path.relative(root, target);
  return relative !== ".." && !relative.startsWith(".." + path.sep) && !path.isAbsolute(relative);
};
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const hasControls = (value) => [...value].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);

async function allowedDirectory(directory) {
  if (typeof directory !== "string" || !path.isAbsolute(directory) || hasControls(directory)) throw new Error("INVALID_DIRECTORY");
  const output = path.resolve(directory); let root = output;
  while (!(path.basename(root).toLowerCase() === "capturas" && path.basename(path.dirname(root)).toLowerCase() === "design" && path.basename(path.dirname(path.dirname(root))).toLowerCase() === "docs")) {
    const parent = path.dirname(root);
    if (parent === root) throw new Error("INVALID_DIRECTORY");
    root = parent;
  }
  const physicalRoot = await realpath(root); const physicalOutput = await realpath(output);
  if (!within(root, physicalRoot) || !within(physicalRoot, physicalOutput)) throw new Error("INVALID_DIRECTORY");
  return { root: physicalRoot, directory: physicalOutput };
}

function relativeReference(value, directory, root) {
  if (typeof value !== "string" || !value.trim()) return null;
  let decoded;
  try { decoded = decodeURIComponent(value.trim()); } catch { return null; }
  if (hasControls(decoded)) return null;
  if (decoded.startsWith("#")) return { anchor: decoded.slice(1) };
  if (decoded.includes(":") || decoded.includes("?") || /^[\\/]/u.test(decoded) || path.win32.isAbsolute(decoded)) return null;
  const [file, anchor] = decoded.split("#");
  const target = path.resolve(directory, file.replaceAll("\\", path.sep));
  return file && within(root, target) ? { target, anchor } : null;
}

async function physicalFile(root, target) {
  const physical = await realpath(target);
  if (!within(root, physical)) return { unsafe: true };
  return (await stat(physical)).isFile() ? { physical } : { missing: true };
}

/** Firma e IHDR solamente; no decodifica ni reescribe la imagen. */
async function pngSize(file) {
  const handle = await open(file, "r");
  try {
    const header = Buffer.alloc(24); const { bytesRead } = await handle.read(header, 0, 24, 0);
    if (bytesRead !== 24 || !header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) || header.readUInt32BE(8) !== 13 || header.toString("ascii", 12, 16) !== "IHDR") return null;
    const width = header.readUInt32BE(16); const height = header.readUInt32BE(20);
    return width > 0 && height > 0 && width <= 0x7fffffff && height <= 0x7fffffff ? { width, height } : null;
  } finally { await handle.close(); }
}

function decodeHTML(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#39|#\d+|#x[0-9a-f]+);/giu, (entity) => {
    const known = { "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">", "&#39;": "'" };
    if (known[entity.toLowerCase()]) return known[entity.toLowerCase()];
    const point = entity.toLowerCase().startsWith("&#x") ? Number.parseInt(entity.slice(3, -1), 16) : Number(entity.slice(2, -1));
    return point <= 0x10ffff ? String.fromCodePoint(point) : "\0";
  });
}

function htmlAttributes(html) {
  const attributes = [];
  for (const tag of html.matchAll(/<[a-z][^>]*>/giu)) {
    for (const attribute of tag[0].matchAll(/\s(href|src|id)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+))/giu)) {
      attributes.push({ name: attribute[1].toLowerCase(), value: decodeHTML(attribute[2] ?? attribute[3] ?? attribute[4]) });
    }
  }
  return attributes;
}

/** Verificación offline de los archivos publicados. No escribe archivos ni cambia resultados o historiales. */
export async function verifyCompleteReport({ directory } = {}) {
  const counts = { cases: 0, matrix: 0, executions: 0, checks: 0, executionChecks: 0, references: 0, pngs: 0, histories: 0 };
  const issues = []; const warnings = []; const seenMessages = new Set();
  const add = (list, code, location, message) => {
    const key = `${code}:${location}`;
    if (!seenMessages.has(key)) { seenMessages.add(key); list.push({ code, location, message }); }
  };
  let allowed;
  try { allowed = await allowedDirectory(directory); }
  catch { add(issues, "INVALID_DIRECTORY", "directory", "Se requiere un directorio absoluto existente dentro de docs/design/capturas."); return { counts, issues, warnings }; }
  const { root, directory: output } = allowed;
  const readPublished = async (file, json = false) => {
    try {
      const found = await physicalFile(root, path.join(output, file));
      if (!found.physical) throw new Error("Archivo no permitido");
      const content = await readFile(found.physical, "utf8"); return json ? JSON.parse(content) : content;
    } catch { add(issues, "UNREADABLE_REPORT", file, "No se pudo leer el archivo publicado permitido o su JSON es inválido."); return null; }
  };
  const [report, publishedMatrix, html] = await Promise.all([readPublished("resultados.json", true), readPublished("matriz.json", true), readPublished("index.html")]);
  if (!object(report)) { add(issues, "INVALID_REPORT", "resultados.json", "El informe debe ser un objeto JSON."); return { counts, issues, warnings }; }
  const rows = (key) => {
    if (!Array.isArray(report[key])) { add(issues, "INVALID_ROWS", key, "Se esperaba una lista de registros."); return []; }
    return report[key].filter((row, index) => {
      if (object(row)) return true;
      add(issues, "INVALID_ROW", `${key}[${index}]`, "El registro debe ser un objeto."); return false;
    });
  };
  const cases = rows("cases"); const matrix = rows("matrix"); const executions = rows("executions");
  Object.assign(counts, { cases: cases.length, matrix: matrix.length, executions: executions.length });
  const summary = summarizeCases(cases); const executionSummary = summarizeCases(executions);
  counts.checks = summary.checks.total; counts.executionChecks = executionSummary.checks.total;
  for (const [key, actual, code] of [["summary", summary, "SUMMARY_MISMATCH"], ["executionSummary", executionSummary, "EXECUTION_SUMMARY_MISMATCH"], ["matrixSummary", summarizeCases(matrix), "MATRIX_SUMMARY_MISMATCH"]]) {
    if (!isDeepStrictEqual(report[key], actual)) add(issues, code, key, "Los contadores publicados no coinciden con los resultados actuales recalculados.");
  }
  if (!isDeepStrictEqual(cases, matrix)) add(issues, "CASE_MATRIX_MISMATCH", "cases/matrix", "Las filas, sus IDs o sus resultados difieren entre cases y matrix.");
  if (!isDeepStrictEqual(publishedMatrix?.cases, matrix) || (Object.hasOwn(publishedMatrix ?? {}, "inventoryMetadata") && !isDeepStrictEqual(publishedMatrix.inventoryMetadata, report.inventoryMetadata))) add(issues, "PUBLISHED_MATRIX_MISMATCH", "matriz.json", "La matriz publicada difiere de resultados.json.");
  if (typeof html === "string") {
    try { if (html !== renderCompleteReport(report)) add(issues, "HTML_MISMATCH", "index.html", "El HTML difiere del renderer actual aplicado al JSON publicado."); }
    catch { add(issues, "RENDER_ERROR", "index.html", "El renderer actual no pudo representar el JSON publicado."); }
  }
  const executionIds = new Set(executions.map((row) => row.id));
  const checkProofs = (ids, location) => {
    if (!Array.isArray(ids)) { add(issues, "INVALID_PROOFS", location, "Las pruebas deben ser una lista de IDs."); return; }
    for (const id of ids) if (typeof id !== "string" || !executionIds.has(id)) add(issues, "UNKNOWN_PROOF", `${location}:${String(id)}`, "El ID de prueba no apunta a una ejecución existente.");
  };
  const imageContexts = [];
  const inspectResult = (result, location, current = true) => {
    if (!object(result)) { add(issues, "INVALID_RESULT", location, "El resultado debe ser un objeto."); return; }
    if (result.proofIds !== undefined) checkProofs(result.proofIds, location + ".proofIds");
    if (current && !statuses.has(result.status)) add(issues, "INVALID_STATUS", location, "El estado no pertenece al contrato del informe.");
    if (current && !widths.includes(result.width)) add(issues, "INVALID_WIDTH", location, "El resultado actual debe declarar uno de los dos anchos del informe.");
    if (result.image) imageContexts.push({ value: result.image, location, result, current });
    else if (current && ["passed", "failed"].includes(result.status)) {
      const timeout = result.status === "failed" && /timeout/iu.test(String(result.actual));
      add(timeout ? warnings : issues, timeout ? "MISSING_TIMEOUT_CAPTURE" : "MISSING_CAPTURE", location, "La comprobación no adjunta una captura; se conserva su resultado original.");
    }
    for (const key of ["previousAttempts", "attempts"]) {
      if (!Array.isArray(result[key])) continue;
      for (const [index, attempt] of result[key].entries()) { counts.histories++; inspectResult(attempt, `${location}.${key}[${index}]`, false); }
    }
  };
  for (const [name, entries] of [["cases", cases], ["matrix", matrix], ["executions", executions]]) {
    const ids = new Set();
    for (const [index, row] of entries.entries()) {
      const location = `${name}[${index}]`;
      if (typeof row.id !== "string" || !row.id || ids.has(row.id)) add(issues, "DUPLICATE_ID", location, "El ID está vacío, es inválido o se repite dentro de su lista.");
      ids.add(row.id);
      if (row.proofIds !== undefined) checkProofs(row.proofIds, location + ".proofIds");
      if (row.proofGroups !== undefined) {
        if (!Array.isArray(row.proofGroups)) add(issues, "INVALID_PROOFS", location + ".proofGroups", "Se esperaba una lista de grupos de pruebas.");
        else for (const [groupIndex, group] of row.proofGroups.entries()) checkProofs(group, `${location}.proofGroups[${groupIndex}]`);
      }
      if (row.verificationLimitation?.partialExecutionIds) checkProofs(row.verificationLimitation.partialExecutionIds, location + ".partialExecutionIds");
      // cases y matrix se comparan íntegramente arriba; no contar dos veces sus imágenes o historiales.
      if (name === "matrix") continue;
      const results = Array.isArray(row.results) ? row.results : [];
      for (const width of widths) {
        const matches = results.filter((result) => result?.width === width);
        if (matches.length > 1) add(issues, "DUPLICATE_WIDTH", location + `:${width}`, "Hay más de un resultado actual para el mismo ancho.");
        if (!matches.length) add(warnings, "MISSING_WIDTH", location + `:${width}`, "Falta resultado actual para este ancho; el resumen lo cuenta como Bloqueado.");
      }
      results.forEach((result, resultIndex) => inspectResult(result, `${location}.results[${resultIndex}]`));
    }
  }
  for (const [index, screen] of (Array.isArray(report.screens) ? report.screens : []).entries()) {
    if (typeof screen === "string") imageContexts.push({ value: screen, location: `screens[${index}]`, current: false });
    else if (screen?.image ?? screen?.path) imageContexts.push({ value: screen.image ?? screen.path, location: `screens[${index}]`, current: false });
  }
  const attributes = typeof html === "string" ? htmlAttributes(html) : [];
  const anchors = new Set(attributes.filter((entry) => entry.name === "id").map((entry) => entry.value));
  const resources = new Map();
  const references = [...imageContexts, ...attributes.filter((entry) => entry.name !== "id").map((entry) => ({ value: entry.value, location: `index.html:${entry.name}` }))];
  for (const reference of references) {
    const resolved = relativeReference(reference.value, output, root);
    if (!resolved || (reference.current !== undefined && !resolved.target)) { add(issues, "UNSAFE_REFERENCE", reference.location, "La referencia no es un archivo relativo permitido dentro del árbol de capturas."); continue; }
    if (!resolved.target) {
      if (!anchors.has(resolved.anchor)) add(issues, "MISSING_ANCHOR", `index.html:#${resolved.anchor}`, "El enlace interno no tiene destino en el HTML.");
      continue;
    }
    if (!resources.has(resolved.target)) resources.set(resolved.target, []);
    resources.get(resolved.target).push(reference);
  }
  counts.references = resources.size;
  for (const [target, referencesForFile] of resources) {
    const location = path.relative(output, target).replaceAll("\\", "/");
    let found;
    try { found = await physicalFile(root, target); }
    catch (error) { found = ["ENOENT", "ENOTDIR"].includes(error.code) ? { missing: true } : { unreadable: true }; }
    if (found.unsafe) { add(issues, "UNSAFE_REFERENCE", location, "El enlace físico sale del árbol de capturas; no se leyó su contenido."); continue; }
    if (!found.physical) {
      const contexts = referencesForFile.filter((entry) => entry.result);
      const timeoutOnly = found.missing && contexts.length > 0 && contexts.every((entry) => entry.result.status === "failed" && /timeout/iu.test(String(entry.result.actual)));
      add(timeoutOnly ? warnings : issues, timeoutOnly ? "MISSING_TIMEOUT_CAPTURE" : "MISSING_REFERENCE", location, found.missing ? "El archivo referido no existe; no se crea ni sustituye la evidencia." : "No se pudo inspeccionar el archivo referido.");
      continue;
    }
    if (path.extname(target).toLowerCase() !== ".png") continue;
    counts.pngs++; let size;
    try { size = await pngSize(found.physical); } catch { size = null; }
    if (!size) { add(issues, "INVALID_PNG", location, "La cabecera PNG está incompleta o no contiene firma e IHDR válidos."); continue; }
    for (const context of referencesForFile.filter((entry) => entry.current && entry.result)) {
      if (!isDeepStrictEqual(context.result.captureSize, size)) add(issues, "CAPTURE_SIZE_MISMATCH", context.location, "captureSize no coincide con las dimensiones actuales de la cabecera PNG.");
      if (Number.isInteger(context.result.width) && size.width !== context.result.width && !String(context.result.captureNote ?? "").trim()) add(issues, "CAPTURE_NOTE_MISSING", context.location, "El PNG tiene un ancho distinto del nominal y falta la nota factual de captura.");
    }
  }
  return { counts, issues, warnings };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argument = process.argv.slice(2);
  if (argument.length !== 1 || !argument[0].startsWith("--directory=")) {
    console.error("Uso: node scripts/e2e-completo-verificar-informe.mjs --directory=<ruta absoluta>"); process.exitCode = 1;
  } else {
    const result = await verifyCompleteReport({ directory: argument[0].slice("--directory=".length) });
    console.info(`Informe: ${result.counts.cases} filas, ${result.counts.executions} ejecuciones, ${result.counts.pngs} PNG; ${result.issues.length} problemas, ${result.warnings.length} advertencias.`);
    for (const item of [...result.issues, ...result.warnings].slice(0, 12)) console.info(`${item.code} · ${item.location}: ${item.message}`);
    if (result.issues.length + result.warnings.length > 12) console.info("La función verifyCompleteReport devuelve la lista completa.");
    process.exitCode = result.issues.length ? 1 : 0;
  }
}
