import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { validateManifest } from "./capturar-etapa-3a.mjs";
import { buildCases, canvas, mergeManifest } from "./capturar-relevamiento.mjs";

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

test("con --out, el manifest de la tanda suma los casos de cada corrida en el orden del catálogo, sin repetirlos", () => {
  const catalogCases = buildCases();
  const folder = mkdtempSync(path.join(os.tmpdir(), "relevamiento-tanda-"));
  const pair = (name) => catalogCases.filter((entry) => entry.pair === name);
  mergeManifest(folder, pair("usuarios-lista"), catalogCases);
  const cases = mergeManifest(folder, [...pair("cuenta"), ...pair("usuarios-lista")], catalogCases);
  assert.deepEqual(cases.map((entry) => entry.id), ["cuenta-escritorio", "cuenta-movil", "usuarios-lista-escritorio", "usuarios-lista-movil"]);
  assert.equal(JSON.parse(readFileSync(path.join(folder, "manifest.json"), "utf8")).version, 1);
});
