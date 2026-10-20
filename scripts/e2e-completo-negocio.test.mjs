import assert from "node:assert/strict";
import test from "node:test";
import { backendUseCases } from "./e2e-completo-inventario-back.mjs";
import { businessDefinitions, clickForResponse, invitationTokenFromMessage, requireOrganizationPermissions, requireProblem, requireSoleCompanyAdministrator, roleScopeNegativeAssignment, runBusinessDependencyCase } from "./e2e-completo-negocio.mjs";

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

test("último Administrador exige una sola asignación efectiva de la identidad que hace la acción", () => {
  const admin = { memberId: "ultimo", state: "Active", membershipStatus: "Active", roles: [{ name: "Administrador", isSystemRole: true }] };
  const inactive = { ...admin, memberId: "inactivo", membershipStatus: "Inactive" };
  const invited = { ...admin, memberId: "invitado", state: "Invited" };
  const custom = { ...admin, memberId: "rol-con-mismo-nombre", roles: [{ name: "Administrador", isSystemRole: false }] };
  assert.equal(requireSoleCompanyAdministrator([admin, inactive, invited, custom], "ultimo"), admin);
  assert.throws(() => requireSoleCompanyAdministrator([inactive, invited, custom], "ultimo"));
  assert.throws(() => requireSoleCompanyAdministrator([admin, { ...admin, memberId: "otro" }], "ultimo"));
  assert.throws(() => requireSoleCompanyAdministrator([admin], "otra-persona"));
});

test("las negativas nuevas tienen IDs propios y sólo certifican los cuatro contratos completos", () => {
  const expected = { "BIZ-36": "BACK-EM-015", "BIZ-37": "BACK-RO-010", "BIZ-38": "BACK-RO-012", "BIZ-39": "BACK-EM-011" };
  for (const [id, covered] of Object.entries(expected)) {
    const entry = businessDefinitions.find((definition) => definition.id === id);
    assert.ok(entry, "Cada negativa debe ser capturada individualmente.");
    assert.deepEqual(entry.covers, [covered]);
  }
  assert.match(businessDefinitions.find((entry) => entry.id === "BIZ-38").expected, /sin reingreso ni recarga/);
});

test("el envío con cooldown conserva el HTTP real mientras las acciones normales siguen exigiendo el estado", async () => {
  const response = { status: () => 429 };
  const page = { waitForResponse: async () => response };
  const button = { click: async () => {} };
  assert.equal(await clickForResponse(page, button, "/api/auth/login-code", "POST", null), response);
  await assert.rejects(clickForResponse(page, button, "/api/auth/login-code", "POST", 202));
});

test("las tres negativas de alcance conservan la versión y las asignaciones válidas y sólo alteran la variante probada", () => {
  const original = Object.freeze({ version: 17, roles: Object.freeze([{ id: "lectura-configuracion" }]),
    companies: Object.freeze([{ companyId: "empresa-previa", roles: [{ id: "rol-previo" }] }]) });
  const fixture = { organizationRoleId: "rol-organizacion", companyRoleId: "rol-empresa-a", companyId: "empresa-a", otherCompanyId: "empresa-c" };
  const allowed = { companyId: "empresa-previa", roleIds: ["rol-previo"] };
  const wrongCompany = roleScopeNegativeAssignment("CompanyNotAllowed", original, fixture);
  assert.deepEqual(wrongCompany, { roleIds: ["lectura-configuracion"], companies: [allowed, { companyId: "empresa-a", roleIds: ["rol-organizacion"] }], version: 17 });
  const missingCompany = roleScopeNegativeAssignment("CompanyRequired", original, fixture);
  assert.deepEqual(missingCompany, { roleIds: ["lectura-configuracion", "rol-empresa-a"], companies: [allowed], version: 17 });
  const mismatch = roleScopeNegativeAssignment("CompanyMismatch", original, fixture);
  assert.deepEqual(mismatch, { roleIds: ["lectura-configuracion"], companies: [allowed, { companyId: "empresa-c", roleIds: ["rol-empresa-a"] }], version: 17 });
  assert.deepEqual(original.roles, [{ id: "lectura-configuracion" }]);
  assert.throws(() => roleScopeNegativeAssignment("CompanyMismatch", original, { ...fixture, otherCompanyId: fixture.companyId }));
  assert.throws(() => roleScopeNegativeAssignment("inventada", original, fixture));
});

test("la cobertura agrupada sólo está en la última variante y sus dependencias impiden acreditar un subconjunto", async () => {
  const defs = new Map(businessDefinitions.map((entry) => [entry.id, entry]));
  for (const id of ["BIZ-40", "BIZ-42", "BIZ-44"]) assert.deepEqual(defs.get(id).covers, []);
  assert.deepEqual(defs.get("BIZ-43").covers, ["BACK-EM-009"]);
  assert.deepEqual(defs.get("BIZ-45").covers, ["BACK-RO-009"]);
  assert.deepEqual(defs.get("BIZ-41").covers, ["BACK-OR-011"]);
  const outcomes = new Map([["BIZ-42", { ok: true }], ["BIZ-44", { ok: false }]]);
  const blocked = [];
  const h = { block: async (...args) => blocked.push(args), record: async () => { throw new Error("No debe ejecutar una aprobación parcial."); } };
  await runBusinessDependencyCase(h, outcomes, "BIZ-45", ["BIZ-42", "BIZ-44"], () => "captura", async () => "rechazo");
  assert.equal(outcomes.get("BIZ-45").blocked, true);
  assert.match(blocked[0][1], /BIZ-44/);
  outcomes.set("BIZ-23", { ok: true }); outcomes.set("BIZ-40", { ok: false });
  await runBusinessDependencyCase(h, outcomes, "BIZ-43", ["BIZ-23", "BIZ-40"], () => "captura", async () => "rechazo");
  assert.equal(outcomes.get("BIZ-43").blocked, true);
  assert.match(blocked[1][1], /BIZ-40/);
});
