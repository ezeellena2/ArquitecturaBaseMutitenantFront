// Galería de una etapa: casos externos y el lienzo vigente. Sin tests propios ni recibos versionados.
import { createServer } from "node:http";
import { existsSync, lstatSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startAssistantOpenStream } from "./assistant-open-stream.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const canvas = path.join(root, "docs/design/lienzo");
const defaultCanvas = canvas;
const output = path.join(root, ".local/capturas");
export const issuer = "http://localtest.me:5192";
const interFont = path.join(root, "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2");
const defaultCases = path.join(root, "scripts/capturas/etapa-8b.json");
export const otpMaskStyle = 'input[inputmode="numeric"] { -webkit-text-security: disc; }';
export const sideBySideFile = (entry, out = output) => path.join(out, entry.group, entry.id + "-" + entry.viewport.width + "x" + entry.viewport.height + "-lado-a-lado.png");
export function boardChoices(file) {
  const html = readFileSync(file, "utf8");
  const attribute = html.match(/<script\b[^>]*\bdata-dc-script\b[^>]*\bdata-props='([^']+)'/);
  if (!attribute) throw new Error(`El tablero no declara data-props: ${file}`);
  const props = JSON.parse(attribute[1]);
  return Object.fromEntries(Object.entries(props)
    .filter(([key]) => !key.startsWith("$"))
    .map(([key, field]) => [key, field.options ?? [field.default]]));
}

export async function waitForAppFont(page) {
  const missing = await page.evaluate(async () => {
    await document.fonts.ready;
    const family = getComputedStyle(document.body).fontFamily;
    if (!family.includes("Inter")) return false;
    await document.fonts.load('13px "Inter Variable"');
    return ![...document.fonts].some((face) => face.family.includes("Inter") && face.status === "loaded");
  });
  if (missing) throw new Error("La app pide Inter y no la cargó: la captura saldría con la letra del sistema.");
}

export function capturePaths(outputRoot, entry) {
  const stem = `${entry.id}-${entry.viewport.width}x${entry.viewport.height}`;
  const directory = path.join(outputRoot, entry.group);
  return {
    board: path.join(directory, `${stem}-lienzo.png`),
    app: path.join(directory, `${stem}-app.png`),
  };
}

export async function startCanvasServer(canvasRoot = defaultCanvas) {
  const server = createServer((request, response) => {
    let file;
    try {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      if (url.pathname === "/_fonts/inter-latin-wght-normal.woff2") {
        if (!existsSync(interFont)) { response.writeHead(404).end(); return; }
        response.writeHead(200, { "Content-Type": "font/woff2" }).end(readFileSync(interFont));
        return;
      }
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

export async function runAppActions(page, actions = []) {
  for (const action of actions) {
    const surface = action.within ? page.getByRole(action.within.role, { name: action.within.name, exact: true }) : page;
    // Como el test de la galería: una acción ubica su elemento por la etiqueta o, si no la trae, por rol y nombre.
    const located = () => action.label ? surface.getByLabel(action.label, { exact: action.exact ?? false })
      : surface.getByRole(action.role, { name: action.name, exact: action.exact ?? false });
    // `nth`: cuál de los que se llaman igual (Roles tiene tres «Solo lectura»), como en el test de la galería.
    const target = () => action.nth === undefined ? located() : located().nth(action.nth);
    if (action.type === "upload") {
      await page.getByLabel(action.label, { exact: action.exact ?? false }).and(page.locator('input[type="file"]')).setInputFiles(action.files.map((file) => {
        if (!Number.isSafeInteger(file.byteLength) || file.byteLength <= 0 || file.byteLength > 15 * 1024 * 1024) throw new Error("Archivo ficticio fuera del límite de memoria de 15 MiB");
        const bytes = Buffer.from(file.base64, "base64");
        if (bytes.length > file.byteLength) throw new Error("Archivo ficticio truncado");
        return { name: file.name, mimeType: file.mimeType, buffer: Buffer.concat([bytes, Buffer.alloc(file.byteLength, file.mimeType === "application/pdf" ? 32 : 0)], file.byteLength) };
      }));
    } else if (action.type === "fill") {
      await target().fill(action.value);
    } else if (action.type === "click") {
      await target().click({ force: action.force ?? false });
    } else if (action.type === "press") {
      await target().focus();
      await target().press(action.key);
    } else if (action.type === "scroll") {
      // Como lo muestra el tablero: con nombre, ese control a la vista; sin nombre, la pantalla arriba.
      if (action.name) await target().evaluate((element, block) => element.scrollIntoView({ block }), action.block ?? "center");
      else await page.evaluate(() => {
        window.scrollTo(0, 0);
        for (const element of document.querySelectorAll("*")) if (element.scrollTop > 0) element.scrollTop = 0;
      });
    } else if (action.type === "otp") {
      await page.getByRole("textbox", { name: "Código 1" }).click();
      await page.keyboard.type(action.value);
    } else {
      throw new Error(`Acción visual desconocida: ${action.type}`);
    }
  }
}

export async function installApiMocks(context, responses = [], userFixture, openStream) {
  // Sólo el arnés: lecturas antes/después de una acción real, sin modificar DTOs.
  if (openStream) {
    const local = new URL(openStream.url);
    if (openStream.origin !== "http://localtest.me:5192" || local.protocol !== "http:" || local.hostname !== "127.0.0.1"
      || !local.port || local.pathname !== "/" || local.search || local.hash || local.username || local.password) throw new Error("Transporte SSE debe ser el fixture local efímero");
  }
  const completed = new Set();
  const forwarded = new Map();
  const onResponse = (response) => {
    const original = forwarded.get(response.request());
    if (!original) return;
    forwarded.delete(response.request());
    if (response.status() === original.status && response.headers()["content-type"] === original.contentType) {
      completed.add(`${original.method} ${original.path}`);
    }
  };
  if (openStream) context.on("response", onResponse);
  await context.route("**/api/**", async (route) => {
    const request = route.request();
    const requestPath = new URL(request.url()).pathname;
    if (!requestPath.startsWith("/api/")) {
      await route.continue();
      return;
    }
    const requestUrl = new URL(request.url());
    const response = responses.find((item) => item.path === requestPath && item.method === request.method()
      && (!item.afterResponse || completed.has(`${item.afterResponse.method} ${item.afterResponse.path}`))
      && Object.entries(item.query ?? {}).every(([key, value]) => requestUrl.searchParams.get(key) === value));
    if (response) {
      if (response.rawBody !== undefined && (typeof response.rawBody !== "string" || !response.contentType)) {
        throw new Error("rawBody exige texto y contentType explícito en el arnés");
      }
      if (response.openStream) {
        const headers = await request.allHeaders();
        if (!openStream || requestUrl.origin !== openStream.origin || headers.origin !== openStream.origin) {
          await route.fulfill({ status: 501, contentType: "application/problem+json", body: JSON.stringify({ code: "Capture.UnmockedRoute", traceId: "capture" }) });
          return;
        }
        forwarded.set(request, response);
        try { await route.continue({ url: `${openStream.url}${requestUrl.pathname}${requestUrl.search}`, headers }); }
        catch (error) { forwarded.delete(request); throw error; }
        return;
      }
      await route.fulfill({
        status: response.status,
        contentType: response.contentType ?? "application/json",
        body: response.rawBody ?? JSON.stringify(response.body ?? {}),
        headers: response.headers ?? {},
      });
      completed.add(`${response.method} ${response.path}`);
      return;
    }
    if (requestPath === "/api/me" && request.method() === "GET" && userFixture) {
      const { currentUsers } = await import("../src/test/mocks/currentUsers.ts");
      const user = currentUsers[userFixture];
      if (!user) throw new Error(`Fixture de usuario desconocido: ${userFixture}`);
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(user) });
      return;
    }
    if (requestPath === "/api/reference-data" && request.method() === "GET") {
      const { referenceDataFixture } = await import("../src/test/mocks/handlers.ts");
      const culture = request.headers()["accept-language"] === "en-US" ? "en-US" : "es-AR";
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(referenceDataFixture(culture)) });
      return;
    }
    if (requestPath === "/api/auth/methods" && request.method() === "GET") {
      await route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({ channels: [{ key: "email", countries: [] }, { key: "google", countries: [] }] }),
      });
      return;
    }
    // Como el back: el registro con Google pide antes su token antiforgery; sin él, el botón queda apagado.
    if (requestPath === "/api/auth/external/google/antiforgery" && request.method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ requestToken: "capture-antiforgery" }) });
      return;
    }
    await route.fulfill({
      status: 501, contentType: "application/problem+json",
      body: JSON.stringify({ code: "Capture.UnmockedRoute", traceId: "capture" }),
    });
  });
  return () => {
    if (openStream) context.off("response", onResponse);
    forwarded.clear();
  };
}

const codeMask = 'input[inputmode="numeric"][aria-label^="Código"] { -webkit-text-security: disc; }';
const fontFace = '@font-face { font-family: Inter; src: url("/_fonts/inter-latin-wght-normal.woff2") format("woff2"); font-style: normal; font-weight: 100 900; font-display: swap; }';

// Las acciones de la vista en vivo (un clic por selector CSS o `text=`) más escribir en un campo (por su nombre o, si no
// es un textbox, como un buscador, por su selector) y marcar una opción.
export async function runBoardActions(page, actions = []) {
  for (const action of actions) {
    if (action.role && (action.type === "fill" || action.type === "click")) {
      const target = page.getByRole(action.role, { name: action.name, exact: true });
      if (action.type === "fill") {
        await target.fill(action.value);
        await target.blur();
      } else await target.click({ force: action.force ?? false });
      await page.waitForTimeout(150);
      continue;
    }
    if (action.type === "fill") {
      const field = action.selector ? page.locator(action.selector).first() : page.getByRole("textbox", { name: action.name });
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
  await page.mouse.move(0, 0);
  await page.addStyleTag({ content: fontFace });
  await page.evaluate(() => document.fonts.load("700 54px Inter"));
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: codeMask });
  return page;
}

/// Abre la app en su estado: datos de prueba, pasos y espera de lo que tiene que verse.
export async function openApp(context, appUrl, entry, openStream) {
  const { app } = entry;
  const disposeMocks = await installApiMocks(context, app.responses, app.userFixture, openStream);
  if (openStream) context.once("close", disposeMocks);
  // `hang`: una ruta de la API que nunca responde (el estado «cargando» o «enviando»). Con `{ path, method }`, solo ese
  // método: la ficha se lee y lo que queda colgado es el guardado.
  if (app.hang) {
    const hang = typeof app.hang === "string" ? { path: app.hang } : app.hang;
    await context.route(`**${hang.path}`, (route) => !hang.method || route.request().method() === hang.method ? new Promise(() => {}) : route.fallback());
  }
  // `now`: la hora de la app, la del tablero (una invitación que el tablero dibuja pendiente no tiene que haber vencido hoy).
  if (app.now) await context.clock.setFixedTime(new Date(app.now));
  const page = await context.newPage();
  await page.goto(new URL(app.path, appUrl).href, { waitUntil: "domcontentloaded" });
  // Un paso puede pedir `waitFor`: esperar un texto antes de hacerlo (por ejemplo, que la dirección figure disponible).
  for (const action of app.actions ?? []) {
    if (action.waitFor) await page.getByText(action.waitFor).first().waitFor();
    await runAppActions(page, [action]);
  }
  await page.locator(app.readySelector ?? "main").filter({ visible: true }).first().waitFor();
  if (app.readyHeading) await page.getByRole("heading", { name: app.readyHeading }).first().waitFor();
  // Como el test de la galería, los textos de listo se comprueban presentes: una opción de un desplegable nativo no se ve.
  if (app.readyText) await page.getByText(app.readyText, { exact: false }).first().waitFor({ state: "attached" });
  for (const text of app.readyTexts ?? []) await page.getByText(text, { exact: false }).first().waitFor({ state: "attached" });
  await page.mouse.move(0, 0);
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


export async function buildManifest(casesFile = defaultCases) {
  return JSON.parse(readFileSync(path.resolve(root, casesFile), "utf8"));
}
export function validateManifest(manifest) {
  if (manifest.version !== 1 || !/^[0-9]+[a-z]?$/.test(manifest.stage) || !Array.isArray(manifest.cases) || !Array.isArray(manifest.pending)) throw new Error("Datos de captura inválidos");
  const seen = new Set();
  for (const entry of [...manifest.cases, ...manifest.pending]) {
    if (!/^[a-z0-9-]+$/.test(entry.id) || seen.has(entry.id) || !/^[A-Za-z0-9-]+$/.test(entry.board)) throw new Error("Caso inválido o repetido");
    seen.add(entry.id);
    if (!["1440x900", "390x844"].includes(entry.viewport?.width + "x" + entry.viewport?.height)) throw new Error(entry.id + ": viewport no aprobado");
    const choices = boardChoices(path.join(canvas, entry.board + ".dc.html"));
    for (const [key, value] of Object.entries(entry.props ?? {})) if (!choices[key]?.includes(value)) throw new Error(entry.id + ": estado ajeno al lienzo");
    if (entry.app && (entry.app.captureMode !== "harness" || !entry.app.path?.startsWith("/src/test/") || !entry.app.readySelector)) throw new Error(entry.id + ": fixture visual inválido");
    if (!entry.app && !entry.reason) throw new Error(entry.id + ": pendiente sin motivo");
  }
  return manifest;
}
function option(args, name) { const i = args.indexOf(name); if (i < 0) return undefined; if (!args[i + 1] || args[i + 1].startsWith("--")) throw new Error("Falta valor de " + name); return args[i + 1]; }
export async function main(args) {
  const manifest = validateManifest(await buildManifest(option(args, "--casos")));
  const ids = option(args, "--id")?.split(","), groups = option(args, "--group")?.split(",");
  const all = [...manifest.cases, ...manifest.pending];
  for (const id of ids ?? []) if (!all.some(c => c.id === id)) throw new Error("Caso desconocido: " + id);
  for (const group of groups ?? []) if (!all.some(c => c.group === group)) throw new Error("Grupo desconocido: " + group);
  const matches = c => (!ids || ids.includes(c.id)) && (!groups || groups.includes(c.group));
  const pending = manifest.pending.filter(matches), selected = manifest.cases.filter(matches);
  if (args.includes("--dry-run") || args.includes("--manifiesto")) { console.log(selected.length + " preparados; " + pending.length + " pendientes; " + manifest.evidence); return; }
  if (pending.length) throw new Error("Selección con estados pendientes: " + pending.map(c => c.id).join(", "));
  if (!selected.length) throw new Error("Selección vacía");
  const appUrl = option(args, "--app-url") ?? manifest.issuer;
  if (new URL(appUrl).origin !== manifest.issuer) throw new Error("Origen distinto al de los casos");
  const base = path.join(root, "docs/design/capturas/etapa-" + manifest.stage);
  const target = path.resolve(root, option(args, "--out") ?? base);
  const relative = path.relative(root, target);
  if (!(target === base || target.startsWith(base + path.sep) || relative.startsWith(".local" + path.sep))) throw new Error("Salida fuera de capturas de la etapa o .local");
  let current = root;
  for (const part of relative.split(path.sep)) { current = path.join(current, part); if (existsSync(current) && lstatSync(current).isSymbolicLink()) throw new Error("Salida mediante junction"); }
  mkdirSync(target, { recursive: true });
  const server = await startCanvasServer(canvas);
  let browser;
  const captured = [];
  try {
    browser = await chromium.launch({ headless: true, args: ["--no-proxy-server", "--host-resolver-rules=MAP localtest.me 127.0.0.1", "--unsafely-treat-insecure-origin-as-secure=" + manifest.issuer], ...(option(args, "--browser-path") ? { executablePath: option(args, "--browser-path") } : { channel: "chrome" }) });
    for (const entry of selected) {
      const context = await browser.newContext({ viewport: entry.viewport, deviceScaleFactor: 1, locale: "es-AR" });
      let stream;
      const failures = [];
      context.on("page", page => page.on("pageerror", () => failures.push("Error JavaScript")));
      context.on("response", response => {
        const url = new URL(response.url()), status = response.status();
        if (url.pathname.startsWith("/api/") && status >= 400 && !entry.app.responses.some(r => r.status === status && status !== 501 && r.path === url.pathname && r.method === response.request().method() && Object.entries(r.query ?? {}).every(([key, value]) => url.searchParams.get(key) === value))) failures.push("API inesperada " + status + ": " + url.pathname);
      });
      const files = capturePaths(target, entry);
      try {
        if (entry.app.responses.some(r => r.openStream)) stream = await startAssistantOpenStream(entry.app.responses, manifest.issuer);
        const board = await openBoard(context, server.url, entry), app = await openApp(context, appUrl, entry, stream && { url: stream.url, origin: manifest.issuer });
        if (failures.length) throw new Error(entry.id + ": " + failures.join("; "));
        mkdirSync(path.dirname(files.app), { recursive: true });
        await board.screenshot({ path: files.board }); await app.screenshot({ path: files.app });
        if (failures.length) throw new Error(entry.id + ": " + failures.join("; "));
      } finally { try { await context.close(); } finally { await stream?.close(); } }
      const comparison = sideBySideFile(entry, target);
      await composeSideBySide(browser, entry, files, comparison);
      captured.push({ id: entry.id, file: path.relative(target, comparison).replaceAll(path.sep, "/") });
      console.log(entry.id);
    }
    const escape = s => String(s).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
    writeFileSync(path.join(target, "index.html"), '<!doctype html><html lang="es"><meta charset="utf-8"><title>Galería etapa ' + manifest.stage + '</title><style>body{font:16px system-ui;margin:24px;background:#faf7f2}img{max-width:100%;height:auto}figure{margin:24px 0}</style><h1>Etapa ' + manifest.stage + '</h1><p>' + escape(manifest.evidence) + '</p>' + captured.map(c => '<figure><figcaption>' + escape(c.id) + '</figcaption><img loading="lazy" src="' + escape(c.file) + '"></figure>').join("") + '</html>');
    console.log(captured.length + " casos capturados; galería: " + path.relative(root, target));
  } finally { try { await browser?.close(); } finally { await server.close(); } }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main(process.argv.slice(2));
