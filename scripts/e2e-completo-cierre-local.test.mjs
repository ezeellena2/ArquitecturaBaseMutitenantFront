import assert from "node:assert/strict";
import test from "node:test";
import { requireGoogleChallenge, requireOwnerPreserved, localClosureDefinitions } from "./e2e-completo-cierre-local.mjs";
import * as closure from "./e2e-completo-cierre-local.mjs";

function googlePage({ status = 200, insecure = false } = {}) {
  const calls = []; let routeHandler; let requested; let failed;
  const observedRequest = new Promise((resolve) => { requested = resolve; });
  const abortedRequest = new Promise((resolve) => { failed = resolve; });
  const request = { url: () => `${insecure ? "http" : "https"}://accounts.google.com/o/oauth2/v2/auth?state=privado` };
  const response = { status: () => status, json: () => { throw new Error("El observador no debe leer el cuerpo del POST durante la navegación retenida."); } };
  const page = {
    route: async (matches, handler) => {
      assert.equal(matches(new URL("https://accounts.google.com/auth")), true);
      assert.equal(matches(new URL("https://localtest.me/api/me/external/google")), false);
      calls.push("interceptar Google"); routeHandler = handler;
    },
    unroute: async () => calls.push("retirar interceptor"),
    waitForRequest: () => observedRequest,
    waitForEvent: (name) => { assert.equal(name, "requestfailed"); return abortedRequest; },
    waitForResponse: () => Promise.resolve(response),
    goto: async () => calls.push("volver Cuenta"),
    getByRole: (role, options) => { assert.equal(role, options.name === "Código 1" ? "textbox" : "button"); return options.name === "Código 1" ? { count: async () => 0 } : { ...button, waitFor: async () => calls.push("Cuenta lista") }; },
  };
  const button = { click: async () => {
    calls.push("clic UI");
    const pending = routeHandler({ request: () => request, abort: async () => {
      calls.push("abortar Google"); await Promise.resolve(); calls.push("aborto confirmado"); failed(request);
    } });
    requested(request); await pending;
  } };
  return { page, calls };
}

test("Google valida POST200 y destino real sin leer JSON y espera el aborto antes de volver a Cuenta", async () => {
  const { page, calls } = googlePage();
  await closure.linkGoogleAndRestoreAccount(page, new URL("https://localtest.me"));
  assert.deepEqual(calls, ["interceptar Google", "clic UI", "abortar Google", "aborto confirmado", "retirar interceptor", "volver Cuenta", "Cuenta lista"]);
});

test("un POST no200 o destino sin HTTPS aborta la petición retenida y restaura Cuenta sin aprobar", async () => {
  for (const options of [{ status: 400 }, { insecure: true }]) {
    const { page, calls } = googlePage(options);
    await assert.rejects(() => closure.linkGoogleAndRestoreAccount(page, new URL("https://localtest.me")), (error) => error.code === "ERR_ASSERTION");
    assert.ok(calls.includes("aborto confirmado"));
    assert.deepEqual(calls.slice(-3), ["retirar interceptor", "volver Cuenta", "Cuenta lista"]);
  }
});

test("el desafío Google exige HTTPS y host exacto, sin acreditar posesión ni vinculación", () => {
  assert.equal(requireGoogleChallenge("https://accounts.google.com/o/oauth2/v2/auth?state=privado"), true);
  for (const requestUrl of ["http://accounts.google.com/auth", "https://accounts.google.com.evil.test/auth", "/auth", "https://otro.test/"]) assert.throws(() => requireGoogleChallenge(requestUrl));
});

test("LastTenantAdmin conserva exactamente membresía, roles y versión del único Dueño", () => {
  const before = { memberId: "m", userId: "u", state: "Active", roles: [{ id: "owner", name: "Dueño" }], companies: [], version: 4 };
  const problem = { code: "Tenancy.Member.LastTenantAdmin", traceId: "t" };
  requireOwnerPreserved(before, structuredClone(before), problem);
  for (const after of [{ ...before, version: 5 }, { ...before, roles: [] }, { ...before, state: "Inactive" }]) assert.throws(() => requireOwnerPreserved(before, after, problem));
  assert.throws(() => requireOwnerPreserved(before, before, { ...problem, code: "Tenancy.Member.CannotDisableSelf" }));
  assert.throws(() => requireOwnerPreserved(before, before, { ...problem, traceId: "" }));
});

test("cada cierre local declara sólo la acción completa que ejecuta", () => {
  assert.deepEqual(localClosureDefinitions.map((entry) => entry.id), ["CIERRE-01", "CIERRE-02", "CIERRE-03", "CIERRE-04"]);
  assert.deepEqual(localClosureDefinitions[0].covers, ["BACK-CU-011"]);
  assert.deepEqual(localClosureDefinitions[1].covers, ["BACK-OR-017"]);
  assert.ok(localClosureDefinitions[2].covers.includes("GUIA-sumar-una-empresa-04"));
});
