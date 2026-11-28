import assert from "node:assert/strict";
import { test } from "node:test";
import { csv, tsv } from "./recorrido-usuario-forms.mjs";
import { zoneOptions } from "./recorrido-usuario-forms.mjs";
import {
  fieldSheet, fieldSheetCells, fieldSheetHeaders, fieldsOf, formsE2ECases, formsE2ESteps, formsNames, formsPhones, phoneFragments, providerRows,
  runFormsRealE2E, sheetRows, surchargeOptions, volumeRows,
} from "./test-e2e-real-forms.mjs";

test("el E2E de Catálogos tiene los cinco casos de la §15 de la E12 y los tres de «Cómo se cierra» de la E13, en su orden, y un paso por caso", () => {
  assert.deepEqual(formsE2ECases.map(([id]) => id), ["FRM-01", "FRM-02", "FRM-03", "FRM-04", "FRM-05", "FRM-06", "FRM-07", "FRM-08"]);
  const titles = formsE2ECases.map(([, title]) => title).join(" ");
  for (const text of ["A mano", "Proveedores", "Recargo por zona", "1.000 filas", "bajas", "sin diferencias", "Miembros", "persona de ejemplo",
    "Sin incluir a quien lo recibe", "Contactos", "etiqueta", "sin teléfonos", "nombre de su perfil", "10.000", "EXPLAIN"]) assert.ok(titles.includes(text), text);
  // E13, «Cómo se cierra»: los campos cargados importando y exportados sin diferencias, el CUIT en la descripción y una zona de baja.
  const fields = formsE2ECases.slice(5).map(([, title]) => title).join(" ");
  for (const text of ["CUIT", "Zona", "Plazo de pago", "importando una planilla", "exportados de nuevo sin diferencias", "En WhatsApp", "descripción",
    "teléfono al costado", "dada de baja", "guardando, importando y exportando", "el valor que tenía"]) assert.ok(fields.includes(text), text);
  const steps = formsE2ESteps({ page: {}, platformPage: {}, browser: {}, env: {}, tenantId: "t", names: formsNames("ab12"), downloads: "." });
  assert.deepEqual(Object.keys(steps), formsE2ECases.map(([id]) => id));
  for (const step of Object.values(steps)) assert.equal(typeof step, "function");
});

test("los nombres son de la corrida, los correos son de prueba y el escenario de WhatsApp entra en su tope", () => {
  const names = formsNames("ab12");
  for (const key of ["providers", "surcharge", "sheet", "volume", "members", "contacts", "role", "emptyRole", "tag", "nora", "hugo", "lucas", "zones", "fieldProviders"])
    assert.ok(names[key].endsWith(" ab12"), key);
  // El combo del campo busca «Zonas» por su nombre: ningún otro catálogo de la corrida empieza igual.
  assert.ok(Object.entries(names).every(([key, value]) => key === "zones" || !String(value).startsWith(names.zones)));
  assert.ok(names.fieldProviders.length <= 60, "El nombre de un catálogo tiene hasta 60 caracteres.");
  for (const key of ["memberA", "memberB"]) assert.match(names[key], /^e2e-frm-[a-z]+-ab12@example\.test$/u, key);
  assert.ok(names.scenario.length <= 40 && /^[A-Za-z0-9_-]+$/u.test(names.scenario));
  // El rol sin nadie no contiene al otro: elegir uno en la pieza no elige el otro.
  assert.ok(!names.emptyRole.includes(names.role) && !names.role.includes(names.emptyRole));
  assert.notDeepEqual(formsNames("cd34"), names);
  assert.throws(() => formsNames("con espacio"));
  assert.throws(() => formsNames(""));
});

test("los teléfonos son de la fixture, distintos, y ninguno puede aparecer en el catálogo", () => {
  const phones = Object.values(formsPhones);
  assert.equal(new Set(phones).size, phones.length);
  for (const phone of phones) assert.match(phone, /^\+54911345678\d{2}$/u);
  const fragments = phoneFragments({ nora: formsPhones.nora });
  assert.deepEqual(fragments, ["34567891", "3456-7891"]);
});

test("las planillas: mil filas con su código, las que faltan para las bajas y las que cambian su texto", () => {
  const all = sheetRows(1_000);
  assert.equal(all.length, 1_000);
  assert.deepEqual(all[0], ["PL-0001", "Artículo 1"]);
  assert.deepEqual(all.at(-1), ["PL-1000", "Artículo 1000"]);
  const second = sheetRows(1_000, { skip: new Set([3, 999]), changed: new Set([10]) });
  assert.equal(second.length, 998);
  assert.ok(!second.some(([code]) => code === "PL-0003" || code === "PL-0999"));
  assert.deepEqual(second.find(([code]) => code === "PL-0010"), ["PL-0010", "Artículo 10 revisado"]);
  assert.throws(() => sheetRows(10_001));
  const file = csv(["Código", "Texto"], all);
  assert.ok(file.startsWith("Código,Texto\r\nPL-0001,Artículo 1\r\n"));
  assert.ok(Buffer.byteLength(file, "utf8") < 10 * 1024 * 1024);
});

test("el volumen son 10.000 opciones con código único, como la prueba del back, y entra en un archivo", () => {
  const rows = volumeRows();
  assert.equal(rows.length, 10_000);
  assert.equal(new Set(rows.map(([code]) => code)).size, 10_000);
  assert.deepEqual(rows[9_875], ["C09876", "Opción 09876"]);
  assert.ok(Buffer.byteLength(csv(["Código", "Texto"], rows), "utf8") < 10 * 1024 * 1024);
});

test("lo que se pega y lo que se carga a mano entra en los topes del contrato", () => {
  for (const [code, text, detail] of providerRows) assert.ok(code.length <= 40 && text.length <= 30 && detail.length <= 300, code);
  assert.equal(tsv(["Código", "Texto", "Detalle"], providerRows).split("\n").length, providerRows.length + 1);
  for (const option of surchargeOptions) {
    assert.ok(option.text.length <= 30 && option.code.length <= 40);
    // Lo escrito en es-AR y lo que guarda el servidor son el mismo número.
    assert.equal(Number(option.value.replace(",", ".")), option.canonical);
  }
});

test("un caso que no existe o repetido se rechaza antes de levantar el entorno", async () => {
  await assert.rejects(runFormsRealE2E({ cases: ["FRM-09"] }), /Casos de Catálogos inválidos/u);
  await assert.rejects(runFormsRealE2E({ cases: ["FRM-01", "FRM-01"] }), /Casos de Catálogos inválidos/u);
  await assert.rejects(runFormsRealE2E({ cases: [] }), /Casos de Catálogos inválidos/u);
});

test("los casos de la E13 que usan los catálogos de FRM-06 no corren sin él ni antes que él", async () => {
  await assert.rejects(runFormsRealE2E({ cases: ["FRM-07"] }), /siguen a FRM-06/u);
  await assert.rejects(runFormsRealE2E({ cases: ["FRM-08", "FRM-06"] }), /siguen a FRM-06/u);
  await assert.rejects(runFormsRealE2E({ cases: ["FRM-01", "FRM-08"] }), /siguen a FRM-06/u);
  const steps = formsE2ESteps({ page: {}, platformPage: {}, browser: {}, env: {}, tenantId: "t", names: formsNames("ab12"), downloads: "." });
  await assert.rejects(steps["FRM-07"](), /siguen a FRM-06/u);
});

test("la planilla de los campos: una columna por campo por su nombre, una zona por su código y dos de «Patagonia», la que se da de baja", () => {
  assert.deepEqual(fieldSheetHeaders, ["Código", "Texto", "CUIT", "Zona", "Plazo de pago", "Detalle"]);
  assert.deepEqual(fieldsOf("Zonas ab12").map((field) => field.name), fieldSheetHeaders.slice(2, 5));
  const zoneTexts = zoneOptions.map((zone) => zone.text);
  for (const row of fieldSheet) {
    assert.equal(fieldSheetCells(row).length, fieldSheetHeaders.length, row.code);
    assert.ok(zoneTexts.includes(row.zoneText), row.code);
    // La celda nombra la zona por su texto o por su código, como acepta una fuente.
    assert.ok(row.zone === row.zoneText || zoneOptions.find((zone) => zone.text === row.zoneText)?.code === row.zone, row.code);
    assert.equal(row.cuit.length, 13, "El CUIT entra en el largo del campo.");
    assert.ok(row.term === "" || (Number(row.term) >= 0 && Number(row.term) <= 365), "El plazo entra en el rango del campo.");
    assert.ok(row.text.length <= 30 && row.detail.length <= 300, row.code);
  }
  assert.ok(fieldSheet.some((row) => row.zone !== row.zoneText), "Una zona va por su código.");
  assert.ok(fieldSheet.some((row) => row.term === ""), "Un plazo vacío queda sin valor.");
  assert.equal(fieldSheet.filter((row) => row.zoneText === "Patagonia").length, 2);
  assert.equal(new Set(fieldSheet.map((row) => row.cuit)).size, fieldSheet.length, "El CUIT es único.");
  assert.equal(new Set(fieldSheet.map((row) => row.code)).size, fieldSheet.length);
  const [cuit, zone, term] = fieldsOf("Zonas ab12");
  assert.deepEqual([cuit.length, cuit.unique, zone.type, zone.catalog, term.type, term.min, term.max], ["13", true, "Catalog", "Zonas ab12", "WholeNumber", "0", "365"]);
});
