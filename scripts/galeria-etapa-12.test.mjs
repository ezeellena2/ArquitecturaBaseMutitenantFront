import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { boardChoices, canvas, validateManifest } from "./capturar-etapa.mjs";
import { boardWidths, buildGallery, caseId, galleryBoards, galleryFile, galleryText, meOf } from "./galeria-etapa-12.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gallery = buildGallery();
const entries = [...gallery.cases, ...gallery.pending];

test("el JSON de la galería es el que arma el generador: nadie lo editó a mano ni quedó viejo", () => {
  assert.equal(readFileSync(path.join(root, galleryFile), "utf8").replace(/\r\n/gu, "\n"), galleryText(),
    "Volvé a escribirlo con node scripts/galeria-etapa-12.mjs.");
});

test("la galería pasa la validación de capturar-etapa: estados del lienzo, anchos aprobados y arnés visual", () => {
  assert.doesNotThrow(() => validateManifest(gallery));
  assert.equal(gallery.stage, "12");
});

test("son los quince tableros de la sección: los trece de la §10 sin FRM-Catalogo-Nuevo ni FRM-Catalogo-Tipo, y la propuesta con su teléfono", () => {
  const boards = galleryBoards.map(([board]) => board);
  assert.equal(boards.length, 15);
  assert.equal(new Set(boards).size, 15);
  for (const gone of ["FRM-Catalogo-Nuevo", "FRM-Catalogo-Tipo"]) assert.ok(!boards.includes(gone), gone);
  for (const proposal of ["FRM-Catalogo-Opciones-Propuesta", "M-FRM-Catalogo-Opciones-Propuesta"]) assert.ok(boards.includes(proposal), proposal);
  assert.deepEqual([...new Set(entries.map((entry) => entry.board))], boards);
});

test("cada estado de cada tablero está una vez por ancho, como caso o como pendiente con su motivo", () => {
  for (const [board] of galleryBoards) {
    const states = boardChoices(path.join(canvas, `${board}.dc.html`)).estado;
    for (const width of boardWidths(board)) {
      const here = entries.filter((entry) => entry.board === board && entry.viewport.width === width);
      assert.deepEqual(here.map((entry) => entry.label).sort(), [...states].sort(), `${board} a ${width}`);
    }
  }
  for (const entry of gallery.pending) assert.ok(entry.reason.length > 60 && !entry.app, entry.id);
  assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length, "Los ids no se repiten.");
});

test("a 320 va lo mismo que a 390, salvo abrir la vista previa, que a 320 está en el ⋮ de la barra", () => {
  for (const narrow of gallery.cases.filter((entry) => entry.viewport.width === 320)) {
    const phone = gallery.cases.find((entry) => entry.id === narrow.id.replace(/-320$/u, ""));
    assert.ok(phone && phone.viewport.width === 390, narrow.id);
    const opensPreview = phone.app.actions.some((action) => action.name === "Así lo ve quien lo recibe" && action.role === "button");
    if (!opensPreview) { assert.deepEqual(narrow.app, phone.app, narrow.id); continue; }
    assert.ok(narrow.app.actions.some((action) => action.type === "press" && /^Acciones de /u.test(action.name)), narrow.id);
    assert.ok(narrow.app.actions.some((action) => action.role === "menuitem" && action.name === "Así lo ve quien lo recibe"), narrow.id);
  }
});

test("cada caso tiene la sesión de la Dueña con Formularios, sus avisos de Clientes y solo rutas de la API", () => {
  for (const entry of gallery.cases) {
    const [me, untaken] = entry.app.responses;
    assert.equal(me.path, "/api/me", entry.id);
    assert.ok(me.body.features.includes("forms") && me.body.effectivePermissions.organization.includes("formcatalogs.read"), entry.id);
    assert.equal(untaken.path, "/api/organization/whatsapp/untaken", entry.id);
    for (const response of entry.app.responses) assert.match(response.path, /^\/api\//u, entry.id);
    if (entry.app.hang) assert.match(entry.app.hang.path, /^\/api\/organization\/forms\/catalogs/u, entry.id);
    assert.ok(entry.app.path.startsWith("/src/test/etapa8VisualApp.html?as=visual-owner&route=%2Forg%2Fformularios%2Fcatalogos"), entry.id);
    assert.equal(entry.app.now, "2026-11-24T14:00:00Z");
  }
  // Sin WhatsApp no se ofrece el origen de contactos; con solo «Ver catálogos», no se edita.
  assert.deepEqual(meOf({ whatsapp: false }).features, ["forms"]);
  assert.ok(!meOf({ manage: false }).effectivePermissions.organization.includes("formcatalogs.manage"));
  assert.ok(gallery.cases.some((entry) => entry.app.responses[0].body.features.length === 1));
});

test("el id de un caso es el tablero y el estado, sin acentos ni signos, y a 320 lleva «-320»", () => {
  assert.equal(caseId("FRM-Catalogo", "Nuevo: de dónde salen", 1440), "frm-catalogo-nuevo-de-donde-salen");
  assert.equal(caseId("M-FRM-Catalogo-Ordenar", "Por código, de la Z a la A", 320), "m-frm-catalogo-ordenar-por-codigo-de-la-z-a-la-a-320");
  assert.equal(caseId("FRM-Catalogo", "1.097 opciones", 1440), "frm-catalogo-1-097-opciones");
});

test("lo que la app no puede mostrar sin la etapa siguiente queda pendiente, con su motivo", () => {
  assert.deepEqual(gallery.pending.map((entry) => entry.id), ["frm-catalogo-opciones-propuesta-con-la-columna-de-un-campo"]);
  assert.match(gallery.pending[0].reason, /E13/u);
});
