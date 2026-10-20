import assert from "node:assert/strict";
import test from "node:test";
import { backendUseCases } from "./e2e-completo-inventario-back.mjs";
import { publicSupplementDefinitions, requireUnavailableMatrix, chooseReferenceChanges, logoFixtures,
  requireAuditPrivacy, withPublicRestoration, publicHostUrl } from "./e2e-completo-publico-complemento.mjs";

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
