import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { startCanvasServer, validateManifest } from "./capturar-etapa-3a.mjs";
import { buildCases, canvas, mergeManifest, openApp, runBoardActions } from "./capturar-relevamiento.mjs";

test("Cuenta y sus diálogos conservan las dos partes de la preparación aprobada v112", () => {
  const entries = buildCases().filter((entry) => entry.app.path?.includes("route=%2Fcuenta") && entry.app.responses?.some((response) => response.method === "GET" && response.path === "/api/me" && response.body?.displayName === "Lucía Fernández"));
  assert.ok(entries.length > 0);
  for (const entry of entries) {
    const body = entry.app.responses.find((response) => response.method === "GET" && response.path === "/api/me").body;
    assert.equal(body.firstName, "Lucía", entry.id);
    assert.equal(body.lastName, "Fernández", entry.id);
  }
});

test("el operador privado conserva ambas puertas, ambos tamaños y el error posterior al código", () => {
  const entries = buildCases().filter((entry) => entry.pair.startsWith("ingreso-operador-"));
  assert.equal(entries.length, 4);
  for (const entry of entries) {
    const business = entry.pair === "ingreso-operador-empresa";
    assert.equal(entry.board, entry.viewport.width === 390 ? "M-Ingreso" : "Ingreso");
    assert.deepEqual(entry.props, { estado: "Operador: la cuenta entra por Plataforma", puerta: business ? "Empresa" : "Persona", cuenta: "Martín (operador de la plataforma)" });
    assert.equal(entry.app.path, `${business ? "/login/empresa" : "/login"}?returnUrl=%2Fconnect%2Fauthorize`);
    assert.equal(entry.app.responses.find((response) => response.path.endsWith("/verify")).body.code, "Tenancy.Access.PlatformOnly");
    assert.equal(entry.app.actions.at(-1).name, "Verificar");
  }
});

test("Cerrar espera la acción exacta de la ficha y no toca Cerrar Gestión durante la carga", { timeout: 15_000 }, async () => {
  const server = createServer((_request, response) => response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(`
    <main><button onclick="document.querySelector('main').textContent = 'Se cerró Gestión por error'">Cerrar Gestión</button></main>
    <script>setTimeout(() => {
      const button = document.createElement('button'); button.textContent = 'Cerrar';
      button.onclick = () => document.querySelector('main').innerHTML = '<div role="dialog"><h2>¿Cerrar Grupo Delta?</h2></div>';
      document.querySelector('main').append(button);
    }, 150);</script>`));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const context = await browser.newContext();
    context.setDefaultTimeout(2_000);
    const app = await openApp(context, `http://127.0.0.1:${server.address().port}`, { app: {
      path: "/", responses: [], userFixture: "visual-operator", actions: [{ type: "click", role: "button", name: "Cerrar", exact: true }],
      readySelector: '[role="dialog"]', readyHeading: "¿Cerrar Grupo Delta?",
    } });
    assert.equal(await app.getByRole("dialog").count(), 1);
  } finally {
    await browser.close();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("incluye los trece pares de Recuperar y los dos errores aprobados v112", () => {
  const cases = buildCases().filter((entry) => entry.group === "recuperar");
  assert.equal(cases.length, 30);
  assert.ok(cases.every((entry) => entry.state && entry.app.captureMode === "harness"));
  assert.ok(cases.some((entry) => entry.id === "recuperar-paso-3-movil"));
});

test("A2 incluye seis pares con campo y código backend, en ambos tamaños", () => {
  const pairs = ["ingreso-sin-cuenta-persona", "ingreso-sin-cuenta-empresa", "registro-correo-con-cuenta", "recuperar-anterior-sin-cuenta", "recuperar-nuevo-con-cuenta", "agregar-correo-otra-cuenta"];
  const entries = buildCases().filter((entry) => pairs.includes(entry.pair));
  assert.equal(entries.length, 12);
  for (const pair of pairs) {
    const cases = entries.filter((entry) => entry.pair === pair);
    assert.deepEqual(cases.map((entry) => entry.viewport.width), [1440, 390]);
    for (const entry of cases) {
      const rejected = entry.app.responses.find((response) => response.status === 400);
      assert.ok(rejected?.body.code, entry.id);
      assert.ok(rejected?.body.errors, entry.id);
      assert.equal(entry.app.readyText, rejected.body.detail);
      assert.equal(entry.app.actions.at(-1).type, "click");
    }
  }
});

test("A2 abre Agregar correo con el rótulo actual de escritorio sin WhatsApp", () => {
  const entry = buildCases().find((item) => item.id === "agregar-correo-otra-cuenta-escritorio");
  assert.equal(entry.app.actions[0].name, "Agregar correo");
});

test("los rótulos de Más real de T20c corresponden al tamaño móvil, sin heredar el marco desktop", () => {
  const cases = buildCases().filter((entry) => entry.group === "plataforma-marco");
  const more = cases.filter((entry) => entry.viewport.width === 390 && entry.app.readyHeading === "Más");
  assert.equal(more.length, 3);
  for (const entry of more) assert.match(entry.state, /Más real T20c/, entry.id);
  assert.ok(cases.filter((entry) => entry.viewport.width === 1440).every((entry) => !entry.state.includes("Más real")));
});

test("el catálogo compara lista y ficha completas T21b–d y Cuentas T22a–b", () => {
  const cases = buildCases();
  const organizations = cases.filter((entry) => entry.group === "plataforma-organizaciones");
  assert.equal(organizations.length, 28);
  assert.ok(organizations.every((entry) => entry.app.captureMode === "harness" && entry.state.includes("lista real T21b")));
  const detail = cases.filter((entry) => entry.group === "plataforma-organizacion" && entry.state.includes("ficha real T21c"));
  assert.equal(detail.length, 32);
  assert.ok(detail.every((entry) => entry.app.captureMode === "harness" && entry.app.now === "2026-09-27T20:35:00Z"));
  const administration = cases.filter((entry) => entry.group === "plataforma-organizacion" && entry.state.includes("administración real T21d"));
  assert.equal(administration.length, 30);
  assert.ok(administration.every((entry) => entry.app.captureMode === "harness" && entry.app.now === "2026-09-27T20:35:00Z"));
  const accounts = cases.filter((entry) => entry.group === "plataforma-cuentas");
  assert.equal(accounts.length, 36);
  assert.ok(accounts.every((entry) => entry.app.captureMode === "harness" && entry.state.includes("lista real T22a")));
  const account = cases.filter((entry) => entry.group === "plataforma-cuenta");
  assert.equal(account.length, 32);
  assert.ok(account.every((entry) => entry.app.captureMode === "harness" && entry.state.includes("ficha real T22b")));
  const recoveries = cases.filter((entry) => entry.group === "plataforma-recuperaciones");
  assert.equal(recoveries.length, 16);
  assert.ok(recoveries.every((entry) => entry.app.captureMode === "harness" && entry.state.includes("lista real T23a")));
  const legal = cases.filter((entry) => entry.group === "plataforma-legales");
  assert.equal(legal.length, 10);
  assert.ok(legal.every((entry) => entry.app.captureMode === "harness" && entry.state.includes("Legales real T23b")));
  const source = JSON.parse(readFileSync(path.join(canvas, "../capturas/etapa-5/manifest.json"), "utf8")).cases;
  const pending = new Set(source.filter((entry) => entry.group.startsWith("plataforma-") && entry.app.captureMode !== "harness").map((entry) => `${entry.group}/${entry.id}`));
  assert.ok(!cases.some((entry) => pending.has(`${entry.group}/${entry.id}`)));
});

test("el relevamiento ejecuta las acciones por rol del tablero de Recuperar v111", async () => {
  const server = await startCanvasServer(canvas);
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const width of [1440, 390]) {
      const entry = buildCases().find((item) => item.pair === "recuperar-codigo" && item.viewport.width === width);
      const page = await browser.newPage({ viewport: entry.viewport });
      page.setDefaultTimeout(2000);
      // El comportamiento del tablero no depende de la descarga de una fuente externa.
      await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
      await page.route("https://fonts.gstatic.com/**", (route) => route.abort());
      await page.goto(`${server.url}/${entry.board}.dc.html`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => Boolean(window.__dcRootName?.()));
      await page.evaluate((props) => window.__dcSetProps(window.__dcRootName(), props), entry.props);
      await runBoardActions(page, entry.boardActions);
      assert.equal(await page.getByRole("heading", { name: "Revisá tu correo", exact: true }).count(), 1);
      await page.close();
    }
  } finally {
    await browser?.close();
    await server.close();
  }
});

test("T23c distingue Auditoría de organización y Plataforma sin cambiar los ids de la etapa", () => {
  const cases = buildCases();
  for (const [group, prefix, board] of [["auditoria", "auditoria-organizacion", "Auditoria-Org"], ["plataforma-auditoria", "auditoria", "Auditoria-Plat"]]) {
    for (const kind of ["lista", "detalle"]) {
      const entry = cases.find((item) => item.id === `${prefix}-${kind}-escritorio`);
      assert.equal(entry?.group, group);
      assert.equal(entry?.board, board);
    }
  }
});

test("el relevamiento tiene cada estado a 1440 y a 390, contra tableros vigentes y con sus datos de prueba", () => {
  const cases = buildCases();
  const file = path.join(mkdtempSync(path.join(os.tmpdir(), "relevamiento-")), "manifest.json");
  writeFileSync(file, JSON.stringify({ version: 1, cases }));
  // El mismo control que los manifiestos de las etapas: ids únicos, los dos tamaños de cada par, tableros y estados que existen.
  assert.equal(validateManifest(file, canvas).length, cases.length);

  const archived = new Set(Object.entries(JSON.parse(readFileSync(path.join(canvas, "canvas.json"), "utf8")).boards)
    .filter(([, board]) => board.page === "archivo").map(([name]) => name.replace(/\.dc\.html$/, "")));
  assert.deepEqual(cases.filter((entry) => archived.has(entry.board)).map((entry) => entry.board), [],
    "ningún caso se compara con un tablero del Archivo (descartado)");
  for (const entry of cases) {
    assert.ok(entry.state, `${entry.id}: dice qué estado es`);
    assert.ok(entry.group && entry.pair, `${entry.id}: tiene grupo y par`);
    // El tablero del teléfono es un `M-*` o una portada móvil; el de la compu, no.
    if (entry.viewport.width === 390) assert.match(entry.board, /^(M-|Landing-Movil$|Configuracion-(Dominio|Verificar|Quitar)$)/, `${entry.id}: tablero de teléfono`);
    else assert.doesNotMatch(entry.board, /^M-/, `${entry.id}: tablero de compu`);
  }
  const pairs = new Set(cases.map((entry) => entry.pair));
  assert.equal(cases.length, pairs.size * 2);
  for (const pair of ["landing", "ingreso-persona-correo", "registro-empresa-lista", "invitacion-sin-cuenta", "cuenta", "roles-lista", "usuarios-lista", "empresas-lista", "configuracion-verificada", "pagina-publica-publicada", "auditoria-organizacion-lista"]) {
    assert.ok(pairs.has(pair), `falta el par ${pair}`);
  }
});

// Los manifiestos de las etapas son fotos con el contrato de entonces: un guardado respondía 204. Desde 6d-3b responde
// 200 con la versión nueva, y la app la toma como base; con un 204, «Guardamos la configuración.» no sale nunca.
test("los guardados simulados responden como el back de hoy: 200 con la versión nueva, nunca 204", () => {
  const stale = buildCases().flatMap((entry) => (entry.app?.responses ?? [])
    .filter((item) => item.method === "PUT" && item.status < 400 && typeof item.body?.version !== "number")
    .map((item) => `${entry.id}: ${item.method} ${item.path} ${item.status}`));
  assert.deepEqual(stale, []);
});

// El relevamiento final encontró tableros en otro estado que la app: el inicio personal sin aviso se comparaba con
// «Con el aviso» (el valor por defecto de Inicio-Personal), «nada para resolver» del teléfono con «Con pendientes», y
// varios estados que el lienzo dibuja desde v106 y v107 (el dominio pendiente, los cambios sin guardar, el 409 de la
// Página pública, el error de «Agregar dominio», la vista previa y la pestaña Roles del teléfono) con su estado de siempre.
test("cada estado se compara con ese estado del tablero, si el tablero lo dibuja", () => {
  const cases = new Map(buildCases().map((entry) => [entry.id, entry]));
  const expected = {
    "inicio-personal-escritorio": { estado: "Sin el aviso" },
    "inicio-personal-movil": { estado: "Sin el aviso" },
    "perfiles-personal-escritorio": { estado: "Sin el aviso" },
    "inicio-org-sin-pendientes-escritorio": { pendientes: "Nada para resolver" },
    "inicio-org-sin-pendientes-movil": { pendientes: "Nada para resolver" },
    "empresa-roles-movil": { estado: "Roles" },
    "configuracion-pendiente-movil": { estado: "Dominio pendiente" },
    "configuracion-cambios-sin-guardar-movil": { estado: "Cambios sin guardar" },
    "configuracion-agregar-dominio-vacio-escritorio": { estado: "Sin dominio: error" },
    "configuracion-agregar-dominio-vacio-movil": { estado: "Sin dominio: error" },
    "pagina-publica-borrador-movil": { estado: "Borrador" },
    "pagina-publica-bloqueada-movil": { estado: "Despublicada por la plataforma" },
    "pagina-publica-cambios-sin-guardar-movil": { estado: "Cambios sin guardar" },
    "pagina-publica-error-al-guardar-escritorio": { estado: "Publicada: error al guardar" },
    "pagina-publica-error-al-guardar-movil": { estado: "Error al guardar" },
    "pagina-publica-vista-previa-escritorio": { estado: "Borrador: vista previa" },
    "pagina-publica-vista-previa-movil": { estado: "Borrador: vista previa" },
    // Tanda 6d-4b (lienzo v108): la ficha de Empresa de su Administrador, la hoja de una invitación, «Quitar dominio» con
    // 10, 1 y 0 correos y el detalle de Auditoría en el teléfono.
    "empresa-administrador-invitaciones-escritorio": { pestana: "Miembros", quien: "Administra solo la empresa" },
    "empresa-administrador-invitaciones-movil": { estado: "Administra solo la empresa" },
    "empresa-invitacion-acciones-escritorio": { pestana: "Miembros", quien: "Administra la organización" },
    "empresa-invitacion-acciones-movil": { estado: "Invitación: acciones" },
    "empresa-administrador-agregar-miembro-escritorio": { pestana: "Miembros", quien: "Administra solo la empresa" },
    "configuracion-quitar-dominio-10-escritorio": { estado: "10 correos administrados" },
    "configuracion-quitar-dominio-10-movil": { estado: "10 correos administrados" },
    "configuracion-quitar-dominio-1-escritorio": { estado: "1 correo administrado" },
    "configuracion-quitar-dominio-1-movil": { estado: "1 correo administrado" },
    "configuracion-quitar-dominio-0-escritorio": { estado: "Ningún correo administrado" },
    "configuracion-quitar-dominio-0-movil": { estado: "Ningún correo administrado" },
    "auditoria-detalle-telefono-movil": { estado: "Detalle de un cambio" },
    "rol-dueno-casillas-fijas-movil": { estado: "Ver el rol Dueño" },
    "pagina-publica-vista-previa-hoja-movil": { estado: "Borrador: vista previa" },
  };
  for (const [id, props] of Object.entries(expected)) assert.deepEqual(cases.get(id)?.props, props, id);
  assert.equal(cases.get("pagina-publica-error-al-guardar-escritorio")?.board, "Pagina-Org");
  assert.equal(cases.get("configuracion-quitar-dominio-1-movil")?.board, "M-Configuracion-Quitar");
  assert.equal(cases.get("auditoria-detalle-telefono-movil")?.board, "M-Auditoria-Org");
  // La invitación de Sofía vence el 02/10: la app se fotografía con la hora del tablero, cuando todavía no venció.
  assert.equal(cases.get("empresa-invitacion-acciones-movil")?.app.now, "2026-10-01T12:00:00Z");
  // «Agregar miembro» pide los candidatos de la empresa (decisión 96), no Usuarios.
  for (const id of ["empresa-agregar-miembro-escritorio", "empresa-administrador-agregar-miembro-movil"]) {
    const paths = cases.get(id)?.app.responses.map((item) => item.path) ?? [];
    assert.ok(paths.includes("/api/companies/company-1/candidates/paged"), `${id}: candidatos`);
    assert.ok(!paths.includes("/api/users/paged"), `${id}: sin Usuarios`);
  }
});

test("con --out, el manifest de la tanda suma los casos de cada corrida en el orden del catálogo, sin repetirlos", () => {
  const catalogCases = buildCases();
  const folder = mkdtempSync(path.join(os.tmpdir(), "relevamiento-tanda-"));
  const pair = (name) => catalogCases.filter((entry) => entry.pair === name);
  mergeManifest(folder, pair("usuarios-lista"), catalogCases);
  const cases = mergeManifest(folder, [...pair("cuenta"), ...pair("usuarios-lista")], catalogCases);
  assert.deepEqual(cases.map((entry) => entry.id), ["cuenta-escritorio", "cuenta-movil", "usuarios-lista-escritorio", "usuarios-lista-movil"]);
  assert.equal(JSON.parse(readFileSync(path.join(folder, "manifest.json"), "utf8")).version, 1);
});
