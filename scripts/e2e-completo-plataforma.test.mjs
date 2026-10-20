import assert from "node:assert/strict";
import { test } from "node:test";
import { assertPlatformProblem, createPlatformRecorder, platformDefinitions, platformWriteAttempts, assertDeniedPlatformWrites, assertReadOnlyPlatformPermissions } from "./e2e-completo-plataforma.mjs";
import { backendUseCases } from "./e2e-completo-inventario-back.mjs";
import { guidedCases, screens } from "./e2e-completo-inventario-front.mjs";
import * as platform from "./e2e-completo-plataforma.mjs";

test("cancelar la baja espera marco Personal antes de la primera lectura Bearer", async () => {
  const ready = Promise.withResolvers(); const entered = Promise.withResolvers(); let reads = 0; let visible = false;
  const locator = { or: () => locator, filter: () => locator, first: () => locator, waitFor: async () => { entered.resolve(); await ready.promise; } };
  const page = { waitForURL: async (predicate) => assert.equal(predicate(new URL("https://localtest.me/")), true), getByRole: () => locator };
  const h = { api: async (target, route) => {
    assert.equal(target, page); assert.equal(route, "/api/me"); assert.equal(visible, true); reads++;
    return { status: () => 200, json: async () => ({ id: "propia", access: "consumer" }) };
  } };
  const pending = platform.requireCancelledPersonalAccount(h, page, "propia");
  await entered.promise; assert.equal(reads, 0, "La URL/ todavía puede mostrar Cargando sin token.");
  visible = true; ready.resolve(); await pending; assert.equal(reads, 1);
  await assert.rejects(() => platform.requireCancelledPersonalAccount(h, page, "ajena"));
});

test("la prueba empresarial puede exigir un formulario nuevo sin reutilizar la cookie pública", () => {
  const base = new URL("https://localtest.me:7433/");
  const forced = platform.platformLoginProofUrl(base, "business", { forceLogin: true });
  assert.equal(forced.origin, base.origin); assert.equal(forced.pathname, "/login/empresa");
  assert.deepEqual([...forced.searchParams], [["prompt", "login"]]); assert.equal(forced.hash, "");
  assert.equal(platform.platformLoginProofUrl(base, "consumer").pathname, "/login");
  assert.equal(platform.platformLoginProofUrl(base, "consumer").search, "");
  assert.throws(() => platform.platformLoginProofUrl(base, "platform"));
});

test("la reparación de sesión sólo declara26/35/28 y sus preparaciones no acreditan casos verdes", async () => {
  assert.deepEqual(platform.platformSessionRepairDefinitions.map((entry) => entry.id), ["PLAT-26", "PLAT-35", "PLAT-28"]);
  const recorded = []; const blocked = []; let closed = 0;
  const h = {
    width: 1440, base: new URL("https://localtest.me:7433/"),
    newPage: async () => ({ isClosed: () => false, close: async () => { closed++; } }),
    registerPerson: async () => { throw new Error("persona no creada"); },
    registerBusiness: async () => { throw new Error("organización no creada"); },
    record: async (id, _page, action) => { recorded.push(id); try { return { ok: true, value: await action() }; } catch (error) { return { ok: false, error }; } },
    block: async (id) => blocked.push(id),
  };
  await platform.runPlatformSessionRepairCases(h);
  assert.deepEqual(recorded, ["PLAT-26", "PLAT-28"]); assert.deepEqual(blocked, ["PLAT-35"]); assert.equal(closed, 3);
});

test("las búsquedas de organizaciones y cuentas montan el campo móvil desde su lupa antes de llenarlo", async () => {
  for (const [helper, label] of [["searchPlatformOrganizations", "Buscar por nombre o correo"], ["searchPlatformAccounts", "Buscar por nombre, correo o teléfono"]]) for (const width of [390, 1440]) {
    let visible = width === 1440; let typed;
    const page = { getByRole: (role, { name }) => {
      assert.equal(name, label);
      if (role === "button") return { click: async () => { assert.equal(width, 390); visible = true; } };
      assert.equal(role, "searchbox");
      return { fill: async (value) => { assert.equal(visible, true, "El input móvil sólo existe después de abrir la lupa."); typed = value; } };
    } };
    await platform[helper]({ width }, page, "Organización propia");
    assert.equal(typed, "Organización propia");
  }
});

test("abrir la fila exige href propio y texto aunque el nombre móvil incluya sus metadatos", async () => {
  for (const resource of ["organizaciones", "cuentas"]) for (const mobile of [false, true]) {
    const route = `/plataforma/${resource}/11111111-1111-4111-8111-111111111111`;
    const label = resource === "cuentas" ? "e2e-propia@example.test" : "Organización propia";
    const target = { href: route, text: label, name: mobile ? `${label} hace un momento Activa Personal` : label };
    const rows = [target, { href: route + "-ajena", text: label, name: label }, { href: route, text: "Otra persona", name: "Otra persona" }];
    let clicked;
    const locator = (items) => ({
      filter: ({ hasText }) => locator(items.filter((item) => item.text.includes(hasText))),
      and: (other) => locator(items.filter((item) => other.items.includes(item))), items,
      click: async () => { assert.equal(items.length, 1); clicked = items[0]; },
    });
    const page = {
      getByRole: (role, options) => { assert.equal(role, "link"); assert.equal(options, undefined, "El título no es todo el nombre accesible móvil."); return locator(rows); },
      locator: (selector) => { assert.equal(selector, `a[href="${route}"]`); return locator(rows.filter((item) => item.href === route)); },
    };
    await platform.openPlatformListItem(page, route, label); assert.equal(clicked, target);
    await assert.rejects(() => platform.openPlatformListItem(page, route, "Texto ausente"));
  }
});

test("la preparación de lectura de cuentas sólo escribe por UI si falta ese permiso", async () => {
  for (const configured of [false, true]) {
    const calls = [];
    const current = { id: "otro-operador", kind: "Operator", operatorPermissions: configured ? ["platform.accounts.read", "platform.tenants.read"] : ["platform.tenants.read"] };
    const page = {};
    const h = { base: new URL("https://localtest.me"), api: async (target, route) => {
      assert.equal(target, page); calls.push(route);
      return { status: () => 200, json: async () => route.includes("/paged?") ? { items: [{ id: current.id }] } : current };
    } };
    const changed = { ...current, operatorPermissions: ["platform.accounts.read", "platform.tenants.read"] };
    const result = await platform.prepareReadOnlyPlatformOperator(h, page, "e2e-reduced@example.test", "operador-actual", {
      addReadByUi: async (_h, target, detail, base) => { assert.equal(target, page); assert.equal(detail, current); assert.equal(base, h.base); calls.push("guardar por UI"); return changed; },
    });
    assert.equal(result, configured ? current : changed);
    assert.equal(calls.includes("guardar por UI"), !configured);
  }
  const h = { base: new URL("https://localtest.me"), api: async (_page, route) => ({ status: () => 200,
    json: async () => route.includes("/paged?") ? { items: [{ id: "otro" }] } : { id: "otro", kind: "Operator", operatorPermissions: ["platform.operators.manage"] } }) };
  await assert.rejects(() => platform.prepareReadOnlyPlatformOperator(h, {}, "e2e-reduced@example.test", "actual", {
    addReadByUi: async () => assert.fail("No cambiar permisos ajenos a la fixture reducida."),
  }));
});

test("el conflicto de configuración verifica la alerta móvil, sus salidas y el borrador intacto", async () => {
  let draft = "3"; const visible = [];
  const page = { getByRole: (role, options) => {
    if (role === "alert") return { filter: ({ hasText }) => { assert.equal(hasText, "Otra persona cambió esto mientras lo editabas."); return { waitFor: async () => visible.push("alerta") }; } };
    if (role === "button") return { waitFor: async () => visible.push(options.name) };
    assert.equal(role, "textbox"); assert.equal(options.name, "Organizaciones propias por persona");
    return { inputValue: async () => draft };
  } };
  await platform.assertPlatformSettingsConflict(page, 3);
  assert.deepEqual(visible, ["alerta", "Seguir editando", "Ver lo nuevo"]);
  draft = "2";
  await assert.rejects(platform.assertPlatformSettingsConflict(page, 3), /borrador/u);
});

test("abrir una acción espera la ficha y elige botón directo, hoja móvil o menú de escritorio", async () => {
  for (const mode of ["directo", "hoja", "menú"]) {
    const calls = [];
    const waiting = Promise.withResolvers(); const loaded = Promise.withResolvers();
    let ready = false;
    const action = (name) => ({ click: async () => calls.push(["click", name]) });
    const direct = { ...action("Cerrar sesiones"), filter: () => direct, first: () => direct,
      isVisible: async () => { assert.equal(ready, true, "isVisible no debe decidir mientras carga la ficha."); return mode === "directo"; },
      or: () => ({ first: () => ({ waitFor: async () => { waiting.resolve(); await loaded.promise; } }) }) };
    const menu = { ...action("Acciones"), filter: () => menu, first: () => menu,
      getAttribute: async () => mode === "hoja" ? "dialog" : "menu",
      focus: async () => calls.push(["focus"]), press: async (key) => calls.push(["press", key]) };
    const page = { getByRole: (role, options) => {
      if (role === "menuitem") { assert.equal(options.name, "Cerrar sesiones"); return action("opción Cerrar sesiones"); }
      return typeof options.name === "string" ? direct : menu;
    } };
    const opened = platform.openAction(page, "Cerrar sus sesiones");
    await waiting.promise;
    assert.deepEqual(calls, [], "La carga pendiente no debe provocar un menú alternativo incorrecto.");
    ready = true; loaded.resolve(); await opened;
    assert.deepEqual(calls, mode === "directo" ? [["click", "Cerrar sesiones"]]
      : mode === "hoja" ? [["click", "Acciones"], ["click", "opción Cerrar sesiones"]]
        : [["focus"], ["press", "ArrowDown"], ["click", "opción Cerrar sesiones"]]);
  }
});

test("la reparación de Plataforma sólo prepara sus fixtures y ejecuta las fichas y estados afectados", async () => {
  const numbers = [8, 9, 10, ...Array.from({ length: 18 }, (_, index) => index + 12), 35, 39];
  assert.deepEqual(platform.platformRepairDefinitions.map((entry) => entry.id), numbers.map((number) => `PLAT-${String(number).padStart(2, "0")}`));
  const records = []; const blocked = []; let closed = 0;
  const h = {
    width: 1440, base: new URL("https://localtest.me:7433"),
    newPage: async () => ({ isClosed: () => false, close: async () => { closed++; } }),
    registerPerson: async () => { throw new Error("No se creó la persona"); },
    registerBusiness: async () => { throw new Error("No se creó la organización"); },
    login: async () => { throw new Error("No ingresó el operador"); },
    record: async (id, _getPage, action) => { records.push(id); try { return { ok: true, value: await action() }; } catch (error) { return { ok: false, error }; } },
    block: async (id, reason) => blocked.push([id, reason]),
  };
  await platform.runPlatformRepairCases(h);
  assert.deepEqual(records, ["PLAT-08", "PLAT-09", "PLAT-10"]);
  assert.deepEqual(blocked.map(([id]) => id), numbers.slice(3).map((number) => `PLAT-${String(number).padStart(2, "0")}`));
  assert.ok(blocked.find(([id]) => id === "PLAT-23")[1].includes("PLAT-22"));
  assert.ok(blocked.find(([id]) => id === "PLAT-28")[1].includes("PLAT-27"));
  assert.equal(closed, 3);
});

test("un rechazo de seguridad exige estado, código y traceId reales", async () => {
  const response = (status, body) => ({ status: () => status, json: async () => body });
  await assert.doesNotReject(assertPlatformProblem(response(403, { code: "Http.Forbidden", traceId: "trace" }), 403, "Http.Forbidden"));
  for (const [status, body] of [[200, { code: "Http.Forbidden", traceId: "trace" }], [401, { code: "Http.Forbidden", traceId: "trace" }], [403, { code: "General.Error", traceId: "trace" }], [403, { code: "Http.Forbidden" }]]) {
    await assert.rejects(assertPlatformProblem(response(status, body), 403, "Http.Forbidden"));
  }
});

test("una dependencia fallida bloquea sólo sus casos y deja continuar los independientes", async () => {
  const executed = []; const blocked = []; const page = {};
  const step = createPlatformRecorder({
    record: async (id, currentPage, action) => { executed.push(id); assert.equal(currentPage(), page); try { return { ok: true, value: await action() }; } catch (error) { return { ok: false, error }; } },
    block: async (id, reason, currentPage) => { blocked.push({ id, reason }); assert.equal(currentPage, page); },
  });
  assert.equal((await step("fixture", page, async () => { throw new Error("No creada"); })).ok, false);
  let dependentRan = false;
  assert.equal((await step("depende", page, async () => { dependentRan = true; }, ["fixture"])).ok, false);
  assert.equal((await step("independiente", page, async () => "ok")).value, "ok");
  assert.equal((await step("no-comenzado", page, async () => "no", ["ausente"])).ok, false);
  assert.equal(dependentRan, false);
  assert.deepEqual(executed, ["fixture", "independiente"]);
  assert.deepEqual(blocked.map((item) => item.id), ["depende", "no-comenzado"]);
  assert.ok(blocked[0].reason.includes("fixture"));
});

test("una acción ejecuta una sola vez y conserva su resultado para habilitar la siguiente", async () => {
  const calls = []; const page = {};
  const step = createPlatformRecorder({ record: async (id, _page, action) => { calls.push(id); return { ok: true, value: await action() }; }, block: () => assert.fail("No debe bloquear") });
  assert.deepEqual(await step("primero", page, async () => "primero"), { ok: true, value: "primero" });
  assert.equal((await step("segundo", page, async () => "segundo", ["primero"])).ok, true);
  assert.deepEqual(calls, ["primero", "segundo"]);
});

test("la captura usa la pestaña del conflicto creada dentro de la acción", async () => {
  const initial = {}; const conflict = {}; let active = initial; let captured;
  const step = createPlatformRecorder({ record: async (_id, currentPage, action) => { const value = await action(); captured = currentPage(); return { ok: true, value }; }, block: () => assert.fail("No debe bloquear") });
  await step("409", () => active, async () => { active = conflict; return "Conflicto visible"; });
  assert.equal(captured, conflict);
});

test("la cobertura usa IDs reales y no confunde abrir una pestaña con modificar sus datos", () => {
  const known = new Set([...backendUseCases, ...guidedCases, ...screens.map((screen) => ({ id: `SCREEN-${screen.id}` }))].map((entry) => entry.id));
  assert.equal(new Set(platformDefinitions.map((entry) => entry.id)).size, platformDefinitions.length);
  for (const entry of platformDefinitions) for (const id of entry.covers) assert.ok(known.has(id), `Referencia desconocida: ${id}`);
  const tabCases = platformDefinitions.filter((entry) => ["PLAT-15", "PLAT-16", "PLAT-17"].includes(entry.id));
  for (const entry of tabCases) {
    assert.ok(entry.covers.includes("SCREEN-organizacion"));
    for (const writeId of ["BACK-PL-012", "BACK-PL-013", "BACK-PL-014"]) assert.equal(entry.covers.includes(writeId), false);
  }
  assert.ok(platformDefinitions.find((entry) => entry.id === "PLAT-23").covers.includes("BACK-ID-021"));
  assert.ok(platformDefinitions.find((entry) => entry.id === "PLAT-34").covers.includes("BACK-PL-027"));
});

const fixtures = {
  tenant: { id: "11111111-1111-4111-8111-111111111111", version: 7 },
  account: { id: "22222222-2222-4222-8222-222222222222" },
  operator: { id: "33333333-3333-4333-8333-333333333333", operatorVersion: 9 },
  ownerEmail: "e2e-denied@example.test",
};

test("los rechazos usan recursos reales, versión de organización y cuerpos propios de cada contrato", () => {
  const attempts = platformWriteAttempts(fixtures);
  assert.equal(attempts.organizations.length, 7);
  assert.equal(attempts.accounts.length, 4);
  assert.equal(attempts.operators.length, 2);
  for (const attempt of attempts.organizations.slice(1)) {
    assert.ok(attempt.route.includes(fixtures.tenant.id));
    assert.equal(attempt.data.version, fixtures.tenant.version);
  }
  for (const attempt of attempts.accounts) {
    assert.ok(attempt.route.includes(fixtures.account.id));
    assert.deepEqual(Object.keys(attempt.data), ["reason"], "Las acciones de cuenta no reciben versión de perfil.");
  }
  assert.equal(attempts.operators[1].data.version, fixtures.operator.operatorVersion);
  assert.throws(() => platformWriteAttempts({ ...fixtures, tenant: { version: 7 } }));
  assert.throws(() => platformWriteAttempts({ ...fixtures, tenant: { ...fixtures.tenant, version: null } }));
  assert.throws(() => platformWriteAttempts({ ...fixtures, ownerEmail: "persona@real.com" }));
});

test("el actor de sólo lectura posee ambos permisos de consulta y ningún permiso de gestión", () => {
  const me = { access: "platform", effectivePermissions: { platform: ["platform.accounts.read", "platform.tenants.read"] } };
  assert.doesNotThrow(() => assertReadOnlyPlatformPermissions(me));
  for (const permissions of [["platform.tenants.read"], ["platform.accounts.read"], [...me.effectivePermissions.platform, "platform.accounts.manage"]]) {
    assert.throws(() => assertReadOnlyPlatformPermissions({ ...me, effectivePermissions: { platform: permissions } }));
  }
  assert.throws(() => assertReadOnlyPlatformPermissions({ ...me, access: "consumer" }));
});

test("cada escritura prohibida exige Http.Forbidden antes de validación o confirmación reciente", async () => {
  const calls = [];
  const attempts = platformWriteAttempts(fixtures).accounts;
  const h = { api: async (_page, route, options) => {
    calls.push({ route, ...options });
    return { status: () => 403, json: async () => ({ code: "Http.Forbidden", traceId: "trace" }) };
  } };
  await assertDeniedPlatformWrites(h, {}, attempts);
  assert.equal(calls.length, 4);
  assert.equal(new Set(calls.map((call) => call.headers["Idempotency-Key"])).size, calls.length);
  for (const [status, code] of [[200, "Http.Forbidden"], [400, "Validation.Failed"], [403, "Platform.Authentication.ReauthenticationRequired"]]) {
    await assert.rejects(assertDeniedPlatformWrites({ api: async () => ({ status: () => status, json: async () => ({ code, traceId: "trace" }) }) }, {}, attempts));
  }
});

test("sólo los casos con actor y acción completos enlazan lectura con escrituras denegadas", () => {
  for (const [id, target] of [["PLAT-37", "BACK-PL-023"], ["PLAT-38", "BACK-PL-011"], ["PLAT-39", "BACK-PL-019"]]) {
    assert.ok(platformDefinitions.find((entry) => entry.id === id)?.covers.includes(target));
  }
  assert.equal(platformDefinitions.find((entry) => entry.id === "PLAT-01").covers.includes("BACK-PL-011"), false);
  assert.equal(platformDefinitions.find((entry) => entry.id === "PLAT-07").covers.includes("BACK-PL-019"), false);
});
