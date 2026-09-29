import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultManifest = path.join(root, "docs/design/capturas/etapa-3a/manifest.json");
const defaultCanvas = path.join(root, "docs/design/lienzo");
const defaultOutput = path.join(root, "docs/design/capturas/etapa-3a");
const viewports = new Set(["1440x900", "390x844"]);

export function boardChoices(file) {
  const html = readFileSync(file, "utf8");
  const attribute = html.match(/<script\b[^>]*\bdata-dc-script\b[^>]*\bdata-props='([^']+)'/);
  if (!attribute) throw new Error(`El tablero no declara data-props: ${file}`);
  const props = JSON.parse(attribute[1]);
  return Object.fromEntries(Object.entries(props)
    .filter(([key]) => !key.startsWith("$"))
    .map(([key, field]) => [key, field.options ?? [field.default]]));
}

export function validateManifest(manifestFile = defaultManifest, canvasRoot = defaultCanvas) {
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  if (manifest.version !== 1 || !Array.isArray(manifest.cases) || manifest.cases.length === 0) {
    throw new Error("El manifest de capturas debe tener versión 1 y casos.");
  }
  const ids = new Set();
  const pairs = new Map();
  for (const entry of manifest.cases) {
    if (!/^[a-z0-9-]+$/.test(entry.id) || !/^[a-z0-9-]+$/.test(entry.pair) ||
        !/^[a-z0-9-]+$/.test(entry.group) ||
        !/^[A-Za-z0-9-]+$/.test(entry.board) || ids.has(entry.id)) {
      throw new Error(`Caso visual inválido o repetido: ${entry.id}`);
    }
    ids.add(entry.id);
    const size = `${entry.viewport?.width}x${entry.viewport?.height}`;
    if (!viewports.has(size)) throw new Error(`${entry.id}: viewport no aprobado (${size})`);
    const pairSizes = pairs.get(entry.pair) ?? new Set();
    if (pairSizes.has(size)) throw new Error(`${entry.pair}: tamaño ${size} repetido`);
    pairSizes.add(size);
    pairs.set(entry.pair, pairSizes);
    if (typeof entry.app?.path !== "string" || !entry.app.path.startsWith("/") || entry.app.path.startsWith("//")) {
      throw new Error(`${entry.id}: falta una ruta local de la app`);
    }
    const board = path.join(canvasRoot, `${entry.board}.dc.html`);
    if (!existsSync(board)) throw new Error(`${entry.id}: falta tablero ${board}`);
    const choices = boardChoices(board);
    for (const [key, value] of Object.entries(entry.props ?? {})) {
      if (!choices[key]?.includes(value)) throw new Error(`${entry.id}: ${key}=${value} no está en ${entry.board}`);
    }
  }
  for (const [pair, sizes] of pairs) {
    for (const size of viewports) {
      if (!sizes.has(size)) throw new Error(`Falta ${pair}: ${size}`);
    }
  }
  return manifest.cases;
}

export function capturePaths(outputRoot, entry) {
  const stem = `${entry.id}-${entry.viewport.width}x${entry.viewport.height}`;
  const directory = path.join(outputRoot, entry.group);
  return {
    board: path.join(directory, `${stem}-lienzo.png`),
    app: path.join(directory, `${stem}-app.png`),
  };
}

export function assertCapturedPairs(cases, outputRoot = defaultOutput) {
  const missing = [];
  for (const entry of cases) {
    const files = capturePaths(outputRoot, entry);
    for (const [side, file] of Object.entries(files)) {
      if (!existsSync(file) || statSync(file).size === 0) missing.push(`${entry.id} ${side}: ${file}`);
    }
  }
  if (missing.length > 0) throw new Error(`Faltan capturas comparables:\n${missing.join("\n")}`);
}

export async function startCanvasServer(canvasRoot = defaultCanvas) {
  const server = createServer((request, response) => {
    let file;
    try {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      file = path.resolve(canvasRoot, `.${decodeURIComponent(url.pathname)}`);
    } catch {
      response.writeHead(400).end();
      return;
    }
    if (!file.startsWith(`${canvasRoot}${path.sep}`) || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404).end();
      return;
    }
    const type = file.endsWith(".html") ? "text/html" : file.endsWith(".js") ? "text/javascript" :
      file.endsWith(".css") ? "text/css" : file.endsWith(".svg") ? "image/svg+xml" : "application/octet-stream";
    response.writeHead(200, { "Content-Type": `${type}; charset=utf-8` }).end(readFileSync(file));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolve) => server.close(resolve)) };
}

export async function captureCase(browser, entry, { canvasUrl, appUrl, outputRoot = defaultOutput }) {
  const files = capturePaths(outputRoot, entry);
  mkdirSync(path.dirname(files.board), { recursive: true });
  const context = await browser.newContext({ viewport: entry.viewport, deviceScaleFactor: 1, locale: "es-AR" });
  try {
    const board = await context.newPage();
    await board.goto(`${canvasUrl}/${entry.board}.dc.html`, { waitUntil: "domcontentloaded" });
    await board.waitForFunction(() => typeof window.__dcSetProps === "function" && Boolean(window.__dcRootName?.()));
    await board.evaluate((props) => window.__dcSetProps(window.__dcRootName(), props), entry.props ?? {});
    await board.locator("[data-sc-name]").first().waitFor();
    await board.evaluate(() => document.fonts.ready);
    await board.screenshot({ path: files.board });

    const app = await context.newPage();
    await app.goto(new URL(entry.app.path, appUrl).href, { waitUntil: "domcontentloaded" });
    await app.locator(entry.app.readySelector ?? "main").first().waitFor();
    await app.evaluate(() => document.fonts.ready);
    await app.screenshot({ path: files.app });
  } finally {
    await context.close();
  }
  return files;
}

function option(args, name) {
  const index = args.indexOf(name);
  return index < 0 ? null : args[index + 1] ?? null;
}

async function main(args) {
  const cases = validateManifest();
  const selected = cases.filter((entry) => (!option(args, "--group") || entry.group === option(args, "--group")) &&
    (!option(args, "--id") || entry.id === option(args, "--id")));
  if (selected.length === 0) throw new Error("No hay casos para ese filtro.");
  if (args.includes("--verify")) {
    assertCapturedPairs(selected);
    console.log(`${selected.length} pares completos.`);
    return;
  }
  const appUrl = option(args, "--app-url");
  if (!appUrl) throw new Error("Indicá --app-url con la app en ejecución.");
  const executablePath = option(args, "--browser-path") ?? process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const canvas = await startCanvasServer();
  try {
    for (const entry of selected) {
      await captureCase(browser, entry, { canvasUrl: canvas.url, appUrl });
      console.log(`${entry.id}: lienzo y app, ${entry.viewport.width}×${entry.viewport.height}`);
    }
    assertCapturedPairs(selected);
  } finally {
    await canvas.close();
    await browser.close();
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
