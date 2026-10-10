// Preparación y futura captura E8b. API/sesión simuladas; no es E2E ni prueba de proveedor.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { boardChoices, capturePaths, startCanvasServer } from "./capturar-etapa-3a.mjs";
import { composeSideBySide, openApp, openBoard, sideBySideFile } from "./capturar-relevamiento.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const canvas = path.join(root, "docs/design/lienzo");
export const issuer = "http://localtest.me:5192";
export const output = path.join(root, "docs/design/implementacion/etapa-8b");
const fixtureFile = path.join(root, "src/test/etapa8bVisualFixtures.ts");
const hash = (content) => createHash("sha256").update(content).digest("hex");
const slug = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/gu, "").toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
const jsonHash = (value) => hash(JSON.stringify(value));

export function inventory(canvasRoot = canvas) {
  // Sólo HTML actual; cada opción usa su viewport propio. No importa .local ni Archivo/generadores.
  const files = readdirSync(canvasRoot).filter((file) => /^(?:M-)?(?:Asistente-(?:Org|Personal|Plat|Config-Org|Uso-Org)|Plat-Asistente-(?:Config|Uso))\.dc\.html$/u.test(file)).sort();
  if (files.length !== 14) throw new Error(`Inventario E8b: se esperaban 14 tableros, hay ${files.length}`);
  return files.flatMap((file) => {
    const board = file.replace(/\.dc\.html$/u, ""); const choices = boardChoices(path.join(canvasRoot, file));
    const group = board.includes("Uso") ? "uso" : board.includes("Config") ? "configuracion" : "chat";
    const stateKey = group === "chat" ? "asistente" : "estado";
    const states = choices[stateKey];
    if (!states?.length || states.some((state) => typeof state !== "string")) throw new Error(`${board}: selector fuente inválido`);
    return states.map((state) => ({ id: `${slug(board)}-${slug(state)}`, group, board, state, stateKey, props: { [stateKey]: state },
      viewport: board.startsWith("M-") ? { width: 390, height: 844 } : { width: 1440, height: 900 }, sourceSha256: hash(readFileSync(path.join(canvasRoot, file))) }));
  });
}

export async function buildManifest(canvasRoot = canvas) {
  const fixtures = await import("../src/test/etapa8bVisualFixtures.ts");
  const cases = []; const pending = [];
  for (const entry of inventory(canvasRoot)) {
    const app = entry.group === "configuracion" ? fixtures.configurationScenario(entry.board, entry.state)
      : entry.group === "chat" ? fixtures.chatScenario(entry.board, entry.state) : undefined;
    if (app) cases.push({ ...entry, label: entry.state, captureExtent: "viewport", app, scenarioSha256: jsonHash(app) });
    else pending.push({ ...entry, reason: entry.group === "uso" ? "Uso CC04 pendiente de aprobación y publicación conjunta; sin página ni fixture."
      : "Escenario/acciones todavía sin preparar en este corte; no se declara cobertura." });
  }
  return { version: 1, stage: "etapa-8b-preparacion", evidence: "API y sesión ficticias del arnés; no E2E/proveedor", issuer,
    sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(), fixtureSha256: hash(readFileSync(fixtureFile)),
    cases, pending, complete: false };
}

export function validateManifest(manifest, source = inventory()) {
  if (manifest.version !== 1 || manifest.issuer !== issuer || manifest.complete !== false || !/^[a-f0-9]{40}$/u.test(manifest.sourceCommit)
    || manifest.fixtureSha256 !== hash(readFileSync(fixtureFile)) || !Array.isArray(manifest.cases) || !Array.isArray(manifest.pending)) throw new Error("Manifest E8b inválido o fixture cambió");
  const expected = new Map(source.map((entry) => [entry.id, entry])); const seen = new Set();
  if (expected.size !== source.length) throw new Error("Inventario repetido");
  for (const [ready, entries] of [[true, manifest.cases], [false, manifest.pending]]) {
    for (const entry of entries) {
      const original = expected.get(entry.id);
      if (!original || seen.has(entry.id)) throw new Error(`${entry.id}: fuera del inventario o repetido`);
      seen.add(entry.id);
      for (const field of ["group", "board", "state", "stateKey", "viewport", "props", "sourceSha256"]) {
        if (JSON.stringify(original[field]) !== JSON.stringify(entry[field])) throw new Error(`${entry.id}: ${field} no coincide con la fuente`);
      }
      if (ready) {
        if (entry.app?.captureMode !== "harness" || !entry.app.path?.startsWith("/src/test/etapa8VisualApp.html?") || !entry.app.readySelector
          || entry.scenarioSha256 !== jsonHash(entry.app) || entry.captureExtent !== "viewport") throw new Error(`${entry.id}: escenario/fixture inválido`);
      } else if (!entry.reason || entry.app) throw new Error(`${entry.id}: pendiente debe tener motivo y no escena nominal`);
    }
  }
  if (seen.size !== expected.size) throw new Error("Hay estados del inventario sin mapear ni declarar pendientes");
  return manifest;
}

export function selectCases(manifest, { ids, groups } = {}) {
  validateManifest(manifest);
  const all = [...manifest.cases, ...manifest.pending];
  for (const id of ids ?? []) if (!all.some((entry) => entry.id === id)) throw new Error(`Selección desconocida: ${id}`);
  for (const group of groups ?? []) if (!all.some((entry) => entry.group === group)) throw new Error(`Selección desconocida: ${group}`);
  const explicit = Boolean(ids?.length || groups?.length);
  const matches = (entry) => (!ids?.length || ids.includes(entry.id)) && (!groups?.length || groups.includes(entry.group));
  const pending = manifest.pending.filter(matches);
  if (pending.length) throw new Error(`${pending.length} estados pendientes; ejecución bloqueada antes de capturar:\n${pending.map((entry) => `${entry.id}: ${entry.reason}`).join("\n")}`);
  const cases = manifest.cases.filter(matches);
  if (!cases.length) throw new Error("Selección vacía");
  return { cases, complete: !explicit && manifest.pending.length === 0, selection: explicit ? "parcial explícita" : "completa", pending: manifest.pending };
}

export function expectedApiFailure(responses, method, url, status) {
  return status >= 400 && status !== 501 && responses.some((response) => response.status === status && response.method === method && response.path === url.pathname
    && Object.entries(response.query ?? {}).every(([key, value]) => url.searchParams.get(key) === value));
}

export function safeOutput(value) {
  const target = path.resolve(root, value); const relative = path.relative(root, target);
  const allowed = [path.join(".local"), path.join("docs", "design", "implementacion", "etapa-8b")];
  if (!allowed.some((base) => relative === base || relative.startsWith(`${base}${path.sep}`))) throw new Error("El destino debe estar dentro de .local o docs/design/implementacion/etapa-8b");
  let current = root;
  for (const part of relative.split(path.sep)) {
    current = path.join(current, part);
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) throw new Error("El destino contiene un enlace/junction");
  }
  return target;
}

function pngDimensions(file) {
  const bytes = readFileSync(file);
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error("Captura PNG inválida");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}
export function captureEvidence(entry, outputRoot) {
  const files = { ...capturePaths(outputRoot, entry), sideBySide: sideBySideFile(entry, outputRoot) };
  return Object.entries(files).map(([kind, file]) => {
    const expected = kind === "sideBySide" ? { width: entry.viewport.width * 2 + 72, height: entry.viewport.height + 80 } : entry.viewport;
    if (JSON.stringify(pngDimensions(file)) !== JSON.stringify(expected)) throw new Error(`${entry.id}: dimensiones incorrectas de ${kind}`);
    return { kind, file: path.relative(outputRoot, file).split(path.sep).join("/"), sha256: hash(readFileSync(file)), ...expected };
  });
}

async function captureEntry(browser, entry, canvasUrl, appUrl, outputRoot) {
  const context = await browser.newContext({ viewport: entry.viewport, deviceScaleFactor: 1, locale: "es-AR" });
  const failures = [];
  context.on("page", (page) => page.on("pageerror", () => failures.push("Error JavaScript")));
  context.on("response", (response) => {
    const url = new URL(response.url()); const status = response.status();
    if (url.pathname.startsWith("/api/") && status >= 400 && !expectedApiFailure(entry.app.responses, response.request().method(), url, status)) failures.push(`API inesperada ${status}: ${url.pathname}`);
  });
  const files = capturePaths(outputRoot, entry);
  try {
    const board = await openBoard(context, canvasUrl, entry); const app = await openApp(context, appUrl, entry);
    if (failures.length) throw new Error(`${entry.id}: ${failures.join("; ")}`);
    mkdirSync(path.dirname(files.app), { recursive: true });
    await board.screenshot({ path: files.board }); await app.screenshot({ path: files.app });
    if (failures.length) throw new Error(`${entry.id}: ${failures.join("; ")}`);
  } finally { await context.close(); }
  await composeSideBySide(browser, entry, files, sideBySideFile(entry, outputRoot));
  return captureEvidence(entry, outputRoot);
}

function option(args, key) { const index = args.indexOf(key); if (index < 0) return undefined; if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`Falta valor de ${key}`); return args[index + 1]; }
export async function main(args) {
  const manifest = validateManifest(await buildManifest());
  if (args.includes("--manifiesto") || args.includes("--dry-run")) {
    const destination = safeOutput(option(args, "--out") ?? ".local/etapa-8b-preparacion");
    if (!path.relative(root, destination).startsWith(`.local${path.sep}`)) throw new Error("El dry-run sólo escribe en .local");
    mkdirSync(destination, { recursive: true }); writeFileSync(path.join(destination, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`${manifest.cases.length} preparados; ${manifest.pending.length} pendientes; galería completa: false.`); return;
  }
  // Esta puerta antecede mkdir, server y browser. No hay captura completa mientras quede un pendiente.
  const selection = selectCases(manifest, { ids: option(args, "--id")?.split(","), groups: option(args, "--group")?.split(",") });
  const appUrl = option(args, "--app-url") ?? issuer;
  if (appUrl !== issuer) throw new Error(`La captura exige ${issuer}`);
  const destination = safeOutput(option(args, "--out") ?? output);
  mkdirSync(destination, { recursive: true });
  // Cada corrida posee sus archivos. PNGs anteriores nunca cuentan como evidencia nueva.
  const runOutput = mkdtempSync(path.join(destination, "corrida-"));
  let server; let browser;
  const receipt = { version: 1, complete: false, selection: selection.selection, requestedCaseIds: selection.cases.map((entry) => entry.id),
    source: manifest, result: "running", captured: [] };
  const receiptFile = path.join(runOutput, "receipt.json");
  writeFileSync(receiptFile, `${JSON.stringify(receipt, null, 2)}\n`);
  try {
    server = await startCanvasServer(canvas);
    browser = await chromium.launch({ headless: true, args: [`--unsafely-treat-insecure-origin-as-secure=${issuer}`], ...(option(args, "--browser-path") ? { executablePath: option(args, "--browser-path") } : { channel: "chrome" }) });
    for (const entry of selection.cases) {
      receipt.captured.push({ id: entry.id, files: await captureEntry(browser, entry, server.url, appUrl, runOutput) });
      writeFileSync(receiptFile, `${JSON.stringify(receipt, null, 2)}\n`);
      console.log(entry.id);
    }
    receipt.complete = selection.complete; receipt.result = "captured";
    writeFileSync(receiptFile, `${JSON.stringify(receipt, null, 2)}\n`);
    console.log(`${receipt.captured.length} casos capturados; galería completa: ${receipt.complete}.`);
  } catch (error) {
    receipt.result = "failed"; receipt.complete = false;
    writeFileSync(receiptFile, `${JSON.stringify(receipt, null, 2)}\n`);
    throw error;
  } finally {
    try { await browser?.close(); } finally { await server?.close(); }
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main(process.argv.slice(2));
