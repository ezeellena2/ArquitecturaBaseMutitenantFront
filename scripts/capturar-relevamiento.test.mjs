import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { chromium } from "playwright";
import { startCanvasServer, validateManifest } from "./capturar-etapa-3a.mjs";
import { buildCases, canvas, mergeManifest, runBoardActions } from "./capturar-relevamiento.mjs";

test("incluye los trece pares aprobados de Recuperar v111 para comparar la app de T19", () => {
  const cases = buildCases().filter((entry) => entry.group === "recuperar");
  assert.equal(cases.length, 26);
  assert.ok(cases.every((entry) => entry.state && entry.app.captureMode === "harness"));
  assert.ok(cases.some((entry) => entry.id === "recuperar-paso-3-movil"));
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
  for (const pair of ["landing", "ingreso-persona-correo", "registro-empresa-lista", "invitacion-sin-cuenta", "cuenta", "roles-lista", "usuarios-lista", "empresas-lista", "configuracion-verificada", "pagina-publica-publicada", "auditoria-lista"]) {
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
