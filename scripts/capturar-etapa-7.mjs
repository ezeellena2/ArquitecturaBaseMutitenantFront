// Galería final de Etapa 7. Vite dev, como E6, sirve la entrada aislada /src/test; no cambia el build del producto.
// VITE_AUTH_ISSUER=http://localtest.me:5192 npm run dev -- --host localtest.me --port 5192
// node scripts/capturar-etapa-7.mjs --app-url http://localtest.me:5192 [--pair <par>] [--id <caso>] [--group <grupo>]
// node scripts/capturar-etapa-7.mjs --manifiesto | --verify
// Las API y sesiones se simulan solo en esta captura. El E2E real corre por separado, sin estos mocks.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { assertCapturedPairs, capturePaths, startCanvasServer, validateManifest } from "./capturar-etapa-3a.mjs";
import { assertSideBySide, composeSideBySide, openApp, openBoard, sideBySideFile } from "./capturar-relevamiento.mjs";
import { writeGallery } from "./generar-galeria-etapa-7.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const output = path.join(root, "docs/design/capturas/etapa-7");
export const canvas = path.join(root, "docs/design/lienzo");
export const issuer = "http://localtest.me:5192";
const viewports = [
  { suffix: "desktop", viewport: { width: 1440, height: 900 } },
  { suffix: "mobile", viewport: { width: 390, height: 844 } },
];
const api = (method, route, body, status = 200) => ({ method, path: route, body, status });
function pageOf(items) {
  return { items, page: 1, pageSize: 10, totalCount: items.length, totalPages: items.length ? 1 : 0, hasPrevious: false, hasNext: false };
}
function harnessPath(route, fixture = "anonymous") {
  return `/src/test/etapa7VisualApp.html?${new URLSearchParams({ as: fixture, route })}`;
}

export async function buildManifest() {
  // El mismo DTO tipado que consume el arnés; Node usa el soporte TS de los helpers de capturas existentes.
  const { etapa7Companies, etapa7PersonalUser, etapa7PublicSite } = await import("../src/test/etapa7VisualFixtures.ts");
  const cases = [];
  function both(pair, group, boards, props, app, extra = {}) {
    for (const { suffix, viewport } of viewports) cases.push({
      id: `${pair}-${suffix}`, pair, group, label: Object.values(props).join(" · "),
      board: boards[suffix], props, viewport, captureExtent: "viewport", ...extra,
      app: { ...app, captureMode: "harness" },
    });
  }
  for (const [pair, state, companies] of [
    ["landing-con-empresas", "Con empresas", etapa7Companies],
    ["landing-sin-empresas", "Sin empresas", []],
  ]) both(pair, "landing", { desktop: "Landing", mobile: "Landing-Movil" }, { empresas: state }, {
    site: "main", path: harnessPath("/"), responses: [api("GET", "/api/directory", pageOf(companies))],
    readyHeading: "Para vos", readyText: companies.length ? "Grupo Delta y sus empresas, en un solo lugar." : "Todavía no hay empresas publicadas",
  }, { captureExtent: "page" });
  for (const [pair, state, route, companies, readyText] of [
    ["directorio-con-empresas", "Con empresas", "/empresas", etapa7Companies, "Grupo Delta"],
    ["directorio-sin-resultados", "Sin resultados", "/empresas?search=Zeta", [], "Ninguna empresa coincide con la búsqueda"],
    ["directorio-sin-empresas", "Todavía no hay empresas", "/empresas", [], "Todavía no hay empresas publicadas"],
  ]) both(pair, "directorio", { desktop: "Directorio", mobile: "M-Directorio" }, { estado: state }, {
    site: "main", path: harnessPath(route), responses: [api("GET", "/api/directory", pageOf(companies))], readyHeading: "Empresas", readyText,
  });
  for (const [pair, state, fixture] of [
    ["pagina-publicada-sin-sesion", "Publicada, sin sesión", "anonymous"],
    ["pagina-publicada-con-sesion", "Publicada, con sesión", "personal"],
    ["pagina-no-disponible", "No disponible", "anonymous"],
  ]) {
    const unavailable = state === "No disponible";
    both(pair, "pagina-publica", { desktop: "Pagina-Publica", mobile: "M-Pagina-Publica" }, { estado: state }, {
      site: "delta", path: harnessPath("/", fixture),
      responses: [api("GET", "/api/public-site", unavailable ? {
        type: "about:blank", title: "Not Found", status: 404, code: "PublicSite.PublicPage.NotFound", traceId: "captura-etapa7",
      } : etapa7PublicSite, unavailable ? 404 : 200), ...(fixture === "personal" ? [api("GET", "/api/me", etapa7PersonalUser)] : [])],
      readyHeading: unavailable ? "Esta página no está disponible" : "Grupo Delta",
    });
  }
  // El estado con sesión incluye el menú desktop y la hoja mobile abiertos, como exige T18.
  for (const entry of cases.filter((item) => item.pair === "pagina-publicada-con-sesion")) {
    const mobile = entry.viewport.width === 390;
    entry.boardActions = [{ type: "click", ...(mobile ? { role: "button", name: "Tu cuenta" } : { selector: ".um-btn" }) }];
    entry.app.actions = [mobile
      ? { type: "click", role: "button", name: "Tu cuenta", exact: true }
      : { type: "press", role: "button", name: "Beto Ramírez, Personal", exact: true, key: "ArrowDown" }];
    entry.app.readySelector = mobile ? '[role="dialog"]' : '[role="menu"]';
    entry.app.readyText = "beto.ramirez@beta.ejemplo.com";
    // El menú modal oculta el resto al árbol accesible; su apertura ya exige que la página esté cargada.
    delete entry.app.readyHeading;
  }
  // Cinco suplementos reales del teléfono. Las 16 referencias base siguen siendo compatibles con validateManifest.
  const supplementalCases = cases.filter((entry) => entry.viewport.width === 390 && entry.app.site === "main").map((entry) => ({
    ...entry, id: `${entry.id}-menu`, parentId: entry.id, label: `${entry.label} · Menú abierto`, captureExtent: "viewport",
    boardActions: [{ type: "click", role: "button", name: "Abrir el menú" }],
    app: { ...entry.app, actions: [{ type: "click", role: "button", name: "Abrir el menú", exact: true }], readySelector: 'nav[aria-label="Secciones"]' },
  }));
  return { version: 1, stage: "etapa-7", canvasVersion: "v113", issuer, cases, supplementalCases };
}

export function allCases(manifest) { return [...manifest.cases, ...(manifest.supplementalCases ?? [])]; }
export function validateEtapa7Manifest(file, canvasRoot = canvas) {
  const base = validateManifest(file, canvasRoot);
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  if (manifest.issuer !== issuer) throw new Error(`La galería exige issuer ${issuer}`);
  const expectedParents = base.filter((entry) => entry.viewport.width === 390 && entry.app.site === "main");
  const supplement = manifest.supplementalCases;
  if (!Array.isArray(supplement) || supplement.length !== expectedParents.length) throw new Error("Faltan los cinco menús móviles públicos");
  const parents = new Set();
  const ids = new Set(base.map((entry) => entry.id));
  for (const entry of supplement) {
    const parent = expectedParents.find((candidate) => candidate.id === entry.parentId);
    if (!parent || parents.has(parent.id) || ids.has(entry.id) || entry.id !== `${parent.id}-menu`
      || entry.pair !== parent.pair || entry.group !== parent.group || entry.board !== parent.board
      || JSON.stringify(entry.props) !== JSON.stringify(parent.props) || JSON.stringify(entry.viewport) !== JSON.stringify(parent.viewport)
      || entry.captureExtent !== "viewport" || entry.app?.path !== parent.app.path || entry.app.site !== "main"
      || entry.app.captureMode !== "harness" || JSON.stringify(entry.app.responses) !== JSON.stringify(parent.app.responses)
      || entry.boardActions?.length !== 1 || entry.app.actions?.length !== 1) throw new Error(`Suplemento móvil inválido: ${entry.id}`);
    parents.add(parent.id);
    ids.add(entry.id);
  }
  return manifest;
}

export async function writeManifest(outputRoot = output, canvasRoot = canvas) {
  mkdirSync(outputRoot, { recursive: true });
  const file = path.join(outputRoot, "manifest.json");
  writeFileSync(file, `${JSON.stringify(await buildManifest(), null, 2)}\n`);
  return validateEtapa7Manifest(file, canvasRoot);
}
function originFor(entry, appUrl) {
  const principal = new URL(appUrl);
  if (principal.origin !== issuer || principal.pathname !== "/" || principal.search || principal.hash) {
    throw new Error(`--app-url debe ser ${issuer}: localhost es un host desconocido para T10`);
  }
  if (entry.app.site === "delta") principal.hostname = `delta.${principal.hostname}`;
  else if (entry.app.site !== "main") throw new Error(`Host visual desconocido: ${entry.app.site}`);
  return principal.origin;
}

export async function captureEntry(browser, entry, canvasUrl, appUrl, outputRoot = output) {
  const files = capturePaths(outputRoot, entry);
  mkdirSync(path.dirname(files.board), { recursive: true });
  const context = await browser.newContext({ viewport: entry.viewport, deviceScaleFactor: 1, locale: "es-AR" });
  const failures = [];
  context.on("page", (page) => page.on("pageerror", (error) => failures.push(error.message)));
  context.on("response", (response) => {
    if (new URL(response.url()).pathname.startsWith("/api/") && response.status() >= 500) failures.push(`API ${response.status()}: ${new URL(response.url()).pathname}`);
  });
  try {
    const board = await openBoard(context, canvasUrl, entry);
    const app = await openApp(context, originFor(entry, appUrl), entry);
    if (failures.length) throw new Error(`${entry.id}: ${failures.join("; ")}`);
    // Las alturas largas del Landing pertenecen a la página; no se estira el viewport aprobado ni se recorta empresas.
    const fullPage = entry.captureExtent === "page";
    await board.screenshot({ path: files.board, fullPage });
    await app.screenshot({ path: files.app, fullPage });
  } finally {
    await context.close();
  }
  await composeSideBySide(browser, entry, files, sideBySideFile(entry, outputRoot));
}
function option(args, name) { const index = args.indexOf(name); return index < 0 ? null : args[index + 1] ?? null; }
function selectedValues(args, name) { return option(args, name)?.split(",").filter(Boolean); }

async function main(args) {
  const outputRoot = option(args, "--out") ? path.resolve(root, option(args, "--out")) : output;
  const canvasRoot = option(args, "--lienzo") ? path.resolve(root, option(args, "--lienzo")) : canvas;
  const manifest = args.includes("--verify")
    ? validateEtapa7Manifest(path.join(outputRoot, "manifest.json"), canvasRoot)
    : await writeManifest(outputRoot, canvasRoot);
  const cases = allCases(manifest);
  if (args.includes("--manifiesto")) { console.log(`${manifest.cases.length} casos base + ${manifest.supplementalCases.length} menús móviles.`); return; }
  if (args.includes("--verify")) {
    assertCapturedPairs(cases, outputRoot);
    assertSideBySide(cases, outputRoot);
    writeGallery(outputRoot);
    console.log(`${cases.length} casos completos: ${cases.length * 3} PNG y galería.`);
    return;
  }
  const pairs = selectedValues(args, "--pair");
  const ids = selectedValues(args, "--id");
  const groups = selectedValues(args, "--group");
  const selected = cases.filter((entry) => (!pairs || pairs.includes(entry.pair)) && (!ids || ids.includes(entry.id)) && (!groups || groups.includes(entry.group)));
  if (!selected.length) throw new Error("El filtro no selecciona capturas");
  const appUrl = option(args, "--app-url") ?? issuer;
  for (const entry of selected) originFor(entry, appUrl);
  const canvasServer = await startCanvasServer(canvasRoot);
  let browser;
  try {
    browser = await chromium.launch();
    for (const entry of selected) {
      await captureEntry(browser, entry, canvasServer.url, appUrl, outputRoot);
      console.log(`${entry.id}: lienzo + app + lado a lado.`);
    }
    assertCapturedPairs(selected, outputRoot);
    assertSideBySide(selected, outputRoot);
    writeGallery(outputRoot);
  } finally {
    await browser?.close();
    await canvasServer.close();
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main(process.argv.slice(2));
