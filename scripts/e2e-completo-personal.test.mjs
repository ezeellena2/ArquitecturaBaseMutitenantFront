import assert from "node:assert/strict";
import test from "node:test";
import { assertProblemResponse, assertViewport, openExistingPersonalAccount, solePersonalMethod, withOffline } from "./e2e-completo-personal.mjs";
import * as personal from "./e2e-completo-personal.mjs";

test("cada ruta protegida abre una pestaña propia y espera una vista terminal antes de la siguiente", async () => {
  const calls = [];
  const firstWaiting = Promise.withResolvers();
  const firstView = Promise.withResolvers();
  const pages = ["organización", "plataforma"].map((name) => ({
    name,
    goto: async (url) => calls.push([name, "goto", new URL(url).pathname]),
    getByRole: (role, { name: title }) => ({
      filter: () => ({ first: () => ({ waitFor: async () => {
        assert.ok(title.test("Tu cuenta no está en ninguna empresa todavía"), "El rechazo puede terminar en el callback OIDC.");
        assert.ok(!title.test("Iniciando sesión…"), "Una vista de transición no completa el paso.");
        assert.ok(!title.test("No pudimos iniciar tu sesión"), "Un error OIDC no certifica el rechazo esperado.");
        if (name === "organización") { firstWaiting.resolve(); await firstView.promise; }
        calls.push([name, "vista terminal"]);
      } }) }),
      count: async () => 0,
    }),
    evaluate: async () => ({ width: 390, document: 390, body: 390 }),
  }));
  const h = { base: new URL("https://localtest.me:7433"), newPage: async () => {
    if (calls.some((entry) => entry[0] === "organización")) assert.ok(calls.some((entry) => entry[0] === "organización" && entry[1] === "vista terminal"));
    return pages.shift();
  } };
  let target;
  const visit = (async () => {
    for (const route of ["/org/usuarios", "/plataforma/cuentas"]) {
      const page = await personal.openPersonalProtectedRoute(h, route, (page) => { target = page; calls.push([page.name, "captura"]); });
      assert.equal(target, page, "La captura debe apuntar a la pestaña que se está comprobando.");
    }
  })();
  await firstWaiting.promise;
  assert.deepEqual(calls, [["organización", "captura"], ["organización", "goto", "/org/usuarios"]]);
  assert.equal(target.name, "organización", "La segunda ruta no debe empezar mientras la primera sigue redirigiendo.");
  firstView.resolve();
  await visit;
  assert.equal(target.name, "plataforma");
  assert.deepEqual(calls, [
    ["organización", "captura"], ["organización", "goto", "/org/usuarios"], ["organización", "vista terminal"],
    ["plataforma", "captura"], ["plataforma", "goto", "/plataforma/cuentas"], ["plataforma", "vista terminal"],
  ]);
});

test("la captura conserva la pestaña protegida aunque falle su navegación", async () => {
  const failure = new Error("navegación incompleta");
  const deep = { goto: async () => { throw failure; } };
  let target = { name: "Mi cuenta" };
  await assert.rejects(personal.openPersonalProtectedRoute({ base: new URL("https://localtest.me:7433"), newPage: async () => deep },
    "/plataforma/cuentas", (page) => { target = page; }), (error) => error === failure);
  assert.equal(target, deep);
});

test("la salida de Cuenta usa la navegación visible y su destino real por ancho", () => {
  for (const [width, name, pathname] of [[390, "Volver a Más", "/mas"], [1440, "Inicio", "/"]]) {
    const locator = { filter: (options) => { assert.deepEqual(options, { visible: true }); return { first: () => locator }; } };
    const page = { getByRole: (role, options) => { assert.equal(role, "link"); assert.deepEqual(options, { name, exact: true }); return locator; } };
    const navigation = personal.personalLeaveNavigation(page, width);
    assert.equal(navigation.control, locator);
    assert.equal(navigation.pathname, pathname);
  }
  const expected = personal.personalDefinitions.find((item) => item.id === "NUEVO-PER-13").expected;
  assert.match(expected, /navegación visible/u);
  assert.match(expected, /Más/u);
  assert.match(expected, /Inicio/u);
});

test("la prueba del último método no acepta una fixture vacía, adicional, pendiente o administrada", () => {
  const method = { id: "method", isVerified: true, canRemove: false, managedByTenantId: null };
  assert.equal(solePersonalMethod([method]), method);
  for (const methods of [[], [method, method], [{ ...method, isVerified: false }], [{ ...method, managedByTenantId: "org" }], [{ ...method, canRemove: true }]]) assert.throws(() => solePersonalMethod(methods));
});

test("la desconexión se restaura aunque falle el paso o su captura", async () => {
  const transitions = [];
  const context = { setOffline: async (offline) => transitions.push(offline) };
  await assert.rejects(withOffline(context, async () => { throw new Error("falló el paso"); }), /falló el paso/);
  assert.deepEqual(transitions, [true, false]);
});

test("el modo sin red se conserva hasta terminar el registro del paso", async () => {
  const transitions = [];
  const context = { setOffline: async (offline) => transitions.push(offline) };
  assert.equal(await withOffline(context, async () => {
    assert.deepEqual(transitions, [true]);
    return "captura terminada";
  }), "captura terminada");
  assert.deepEqual(transitions, [true, false]);
});

test("un rechazo sólo cuenta con status, código y traceId del contrato", async () => {
  const response = (status, body) => ({ status: () => status, json: async () => body });
  await assertProblemResponse(response(403, { code: "Http.Forbidden", traceId: "sintetico" }), 403, "Http.Forbidden");
  await assert.rejects(assertProblemResponse(response(200, { code: "Http.Forbidden", traceId: "sintetico" }), 403, "Http.Forbidden"));
  await assert.rejects(assertProblemResponse(response(403, { code: "Tenancy.Access.Wrong", traceId: "sintetico" }), 403, "Http.Forbidden"));
  await assert.rejects(assertProblemResponse(response(403, { code: "Http.Forbidden" }), 403, "Http.Forbidden"));
});

test("la segunda pestaña abre la cuenta de la sesión existente sin pedir otro ingreso ni OTP", async () => {
  const calls = [];
  const account = { id: "persona-propia", access: "consumer", version: 7 };
  const page = {
    goto: async (url) => calls.push(["goto", url]),
    getByRole: (role, options) => ({ waitFor: async () => calls.push([role, options.name]) }),
  };
  const h = {
    base: new URL("https://localtest.me:7433"),
    api: async (target, route) => { assert.equal(target, page); calls.push(["api", route]); return { status: () => 200, json: async () => account }; },
    login: async () => assert.fail("La cookie vigente evita un login nuevo."),
  };
  assert.equal(await openExistingPersonalAccount(h, page, account.id), account);
  assert.deepEqual(calls, [["goto", "https://localtest.me:7433/cuenta"], ["heading", "Mi cuenta"], ["api", "/api/me"]]);
  await assert.rejects(openExistingPersonalAccount(h, page, "otra-persona"));
  account.access = "business";
  await assert.rejects(openExistingPersonalAccount(h, page, account.id));
});

test("el control del ancho tolera el redondeo de un píxel y denuncia el desborde real", async () => {
  await assertViewport({ evaluate: async () => ({ width: 390, document: 391, body: 390 }) });
  await assert.rejects(assertViewport({ evaluate: async () => ({ width: 390, document: 412, body: 390 }) }), /desborde/);
});
