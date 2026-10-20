import assert from "node:assert/strict";
import test from "node:test";
import { backendUseCases } from "./e2e-completo-inventario-back.mjs";
import { businessDefinitions, clickForResponse, invitationTokenFromMessage, requireOrganizationPermissions, requireProblem, requireSoleCompanyAdministrator, roleScopeNegativeAssignment, runBusinessDependencyCase } from "./e2e-completo-negocio.mjs";
import * as business from "./e2e-completo-negocio.mjs";

function companyRepairCandidateFixture(patch = {}, postedPatch = {}) {
  const calls = []; const waiting = []; const companyId = "empresa-propia"; const memberId = "miembro-propio";
  const candidates = { page: 1, pageSize: 20, totalCount: 1, hasNext: false, items: [{ memberId, displayName: "e2•••@example.test" }], ...patch };
  const reply = (route, method, body, posted) => ({ url: () => `https://localtest.me${route}`, request: () => ({ method: () => method, postDataJSON: () => posted }), status: () => method === "GET" ? 200 : 204, json: async () => body });
  const candidateReply = reply(`/api/companies/${companyId}/candidates/paged?page=1&pageSize=20&sort=displayName`, "GET", candidates);
  const postReply = reply(`/api/companies/${companyId}/members`, "POST", undefined, { memberId, roleIds: [], ...postedPatch });
  const send = (response) => { const matching = waiting.filter(({ predicate }) => predicate(response)); assert.equal(matching.length, 1); matching[0].resolve(response); };
  const option = { waitFor: async () => calls.push("opción visible"), count: async () => 1, click: async () => calls.push("seleccionar candidato verificado") };
  const dialog = { getByRole: (role, options) => {
    if (role === "combobox") { assert.deepEqual(options, { name: "Usuario", exact: true }); return { click: async () => calls.push("abrir selector") }; }
    assert.equal(role, "button"); assert.deepEqual(options, { name: "Agregar miembro", exact: true }); return { click: async () => { calls.push("POST UI"); send(postReply); } };
  }, waitFor: async (options) => { assert.deepEqual(options, { state: "hidden" }); calls.push("diálogo cerrado"); } };
  const page = { waitForResponse: (predicate) => { calls.push("observar respuesta"); const pending = { predicate, ...Promise.withResolvers() }; waiting.push(pending); return pending.promise; }, getByRole: (role, options) => {
    if (role === "dialog") { assert.deepEqual(options, { name: "Agregar miembro", exact: true }); return dialog; }
    if (role === "listbox") return { getByRole: (role, options) => { assert.equal(role, "option"); assert.deepEqual(options, { name: candidates.items[0].displayName, exact: true }); return option; } };
    assert.equal(role, "button"); assert.deepEqual(options, { name: "Agregar miembro", exact: true });
    const trigger = { first: () => trigger, click: async () => { calls.push("abrir Agregar miembro"); send(candidateReply); } }; return trigger;
  } };
  return { page, calls, companyId, memberId };
}

test("Agregar miembro usa el único ID candidato real y su etiqueta enmascarada sin buscar el correo completo", async () => {
  const fixture = companyRepairCandidateFixture();
  await business.addBusinessRepairCompanyMember(fixture.page, fixture.companyId, fixture.memberId);
  assert.deepEqual(fixture.calls, ["observar respuesta", "abrir Agregar miembro", "abrir selector", "opción visible", "seleccionar candidato verificado", "observar respuesta", "POST UI", "diálogo cerrado"]);
});

test("Agregar miembro rechaza candidatos ajenos, múltiples, incompletos o sin etiqueta y conserva el POST exacto", async () => {
  for (const patch of [
    { items: [{ memberId: "ajeno", displayName: "Opción" }] }, { items: [{ memberId: "miembro-propio", displayName: "" }] },
    { hasNext: true }, { hasMore: true }, { totalCount: 2 }, { page: 2 },
    { items: [{ memberId: "miembro-propio", displayName: "Opción" }, { memberId: "otra", displayName: "Opción" }] },
  ]) {
    const fixture = companyRepairCandidateFixture(patch);
    await assert.rejects(() => business.addBusinessRepairCompanyMember(fixture.page, fixture.companyId, fixture.memberId));
    assert.equal(fixture.calls.includes("seleccionar candidato verificado"), false); assert.equal(fixture.calls.includes("POST UI"), false);
  }
  for (const posted of [{ memberId: "ajeno" }, { roleIds: ["rol-ajeno"] }]) {
    const fixture = companyRepairCandidateFixture({}, posted);
    await assert.rejects(() => business.addBusinessRepairCompanyMember(fixture.page, fixture.companyId, fixture.memberId));
    assert.equal(fixture.calls.includes("diálogo cerrado"), false);
  }
});

test("el nombre propio de la fixture se guarda por UI sin cambiar identidad, tenant, acceso ni permisos", async () => {
  const before = { id: "persona-propia", access: "business", activeTenantId: "organización-propia", version: 2, culture: "es-AR", timeZoneId: "America/Argentina/Buenos_Aires",
    effectivePermissions: { organization: ["users.read"], platform: [], companies: {} } };
  const name = "Miembro reparación único"; const payload = { firstName: name, lastName: null, culture: before.culture, timeZoneId: before.timeZoneId, version: before.version };
  for (const change of [{}, { id: "otra" }, { activeTenantId: "otra" }, { access: "consumer" },
    { effectivePermissions: { ...before.effectivePermissions, organization: ["users.read", "users.manage"] } }, { post: { version: 999 } }]) {
    const calls = []; const { post = {}, ...altered } = change;
    const after = { ...before, firstName: name, lastName: null, displayName: name, version: 3, ...altered };
    const response = { status: () => 200, url: () => "https://localtest.me/api/me", request: () => ({ method: () => "PUT", postDataJSON: () => ({ ...payload, ...post }) }), json: async () => ({ version: 3 }) };
    const page = { goto: async (url) => { assert.equal(new URL(url).pathname, "/cuenta"); calls.push("cuenta propia"); }, getByRole: (role, options) => {
      if (role === "heading") { assert.deepEqual(options, { name: "Mi cuenta", exact: true }); return { waitFor: async () => calls.push("cuenta lista") }; }
      if (role === "textbox") return { fill: async (value) => { assert.ok(["Nombre", "Apellido"].includes(options.name)); calls.push([options.name, value]); } };
      assert.equal(role, "button"); assert.deepEqual(options, { name: "Guardar cambios", exact: true }); return { click: async () => calls.push("PUT por UI") };
    }, waitForResponse: async (predicate) => { assert.equal(predicate(response), true); return response; } };
    const h = { base: new URL("https://localtest.me"), api: async (target, route) => { assert.equal(target, page); assert.equal(route, "/api/me"); return { status: () => 200, json: async () => after }; } };
    const run = () => business.prepareBusinessRepairMemberProfile(h, page, before, name);
    if (Object.keys(change).length) await assert.rejects(run); else {
      assert.equal(await run(), after); assert.deepEqual(calls, ["cuenta propia", "cuenta lista", ["Nombre", name], ["Apellido", ""], "PUT por UI"]);
    }
  }
});

test("el Administrador empresarial de la reparación proyecta sólo assistant.use y conserva sus permisos exactos en una empresa", () => {
  const me = { access: "business", activeTenantId: "organizacion-propia", effectivePermissions: {
    organization: ["assistant.use"], platform: [], companies: { "empresa-propia": ["assistant.use", "company.members.manage", "company.members.read"] },
  } };
  business.requireBusinessCompanyAdministrator(me, "organizacion-propia", "empresa-propia");
  for (const patch of [
    { activeTenantId: "ajena" }, { access: "consumer" },
    { effectivePermissions: { ...me.effectivePermissions, organization: [] } },
    ...["assistant.configure", "users.manage", "users.read", "roles.read"].map((permission) => ({ effectivePermissions: { ...me.effectivePermissions, organization: ["assistant.use", permission] } })),
    { effectivePermissions: { ...me.effectivePermissions, platform: ["platform.tenants.read"] } },
    { effectivePermissions: { ...me.effectivePermissions, companies: { "empresa-ajena": me.effectivePermissions.companies["empresa-propia"] } } },
    { effectivePermissions: { ...me.effectivePermissions, companies: { "empresa-propia": ["company.members.read"] } } },
    { effectivePermissions: { ...me.effectivePermissions, companies: { "empresa-propia": [...me.effectivePermissions.companies["empresa-propia"], "users.manage"] } } },
  ]) assert.throws(() => business.requireBusinessCompanyAdministrator({ ...me, ...patch }, "organizacion-propia", "empresa-propia"));
  assert.throws(() => requireOrganizationPermissions(me, []), "El comparador general no debe eliminar assistant.use para otros actores.");
});

test("la reparación pendiente incluye los12 IDs pedidos y no vuelve a ejecutar ni bloquear34", async () => {
  const ids = ["23", "24", "25", "26", "27", "28", "31", "38", "42", "43", "44", "45"].map((id) => "BIZ-" + id);
  assert.deepEqual(business.businessAccessPendingRepairDefinitions.map(({ id }) => id), ids);
  const records = []; const blocks = [];
  const h = { width: 390, record: async (id, _getPage, action) => { records.push(id); return { ok: true, value: await action() }; }, block: async (id) => blocks.push(id) };
  await business.runBusinessAccessPendingRepairCases(h, { run: async (selected) => {
    for (const { id } of business.businessAccessRepairDefinitions) {
      await selected.record(id, () => ({}), async () => { assert.notEqual(id, "BIZ-34"); return id; });
      await selected.block(id, "Fallo de preparación", {});
    }
  } });
  assert.deepEqual(records, ids); assert.deepEqual(blocks, ids);
});

function selfDisableFixture({ status = 403, code = "Tenancy.Member.CannotDisableSelf", changed = false, width = 1440, initialState = "Active", cycle } = {}) {
  const calls = [];
  const before = { memberId: "own-member", userId: "own-person", state: initialState, version: 7,
    roles: [{ id: "owner-role", name: "Dueño", isSystemRole: true, scope: "Organization" }], companies: [] };
  let detailReads = 0;
  const response = { status: () => status, json: async () => ({ code, traceId: "synthetic-trace" }),
    url: () => "https://localtest.me:7433/api/users/own-member", request: () => ({ method: () => "PUT" }) };
  const control = (name) => ({
    name,
    click: async () => calls.push(["click", name]), check: async () => calls.push(["check", name]),
    locator: () => assert.fail("Un has con el dialog como ancestro no es relativo a la opción."),
    getByText: (text) => control("opción visible " + text),
    getByRole: (_role, options = {}) => control(String(options.name)), filter: () => control(name), first: () => control(name),
    isVisible: async () => name === "Descartar cambios", waitFor: async () => calls.push(["visible", name]),
  });
  const page = {
    goto: async (url) => calls.push(["goto", new URL(url).pathname]),
    getByRole: (_role, options = {}) => control(String(options.name)),
    getByText: (text) => control(text),
    waitForResponse: async (predicate) => { assert.equal(predicate(response), true); return response; },
    close: async () => calls.push(["close"]),
  };
  const h = {
    width, base: new URL("https://localtest.me:7433"), newPage: async () => page,
    api: async (target, route, options) => {
      assert.equal(target, page); assert.equal(options, undefined, "Las escrituras se hacen por UI.");
      calls.push(["read", route]);
      const data = route.includes("paged") ? { items: [before] } : cycle ? { ...before, ...(detailReads++ > 0 ? cycle : {}) } : { ...before, version: changed && detailReads++ > 0 ? 8 : 7 };
      return { status: () => 200, json: async () => data };
    },
    registerBusiness: async (target) => { assert.equal(target, page); calls.push(["register"]); return { me: { id: "own-person", access: "business", hasPersonalSpace: false } }; },
    signOut: async (target) => { assert.equal(target, page); calls.push(["logout"]); },
    record: async (id, getPage, action) => {
      assert.ok(["BIZ-25", "BIZ-41"].includes(id)); assert.equal(getPage(), page);
      calls.push(["record", id]);
      if (id === "BIZ-41") return { ok: true };
      try { const value = await action(); calls.push(["capture"]); return { ok: true, value }; }
      catch (error) { calls.push(["capture"]); return { ok: false, error }; }
    },
  };
  return { h, page, calls };
}

test("deshabilitarse exige 403 CannotDisableSelf y conserva el acceso, roles y versión", async () => {
  for (const width of [1440, 390]) {
    const { h, page, calls } = selfDisableFixture({ width });
    assert.match(await business.checkSelfDisable(h, page, "own-person"), /403/u);
    assert.ok(calls.some((entry) => entry[1] === "Deshabilitar y guardar"));
    assert.ok(calls.some((entry) => entry[1] === "No podés deshabilitarte a vos misma."));
    if (width === 390) {
      assert.ok(calls.some((entry) => entry[0] === "click" && entry[1] === "opción visible Deshabilitado"));
      assert.equal(calls.some(([action]) => action === "check"), false, "El input sr-only no recibe clicks forzados.");
    }
  }
  for (const options of [{ status: 409 }, { code: "Tenancy.Member.LastTenantAdmin" }, { changed: true }]) {
    const { h, page } = selfDisableFixture(options);
    await assert.rejects(business.checkSelfDisable(h, page, "own-person"));
  }
});

test("deshabilitar y rehabilitar exigen PUT200, versión nueva y conservación de roles y empresas", async () => {
  for (const active of [false, true]) {
    const initialState = active ? "Inactive" : "Active"; const state = active ? "Active" : "Inactive";
    const { h, page } = selfDisableFixture({ status: 200, initialState, cycle: { state, version: 8 } });
    assert.equal((await business.checkMemberStateChange(h, page, "own-member", active)).after.state, state);
    for (const change of [{ state, version: 7 }, { state: initialState, version: 8 }, { state, version: 8, roles: [] }, { state, version: 8, companies: [{ companyId: "ajena" }] }, { state, version: 8, userId: "ajena" }]) {
      const fixture = selfDisableFixture({ status: 200, initialState, cycle: change });
      await assert.rejects(() => business.checkMemberStateChange(fixture.h, fixture.page, "own-member", active));
    }
    const rejected = selfDisableFixture({ status: 403, initialState, cycle: { state, version: 8 } });
    await assert.rejects(() => business.checkMemberStateChange(rejected.h, rejected.page, "own-member", active));
  }
});

test("el filtro móvil aplica la opción por su texto y verifica la URL y la lectura HTTP200 después de desmontar", async () => {
  let current = "https://localtest.me/org/roles"; let clicked = false; let closed = false;
  const response = { url: () => "https://localtest.me/api/roles/paged?companyId=propia", status: () => 200 };
  const sheet = { getByText: (name, options) => { assert.equal(name, "Empresa propia"); assert.equal(options.exact, true); return { click: async (options) => { assert.equal(options, undefined); clicked = true; closed = true; current += "?vale=propia"; } }; },
    getByRole: () => assert.fail("check requiere una comprobación posterior sobre el radio ya desmontado."),
    waitFor: async ({ state }) => { assert.equal(state, "hidden"); assert.equal(closed, true); } };
  const page = { goto: async () => {}, url: () => current, waitForResponse: async (predicate) => { assert.equal(predicate(response), true); return response; },
    getByRole: (role) => role === "dialog" ? sheet : { click: async () => {} } };
  await business.filterRolesByCompany({ width: 390, base: new URL("https://localtest.me") }, page, { id: "propia", name: "Empresa propia" });
  assert.equal(clicked, true);
});

test("la reparación de acceso sólo declara los trece afectados y bloquea dependientes si no existe fixture", async () => {
  const ids = ["23", "24", "25", "26", "27", "28", "31", "34", "38", "42", "43", "44", "45"].map((id) => `BIZ-${id}`);
  assert.deepEqual(business.businessAccessRepairDefinitions.map((item) => item.id), ids);
  const recorded = []; const blocked = []; let closed = false;
  const page = { close: async () => { closed = true; } };
  const h = { width: 390, newPage: async () => page, registerBusiness: async () => { throw new Error("alta no preparada"); },
    record: async (id, getPage, action) => { recorded.push(id); assert.equal(getPage(), page); try { return { ok: true, value: await action() }; } catch (error) { return { ok: false, error }; } },
    block: async (id) => blocked.push(id), signOut: async () => assert.fail("No hay sesión para salir.") };
  const outcomes = await business.runBusinessAccessRepairCases(h);
  assert.deepEqual(recorded, ["BIZ-23"]); assert.deepEqual(blocked.sort(), ids.filter((id) => id !== "BIZ-23").sort());
  assert.equal(outcomes.get("BIZ-23").ok, false); assert.equal(closed, true);
});

test("el estado de empresa se comprueba por badge en escritorio y por la acción disponible en móvil", async () => {
  for (const width of [390, 1440]) for (const status of ["Active", "Inactive"]) {
    const calls = [];
    const control = (name) => ({ click: async () => calls.push(["click", name]), waitFor: async () => calls.push(["visible", name]), first: () => control(name) });
    const inverse = { waitFor: async () => calls.push(["visible", status === "Inactive" ? "Activar" : "Inactivar"]) };
    const menu = { waitFor: async () => {}, getByRole: (role, options) => { assert.equal(role, "menuitem"); assert.deepEqual(options, { name: status === "Inactive" ? "Activar" : "Inactivar", exact: true }); return inverse; } };
    const sheet = { waitFor: async () => {}, getByRole: (role) => { assert.equal(role, "menu"); return menu; } };
    const title = { filter: () => title, first: () => title, innerText: async () => "Empresa propia" };
    const page = {
      viewportSize: () => ({ width }),
      getByRole: (role, options) => {
        assert.equal(width, 390);
        if (role === "heading") return title;
        if (role === "dialog") { assert.deepEqual(options, { name: "Empresa propia", exact: true }); return sheet; }
        assert.equal(role, "button"); assert.deepEqual(options, { name: "Más acciones", exact: true });
        return { waitFor: async (options) => assert.deepEqual(options, { state: "visible" }), getAttribute: async () => "dialog", focus: async () => calls.push(["focus", "Más acciones"]), press: async (key) => calls.push(["press", key]) };
      },
      getByText: (name) => { assert.equal(width, 1440, "El tablero móvil no tiene badge de estado."); return control(name); },
    };
    await business.assertCompanyStateVisible({ width }, page, status);
    assert.deepEqual(calls, width === 390 ? [["focus", "Más acciones"], ["press", "Enter"], ["visible", status === "Inactive" ? "Activar" : "Inactivar"]]
      : [["visible", status === "Inactive" ? "Inactiva" : "Activa"]]);
  }
  await assert.rejects(business.assertCompanyStateVisible({ width: 390 }, {}, "Desconocido"));
  const expected = businessDefinitions.find((entry) => entry.id === "BIZ-21").expected;
  assert.match(expected, /móvil/u); assert.match(expected, /Activar/u); assert.match(expected, /Inactiva/u);
});

test("el runner móvil de Negocio sólo registra sus cinco acciones y ejecuta las siete fixtures", async () => {
  const targets = ["19", "20", "21", "22", "34"].map((id) => `BIZ-${id}`);
  const fixtures = ["01", "02", "03", "06", "23", "24", "31"].map((id) => `BIZ-${id}`);
  assert.deepEqual(business.businessMobileBarDefinitions.map((row) => row.id), targets);
  for (const row of business.businessMobileBarDefinitions) assert.equal(row, businessDefinitions.find((original) => original.id === row.id));
  const recorded = []; const executed = [];
  const h = { width: 390, record: async (id, _page, action) => { recorded.push(id); return { ok: true, value: await action() }; } };
  await business.runBusinessMobileBarCases(h, { run: async (selected) => {
    for (const row of businessDefinitions) {
      const result = await selected.record(row.id, () => ({}), async () => executed.push(row.id));
      if (!targets.includes(row.id) && !fixtures.includes(row.id)) assert.deepEqual(result, { ok: false, skipped: true });
    }
  } });
  assert.deepEqual(recorded, targets); assert.deepEqual(new Set(executed), new Set([...targets, ...fixtures]));
  await assert.rejects(business.runBusinessMobileBarCases({ ...h, width: 1440 }, { run: async () => assert.fail("Sólo390") }), /390/u);
});

test("la reparación de negocio prepara una sola organización para25/41, captura y cierra por UI incluso si falla25", async () => {
  for (const options of [{}, { code: "Http.Forbidden" }]) {
    const { h, calls } = selfDisableFixture(options);
    const result = await business.runBusinessRepairCases(h);
    assert.equal(result.get("BIZ-25").ok, !options.code);
    assert.equal(result.get("BIZ-41").ok, true, "41 depende de la organización creada, no del resultado negativo de25.");
    assert.equal(calls.filter(([action]) => action === "register").length, 1);
    assert.deepEqual(calls.filter(([action]) => action === "record"), [["record", "BIZ-25"], ["record", "BIZ-41"]]);
    assert.deepEqual(calls.slice(-3), [["click", "Descartar cambios"], ["logout"], ["close"]]);
  }
});

test("la reparación de negocio incluye sólo BIZ25/41 y no acredita la guarda distinta del último Dueño", () => {
  const definition = businessDefinitions.find((entry) => entry.id === "BIZ-25");
  assert.deepEqual(business.businessRepairDefinitions, [definition, businessDefinitions.find((entry) => entry.id === "BIZ-41")]);
  assert.match(definition.expected, /403 Tenancy.Member.CannotDisableSelf/u);
  assert.doesNotMatch(definition.expected, /409/u);
  assert.deepEqual(definition.covers, []);
});

test("la reparación de negocio bloquea41 si el alta propia no llegó a completarse", async () => {
  const { h, calls } = selfDisableFixture();
  h.registerBusiness = async () => { throw new Error("No se creó la organización"); };
  const blocked = [];
  h.block = async (...args) => blocked.push(args);
  const results = await business.runBusinessRepairCases(h);
  assert.equal(results.get("BIZ-25").ok, false);
  assert.equal(results.get("BIZ-41").blocked, true);
  assert.equal(blocked[0][0], "BIZ-41");
  assert.equal(calls.some(([action]) => action === "logout"), false);
  assert.deepEqual(calls.at(-1), ["close"]);
});

test("la lectura de vista previa sólo reemplaza el body CDP perdido por cambio de documento", async () => {
  const stale = new Error("Protocol error (Network.getResponseBody): No resource with given identifier found\nResponse body is not available for a response that was navigated away from.");
  const response = (status, body) => ({ status: () => status, json: async () => { if (body instanceof Error) throw body; return body; } });
  let reloaded = 0;
  const reload = async () => { reloaded++; return response(200, { state: "NoAccount" }); };
  assert.deepEqual(await business.readInvitationPreviewResponse(response(200, stale), "NoAccount", reload), { state: "NoAccount" });
  assert.equal(reloaded, 1);
  for (const original of [response(403, stale), response(200, { state: "WrongSession" }), response(200, new Error("Timeout")), response(200, new Error("Protocol error (Network.getResponseBody): Target closed"))]) {
    await assert.rejects(business.readInvitationPreviewResponse(original, "NoAccount", reload));
  }
  assert.equal(reloaded, 1, "No se oculta ningún status, estado funcional ni fallo de infraestructura distinto.");
  await assert.rejects(business.readInvitationPreviewResponse(response(200, stale), "NoAccount", async () => response(403, { state: "NoAccount" })));
});

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
