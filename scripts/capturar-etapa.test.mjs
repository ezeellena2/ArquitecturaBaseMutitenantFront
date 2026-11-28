import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { chromium } from "playwright";
import { at320, galleryApp, galleryCase } from "../src/test/gallery.ts";
import { appContextOptions, boardViewport, sideScroll, validateManifest, viewports } from "./capturar-etapa.mjs";

// Un lienzo de prueba con un tablero de la compu y uno del teléfono, cada uno con su `$preview`, como los del lienzo.
function canvasWith(boards) {
  const root = mkdtempSync(path.join(tmpdir(), "lienzo-"));
  for (const [name, preview] of Object.entries(boards)) {
    const props = { estado: { editor: "enum", options: ["Editar opción", "Cambiar a un texto"], default: "Editar opción" }, $preview: preview };
    writeFileSync(path.join(root, `${name}.dc.html`), `<script type="text/x-dc" data-dc-script data-props='${JSON.stringify(props)}'></script>`);
  }
  return root;
}
const app = galleryApp("visual-owner", "/org/whatsapp/bot", [], { readySelector: "[role=dialog]", readyText: "Editar opción 1", now: "2026-11-08T12:00:00Z" });
const manifest = (...cases) => ({ version: 1, stage: "12", issuer: "http://localtest.me:5192", evidence: "prueba", cases, pending: [] });

test("un caso del teléfono pasa a 320 con sus datos y pasos, y se compara con el tablero de 390", () => {
  const canvas = canvasWith({ "M-Prueba-Editar": { width: 390, height: 844 }, "Prueba-Editar": { width: 1440, height: 900 } });
  try {
    const phone = galleryCase("bot", "M-Prueba-Editar", "Cambiar a un texto", app);
    const narrow = at320(phone);
    assert.deepEqual(narrow, { ...phone, id: "m-prueba-editar-cambiar-a-un-texto-320", viewport: { width: 320, height: 844 } });
    assert.equal(validateManifest(manifest(phone, narrow), canvas).cases.length, 2);

    // A 320 la app mide 320, como la del teléfono; el tablero se fotografía en el tamaño del de 390.
    assert.deepEqual(appContextOptions(narrow.viewport), { viewport: { width: 320, height: 844 }, deviceScaleFactor: 1 });
    assert.deepEqual(boardViewport(narrow), { width: 390, height: 844 });
    assert.deepEqual(boardViewport(phone), { width: 390, height: 844 });
    const desktop = galleryCase("bot", "Prueba-Editar", "Editar opción", app);
    assert.deepEqual(boardViewport(desktop), { width: 1440, height: 900 });
    // La compu, como el lienzo desde la v166 (180): en el tamaño que se ve en pantalla, sin agrandar la app.
    assert.deepEqual(appContextOptions(desktop.viewport), { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

    // 320 no tiene tablero propio: sale solo de uno del teléfono, y ningún otro ancho se pide.
    assert.throws(() => at320(desktop), /a 320 se compara con un tablero de 390/);
    assert.throws(() => validateManifest(manifest({ ...desktop, id: "prueba-320", viewport: { ...viewports.narrow } }), canvas), /a 320 se compara con un tablero de 390/);
    assert.throws(() => validateManifest(manifest({ ...narrow, viewport: { width: 320, height: 568 } }), canvas), /viewport no aprobado/);
    assert.throws(() => validateManifest(manifest({ ...phone, viewport: { width: 375, height: 844 } }), canvas), /viewport no aprobado/);
  } finally { rmSync(canvas, { recursive: true, force: true }); }
});

// Sin respuesta preparada, la captura sirve `/api/me` y `/api/reference-data` con los mocks de src, cargados en Node: un import
// relativo sin extensión (`./platformPermissions`) los rompe con ERR_MODULE_NOT_FOUND y la galería se cae en su primer caso.
test("lo que la captura carga de src en Node se importa: los datos de referencia y las personas de prueba", async () => {
  const source = readFileSync(new URL("./capturar-etapa.mjs", import.meta.url), "utf8");
  const modules = [...source.matchAll(/import\("(\.\.\/src\/[^"]+)"\)/gu)].map((match) => match[1]);
  assert.ok(modules.includes("../src/test/mocks/handlers.ts"), "La captura sirve los datos de referencia desde handlers.ts.");
  for (const module of modules) await import(new URL(module, import.meta.url).href);
  const { referenceDataFixture } = await import("../src/test/mocks/handlers.ts");
  assert.equal(referenceDataFixture("en-US").currencies[0].name, "Argentine Peso");
});

// La base de una etapa tiene su galería (scripts/capturas/etapa-base-12.json, en docs/design/capturas/etapa-base-12/).
test("la base de una etapa o una etapa con nombre son etapas de la galería; otro nombre no", () => {
  const canvas = canvasWith({ "Prueba-Editar": { width: 1440, height: 900 } });
  try {
    const desktop = galleryCase("bot", "Prueba-Editar", "Editar opción", app);
    assert.equal(validateManifest({ ...manifest(desktop), stage: "base-12" }, canvas).stage, "base-12");
    // Una etapa sin número se nombra como su plan (2026-11-23-etapa-acciones-del-asistente).
    assert.equal(validateManifest({ ...manifest(desktop), stage: "acciones-del-asistente" }, canvas).stage, "acciones-del-asistente");
    for (const stage of ["base12", "base-", "otra-12", "12-base", "acciones", "Acciones-del-asistente", "acciones--asistente"]) {
      assert.throws(() => validateManifest({ ...manifest(desktop), stage }, canvas), /Datos de captura inválidos/);
    }
  } finally { rmSync(canvas, { recursive: true, force: true }); }
});

test("a 320 nada se desplaza de costado: ni la página, ni el contenido, ni un diálogo; sí lo que va en su propia caja", async () => {
  // DOM local con la forma del marco: con sesión, el que se desplaza es `main`, no la página. Sin red ni app.
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { ...viewports.narrow } });
    const show = (body) => page.setContent(`<!doctype html><style>body{margin:0}</style>${body}`);
    const wide = '<div style="width:400px">Hacer un pedido</div>';
    const frame = (content) => `<div style="display:flex;flex-direction:column;height:100svh"><main style="flex:1;min-height:0;overflow-y:auto">${content}</main></div>`;

    await show(frame('<p>Bot</p><div style="overflow-x:auto"><div style="width:600px">Configuración · Recorrido</div></div>'));
    assert.equal(await sideScroll(page), null);

    await show(wide);
    assert.equal(await sideScroll(page), "la página mide 400 px de ancho en 320");

    await show(frame(wide));
    assert.match(await sideScroll(page), /^el contenido mide 400 px de ancho en \d+$/);

    await show(`${frame("<p>Bot</p>")}<div role="alertdialog" aria-labelledby="titulo" style="position:fixed;left:0;bottom:0;width:100%;overflow-y:auto">
      <h2 id="titulo">¿Cambiar a «Contesta un texto»?</h2>${wide}</div>`);
    assert.match(await sideScroll(page), /^el diálogo «¿Cambiar a «Contesta un texto»\?» mide 400 px de ancho en \d+$/);
  } finally { await browser.close(); }
});
