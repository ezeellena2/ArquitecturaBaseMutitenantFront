import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { boardChoices, canvas, validateManifest } from "./capturar-etapa.mjs";
import { boardWidths } from "./galeria-etapa-12.mjs";
import {
  buildGallery, comboRows, fieldKey, galleryBoards, galleryFile, galleryText, importBoard, longTitle, pastedWithFields, providerItems, proveedores, twentyFields,
  zonasItems,
} from "./galeria-etapa-13.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gallery = buildGallery();
const entries = [...gallery.cases, ...gallery.pending];
const catalogs = "/api/organization/forms/catalogs";
const responseOf = (entry, method, apiPath) => entry.app.responses.find((response) => response.method === method && response.path === apiPath && !response.query);

test("el JSON de la galería es el que arma el generador: nadie lo editó a mano ni quedó viejo", () => {
  assert.equal(readFileSync(path.join(root, galleryFile), "utf8").replace(/\r\n/gu, "\n"), galleryText(),
    "Volvé a escribirlo con node scripts/galeria-etapa-13.mjs.");
});

test("la galería pasa la validación de capturar-etapa: estados del lienzo, anchos aprobados y arnés visual", () => {
  assert.doesNotThrow(() => validateManifest(gallery));
  assert.equal(gallery.stage, "13");
});

test("son los ocho tableros de la sección y el diálogo de importar al lado de FRM-Catalogo-Importar", () => {
  const boards = galleryBoards.map(([board]) => board);
  assert.deepEqual(boards, ["FRM-Catalogo-13", "M-FRM-Catalogo-13", "FRM-Catalogo-Campos", "M-FRM-Catalogo-Campos", "FRM-Catalogo-Opciones-13",
    "M-FRM-Catalogo-Opciones-13", "FRM-Catalogo-Ordenar-13", "M-FRM-Catalogo-Ordenar-13"]);
  assert.deepEqual(importBoard, ["FRM-Catalogo-Importar", "importar-13"]);
  assert.deepEqual([...new Set(entries.map((entry) => entry.board))], [...boards, importBoard[0]]);
});

test("cada estado de cada tablero de la etapa está una vez por ancho, como caso o como pendiente con su motivo", () => {
  for (const [board] of galleryBoards) {
    const states = boardChoices(path.join(canvas, `${board}.dc.html`)).estado;
    for (const width of boardWidths(board)) {
      const here = entries.filter((entry) => entry.board === board && entry.viewport.width === width);
      assert.deepEqual(here.map((entry) => entry.label).sort(), [...states].sort(), `${board} a ${width}`);
    }
  }
  for (const entry of gallery.pending) assert.ok(entry.reason.length > 60 && !entry.app, entry.id);
  assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length, "Los ids no se repiten.");
  // La app llega a todos los estados: nada queda pendiente de la etapa siguiente.
  assert.deepEqual(gallery.pending, []);
});

test("importar pega con una columna por campo, en estados del tablero de la E12, a 1440 y con su propio rótulo", () => {
  const imports = gallery.cases.filter((entry) => entry.board === importBoard[0]);
  const states = boardChoices(path.join(canvas, `${importBoard[0]}.dc.html`)).estado;
  assert.deepEqual(imports.map((entry) => entry.state), ["Pegar: la grilla vacía", "Pegar: con filas"]);
  for (const entry of imports) {
    assert.ok(states.includes(entry.state) && entry.viewport.width === 1440, entry.id);
    assert.match(entry.label, /, con las columnas de los campos$/u, entry.id);
    assert.ok(responseOf(entry, "GET", `${catalogs}/c-prov`).body.fields.length === 2, "Proveedores tiene sus dos campos.");
  }
  assert.deepEqual(pastedWithFields.split("\n")[0].split("\t"), ["Código", "Texto", "CUIT", "Zona", "Detalle"], "Las columnas de los campos van antes del detalle.");
  assert.equal(pastedWithFields.split("\n").length, 4);
});

test("a 320 va lo mismo que a 390", () => {
  for (const narrow of gallery.cases.filter((entry) => entry.viewport.width === 320)) {
    const phone = gallery.cases.find((entry) => entry.id === narrow.id.replace(/-320$/u, ""));
    assert.ok(phone && phone.viewport.width === 390, narrow.id);
    assert.deepEqual(narrow.app, phone.app, narrow.id);
  }
});

test("cada caso tiene la sesión de la Dueña con Formularios, solo rutas de la API y, en «Proveedores», las opciones de «Zonas» que nombra", () => {
  for (const entry of gallery.cases) {
    const [me, untaken] = entry.app.responses;
    assert.equal(me.path, "/api/me", entry.id);
    assert.ok(me.body.features.includes("forms") && me.body.effectivePermissions.organization.includes("formcatalogs.read"), entry.id);
    assert.equal(untaken.path, "/api/organization/whatsapp/untaken", entry.id);
    for (const response of entry.app.responses) assert.match(response.path, /^\/api\//u, entry.id);
    assert.ok(entry.app.path.startsWith("/src/test/etapa8VisualApp.html?as=visual-owner&route=%2Forg%2Fformularios%2Fcatalogos"), entry.id);
    assert.equal(entry.app.now, "2026-11-28T14:00:00Z");
    if (!entry.app.path.endsWith("%2Fc-prov")) continue;
    // La fuente se pide por identidad (también las de baja) y para elegir (las activas): sin las dos, una respuesta sin
    // simular cortaría la captura.
    const zonas = entry.app.responses.filter((response) => response.path === `${catalogs}/c-zonas/items`);
    assert.deepEqual(zonas.map((response) => response.query?.status), ["All", "Active"], entry.id);
    assert.ok(zonas[1].body.items.every((zone) => zone.isActive), entry.id);
    // Una respuesta propia del estado va antes que las de siempre: el arnés usa la primera que coincide.
    const detail = entry.app.responses.findIndex((response) => response.method === "GET" && response.path === `${catalogs}/c-prov`);
    const own = entry.app.responses.findIndex((response) => response.method === "PUT");
    if (own >= 0) assert.ok(own < detail, entry.id);
  }
});

test("solo lectura llega sin «Administrar catálogos»", () => {
  const readOnly = gallery.cases.filter((entry) => entry.state === "Solo lectura");
  assert.equal(readOnly.length, 2);
  for (const entry of readOnly) {
    assert.ok(!entry.app.responses[0].body.effectivePermissions.organization.includes("formcatalogs.manage"), entry.id);
    assert.equal(responseOf(entry, "GET", `${catalogs}/c-prov`).body.canManage, false, entry.id);
  }
});

test("los datos siguen a los tableros y al contrato: cada valor de la Zona es una opción de «Zonas», y cada lugar de «En WhatsApp», un campo guardado", () => {
  const zoneIds = new Set(zonasItems.map((zone) => zone.id));
  for (const sortFields of [false, true]) for (const row of providerItems({ sortFields })) assert.ok(zoneIds.has(row.fields["f-zona"]), row.id);
  assert.deepEqual(proveedores.presentation, { title: ["text"], description: ["field:f-cuit", "field:f-zona"] });
  for (const place of proveedores.presentation.description) assert.ok(proveedores.fields.some((field) => `field:${field.id}` === place), place);
  assert.equal(twentyFields.length, 20, "El tope de campos activos (42 y 105).");
  assert.equal(new Set(twentyFields.map((field) => field.key)).size, 20, "Las claves no se repiten.");
  for (const field of twentyFields) assert.match(field.key, /^[a-z][a-z0-9_]{0,39}$/u, field.name);
  assert.equal(fieldKey("Plazo de pago"), "plazo_de_pago");
  assert.equal(fieldKey("Condición de IVA"), "condicion_de_iva");
  assert.ok(longTitle.length > 30, "El título que no entra pasa de 30 (36).");
  assert.ok(comboRows.some((row) => row.id === "c-prov"), "El combo lista también el catálogo que se edita, apagado con su motivo.");
  assert.deepEqual(comboRows.filter((row) => /zo/iu.test(row.name)).map((row) => row.name), ["Recargo por zona", "Zonas"]);
});

test("las piezas de un campo obligatorio se eligen por lo elegido, sin depender del asterisco en su nombre", () => {
  for (const entry of gallery.cases) {
    for (const action of entry.app.actions) {
      if (action.role !== "button" || action.exact !== true) continue;
      assert.ok(!/^(Tipo|Catálogo|Zona) /u.test(action.name), `${entry.id}: «${action.name}»`);
    }
  }
});
