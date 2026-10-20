import assert from "node:assert/strict";
import test from "node:test";
import { backendUseCases } from "./e2e-completo-inventario-back.mjs";
import { businessDefinitions, clickForResponse, invitationTokenFromMessage, requireOrganizationPermissions, requireProblem, runBusinessDependencyCase } from "./e2e-completo-negocio.mjs";

test("un fallo de preparación bloquea sólo sus dependientes y permite el siguiente caso independiente", async () => {
  const calls = [];
  const page = { name: "captura" };
  const h = {
    record: async (id, getPage, action) => {
      calls.push(["record", id, getPage()]);
      try { return { ok: true, value: await action() }; }
      catch (error) { return { ok: false, error }; }
    },
    block: async (...args) => calls.push(["block", ...args]),
  };
  const outcomes = new Map();
  await runBusinessDependencyCase(h, outcomes, "setup", [], () => page, async () => { throw new Error("Sin alta"); });
  let executed = false;
  const blocked = await runBusinessDependencyCase(h, outcomes, "dependent", ["setup"], () => page, async () => { executed = true; });
  const independent = await runBusinessDependencyCase(h, outcomes, "independent", [], () => page, async () => "Puede seguir");
  assert.equal(executed, false);
  assert.deepEqual(blocked, { ok: false, blocked: true });
  assert.equal(independent.ok, true);
  assert.equal(independent.value, "Puede seguir");
  assert.deepEqual(calls.map(([type, id]) => [type, id]), [["record", "setup"], ["block", "dependent"], ["record", "independent"]]);
  assert.match(calls[1][2], /setup/);
  assert.equal(calls[1][3], page);
});

test("el chequeo de aislamiento exige 404 ProblemDetails y no acepta HTML, 403 ni éxito", async () => {
  const response = (status, body) => ({ status: () => status, json: async () => body });
  const problem = { code: "Tenancy.Company.NotFound", traceId: "traza-sintetica" };
  assert.equal(await requireProblem(response(404, problem), 404, problem.code), problem);
  await assert.rejects(requireProblem(response(403, problem), 404));
  await assert.rejects(requireProblem(response(200, { name: "Dato privado" }), 404));
  await assert.rejects(requireProblem(response(404, { code: problem.code }), 404));
  await assert.rejects(requireProblem(response(404, { traceId: problem.traceId }), 404));
  await assert.rejects(requireProblem(response(404, problem), 404, "Roles.Role.NotFound"));
});

test("cambiar organización no acepta permisos que quedaron del perfil anterior ni permisos de Plataforma", () => {
  const me = { access: "business", activeTenantId: "organizacion-b", effectivePermissions: { organization: ["roles.read"], platform: [] } };
  requireOrganizationPermissions(me, ["roles.read"]);
  assert.throws(() => requireOrganizationPermissions({ ...me, effectivePermissions: { ...me.effectivePermissions, organization: ["roles.read", "users.read"] } }, ["roles.read"]));
  assert.throws(() => requireOrganizationPermissions({ ...me, access: "consumer" }, ["roles.read"]));
  assert.throws(() => requireOrganizationPermissions({ ...me, activeTenantId: null }, ["roles.read"]));
  assert.throws(() => requireOrganizationPermissions({ ...me, effectivePermissions: { ...me.effectivePermissions, platform: ["platform.tenants.read"] } }, ["roles.read"]));
});

test("las comprobaciones de negocio enlazan casos reales de la matriz sin duplicar IDs", () => {
  assert.equal(new Set(businessDefinitions.map((entry) => entry.id)).size, businessDefinitions.length);
  const known = new Set(backendUseCases.map((entry) => entry.id));
  for (const entry of businessDefinitions) {
    for (const id of entry.covers) assert.ok(known.has(id), `Referencia desconocida: ${id}`);
  }
  assert.ok(businessDefinitions.some((entry) => entry.covers.includes("BACK-CU-002")));
  assert.ok(businessDefinitions.some((entry) => entry.covers.includes("BACK-EM-008")));
  assert.ok(businessDefinitions.some((entry) => entry.covers.includes("BACK-OR-022")));
});

test("la invitación del pickup sólo aporta el fragmento del origen aislado y nunca acepta un enlace externo", () => {
  const base = new URL("https://localtest.me:7433");
  const eml = (link) => `Content-Type: text/plain; charset=utf-8\r\n\r\nIngresá desde ${link}\r\n--fin`;
  assert.equal(invitationTokenFromMessage(eml(`${base.origin}/invitacion#prueba_sintetica-123`), base), "prueba_sintetica-123");
  assert.equal(invitationTokenFromMessage(eml(`${base.origin}/invitacion?token=prueba_sintetica`), base), null);
  assert.equal(invitationTokenFromMessage("No contiene un correo multipart.", base), null);
  assert.throws(() => invitationTokenFromMessage(eml("https://ajeno.example.test/invitacion#prueba_sintetica"), base));
  assert.throws(() => invitationTokenFromMessage(eml("https://localtest.me:9443/invitacion#prueba_sintetica"), base));
});

test("un clic fallido no deja un waiter de red rechazado sin observar ni transforma el fallo en éxito", async () => {
  let rejectResponse;
  const pending = new Promise((_resolve, reject) => { rejectResponse = reject; });
  const page = { waitForResponse: () => pending };
  const button = { click: async () => { throw new Error("El botón no es operable"); } };
  await assert.rejects(clickForResponse(page, button, "/api/users/invitations", "POST", 201), /no es operable/);
  rejectResponse(new Error("La respuesta nunca llegó"));
  await new Promise((resolve) => setImmediate(resolve));
});
