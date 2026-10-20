import assert from "node:assert/strict";
import { test } from "node:test";
import { localApiUrl, requireSyntheticEmail, viewportOf, syntheticEmail, withFirstConsultationNotice, withSuccessToastClearance } from "./e2e-completo-soporte.mjs";

test("la espera de una notificación de éxito quita el hover, no la borra y retira el handler", async () => {
  const calls = []; let handler;
  const toast = { first: () => toast, waitFor: async ({ state }) => calls.push(state) };
  const page = { locator: () => toast, mouse: { move: async (x, y) => calls.push([x, y]) },
    addLocatorHandler: async (_target, callback) => { handler = callback; },
    removeLocatorHandler: async () => calls.push("retirar") };
  const result = await withSuccessToastClearance(page, async () => { await handler(); return "segunda acción"; });
  assert.equal(result, "segunda acción"); assert.deepEqual(calls, [[0, 0], "hidden", "retirar"]);
});

test("el aviso que llega durante Salir se acepta por UI y su handler se retira aun si falla el clic", async () => {
  const calls = []; let handle;
  const notice = { getByRole: () => ({ click: async () => calls.push("aceptar") }), waitFor: async () => calls.push("oculto") };
  const page = { getByRole: () => notice,
    addLocatorHandler: async (target, callback) => { assert.equal(target, notice); handle = callback; calls.push("registrar"); },
    removeLocatorHandler: async (target) => { assert.equal(target, notice); calls.push("retirar"); } };
  const failure = new Error("Otro obstáculo del menú");
  await assert.rejects(withFirstConsultationNotice(page, async () => { calls.push("clic"); await handle(); throw failure; }), (error) => error === failure);
  assert.deepEqual(calls, ["registrar", "clic", "aceptar", "oculto", "retirar"]);
});

for (const [name, actionFails, removalFails] of [
  ["termina", false, false],
  ["falla", true, false],
  ["falla y también falla retirar el handler", true, true],
]) {
  test(`el aviso que falla después de que la acción ${name} se espera y conserva sus causas`, async () => {
    const clicked = Promise.withResolvers(); const removed = Promise.withResolvers();
    const calls = []; let handler; let callback;
    const actionError = new Error("Falló la navegación original");
    const noticeError = new Error("Entendido dejó de ser estable");
    const removalError = new Error("No se pudo retirar el handler");
    const notice = { getByRole: () => ({ click: () => { calls.push("aceptar"); return clicked.promise; } }),
      waitFor: async () => calls.push("oculto") };
    const page = { getByRole: () => notice,
      addLocatorHandler: async (_target, value) => { handler = value; },
      removeLocatorHandler: async () => { calls.push("retirar"); removed.resolve(); if (removalFails) throw removalError; } };
    const operation = withFirstConsultationNotice(page, async () => {
      callback = handler(); void callback.catch(() => {});
      calls.push("acción finalizada");
      if (actionFails) throw actionError;
      return "navegación completa";
    });
    const rejected = assert.rejects(operation, (error) => {
      if (!actionFails) return error === noticeError;
      assert.ok(error instanceof AggregateError);
      assert.equal(error.cause, actionError);
      assert.deepEqual(error.errors, [actionError, noticeError, ...(removalFails ? [removalError] : [])]);
      assert.match(error.message, /Falló la navegación original/u);
      assert.match(error.message, /Entendido dejó de ser estable/u);
      return true;
    });
    void rejected.catch(() => {});
    await removed.promise;
    clicked.reject(noticeError);
    await rejected;
    await assert.doesNotReject(callback, "El evento de Playwright no debe recibir una promesa rechazada.");
    assert.deepEqual(calls, ["aceptar", "acción finalizada", "retirar"]);
  });
}

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
