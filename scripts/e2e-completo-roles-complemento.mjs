import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { syntheticEmail } from "./e2e-completo-soporte.mjs";
import { clickForResponse, forceBusinessLogin, requireProblem, runBusinessDependencyCase, assertCompanyStateVisible, openBusinessBarMenu } from "./e2e-completo-negocio.mjs";
import { selectMobileBarCases } from "./e2e-completo-seleccion-movil.mjs";
import { cleanupContinuationSessions } from "./e2e-completo-continuacion.mjs";
import { assertViewport } from "./e2e-completo-personal.mjs";

const definition = (number, actor, action, route, expected, covers = []) => ({ id: `SUP-RO-${number}`, area: "Roles y permisos de empresa", actor, action, route, expected, covers, critical: true,
  source: "docs/features/roles.md; docs/features/organizaciones.md; docs/features/inicio.md" });
export const roleSupplementDefinitions = [
  definition("01", "Dueña nueva", "Crear una organización propia y su primera empresa por UI", "/registro/empresa", "Alta empresarial real con OTP, organización activa y empresa propia; no se reutilizan miembros de otras suites."),
  definition("02", "Dueña", "Leer el catálogo traducido y comprobar la inmutabilidad de ambos roles de sistema", "/org/roles", "Catálogo es/en en el orden de Permissions.All; Dueño y Administrador son de sistema, UI de sólo lectura y PUT/DELETE403 sin cambiar datos ni versión.", ["BACK-RO-001", "BACK-RO-008"]),
  definition("03", "Dueña y dos destinatarios de invitación", "Preparar roles con personas activas, invitadas y deshabilitadas", "/org/usuarios", "Tres roles específicos de la empresa y tres invitaciones por UI; dos cuentas se activan con OTP real y una membresía se deshabilita por UI."),
  definition("04", "Dueña", "Borrar y cambiar alcance de los tres roles asignados", "/org/roles/:id", "Active, Invited e Inactive: DELETE409 HasUsers y PUT409 ScopeChangeHasUsers, todos con userCount1; rol y miembro conservan datos, asignación y versión.", ["BACK-RO-007"]),
  definition("05", "Miembro con sólo un rol de empresa y Dueña", "Ver Tus empresas tras ingresar y comprobar la membresía activa", "/org", "El miembro ve su empresa y rol en Inicio; Me no concede permisos organizacionales o de Plataforma; la Dueña lo ve Activo en Usuarios.", ["SCREEN-inicio-miembro", "GUIA-invitar-y-aceptar-06"]),
  definition("06", "Dueña y miembro con token empresarial ya emitido", "Inactivar y reactivar la empresa sin perder datos, miembros ni permisos al restaurar", "/org/empresas/:id", "UI Active→Inactive→Active; la misma pestaña del miembro conserva identidad/token y pierde/recupera sus permisos, Inicio y GET miembros200→403→200. Datos y membresías intactos al reactivar.", ["BACK-EM-005"]),
];
export const roleSupplementMobileBarDefinitions = roleSupplementDefinitions.filter((entry) => entry.id === "SUP-RO-06");

export async function runRoleMobileBarCases(h, { run = runRoleSupplementCases } = {}) {
  return run(selectMobileBarCases(h, {
    targets: roleSupplementMobileBarDefinitions.map(({ id }) => id), prepare: ["SUP-RO-01", "SUP-RO-03", "SUP-RO-05"],
  }));
}

export function assertPermissionCatalog(actual, expected) {
  assert.deepEqual(actual.map((group) => group.area), expected.map((group) => group.area), "El orden de áreas sale de Permissions.All.");
  assert.deepEqual(actual.flatMap((group) => group.permissions.map((permission) => permission.code)), expected.flatMap((group) => group.permissions.map((permission) => permission.code)), "El catálogo debe ser completo y mantener el orden del dominio.");
  for (const [index, group] of actual.entries()) {
    assert.equal(group.name, expected[index].name, "El nombre del grupo debe estar traducido.");
    for (const [position, permission] of group.permissions.entries()) {
      assert.equal(permission.name, expected[index].permissions[position].name, "El permiso debe tener su nombre traducido.");
      assert.equal(permission.description, expected[index].permissions[position].description, "La descripción debe estar traducida.");
    }
  }
}

export function assertAssignedRoleUnchanged({ role, member, state, code, problem, afterRole, afterMember }) {
  assert.equal(role.isSystemRole, false);
  assert.equal(role.userCount, 1);
  assert.equal(member.state, state, "La variante debe usar el estado real previsto.");
  assert.ok(member.companies.some((company) => company.companyId === role.companyId && company.roles.some((assigned) => assigned.id === role.id)), "La persona debe tener una asignación real a este rol.");
  assert.equal(problem.code, code); assert.equal(problem.userCount, 1);
  assert.deepEqual(afterRole, role, "El rechazo no cambia el rol, sus permisos ni su versión.");
  assert.deepEqual(afterMember, member, "El rechazo no cambia el miembro ni sus asignaciones.");
}

export function assertCompanyOnlyPermissions(me, { userId, tenantId, companyId }, active) {
  assert.equal(me.id, userId, "La pestaña debe seguir siendo del miembro, no de la Dueña.");
  assert.equal(me.access, "business"); assert.equal(me.activeTenantId, tenantId);
  assert.deepEqual(me.effectivePermissions.organization, []);
  assert.deepEqual(me.effectivePermissions.platform, []);
  assert.deepEqual(me.effectivePermissions.companies, active ? { [companyId]: ["company.members.read"] } : {}, "Sólo una empresa activa puede aportar el permiso de su rol.");
}

export function assertCompanyCyclePreserved(before, after) {
  assert.equal(before.company.status, "Active"); assert.equal(after.company.status, "Active");
  assert.ok(after.company.version > before.company.version, "El ciclo debe haber escrito versiones reales.");
  const data = ({ status: _status, version: _version, ...rest }) => rest;
  assert.deepEqual(data(after.company), data(before.company), "El ciclo no pierde datos de la empresa.");
  assert.deepEqual(after.members, before.members, "Reactivar conserva la lista completa de miembros y sus roles.");
  assert.deepEqual(after.member, before.member, "La membresía de organización y sus asignaciones siguen intactas.");
}

export async function assertCompanyHomeCard(page, company, roleName) {
  await heading(page, "Tus empresas");
  const name = new RegExp(company.name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u");
  const card = page.getByRole("link", { name });
  await card.waitFor();
  assert.equal(await card.getAttribute("href"), `/org/empresas/${company.id}`, "La tarjeta debe abrir la empresa propia.");
  const text = await card.innerText();
  assert.ok(text.includes(company.name)); assert.ok(text.includes(roleName), "La tarjeta debe mostrar el rol asignado al miembro.");
}

const read = async (h, page, route, options) => { const response = await h.api(page, route, options); assert.equal(response.status(), 200, `La lectura ${route} debe responder200.`); return response.json(); };
const heading = (page, name) => page.getByRole("heading", { name, exact: true }).waitFor();
const visit = (h, page, route) => page.goto(new URL(route, h.base).href);
const roleBody = (role) => ({ name: role.name, description: role.description, scope: role.scope, companyId: role.companyId, permissions: role.permissions, version: role.version });

// Mismo orden explícito de Permissions.OrganizationScoped y CompanyScoped (Permissions.All).
const permissionOrder = ["users.read", "users.invite", "users.manage", "roles.read", "roles.manage", "roles.assign", "companies.read", "companies.manage", "settings.read", "settings.manage", "audit.read", "publicpage.manage", "assistant.use", "assistant.configure", "whatsapp.customers", "whatsapp.internal", "whatsapp.broadcasts", "whatsapp.manage", "company.members.read", "company.members.manage"];
const unescapeXml = (value) => value.replace(/&(?:amp|lt|gt|quot|apos);/g, (entity) => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" })[entity]);
async function expectedCatalog(language) {
  const file = `../../ArquitecturaBaseMutitenant/src/ArquitecturaBaseMultitenant.Application/Resources/Permissions${language === "en" ? ".en" : ""}.resx`;
  const xml = await readFile(new URL(file, import.meta.url), "utf8");
  const texts = new Map([...xml.matchAll(/<data\s+name="([^"]+)"[^>]*>\s*<value>([\s\S]*?)<\/value>\s*<\/data>/g)].map((match) => [match[1], unescapeXml(match[2])]));
  const text = (key) => { assert.ok(texts.get(key), `Falta el resource ${key}.`); return texts.get(key); };
  const groups = new Map();
  for (const code of permissionOrder) {
    const area = code.split(".")[0];
    if (!groups.has(area)) groups.set(area, { area, name: text(`Area.${area}`), permissions: [] });
    groups.get(area).permissions.push({ code, name: text(`Permission.${code}`), description: text(`PermissionDescription.${code}`) });
  }
  return [...groups.values()];
}

async function createRole(h, page, company, name) {
  await visit(h, page, "/org/roles/nuevo");
  await page.getByRole("textbox", { name: "Nombre", exact: true }).fill(name);
  await page.getByRole("combobox", { name: "Vale en", exact: true }).click();
  await page.getByRole("option", { name: company.name, exact: true }).click();
  await page.getByRole("button", { name: "Abrir o cerrar Miembros", exact: true }).click();
  await page.getByRole("checkbox", { name: "Ver miembros", exact: true }).check();
  const created = await clickForResponse(page, page.getByRole("button", { name: "Crear rol", exact: true }), "/api/roles", "POST", 201);
  const id = await created.json(); assert.match(id, /^[0-9a-f-]{36}$/iu); await heading(page, name);
  const role = await read(h, page, `/api/roles/${id}`);
  assert.equal(role.scope, "SpecificCompany"); assert.equal(role.companyId, company.id); assert.deepEqual(role.permissions, ["company.members.read"]);
  return role;
}

async function invite(h, page, email, company, role) {
  await visit(h, page, "/org/usuarios");
  await page.getByRole("button", { name: "Invitar usuario", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Invitar usuario", exact: true });
  await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill(email);
  await dialog.getByRole("combobox", { name: "Empresa", exact: true }).click();
  await page.getByRole("option", { name: company.name, exact: true }).click();
  await dialog.getByRole("button", { name: "Roles en la empresa", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: role.name, exact: true }).click(); await page.keyboard.press("Escape");
  const issued = await clickForResponse(page, dialog.getByRole("button", { name: "Invitar", exact: true }), "/api/users/invitations", "POST", 201);
  const { invitationId } = await issued.json(); assert.ok(invitationId); await dialog.waitFor({ state: "hidden" });
  const list = await read(h, page, `/api/users/paged?search=${encodeURIComponent(email)}&pageSize=100`);
  const member = list.items.find((item) => item.invitationId === invitationId); assert.ok(member?.memberId);
  const detail = await read(h, page, `/api/users/${member.memberId}`);
  assert.equal(detail.state, "Invited"); assert.deepEqual(detail.roles, []);
  assert.equal(detail.companies.length, 1); assert.equal(detail.companies[0].companyId, company.id); assert.deepEqual(detail.companies[0].roles.map((item) => item.id), [role.id]);
  return { email, roleId: role.id, memberId: member.memberId, state: "Invited" };
}

export async function disableMember(h, page, memberId) {
  await visit(h, page, `/org/usuarios/${memberId}`);
  if (h.width === 390) {
    await page.getByRole("region", { name: "Acceso a la organización", exact: true }).getByRole("button", { name: /^Estado/ }).click();
    const sheet = page.getByRole("dialog", { name: "Estado", exact: true });
    await sheet.getByText("Deshabilitado", { exact: true }).click();
    await sheet.waitFor({ state: "hidden" });
  } else {
    await page.getByRole("combobox", { name: "Estado", exact: true }).click(); await page.getByRole("option", { name: "Deshabilitado", exact: true }).click();
  }
  await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await clickForResponse(page, page.getByRole("dialog").getByRole("button", { name: "Deshabilitar y guardar", exact: true }), `/api/users/${memberId}`, "PUT");
  assert.equal((await read(h, page, `/api/users/${memberId}`)).state, "Inactive");
}

export async function companyStatus(h, page, company, active) {
  const opened = await openBusinessBarMenu(page);
  const action = opened.menu.getByRole("menuitem", { name: active ? "Activar" : "Inactivar", exact: true });
  if (active) { await clickForResponse(page, action, `/api/companies/${company.id}/status`, "PUT"); await opened.waitForClosed(); }
  else { await action.click(); await opened.waitForClosed(); await clickForResponse(page, page.getByRole("dialog").getByRole("button", { name: "Inactivar", exact: true }), `/api/companies/${company.id}/status`, "PUT"); }
  const inverse = await assertCompanyStateVisible(h, page, active ? "Active" : "Inactive");
  if (h.width === 390) { await page.keyboard.press("Escape"); await inverse.waitForClosed(); }
  const result = await read(h, page, `/api/companies/${company.id}`); assert.equal(result.status, active ? "Active" : "Inactive"); return result;
}

async function discard(page) {
  const cancel = page.getByRole("dialog").getByRole("button", { name: "Cancelar", exact: true }).first(); if (await cancel.isVisible()) await cancel.click();
  const reset = page.getByRole("button", { name: "Descartar cambios", exact: true }).filter({ visible: true }).first(); if (await reset.isVisible()) await reset.click();
}

export async function runRoleSupplementCases(h) {
  const page = await h.newPage(); let live; let capturePage = page; let owner; let company; let currentEmail; let liveToken; let activeToken;
  const activePages = new Set(); const outcomes = new Map(); const failures = []; const assignments = []; const tag = randomUUID().slice(0, 8);
  const run = (number, dependencies, action) => runBusinessDependencyCase(h, outcomes, `SUP-RO-${number}`, dependencies.map((value) => `SUP-RO-${value}`), () => capturePage, async () => { capturePage = page; return action(); });
  const leave = async (target = page) => { await discard(target); await h.signOut(target); activePages.delete(target); if (target === page) currentEmail = null; };
  const as = async (email) => {
    if (currentEmail === email) return read(h, page, "/api/me");
    if (currentEmail) await leave();
    const me = await h.login(page, email, "business"); currentEmail = email; activePages.add(page); return me;
  };
  try {
    await run("01", [], async () => {
      owner = await h.registerBusiness(page); currentEmail = owner.email; activePages.add(page);
      assert.equal(owner.me.access, "business"); assert.ok(owner.me.activeTenantId);
      const companies = await read(h, page, "/api/companies/paged?pageSize=100"); company = companies.items.find((item) => item.name === owner.companyName);
      assert.ok(company?.id); assert.equal(company.status, "Active"); await assertViewport(page);
      return "Organización y primera empresa propias creadas desde el alta empresarial con OTP real.";
    });
    await run("02", ["01"], async () => {
      const es = await expectedCatalog("es"); const en = await expectedCatalog("en"); assert.notDeepEqual(es, en);
      for (const [language, expected] of [["es-AR", es], ["en-US", en]]) assertPermissionCatalog(await read(h, page, "/api/permissions", { headers: { "Accept-Language": language } }), expected);
      const roles = await read(h, page, "/api/roles/paged?pageSize=100");
      const system = roles.items.filter((role) => role.isSystemRole);
      assert.deepEqual(system.map((role) => role.name).sort(), ["Administrador", "Dueño"]);
      for (const item of system) {
        const role = await read(h, page, `/api/roles/${item.id}`); assert.equal(role.isSystemRole, true);
        await visit(h, page, `/org/roles/${role.id}`); await heading(page, role.name);
        assert.equal(await page.getByRole("textbox", { name: "Nombre", exact: true }).count(), 0);
        assert.equal(await page.getByRole("combobox", { name: "Vale en", exact: true }).isDisabled(), true);
        assert.equal(await page.getByRole("button", { name: "Guardar cambios", exact: true }).count(), 0);
        const checks = page.getByRole("checkbox"); assert.ok(await checks.count());
        for (const check of await checks.all()) assert.equal(await check.isDisabled(), true);
        await requireProblem(await h.api(page, `/api/roles/${role.id}`, { method: "PUT", data: { ...roleBody(role), name: `${role.name} cambio denegado` } }), 403, "Roles.Role.SystemRoleCannotChange");
        assert.deepEqual(await read(h, page, `/api/roles/${role.id}`), role);
        await requireProblem(await h.api(page, `/api/roles/${role.id}`, { method: "DELETE", data: { version: role.version } }), 403, "Roles.Role.SystemRoleCannotChange");
        assert.deepEqual(await read(h, page, `/api/roles/${role.id}`), role);
      }
      await visit(h, page, "/org/roles"); await heading(page, "Roles y permisos"); await assertViewport(page);
      return "Catálogo completo es/en en orden del dominio; Dueño y Administrador sólo lectura y PUT/DELETE403, ambos persistidos sin cambios.";
    });
    await run("03", ["01"], async () => {
      await as(owner.email);
      for (const state of ["Active", "Invited", "Inactive"]) {
        const role = await createRole(h, page, company, `Asignado ${state} ${tag}`);
        assignments.push({ ...await invite(h, page, syntheticEmail(`rol-${state.toLowerCase()}`), company, role), roleName: role.name, state });
      }
      for (const member of assignments.filter((item) => item.state !== "Invited")) {
        const me = await as(member.email); assert.equal(me.activeTenantId, owner.me.activeTenantId); member.userId = me.id;
        assertCompanyOnlyPermissions(me, { userId: me.id, tenantId: owner.me.activeTenantId, companyId: company.id }, true);
        await heading(page, "Tus empresas"); await as(owner.email);
      }
      await disableMember(h, page, assignments.find((item) => item.state === "Inactive").memberId);
      for (const member of assignments) {
        const detail = await read(h, page, `/api/users/${member.memberId}`); assert.equal(detail.state, member.state);
        assert.equal((await read(h, page, `/api/roles/${member.roleId}`)).userCount, 1);
      }
      await assertViewport(page);
      return "Tres roles y asignaciones UI: una cuenta activa por OTP, una invitada sin aceptar y otra activada por OTP y luego deshabilitada por UI.";
    });
    await run("04", ["01", "03"], async () => {
      await as(owner.email); assert.equal(assignments.length, 3);
      for (const entry of assignments) {
        const role = await read(h, page, `/api/roles/${entry.roleId}`); const member = await read(h, page, `/api/users/${entry.memberId}`);
        await visit(h, page, `/org/roles/${role.id}`); await heading(page, role.name);
        assert.equal(await page.getByRole("combobox", { name: "Vale en", exact: true }).isDisabled(), true);
        for (const [method, data, code] of [["DELETE", { version: role.version }, "Roles.Role.HasUsers"], ["PUT", { ...roleBody(role), scope: "Organization", companyId: null, permissions: ["roles.read"] }, "Roles.Role.ScopeChangeHasUsers"]]) {
          const problem = await requireProblem(await h.api(page, `/api/roles/${role.id}`, { method, data }), 409, code);
          assertAssignedRoleUnchanged({ role, member, state: entry.state, code, problem, afterRole: await read(h, page, `/api/roles/${role.id}`), afterMember: await read(h, page, `/api/users/${member.memberId}`) });
        }
      }
      await assertViewport(page);
      return "Las seis negativas reales pasaron: DELETE HasUsers y PUT ScopeChangeHasUsers en Active/Invited/Inactive, cada una409 con userCount1 y rol/miembro/versiones intactos.";
    });
    await run("05", ["01", "03"], async () => {
      const active = assignments.find((item) => item.state === "Active");
      await leave(); live = await h.newPage();
      capturePage = live;
      live.on("request", (request) => { const url = new URL(request.url()); const token = request.headers().authorization; if (url.origin === h.base.origin && url.pathname.startsWith("/api/") && token?.startsWith("Bearer ")) liveToken = token; });
      const me = await h.login(live, active.email, "business"); activePages.add(live);
      const fixture = { userId: active.userId, tenantId: owner.me.activeTenantId, companyId: company.id };
      assertCompanyOnlyPermissions(me, fixture, true); assert.ok(liveToken); activeToken = liveToken;
      const home = await read(h, live, "/api/home"); assert.equal(home.organization, null); assert.equal(home.companies.length, 1);
      assert.equal(home.companies[0].companyId, company.id); assert.deepEqual(home.companies[0].roles, [active.roleName]);
      await assertCompanyHomeCard(live, company, home.companies[0].roles[0]);
      capturePage = page;
      const restored = await forceBusinessLogin(h, page, owner.email); currentEmail = owner.email; activePages.add(page); assert.equal(restored.id, owner.me.id);
      await visit(h, page, `/org/usuarios/${active.memberId}`); const accepted = await read(h, page, `/api/users/${active.memberId}`); assert.equal(accepted.state, "Active"); assert.equal(accepted.userId, me.id);
      if (h.width === 390) await page.getByRole("region", { name: "Acceso a la organización", exact: true }).getByRole("button", { name: /^Estado/ }).getByText("Activo", { exact: true }).waitFor();
      else assert.ok((await page.getByRole("combobox", { name: "Estado", exact: true }).innerText()).includes("Activo"));
      capturePage = live; assertCompanyOnlyPermissions(await read(h, live, "/api/me"), fixture, true); assert.equal(liveToken, activeToken);
      await assertViewport(live);
      return "Miembro company-only con token propio: Inicio muestra su empresa/rol y Me sólo company.members.read. La Dueña lo ve Activo en Usuarios; las identidades permanecen separadas.";
    });
    await run("06", ["01", "03", "05"], async () => {
      const active = assignments.find((item) => item.state === "Active"); const memberRoute = `/api/users/${active.memberId}`;
      const membersRoute = `/api/companies/${company.id}/members/paged?pageSize=100`; const fixture = { userId: active.userId, tenantId: owner.me.activeTenantId, companyId: company.id };
      await visit(h, page, `/org/empresas/${company.id}`); await heading(page, company.name);
      const snapshot = async () => ({ company: await read(h, page, `/api/companies/${company.id}`), members: await read(h, page, membersRoute), member: await read(h, page, memberRoute) });
      const before = await snapshot(); capturePage = live; assertCompanyOnlyPermissions(await read(h, live, "/api/me"), fixture, true);
      assert.equal((await h.api(live, membersRoute)).status(), 200); assert.equal(liveToken, activeToken);
      let actionFailure;
      try {
        capturePage = page;
        await companyStatus(h, page, company, false);
        capturePage = live;
        assertCompanyOnlyPermissions(await read(h, live, "/api/me"), fixture, false);
        const inactiveHome = await read(h, live, "/api/home"); assert.equal(inactiveHome.organization, null); assert.deepEqual(inactiveHome.companies, []);
        await requireProblem(await h.api(live, membersRoute), 403, "Http.Forbidden");
        await requireProblem(await h.api(live, `/api/companies/${company.id}`), 403, "Http.Forbidden"); assert.equal(liveToken, activeToken);
        capturePage = page; await companyStatus(h, page, company, true);
        capturePage = live;
        assertCompanyOnlyPermissions(await read(h, live, "/api/me"), fixture, true);
        assert.equal((await h.api(live, membersRoute)).status(), 200); assert.equal((await h.api(live, `/api/companies/${company.id}`)).status(), 200);
        const restoredHome = await read(h, live, "/api/home"); assert.equal(restoredHome.organization, null); assert.deepEqual(restoredHome.companies.map((item) => item.companyId), [company.id]); assert.equal(liveToken, activeToken);
        capturePage = page; assertCompanyCyclePreserved(before, await snapshot()); await assertViewport(page);
      } catch (error) { actionFailure = error; }
      finally {
        const actionPage = capturePage; const originalFailure = actionFailure;
        try { capturePage = page; if ((await read(h, page, `/api/companies/${company.id}`)).status === "Inactive") { await visit(h, page, `/org/empresas/${company.id}`); await companyStatus(h, page, company, true); } }
        catch (error) { actionFailure = actionFailure ? new AggregateError([actionFailure, error], "Fallaron la comprobación y la restauración UI de la empresa.") : error; }
        finally { if (originalFailure || !actionFailure) capturePage = actionPage; }
      }
      if (actionFailure) throw actionFailure;
      return "Misma identidad/token del miembro: permisos de empresa y GET miembros200→403→200; Inicio API incluye→retira→restaura la empresa. El ciclo UI conserva datos, miembros y asignaciones.";
    });
  } catch (error) { failures.push(error); }
  finally {
    for (const target of [page, live].filter(Boolean)) {
      try { if (activePages.has(target)) await leave(target); } catch (error) { failures.push(error); }
    }
    try { await cleanupContinuationSessions(h); } catch (error) { failures.push(error); }
    for (const target of [page, live].filter(Boolean)) { try { await target.close(); } catch (error) { failures.push(error); } }
  }
  if (failures.length > 1) throw new AggregateError(failures, "Fallaron el complemento de roles o su salida UI.");
  if (failures.length) throw failures[0];
  return outcomes;
}
