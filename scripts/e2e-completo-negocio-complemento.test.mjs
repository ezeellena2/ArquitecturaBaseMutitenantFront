import assert from "node:assert/strict";
import test from "node:test";
import { backendUseCases } from "./e2e-completo-inventario-back.mjs";
import { businessDefinitions } from "./e2e-completo-negocio.mjs";
import { guidedCases, screens } from "./e2e-completo-inventario-front.mjs";
import { supplementBusinessDefinitions, businessHomeRepairDefinitions, runBusinessHomeRepairCases, assertUserFacetCounts, assertMemberChangesStayInCompany, requireHomeGroupPreview } from "./e2e-completo-negocio-complemento.mjs";

test("el complemento enlaza sólo acciones completas todavía sin covers nativos de Negocio", () => {
  assert.equal(supplementBusinessDefinitions.length, 13);
  assert.equal(new Set(supplementBusinessDefinitions.map((entry) => entry.id)).size, 13);
  const known = new Set([...backendUseCases, ...guidedCases].map((entry) => entry.id).concat(screens.map((entry) => `SCREEN-${entry.id}`)));
  const prior = new Set(businessDefinitions.flatMap((entry) => entry.covers));
  for (const item of supplementBusinessDefinitions) for (const id of item.covers) {
    assert.ok(known.has(id), id); assert.equal(prior.has(id), false, `No repetir ${id}.`);
  }
});

test("los conteos cruzados no aceptan sumar estados duplicados ni perder la otra empresa", () => {
  const counts = { all: 15, active: 3, invited: 12, expired: 0, pendingDeletion: 0, inactive: 0, companyAll: 12, companies: { a: 12, b: 1 } };
  const expected = { all: 15, active: 3, invited: 12, companyAll: 12, companies: { a: 12, b: 1 } };
  assertUserFacetCounts(counts, expected);
  assert.throws(() => assertUserFacetCounts({ ...counts, all: 16 }, expected));
  assert.throws(() => assertUserFacetCounts({ ...counts, companies: { a: 12, b: 0 } }, expected));
  assert.throws(() => assertUserFacetCounts({ ...counts, active: 4 }, { ...expected, active: 4 }));
});

test("gestionar un miembro de empresa no puede cambiar su identidad, estado o rol organizacional ni otra empresa", () => {
  const before = { memberId: "persona", userId: "identidad", state: "Active", roles: [{ id: "org" }], version: 8,
    companies: [{ companyId: "a", status: "Active", roles: [{ id: "antes" }] }, { companyId: "b", status: "Active", roles: [{ id: "b-lector" }] }] };
  const after = { ...before, companies: [{ companyId: "b", status: "Active", roles: [{ id: "b-lector" }] }, { companyId: "a", status: "Inactive", roles: [] }] };
  assertMemberChangesStayInCompany(before, after, "a");
  assert.throws(() => assertMemberChangesStayInCompany(before, { ...after, state: "Inactive" }, "a"));
  assert.throws(() => assertMemberChangesStayInCompany(before, { ...after, roles: [] }, "a"));
  assert.throws(() => assertMemberChangesStayInCompany(before, { ...after, companies: [after.companies[1]] }, "a"));
  assert.throws(() => assertMemberChangesStayInCompany(before, { ...after, userId: "otra" }, "a"));
});

test("Inicio exige total real mayor a diez y exactamente diez pendientes únicos de ese grupo", () => {
  const group = { kind: "domainUnverified", totalCount: 11, items: Array.from({ length: 10 }, (_, index) => ({ targetId: `dominio-${index}` })) };
  assert.equal(requireHomeGroupPreview({ pendingGroups: [group] }, "domainUnverified", 11), group);
  assert.throws(() => requireHomeGroupPreview({ pendingGroups: [{ ...group, totalCount: 10 }] }, "domainUnverified", 11));
  assert.throws(() => requireHomeGroupPreview({ pendingGroups: [{ ...group, items: [...group.items, { targetId: "once" }] }] }, "domainUnverified", 11));
  assert.throws(() => requireHomeGroupPreview({ pendingGroups: [{ ...group, items: group.items.map(() => ({ targetId: "repetido" })) }] }, "domainUnverified", 11));
  assert.throws(() => requireHomeGroupPreview({ pendingGroups: [] }, "domainUnverified", 11));
});

test("la reparación de Inicio registra sólo SUP13 con una organización propia y sale por UI aun al fallar", async () => {
  const events = []; const page = { close: async () => { events.push("cerrar"); } };
  const h = { newPage: async () => page, registerBusiness: async (target) => { assert.equal(target, page); events.push("registrar organización por UI"); return { email: "propia@example.test" }; },
    record: async (id, getPage, action) => { assert.equal(getPage(), page); events.push(id); try { return { ok: true, value: await action() }; } catch (error) { return { ok: false, error }; } },
    signOut: async (target) => { assert.equal(target, page); events.push("salir por UI"); } };
  const failure = new Error("falló comprobación");
  const result = await runBusinessHomeRepairCases(h, { check: async () => { throw failure; } });
  assert.equal(result.ok, false); assert.equal(result.error, failure);
  assert.deepEqual(events, ["registrar organización por UI", "SUP-BIZ-13", "salir por UI", "cerrar"]);
  assert.deepEqual(businessHomeRepairDefinitions.map((entry) => entry.id), ["SUP-BIZ-13"]);
  assert.equal(businessHomeRepairDefinitions[0], supplementBusinessDefinitions.find((entry) => entry.id === "SUP-BIZ-13"));
});
