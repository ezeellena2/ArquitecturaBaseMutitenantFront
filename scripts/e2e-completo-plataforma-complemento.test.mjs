import assert from "node:assert/strict";
import test from "node:test";
import { supplementPlatformDefinitions, supplementPlatformProofGroups, supplementPlatformLimitations, supplementPhoneFixtures, requireAuditOnlyActor, requirePendingOperator, requireRecoveryUnchanged, requireRejectedNotice, requireCreationProfileIsolation, requireInvitedOwnerBusinessOnly, requireIdenticalReplay, requireUniqueOrganizationNotice, requireOperatorDeletion } from "./e2e-completo-plataforma-complemento.mjs";
import { backendUseCases } from "./e2e-completo-inventario-back.mjs";
import { guidedCases, screens } from "./e2e-completo-inventario-front.mjs";

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
