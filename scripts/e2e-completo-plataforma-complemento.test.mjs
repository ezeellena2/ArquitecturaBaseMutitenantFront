import assert from "node:assert/strict";
import test from "node:test";
import { supplementPlatformDefinitions, supplementPlatformProofGroups, supplementPlatformLimitations, supplementPhoneFixtures, requireAuditOnlyActor, requirePendingOperator, requireRecoveryUnchanged, requireRejectedNotice, requireCreationProfileIsolation, requireInvitedOwnerBusinessOnly, requireIdenticalReplay, requireUniqueOrganizationNotice, requireOperatorDeletion } from "./e2e-completo-plataforma-complemento.mjs";
import { backendUseCases } from "./e2e-completo-inventario-back.mjs";
import { guidedCases, screens } from "./e2e-completo-inventario-front.mjs";
import * as platform from "./e2e-completo-plataforma-complemento.mjs";

test("la fila móvil de Email usa los dos métodos combinados y no exige textos separados inexistentes", () => {
  for (const sameMask of [false, true]) {
    const item = { previousMethodType: "Email", newMethodType: "Email", previousMethod: "e2•••@example.test", newMethod: sameMask ? "e2•••@example.test" : "re•••@propia.example.test" };
    const target = { text: `${item.previousMethod} → ${item.newMethod} Pendiente` };
    const all = [target, { text: `${item.newMethod} → ${item.previousMethod} Resuelto` }];
    const page = { viewportSize: () => ({ width: 390 }), getByRole: (role) => {
      assert.equal(role, "listitem"); return { filter: ({ hasText, has }) => {
        assert.equal(has, undefined, "Email se dibuja como un texto combinado, sin spans por máscara.");
        assert.equal(hasText, `${item.previousMethod} → ${item.newMethod}`);
        return all.filter((row) => row.text.includes(hasText));
      } };
    } };
    const rows = platform.supplementRecoveryRow(page, item);
    assert.ok(rows.includes(target));
    if (!sameMask) assert.deepEqual(rows, [target]);
  }
});

test("los destinos propios se distinguen aun después de ocultar el correo y conservan example.test", () => {
  const mask = (email) => email.slice(0, 2) + "•••@" + email.split("@")[1];
  const first = platform.rejectionRecoveryDestination("1234abcd"); const second = platform.rejectionRecoveryDestination("5678cdef");
  for (const email of [first, second]) assert.match(email, /^[a-z0-9-]+@[a-z0-9-]+\.example\.test$/u);
  assert.notEqual(mask(first), mask(second)); assert.notEqual(mask(first), mask("e2e-completo-persona@example.test"));
  assert.throws(() => platform.rejectionRecoveryDestination('tag"inválido'));
});

test("la reparación de recuperaciones sólo declara08/09 y bloquea09 si no pudo crear su propia persona", async () => {
  assert.deepEqual(platform.platformRecoveryRepairDefinitions.map((entry) => entry.id), ["PLAT-C-08", "PLAT-C-09"]);
  const calls = []; const blocked = []; let closed = 0;
  const h = { width: 390, base: new URL("https://localtest.me"), newPage: async () => ({ isClosed: () => false, close: async () => { closed++; } }),
    registerPerson: async () => { throw new Error("No pudo registrar su persona"); },
    registerBusiness: async () => assert.fail("No precisa organización"),
    record: async (id, _page, action) => { calls.push(id); try { return { ok: true, value: await action() }; } catch (error) { return { ok: false, error }; } },
    block: async (id) => blocked.push(id),
  };
  await platform.runPlatformRecoveryRepairCases(h);
  assert.deepEqual(calls, ["PLAT-C-08"]); assert.deepEqual(blocked, ["PLAT-C-09"]); assert.equal(closed, 2);
});

test("Inicio móvil exige Para resolver en su propia ruta y no lo reemplaza por ficha o Asistente", async () => {
  for (const width of [390, 1440]) {
    const calls = []; const missing = new Error("Para resolver no está disponible en el Inicio móvil.");
    const region = { waitFor: async () => { calls.push("Para resolver"); if (width === 390) throw missing; } };
    const page = { goto: async (url) => calls.push(new URL(url).pathname), getByRole: (role, options) => {
      assert.equal(role, "region"); assert.deepEqual(options, { name: "Para resolver", exact: true }); return region;
    } };
    const open = () => platform.openPlatformPendingHome({ width, base: new URL("https://localtest.me") }, page, {
      acceptNotice: async () => calls.push("Aviso Asistente escritorio"),
    });
    if (width === 390) await assert.rejects(open, (error) => error === missing);
    else assert.equal(await open(), region);
    assert.deepEqual(calls, width === 390 ? ["/plataforma", "Para resolver"] : ["/plataforma", "Aviso Asistente escritorio", "Para resolver"]);
  }
});

test("un replay201 sin Location sigue fallando aunque conserve cuerpo e IDs", () => {
  const location = "https://localtest.me/api/platform/tenants/propia";
  const response = (value) => ({ headers: () => value === undefined ? {} : { location: value } });
  platform.requireCreatedReplayLocation(response(location), response(location));
  assert.throws(() => platform.requireCreatedReplayLocation(response(location), response(undefined)), /replay201.*Location/u);
  assert.throws(() => platform.requireCreatedReplayLocation(response(undefined), response(undefined)), /alta201.*Location/u);
  assert.throws(() => platform.requireCreatedReplayLocation(response(location), response(location + "-ajena")), /replay201.*Location/u);
});

test("el motivo de Historial se verifica en la fila propia aunque móvil lo combine con el actor", async () => {
  for (const width of [390, 1440]) for (const present of [true, false]) {
    let waited = false; const reason = "Motivo propio único";
    const result = { waitFor: async () => { waited = true; assert.ok(present, "La fila no contiene el motivo, aunque exista en el banner exterior."); } };
    const panel = {
      getByRole: (role) => { assert.equal(width, 390); assert.equal(role, "listitem"); return { filter: ({ hasText }) => { assert.equal(hasText, reason); return result; } }; },
      getByText: (text, options) => { assert.equal(width, 1440); assert.equal(text, reason); assert.deepEqual(options, { exact: true }); return { filter: () => ({ first: () => result }) }; },
    };
    const page = { getByRole: (role) => { assert.equal(role, "tabpanel"); return panel; } };
    const verify = () => platform.waitForOrganizationHistoryReason({ width }, page, reason);
    if (present) await verify(); else await assert.rejects(verify, /fila no contiene/u);
    assert.equal(waited, true);
  }
});

test("los teléfonos son exclusivos de cada ancho y del rango admitido por el control existente", () => {
  const all = [1440, 390].flatMap((width) => Object.values(supplementPhoneFixtures(width)));
  assert.equal(new Set(all).size, 8);
  for (const phone of all) assert.match(phone, /^\+54911345678(?:1[0-7])$/u);
  assert.throws(() => supplementPhoneFixtures(800));
});

test("audit-only no certifica la consulta con un operador que también puede leer organizaciones", () => {
  const me = { access: "platform", effectivePermissions: { platform: ["platform.audit.read"] } };
  assert.doesNotThrow(() => requireAuditOnlyActor(me));
  assert.throws(() => requireAuditOnlyActor({ ...me, access: "business" }));
  assert.throws(() => requireAuditOnlyActor({ ...me, effectivePermissions: { platform: ["platform.audit.read", "platform.tenants.read"] } }));
});

test("una invitación de operador no puede tener Personal, organizaciones ni permisos adicionales", () => {
  const detail = { kind: "Operator", state: "Invited", hasPersonalSpace: false, organizations: [], operatorPermissions: ["platform.audit.read"] };
  assert.doesNotThrow(() => requirePendingOperator(detail, ["platform.audit.read"]));
  for (const patch of [{ hasPersonalSpace: true }, { organizations: [{ id: "org" }] }, { state: "Active" }, { operatorPermissions: ["platform.audit.read", "platform.settings.manage"] }]) {
    assert.throws(() => requirePendingOperator({ ...detail, ...patch }, ["platform.audit.read"]));
  }
});

test("un destino ocupado debe conservar Pending, versión y métodos originales sin aprobar por inferencia", () => {
  const before = { id: "pedido", version: 7, status: "Pending" };
  const methods = [{ id: "anterior", type: "Phone", isPrimary: true }];
  assert.doesNotThrow(() => requireRecoveryUnchanged(before, { ...before }, methods, [...methods]));
  for (const after of [{ ...before, version: 8 }, { ...before, status: "Approved" }, { ...before, id: "otro" }]) assert.throws(() => requireRecoveryUnchanged(before, after, methods, methods));
  assert.throws(() => requireRecoveryUnchanged(before, before, methods, [...methods, { id: "nuevo" }]));
});

test("el aviso de rechazo real no publica el motivo interno", () => {
  const eml = "Content-Type: text/plain; charset=utf-8\r\n\r\nNo pudimos recuperar tu cuenta\r\nRevisamos tu pedido y no pudimos confirmar que la cuenta sea tuya.\r\n";
  assert.doesNotThrow(() => requireRejectedNotice(eml, "Motivo interno privado"));
  assert.throws(() => requireRejectedNotice(eml + "Motivo interno privado", "Motivo interno privado"));
  assert.throws(() => requireRejectedNotice("Content-Type: text/plain\r\n\r\nCódigo enviado", "Motivo interno privado"));
});

test("hay diecinueve acciones y sólo se enlazan las ramas completas con sus actores", () => {
  assert.equal(supplementPlatformDefinitions.length, 19);
  assert.equal(new Set(supplementPlatformDefinitions.map((entry) => entry.id)).size, 19);
  const known = new Set([...backendUseCases, ...guidedCases, ...screens.map((entry) => ({ id: "SCREEN-" + entry.id }))].map((entry) => entry.id));
  const covers = supplementPlatformDefinitions.flatMap((entry) => entry.covers);
  for (const id of covers) assert.ok(known.has(id));
  for (const id of ["PL-020", "PL-021", "PL-022", "PL-030", "RE-002", "RE-006", "RE-008", "RE-009"]) assert.ok(covers.includes("BACK-" + id), id);
  assert.equal(covers.includes("BACK-PL-024"), false, "Autoedición no prueba LastManager.");
  assert.equal(covers.includes("BACK-RE-007"), false, "Operadora no prueba la rama Sin cuenta.");
  for (const id of ["GUIA-crear-una-organizacion-01", "GUIA-aprobar-una-organizacion-05", "GUIA-publicar-una-version-legal-03"]) assert.ok(covers.includes(id));
  assert.deepEqual(supplementPlatformDefinitions.find((row) => row.id === "PLAT-C-16").covers, ["BACK-PL-007"]);
  assert.deepEqual(supplementPlatformProofGroups, { "BACK-PL-008": [["PLAT-C-13", "PLAT-C-17"]], "BACK-PL-018": [["PLAT-25", "PLAT-26", "PLAT-C-18"]] });
  assert.deepEqual(supplementPlatformDefinitions.find((row) => row.id === "PLAT-C-17").covers, []);
  assert.deepEqual(supplementPlatformDefinitions.find((row) => row.id === "PLAT-C-18").covers, ["GUIA-suspender-y-reactivar-03", "GUIA-suspender-y-reactivar-05"]);
  assert.deepEqual(supplementPlatformDefinitions.at(-1).covers, ["BACK-PL-006"]);
  assert.deepEqual(supplementPlatformLimitations["BACK-PL-024"].partialExecutionIds, ["PLAT-C-05"]);
  assert.match(supplementPlatformLimitations["BACK-PL-024"].reason, /gestores.*base/u);
});

test("crear una organización no crea cuenta para el Dueño pendiente ni perfiles públicos del operador", () => {
  const operator = { id: "operador", access: "platform", hasPersonalSpace: false, organizations: [] };
  const organization = { id: "org", status: "Active", ownerEmail: "own@example.test", owners: [], companyCount: 1, memberCount: 1 };
  const input = { beforeOperator: operator, afterOperator: { ...operator }, organization, ownerEmail: "own@example.test", pendingAccounts: { totalCount: 0, items: [] }, createdId: "org" };
  requireCreationProfileIsolation(input);
  for (const patch of [{ afterOperator: { ...operator, hasPersonalSpace: true } }, { afterOperator: { ...operator, organizations: [{ id: "org" }] } }, { pendingAccounts: { totalCount: 1, items: [{ id: "cuenta" }] } }, { organization: { ...organization, owners: [{ id: "operador" }] } }, { organization: { ...organization, memberCount: 2 } }]) assert.throws(() => requireCreationProfileIsolation({ ...input, ...patch }));
  const owner = { id: "dueño", access: "business", activeTenantId: "org", hasPersonalSpace: false, organizations: [{ id: "org" }] };
  requireInvitedOwnerBusinessOnly(owner, "org", "operador");
  for (const patch of [{ id: "operador" }, { hasPersonalSpace: true }, { access: "consumer" }, { activeTenantId: "otra" }, { organizations: [{ id: "otra" }] }]) assert.throws(() => requireInvitedOwnerBusinessOnly({ ...owner, ...patch }, "org", "operador"));
});

test("el replay conserva exactamente la respuesta, incluidos IDs y versión", () => {
  const receipt = { id: "org", firstCompanyId: "empresa", invitationId: "invitación", version: 1 };
  requireIdenticalReplay(receipt, { ...receipt });
  for (const patch of [{ id: "otra" }, { firstCompanyId: "otra" }, { invitationId: "otra" }, { version: 2 }]) assert.throws(() => requireIdenticalReplay(receipt, { ...receipt, ...patch }));
});

test("un aviso único de rechazo conserva el nombre público sin publicar el motivo interno", () => {
  const body = "Content-Type: text/plain; charset=utf-8\r\n\r\nNo aprobamos el alta de tu organización\r\nNo aprobamos la solicitud de alta de Organización propia. Tu cuenta y tu espacio personal siguen funcionando.";
  const options = { name: "Organización propia", kind: "rejected", reason: "Motivo interno" };
  requireUniqueOrganizationNotice([{ body }], options);
  assert.throws(() => requireUniqueOrganizationNotice([], options)); assert.throws(() => requireUniqueOrganizationNotice([{ body }, { body }], options));
  assert.throws(() => requireUniqueOrganizationNotice([{ body: body + "Motivo interno" }], options));
  assert.throws(() => requireUniqueOrganizationNotice([{ body: body.replaceAll("Organización propia", "Otra organización") }], options));
});

test("la baja del operador tiene gracia exacta de treinta días, autor, fecha real y motivo persistido", () => {
  const before = Date.parse("2026-10-20T10:00:00Z"); const after = before + 2000;
  const detail = { state: "PendingDeletion", deletion: { requestedAtUtc: "2026-10-20T10:00:01Z", scheduledForUtc: "2026-11-19T10:00:01Z", requestedByPlatform: true }, lastStateChange: { atUtc: "2026-10-20T10:00:01Z", reason: "Baja propia" } };
  requireOperatorDeletion(detail, { before, after, reason: "Baja propia" });
  for (const patch of [{ state: "Active" }, { deletion: { ...detail.deletion, requestedByPlatform: false } }, { deletion: { ...detail.deletion, scheduledForUtc: "2026-11-18T10:00:01Z" } }, { deletion: { ...detail.deletion, requestedAtUtc: "2026-10-19T10:00:01Z" } }, { lastStateChange: { ...detail.lastStateChange, reason: "Otro" } }]) assert.throws(() => requireOperatorDeletion({ ...detail, ...patch }, { before, after, reason: "Baja propia" }));
});
