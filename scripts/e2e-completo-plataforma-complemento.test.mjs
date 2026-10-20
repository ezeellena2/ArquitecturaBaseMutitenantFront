import assert from "node:assert/strict";
import test from "node:test";
import { supplementPlatformDefinitions, supplementPhoneFixtures, requireAuditOnlyActor, requirePendingOperator, requireRecoveryUnchanged, requireRejectedNotice } from "./e2e-completo-plataforma-complemento.mjs";
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

test("hay quince acciones y sólo se enlazan las ramas completas con sus actores", () => {
  assert.equal(supplementPlatformDefinitions.length, 15);
  assert.equal(new Set(supplementPlatformDefinitions.map((entry) => entry.id)).size, 15);
  const known = new Set([...backendUseCases, ...guidedCases, ...screens.map((entry) => ({ id: "SCREEN-" + entry.id }))].map((entry) => entry.id));
  const covers = supplementPlatformDefinitions.flatMap((entry) => entry.covers);
  for (const id of covers) assert.ok(known.has(id));
  for (const id of ["PL-020", "PL-021", "PL-022", "PL-030", "RE-002", "RE-006", "RE-008", "RE-009"]) assert.ok(covers.includes("BACK-" + id), id);
  assert.equal(covers.includes("BACK-PL-024"), false, "Autoedición no prueba LastManager.");
  assert.equal(covers.includes("BACK-RE-007"), false, "Operadora no prueba la rama Sin cuenta.");
  for (const id of ["GUIA-crear-una-organizacion-01", "GUIA-aprobar-una-organizacion-05", "GUIA-publicar-una-version-legal-03"]) assert.ok(covers.includes(id));
});
