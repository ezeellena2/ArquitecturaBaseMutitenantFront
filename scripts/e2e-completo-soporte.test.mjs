import assert from "node:assert/strict";
import { test } from "node:test";
import { localApiUrl, requireSyntheticEmail, viewportOf, syntheticEmail } from "./e2e-completo-soporte.mjs";

test("los buzones generados conservan un local-part válido aun con una etiqueta larga", () => {
  const first = syntheticEmail("cerrado-consumer");
  const second = syntheticEmail("cerrado-consumer");
  requireSyntheticEmail(first);
  assert.ok(first.split("@")[0].length <= 64);
  assert.notEqual(first, second);
  assert.throws(() => syntheticEmail("usuario@gmail.com"));
});

test("el control HTTP no permite mandar el bearer fuera de la API aislada", () => {
  const base = new URL("https://localtest.me:5174");
  assert.equal(localApiUrl("/api/me", base), "https://localtest.me:5174/api/me");
  for (const route of ["https://example.com/api/me", "//otro.localtest.me:5174/api/me", "/connect/token", "/api/../login"]) {
    assert.throws(() => localApiUrl(route, base));
  }
});

test("el ingreso rechaza datos reales y admite sólo buzones sintéticos de prueba", () => {
  requireSyntheticEmail("e2e-a3-operator@example.test");
  requireSyntheticEmail("e2e-managed@corp.example.test");
  for (const email of ["cuenta@gmail.com", "usuario@example.test.evil.com", "\n@example.test", "sin-arroba"]) assert.throws(() => requireSyntheticEmail(email));
  assert.deepEqual(viewportOf(390), { width: 390, height: 844 });
});
