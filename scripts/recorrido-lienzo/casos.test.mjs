import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { adHocCase, loadCases } from "./casos.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const captures = path.join(root, "docs/design/capturas");
const lienzo = path.join(root, "docs/design/lienzo");

test("las pantallas salen de los manifiestos de capturas, con su tablero vigente y sus datos de prueba", () => {
  const cases = loadCases(captures, lienzo);
  const users = cases.find((item) => item.id === "etapa-6/usuarios-lista-escritorio");
  assert.equal(users.device, "Compu");
  assert.equal(users.board, "Usuarios");
  assert.ok(users.app.path.startsWith("/src/test/visualApp.html"));
  assert.ok(users.app.responses.length > 0);
  assert.equal(cases.find((item) => item.id === "etapa-6/usuarios-lista-movil").device, "Teléfono");
  assert.ok(cases.every((item) => existsSync(path.join(lienzo, `${item.board}.dc.html`))));
  // La 3b todavía compara contra la copia v35 y los correos no son pantallas de la app.
  assert.ok(!cases.some((item) => item.etapa === "etapa-3b"));
  assert.ok(!cases.some((item) => item.app.path.includes("/correos/")));
});

test("una pantalla nueva, sin caso todavía, se abre con su tablero y la ruta", () => {
  const item = adHocCase({ board: "Directorio", route: "/empresas", as: "visual-owner", phone: true });
  assert.equal(item.device, "Teléfono");
  assert.deepEqual(item.viewport, { width: 390, height: 844 });
  assert.equal(item.app.path, "/src/test/visualApp.html?as=visual-owner&route=%2Fempresas");
  assert.equal(item.app.userFixture, "visual-owner");
});
