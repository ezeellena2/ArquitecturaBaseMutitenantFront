// Relevamiento visual de las etapas 1 a 6 contra el lienzo vigente: cada pantalla y cada estado que ya existe en la app,
// a 1440 × 900 y a 390 × 844, con el tablero a la izquierda y la app a la derecha.
//
// Reusa los casos y los datos de prueba de los generadores de las etapas (lee sus manifiestos: capturar-etapa-3a, 3b, 3c,
// 4, 6 y capturar-f7) y cambia solo el lado del tablero: cada caso se compara con el tablero vigente y, en el teléfono,
// con su `M-*` si el lienzo lo dibuja. No escribe nada en docs/design/capturas/etapa-*.
//
// - solo el manifiesto:  node scripts/capturar-relevamiento.mjs --manifiesto
// - capturar:            node scripts/capturar-relevamiento.mjs --app-url http://127.0.0.1:5191 [--pair <par>] [--id <caso>] [--group <grupo>]
//                        [--lienzo <copia del lienzo>] [--tmp <carpeta de las imágenes sueltas>]
// - comprobar las PNG:   node scripts/capturar-relevamiento.mjs --verify
// Las imágenes sueltas (tablero y app) quedan en una carpeta temporal (--tmp); en docs/design/capturas/consolidacion/
// relevamiento solo van el manifest.json, relevamiento.md y las PNG `-lado-a-lado.png`. El manifest tiene la forma de los
// de las etapas, así que la vista en vivo (scripts/recorrido-lienzo) lo toma.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { installApiMocks, runAppActions, startCanvasServer, validateManifest, waitForAppFont } from "./capturar-etapa-3a.mjs";
import { catalog } from "./capturar-relevamiento.casos.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const canvas = path.join(root, "docs/design/lienzo");
export const output = path.join(root, "docs/design/capturas/consolidacion/relevamiento");
export const manifestFile = path.join(output, "manifest.json");

export function sideBySideFile(entry, outputRoot = output) {
  return path.join(outputRoot, entry.group, `${entry.id}-${entry.viewport.width}x${entry.viewport.height}-lado-a-lado.png`);
}

export function buildCases() {
  return catalog(root);
}

export function writeManifest() {
  mkdirSync(output, { recursive: true });
  const cases = buildCases();
  writeFileSync(manifestFile, `${JSON.stringify({ version: 1, cases }, null, 2)}\n`);
  return validateManifest(manifestFile, canvas);
}

// Los dígitos de un código no se comparan (son datos de prueba distintos): solo se enmascaran los casilleros del código,
// no los demás campos numéricos (el CUIT, las fechas).
const codeMask = 'input[inputmode="numeric"][aria-label^="Código"] { -webkit-text-security: disc; }';
const fontFace = '@font-face { font-family: Inter; src: url("/_fonts/inter-latin-wght-normal.woff2") format("woff2"); font-style: normal; font-weight: 100 900; font-display: swap; }';

// Las acciones de la vista en vivo (un clic por selector CSS o `text=`) más escribir en un campo y marcar una opción.
export async function runBoardActions(page, actions = []) {
  for (const action of actions) {
    if (action.type === "fill") {
      const field = page.getByRole("textbox", { name: action.name });
      await field.fill(action.value);
      await field.blur();
    } else if (action.type === "click" && action.selector?.startsWith("text=")) {
      await page.getByText(action.selector.slice(5), { exact: true }).last().click();
    } else if (action.type === "click") {
      await page.locator(action.selector).first().click({ force: action.force ?? false });
    } else if (action.type === "toggle") {
      await page.locator(action.selector).filter({ has: page.getByText(action.text, { exact: true }) }).first()
        .locator('input[type="checkbox"]').click();
    } else {
      throw new Error(`Acción de tablero desconocida: ${action.type}`);
    }
    await page.waitForTimeout(150);
  }
}

/// Abre el tablero en su estado y lo deja listo para fotografiar (con Inter, como la app).
export async function openBoard(context, canvasUrl, entry) {
  const page = await context.newPage();
  await page.goto(`${canvasUrl}/${entry.board}.dc.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof window.__dcSetProps === "function" && Boolean(window.__dcRootName?.()));
  await page.evaluate((props) => window.__dcSetProps(window.__dcRootName(), props), entry.props ?? {});
  await page.locator("[data-sc-name]").first().waitFor();
  await page.waitForTimeout(200);
  await runBoardActions(page, entry.boardActions);
  await page.addStyleTag({ content: fontFace });
  await page.evaluate(() => document.fonts.load("700 54px Inter"));
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: codeMask });
  return page;
}

/// Abre la app en su estado: datos de prueba, pasos y espera de lo que tiene que verse.
export async function openApp(context, appUrl, entry) {
  const { app } = entry;
  await installApiMocks(context, app.responses, app.userFixture);
  // `hang`: una ruta de la API que nunca responde (el estado «cargando» o «enviando»).
  if (app.hang) await context.route(`**${app.hang}`, () => new Promise(() => {}));
  const page = await context.newPage();
  await page.goto(new URL(app.path, appUrl).href, { waitUntil: "domcontentloaded" });
  // Un paso puede pedir `waitFor`: esperar un texto antes de hacerlo (por ejemplo, que la dirección figure disponible).
  for (const action of app.actions ?? []) {
    if (action.waitFor) await page.getByText(action.waitFor).first().waitFor();
    await runAppActions(page, [action]);
  }
  await page.locator(app.readySelector ?? "main").first().waitFor();
  if (app.readyHeading) await page.getByRole("heading", { name: app.readyHeading }).first().waitFor();
  if (app.readyText) await page.getByText(app.readyText, { exact: false }).first().waitFor();
  await page.waitForTimeout(app.readyText && /^(Guardamos|Agregamos|Quitamos|Desde ahora|Vinculamos|Desvinculamos|Cancelamos)/.test(app.readyText) ? 800 : 300);
  await waitForAppFont(page);
  await page.addStyleTag({ content: codeMask });
  return page;
}

// Una sola imagen para mirar: el tablero a la izquierda y la app a la derecha, cada una con su rótulo.
export async function composeSideBySide(browser, entry, files, target) {
  const image = (file) => `data:image/png;base64,${readFileSync(file).toString("base64")}`;
  const size = (file) => { const buffer = readFileSync(file); return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }; };
  const left = size(files.board);
  const right = size(files.app);
  const propsText = Object.entries(entry.props ?? {}).map(([key, value]) => `${key}: ${value}`).join(" · ");
  const figure = (label, file) => `<figure><figcaption>${label}</figcaption><img src="${image(file)}"></figure>`;
  const page = await browser.newPage({ viewport: { width: left.width + right.width + 72, height: Math.max(left.height, right.height) + 80 }, deviceScaleFactor: 1 });
  try {
    await page.setContent(`<!doctype html><html><body style="margin:0;background:#ece6dc">
      <style>main{display:flex;gap:24px;padding:16px 24px 24px;align-items:flex-start}figure{margin:0}figcaption{font:600 14px/1.6 system-ui,sans-serif;color:#3b352d;margin-bottom:6px}
      img{display:block;box-shadow:0 0 0 1px #d8d0c4}</style>
      <main>${figure(`Tablero · ${entry.board}${propsText ? ` · ${propsText}` : ""}`, files.board)}${figure("App", files.app)}</main></body></html>`);
    await page.waitForFunction(() => [...document.images].every((img) => img.complete));
    mkdirSync(path.dirname(target), { recursive: true });
    await page.screenshot({ path: target, fullPage: true });
    return target;
  } finally {
    await page.close();
  }
}

/// Fotografía el tablero y la app de un caso en `tmp` y arma la imagen lado a lado en `outputRoot`. `onPages` deja mirar las
/// dos páginas abiertas (por ejemplo, para comparar su texto) antes de cerrarlas.
export async function captureEntry(browser, canvasUrl, appUrl, entry, { tmp, outputRoot = output, onPages } = {}) {
  const stem = path.join(tmp, entry.group, `${entry.id}-${entry.viewport.width}x${entry.viewport.height}`);
  mkdirSync(path.dirname(stem), { recursive: true });
  const files = { board: `${stem}-lienzo.png`, app: `${stem}-app.png` };
  const context = await browser.newContext({ viewport: entry.viewport, deviceScaleFactor: 1, locale: "es-AR", ignoreHTTPSErrors: true });
  try {
    const board = await openBoard(context, canvasUrl, entry);
    // Un tablero «Criterio» es una página larga: se fotografía solo la sección que se compara.
    if (entry.section) {
      await board.locator("section").filter({ has: board.getByRole("heading", { level: 2, name: entry.section, exact: true }) })
        .first().screenshot({ path: files.board });
    } else {
      await board.screenshot({ path: files.board });
    }
    const app = await openApp(context, appUrl, entry);
    await app.screenshot({ path: files.app });
    if (onPages) await onPages({ entry, board, app, files });
  } finally {
    await context.close();
  }
  const target = await composeSideBySide(browser, entry, files, sideBySideFile(entry, outputRoot));
  return { files, target };
}

export function assertSideBySide(cases, outputRoot = output) {
  const missing = cases.filter((entry) => { const file = sideBySideFile(entry, outputRoot); return !existsSync(file) || statSync(file).size === 0; });
  if (missing.length > 0) throw new Error(`Faltan imágenes lado a lado:\n${missing.map((entry) => sideBySideFile(entry, outputRoot)).join("\n")}`);
}

function option(args, name) {
  const index = args.indexOf(name);
  return index < 0 ? null : args[index + 1] ?? null;
}

const relative = (file) => path.relative(root, file).replaceAll("\\", "/");

async function main(args) {
  const cases = writeManifest();
  if (args.includes("--manifiesto")) {
    console.log(`${cases.length} casos en ${relative(manifestFile)}.`);
    return;
  }
  const pairId = option(args, "--pair");
  const id = option(args, "--id");
  const group = option(args, "--group");
  const selected = cases.filter((entry) => (!pairId || entry.pair === pairId) && (!id || entry.id === id) && (!group || entry.group === group));
  if (selected.length === 0) throw new Error("No hay casos para ese filtro.");
  if (args.includes("--verify")) {
    assertSideBySide(selected);
    console.log(`${selected.length} imágenes lado a lado del relevamiento verificadas.`);
    return;
  }
  const appUrl = option(args, "--app-url");
  if (!appUrl) throw new Error("Indicá --app-url del servidor Vite (o --manifiesto, o --verify).");
  const tmp = option(args, "--tmp") ?? path.join(os.tmpdir(), "capturar-relevamiento");
  const executablePath = option(args, "--browser-path") ?? process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  // Sin una ruta, el Chrome del sistema: el Chromium de Playwright no siempre está descargado.
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : { channel: "chrome" }) });
  // Con --lienzo se fotografía una copia del lienzo (para que todos los casos de una corrida vean los mismos tableros).
  const server = await startCanvasServer(path.resolve(option(args, "--lienzo") ?? canvas));
  const failed = [];
  try {
    for (const entry of selected) {
      try {
        const { target } = await captureEntry(browser, server.url, appUrl, entry, { tmp });
        console.log(`${relative(target)}: ${entry.state}`);
      } catch (error) {
        failed.push(entry.id);
        console.error(`${entry.id}: ${error instanceof Error ? error.message.split("\n")[0] : error}`);
      }
    }
  } finally {
    await server.close();
    await browser.close();
  }
  if (failed.length > 0) throw new Error(`No se pudieron capturar: ${failed.join(", ")}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
