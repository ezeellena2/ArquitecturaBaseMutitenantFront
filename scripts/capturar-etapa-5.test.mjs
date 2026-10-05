import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { boardChoices } from "./capturar-etapa-3a.mjs";
import { loadCases } from "./recorrido-lienzo/casos.mjs";
import { buildCases, canvas, output } from "./capturar-etapa-5.mjs";

const groups = ["plataforma-marco", "plataforma-organizaciones", "plataforma-organizacion", "plataforma-cuentas",
  "plataforma-cuenta", "plataforma-recuperaciones", "plataforma-legales", "plataforma-auditoria", "plataforma-configuracion", "recuperar"];

test("registra cada grupo T24 y cada caso en ambos tamaños nativos", () => {
  const cases = buildCases();
  assert.deepEqual([...new Set(cases.map((entry) => entry.group))].sort(), groups.sort());
  for (const pair of new Set(cases.map((entry) => entry.pair))) {
    assert.deepEqual(cases.filter((entry) => entry.pair === pair).map((entry) => entry.viewport), [
      { width: 1440, height: 900 }, { width: 390, height: 844 },
    ]);
  }
  for (const entry of cases) {
    assert.equal(entry.board.startsWith("M-"), entry.viewport.width === 390, entry.id);
    assert.equal(entry.boardViewport, undefined, entry.id);
    assert.ok(entry.app.path.startsWith("/"), entry.id);
  }
});

test("descubre y cubre todos los Tweaks v111 de Plataforma con los tableros actuales", () => {
  const cases = buildCases();
  for (const board of ["Organizacion", "M-Organizacion", "Cuenta-Plat", "M-Cuenta-Plat", "Recuperaciones", "Legales"]) {
    for (const [prop, choices] of Object.entries(boardChoices(path.join(canvas, `${board}.dc.html`)))) {
      for (const value of choices) assert.ok(cases.some((entry) => entry.board === board && entry.props[prop] === value), `${board}: ${prop}=${value}`);
    }
  }
});

test("Recuperar captura los pasos, código y errores reales sin WhatsApp", () => {
  const cases = buildCases().filter((entry) => entry.group === "recuperar");
  const pairs = new Set(cases.map((entry) => entry.pair));
  for (const pair of ["recuperar-paso-1", "recuperar-paso-2", "recuperar-paso-3", "recuperar-codigo",
    "recuperar-correo-anterior-invalido", "recuperar-correo-nuevo-invalido", "recuperar-codigo-incompleto",
    "recuperar-enlace-persona", "recuperar-enlace-empresa"]) assert.ok(pairs.has(pair), pair);
  for (const entry of cases.filter((entry) => entry.board.endsWith("Recuperar"))) {
    assert.equal(entry.props.whatsapp, "Sin WhatsApp (hasta la Etapa 8)", entry.id);
  }
  for (const entry of cases.filter((entry) => entry.pair === "recuperar-codigo")) {
    assert.deepEqual(entry.boardActions, [
      { type: "fill", role: "textbox", name: "Correo electrónico nuevo", value: "lucia.fer@gmail.com" },
      { type: "click", role: "button", name: "Enviar código" },
    ]);
    assert.equal(entry.boardReference.kind, "drawn");
  }
});

test("mantiene 50 filas y 409 como casos futuros con referencia real y limitación explícita", () => {
  const cases = buildCases();
  for (const pair of ["organizaciones-50-filas", "organizaciones-409", "configuracion-409"]) {
    const entries = cases.filter((entry) => entry.pair === pair);
    assert.equal(entries.length, 2, pair);
    for (const entry of entries) {
      assert.equal(entry.boardReference.kind, "base");
      assert.ok(entry.boardReference.note.length > 20);
      assert.ok(entry.app.scenario.length > 0);
    }
  }
});

test("una referencia base móvil no finge errores, confirmaciones ni pestañas no dibujadas", () => {
  const cases = buildCases();
  const mobile = cases.find((entry) => entry.id === "organizacion-pestana-modulos-movil");
  assert.ok(mobile);
  assert.equal(mobile.board, "M-Organizacion");
  assert.deepEqual(mobile.props, { estado: "Historial" });
  assert.equal(mobile.boardReference.kind, "base");
  assert.deepEqual(mobile.boardActions, []);
});

test("las variantes de dueño, página y dominio se comprueban en la pestaña donde se ven", () => {
  for (const entry of buildCases().filter((entry) => entry.board === "Organizacion")) {
    for (const [prop, tab] of [["duenos", "Dueños"], ["pagina", "Página pública"], ["dominio", "Dominio verificado"]]) {
      if (entry.props[prop]) {
        assert.equal(entry.props.pestana, tab, entry.id);
        assert.ok(entry.boardReadyText || entry.boardReadySelector, entry.id);
      }
    }
  }
});

test("invitaciones y acciones de operador verifican el estado visible sin mezclar pestañas de persona", () => {
  for (const entry of buildCases().filter((entry) => entry.pair.startsWith("cuenta-tipo-") && entry.props.cuenta !== "Persona")) {
    assert.equal(entry.props.pestana, undefined, entry.id);
    if (entry.pair.endsWith("invitacion-de-operador-pendiente")) assert.equal(entry.boardReadyText, "Invitación pendiente", entry.id);
    if (entry.pair.endsWith("invitacion-de-operador-vencida")) assert.equal(entry.boardReadyText, "Invitación vencida", entry.id);
    if (entry.pair.endsWith("operador-acciones")) assert.equal(entry.boardReadySelector, '[role="menu"]', entry.id);
  }
});

test("los tres pasos de Recuperar comprueban su título visible antes de capturar", () => {
  const cases = buildCases();
  for (const [step, text] of [[1, "Recuperar mi cuenta"], [2, "¿Dónde te escribimos?"], [3, "Recibimos tu pedido"]]) {
    for (const entry of cases.filter((entry) => entry.pair === `recuperar-paso-${step}`)) assert.equal(entry.boardReadyText, text, entry.id);
  }
});

test("Más usa su ruta móvil futura y conserva la referencia Administración desktop", () => {
  const cases = buildCases();
  assert.equal(cases.find((entry) => entry.id === "marco-mas-movil").app.path, "/plataforma/mas");
  assert.equal(cases.find((entry) => entry.id === "marco-mas-escritorio").app.path, "/plataforma/configuracion");
});

test("el manifest escrito es consumible por el recorrido vivo con el id exacto del plan", () => {
  // Cuando existe, también se verifica el archivo generado; el catálogo siempre se valida en memoria.
  const cases = buildCases();
  assert.ok(cases.some((entry) => entry.id === "recuperar-paso-1-escritorio"));
  const capturesDir = path.dirname(output);
  const manifest = path.join(output, "manifest.json");
  try { readFileSync(manifest, "utf8"); } catch (error) { if (error.code === "ENOENT") return; throw error; }
  const loaded = loadCases(capturesDir, canvas).find((entry) => entry.id === "etapa-5/recuperar-paso-1-escritorio");
  assert.ok(loaded);
  assert.equal(loaded.app.path, "/recuperar");
});
