import assert from "node:assert/strict";
import test from "node:test";
import { backendUseCases } from "./e2e-completo-inventario-back.mjs";
import { publicSupplementDefinitions, requireUnavailableMatrix, chooseReferenceChanges, logoFixtures,
  requireAuditPrivacy, withPublicRestoration, publicHostUrl } from "./e2e-completo-publico-complemento.mjs";
import * as publicCases from "./e2e-completo-publico-complemento.mjs";

test("la barra móvil pública prepara01 sin alterar evidencia y registra sólo02 y05", async () => {
  const targets = ["PUB-C-02", "PUB-C-05"]; const recorded = []; const executed = [];
  const historical = new Map(publicSupplementDefinitions.map(({ id }) => [id, { status: "passed", image: id + "-previa.png" }]));
  const fixtureEvidence = historical.get("PUB-C-01");
  assert.deepEqual(publicCases.publicSupplementMobileBarDefinitions.map(({ id }) => id), targets);
  for (const row of publicCases.publicSupplementMobileBarDefinitions) assert.equal(row, publicSupplementDefinitions.find(({ id }) => id === row.id));
  const h = { width: 390, record: async (id, _page, action) => { recorded.push(id); const value = await action(); historical.set(id, { status: "passed", image: id + "-nueva.png" }); return { ok: true, value }; } };
  await publicCases.runPublicMobileBarCases(h, { run: async (selected) => {
    for (const row of publicSupplementDefinitions) {
      const result = await selected.record(row.id, () => ({}), async () => executed.push(row.id));
      if (row.id === "PUB-C-01") assert.equal(result.preparationOnly, true);
      else if (!targets.includes(row.id)) assert.deepEqual(result, { ok: false, skipped: true });
    }
  } });
  assert.deepEqual(recorded, targets); assert.deepEqual(executed, ["PUB-C-01", ...targets]);
  assert.equal(historical.get("PUB-C-01"), fixtureEvidence);
  await assert.rejects(publicCases.runPublicMobileBarCases({ ...h, width: 1440 }, { run: async () => assert.fail("Sólo390") }), /390/u);
});

test("si falla la fixture pública01 el runner móvil no registra02 ni05", async () => {
  const failure = new Error("No se creó la organización propia"); const recorded = [];
  const h = { width: 390, record: async (id) => recorded.push(id) };
  await assert.rejects(publicCases.runPublicMobileBarCases(h, { run: async (selected) => {
    await selected.record("PUB-C-01", () => ({}), async () => { throw failure; });
    assert.fail("No continúa sin fixture");
  } }), (error) => error.cause === failure);
  assert.deepEqual(recorded, []);
});

const problem = { status: 404, code: "PublicSite.PublicPage.NotFound", title: "No disponible", traceId: "traza" };
const matrix = () => ["unknown", "draft", "blocked", "suspended"].flatMap((state) => ["anonymous", "member"].flatMap((actor) => ["/api/public-site", "/api/public-site/logo"].map((route) => ({ state, actor, route, status: 404, body: { ...problem, traceId: state + actor + route } }))));
test("404 uniforme exige todas las variantes y actores sin aceptar información extra", () => {
  requireUnavailableMatrix(matrix());
  assert.throws(() => requireUnavailableMatrix(matrix().slice(1)));
  const leaked = matrix(); leaked[8].body.reason = "Bloqueada";
  assert.throws(() => requireUnavailableMatrix(leaked));
  const wrong = matrix(); wrong[5].status = 403; assert.throws(() => requireUnavailableMatrix(wrong));
});
test("las referencias cambiadas salen sólo de opciones habilitadas reales y diferentes", () => {
  const data = { cultures: [{ code: "actual", isEnabled: true }, { code: "nueva", isEnabled: true }],
    currencies: [{ code: "actual", isEnabled: true }, { code: "apagada", isEnabled: false }, { code: "nueva", isEnabled: true }],
    timeZones: [{ id: "actual", city: "Actual", isEnabled: true }, { id: "nueva", city: "Nueva", isEnabled: true }] };
  const selected = chooseReferenceChanges(data, { defaultCulture: "actual", defaultCurrency: "actual", defaultTimeZoneId: "actual" });
  assert.equal(selected.culture.code, "nueva"); assert.equal(selected.currency.code, "nueva"); assert.equal(selected.timeZone.id, "nueva");
  assert.throws(() => chooseReferenceChanges({ ...data, currencies: [] }, {}));
});
test("los archivos tienen bytes reales: PNG válido, firma incorrecta y tamaño excedido", () => {
  const files = logoFixtures();
  assert.equal(files.valid.buffer.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.notEqual(files.signature.buffer.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(files.oversized.buffer.length, 512 * 1024 + 1); assert.equal(files.signature.mimeType, "image/png");
});
test("auditoría permite correo del actor miembro pero oculta invitado y operador interno", () => {
  const own = { actorKind: "User", actorId: "dueña", actorEmail: "dueña@example.test", actorDisplayName: "Dueña", whereText: "Empresa propia", affectedDisplayName: "au•••@example.test", changes: [{ field: "Correo", oldValue: null, newValue: "au•••@example.test" }] };
  const platform = { actorKind: "PlatformOperator", actorId: null, actorEmail: null, actorDisplayName: null, actorText: "Plataforma", changes: [] };
  const args = { invitation: own, platforms: [platform], invitedEmail: "auditoria@example.test", actorId: "dueña", actorEmail: "dueña@example.test", companyName: "Empresa propia", operator: { id: "operador-secreto", email: "operador@example.test", displayName: "Operador interno" }, reason: "motivo interno" };
  requireAuditPrivacy(args);
  assert.throws(() => requireAuditPrivacy({ ...args, invitation: { ...own, affectedDisplayName: args.invitedEmail } }));
  assert.throws(() => requireAuditPrivacy({ ...args, platforms: [{ ...platform, actorId: args.operator.id }] }));
  assert.throws(() => requireAuditPrivacy({ ...args, platforms: [{ ...platform, changes: [{ newValue: args.reason }] }] }));
});
test("restauración UI ocurre si una aserción falla y no oculta el fallo original", async () => {
  let restored = false; const failure = new Error("fallo original");
  await assert.rejects(() => withPublicRestoration(async () => { throw failure; }, async () => { restored = true; }), (error) => error === failure);
  assert.equal(restored, true);
  await assert.rejects(() => withPublicRestoration(async () => { throw failure; }, async () => { throw new Error("fallo restauración"); }), AggregateError);
});

test("la captura conserva la página de la acción aunque la restauración use otra pestaña", async () => {
  for (const fail of [false, true]) {
    const visitor = {}; const operator = {}; const owner = {}; let page = visitor;
    const failure = new Error("falló la acción operadora");
    const run = () => withPublicRestoration(async () => {
      page = operator;
      if (fail) throw failure;
      return "acción completa";
    }, async () => { page = owner; }, { getPage: () => page, setPage: (target) => { page = target; } });
    if (fail) await assert.rejects(run, (error) => error === failure);
    else assert.equal(await run(), "acción completa");
    assert.equal(page, operator, "El finally no debe cambiar la evidencia al último actor que restaura.");
  }
});

test("si sólo falla restaurar, la captura queda en la página de ese fallo", async () => {
  const visitor = {}; const operator = {}; let page = visitor;
  await assert.rejects(() => withPublicRestoration(async () => "completa", async () => { page = operator; throw new Error("restauración operadora falló"); },
    { getPage: () => page, setPage: (target) => { page = target; } }), /restauración operadora/u);
  assert.equal(page, operator);
});

test("moderar espera las acciones de la página pública y no abre el menú de la organización durante la carga", async () => {
  for (const action of ["Despublicar", "Permitir publicar"]) {
    const waiting = Promise.withResolvers(); const loaded = Promise.withResolvers(); const calls = [];
    const actions = { filter: ({ visible }) => { assert.equal(visible, true); return actions; },
      waitFor: async () => { waiting.resolve(); await loaded.promise; }, click: async () => calls.push("acciones página pública") };
    const panel = { getByRole: (role, { name }) => { assert.equal(role, "button"); assert.equal(String(name), String(/^Acciones de /u)); return actions; } };
    const page = { getByRole: (role, options) => {
      if (role === "tab") { assert.deepEqual(options, { name: "Página pública", exact: true }); return { click: async () => calls.push("pestaña") }; }
      if (role === "tabpanel") return panel;
      assert.equal(role, "menuitem", "El botón global de la organización no identifica la fila de la página pública.");
      assert.deepEqual(options, { name: action, exact: true }); return { click: async () => calls.push(action) };
    } };
    const pending = publicCases.openPublicModerationAction(page, action);
    await waiting.promise; assert.deepEqual(calls, ["pestaña"]);
    loaded.resolve(); await pending;
    assert.deepEqual(calls, ["pestaña", "acciones página pública", action]);
  }
});

test("salir del editor usa la flecha móvil a Más o Inicio de escritorio sin navegación directa", async () => {
  for (const width of [390, 1440]) {
    const route = width === 390 ? "/mas" : "/org"; const name = width === 390 ? "Volver a Más" : "Inicio"; let clicks = 0;
    const href = {};
    const link = { filter: ({ visible }) => { assert.equal(visible, true); return link; },
      and: (target) => { assert.equal(target, href); return link; }, first: () => link, click: async () => { clicks++; } };
    const page = { goto: async () => assert.fail("La navegación directa no prueba la guarda del router."),
      locator: (selector) => { assert.equal(selector, `a[href="${route}"]`); return href; },
      getByRole: (role, options) => { assert.equal(role, "link"); assert.deepEqual(options, { name, exact: true }); return link; } };
    assert.equal(await publicCases.leaveOrganizationSettings({ width }, page), route); assert.equal(clicks, 1);
  }
});
test("hosts se limitan al subdominio propio y las lecturas API locales", () => {
  const base = new URL("https://localtest.me:5174");
  assert.equal(publicHostUrl(base, "propia", "/api/public-site").href, "https://propia.localtest.me:5174/api/public-site");
  for (const slug of ["ajena.example.com", "../propia", "https://otro"]) assert.throws(() => publicHostUrl(base, slug, "/api/public-site"));
  assert.throws(() => publicHostUrl(base, "propia", "https://externo.test/api/public-site"));
});
test("ocho records únicos enlazan sólo los siete contratos completos del inventario", () => {
  assert.equal(publicSupplementDefinitions.length, 8); assert.equal(new Set(publicSupplementDefinitions.map((item) => item.id)).size, 8);
  const known = new Set(backendUseCases.map((item) => item.id));
  const covers = publicSupplementDefinitions.flatMap((item) => item.covers);
  assert.deepEqual(covers.sort(), ["BACK-CF-001", "BACK-CF-002", "BACK-CF-007", "BACK-PU-005", "BACK-PU-006", "BACK-PU-008", "BACK-PU-009"]);
  for (const id of covers) assert.ok(known.has(id));
});
