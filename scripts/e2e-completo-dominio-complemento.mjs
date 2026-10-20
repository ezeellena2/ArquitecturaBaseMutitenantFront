import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { fillOtp, openAccountEmailDialog } from "./test-e2e-real-ui.mjs";
import { pickupCode } from "./test-e2e-real-mail.mjs";
import { clickForResponse, requireProblem, runBusinessDependencyCase } from "./e2e-completo-negocio.mjs";
import { requireSyntheticEmail } from "./e2e-completo-soporte.mjs";
import { sendWithCooldown } from "./recorrido-usuario-whatsapp.mjs";

const preparedDomain = "corp.example.test";
const preparedEmail = "e2e-managed@corp.example.test";
const definition = (number, actor, action, route, expected, covers = []) => ({ id: `DOM-${String(number).padStart(2, "0")}`, area: "Dominio y métodos administrados", actor, action, route, expected, covers, critical: true, source: "tools/ArquitecturaBaseMultitenant.RealE2ESetup/PlatformCommand.cs; docs/features/identidad.md" });
export const domainSupplementDefinitions = [
  definition(1, "Propietario original y otra Dueña creada por UI", "Usar el dominio verificado existente y deshabilitar la membresía original", "/org/usuarios · /login", "Seed Verified y método administrado pertenecen a la organización original. Un OTP real emitido antes de deshabilitarla es rechazado después; pedir otro responde202 sin correo y no da Personal. La membresía se reactiva antes de continuar."),
  definition(2, "Propietario original env.businessEmail", "Retirar por UI el dominio con su versión y verificar un correo posterior", "/org/configuracion · /cuenta", "DELETE lleva la versión actual; el método previo conserva su ManagedByTenantId. Un correo nuevo del mismo dominio verificado por OTP queda propio y sin asociación automática.", ["BACK-CF-006"]),
  definition(3, "Propietario con membresía deshabilitada y otra Dueña", "Comprobar el correo administrado después de retirar el dominio", "/login · /cuenta", "Sin membresía activa el correo administrado sigue rechazado y no crea Personal; su vínculo persiste. El correo propio original permite Personal y la membresía se restaura por UI.", ["BACK-CU-016"]),
];
export const domainPendingRepairDefinitions = [...domainSupplementDefinitions];
export async function runDomainPendingRepairCases(h, { run = runDomainSupplementCases } = {}) {
  assert.equal(h.width, 390, "La reparación pendiente de dominio corresponde a 390 px.");
  return run(h);
}
export const domainSupplementLimitations = {
  "BACK-CF-005": {
    partialExecutionIds: [], missing: "Verificación TXT y asociación de métodos existentes y futuros a partir de una prueba DNS auténtica.",
    reason: "Requiere DNS real: el host registra CloudflareDnsTxtLookup y no expone un control DNS. El seed Verified de PlatformCommand llama Domain.Verify directamente y no acredita verificación TXT.",
    source: ["src/ArquitecturaBaseMultitenant.Infrastructure/DependencyInjection.cs", "src/ArquitecturaBaseMultitenant.Infrastructure/Identity/CloudflareDnsTxtLookup.cs", "src/ArquitecturaBaseMultitenant.Application/Services/OrganizationSettings/OrganizationDomainVerifier.cs", "tools/ArquitecturaBaseMultitenant.RealE2ESetup/RecorridoHost.cs", "tools/ArquitecturaBaseMultitenant.RealE2ESetup/PlatformCommand.cs"],
  },
};
export function requirePreparedDomain(domains, methods, organizationId) {
  const domain = domains.find((item) => item.domain === preparedDomain);
  assert.ok(domain?.id && domain.status === "Verified" && Number.isInteger(domain.version), "El dominio Verified original debe seguir disponible; no se regenera ni se prepara otro técnicamente.");
  const managed = methods.methods.find((method) => method.type === "Email" && method.value === preparedEmail);
  assert.ok(managed?.id && managed.isVerified && managed.managedByTenantId === organizationId, "El método administrado original debe conservar la organización exacta del seed.");
  return { domain, managed };
}
export function requirePreservedDomainBinding(previous, response, newEmail = null) {
  const existing = response.methods.find((method) => method.id === previous.id);
  assert.ok(existing?.isVerified); assert.equal(existing.value, previous.value); assert.equal(existing.managedByTenantId, previous.managedByTenantId); assert.equal(existing.managedByOrganizationName, previous.managedByOrganizationName);
  if (newEmail) {
    const added = response.methods.find((method) => method.value === newEmail && method.type === "Email");
    assert.ok(added?.isVerified); assert.equal(added.managedByTenantId, null, "Después de retirar el dominio un correo nuevo no debe asociarse automáticamente.");
  }
}
export async function requireManagedLoginRejection(response) {
  return requireProblem(response, 400, "Auth.LoginCode.Invalid");
}
const pathOf = (response) => new URL(response.url()).pathname;
async function read(h, page, route) { const response = await h.api(page, route); assert.equal(response.status(), 200); return response.json(); }
export async function clickDomainForResponse(page, button, route, method, status = 200) {
  const path = new URL(route, "https://local.invalid").pathname;
  const response = await clickForResponse(page, button, path, method, null);
  if (response.status() !== status) {
    let code = "no registrado";
    try { const body = await response.json(); if (/^[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)+$/u.test(body.code)) code = body.code; } catch { /* No copiar bodies ni mensajes de servidor al diagnóstico. */ }
    const operation = path.replace(/\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}(?=\/|$)/giu, "/:id");
    assert.equal(response.status(), status, `${method} ${operation}: respondió ${response.status()}, esperado ${status}; código ${code}.`);
  }
  return response;
}

async function addDomainBackupCompany(h, page, memberId, company, role) {
  await page.goto(new URL(`/org/usuarios/${memberId}`, h.base).href);
  await page.getByRole("button", { name: "Sumar empresa", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Sumar empresa", exact: true });
  await dialog.getByRole("combobox", { name: "Empresa", exact: true }).click();
  await page.getByRole("option", { name: company.name, exact: true }).click();
  await dialog.getByRole("button", { name: "Roles en la empresa", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: role.name, exact: true }).click(); await page.keyboard.press("Escape");
  await clickDomainForResponse(page, dialog.getByRole("button", { name: "Sumar", exact: true }), `/api/users/${memberId}`, "PUT");
  await dialog.waitFor({ state: "hidden" });
}

/** Dueño organizacional no reemplaza CompanyAdmin: preparar sólo la suplente propia antes de deshabilitar al original. */
export async function prepareDomainBackupAdministration(h, page, { ownerMemberId, ownerId, backupMe, backupEmail, organizationId }, { addCompany = addDomainBackupCompany } = {}) {
  requireSyntheticEmail(backupEmail);
  assert.equal(backupMe.access, "business"); assert.equal(backupMe.activeTenantId, organizationId); assert.notEqual(backupMe.id, ownerId);
  const original = await read(h, page, `/api/users/${ownerMemberId}`);
  assert.equal(original.memberId, ownerMemberId); assert.equal(original.userId, ownerId); assert.equal(original.state, "Active");
  const listed = await read(h, page, `/api/users/paged?search=${encodeURIComponent(backupEmail)}&pageSize=100`);
  const matches = listed.items.filter((item) => item.userId === backupMe.id); assert.equal(matches.length, 1);
  const memberId = matches[0].memberId; assert.ok(memberId && memberId !== ownerMemberId);
  const before = await read(h, page, `/api/users/${memberId}`);
  assert.equal(before.memberId, memberId); assert.equal(before.userId, backupMe.id); assert.equal(before.state, "Active");
  assert.ok(before.roles.some((role) => role.isSystemRole && role.name === "Dueño"));
  assert.deepEqual(before.companies, [], "La suplente propia se invitó sólo como Dueña, sin empresas previas.");
  const prepared = [];
  for (const assignment of original.companies) {
    const role = assignment.roles.find((item) => item.isSystemRole && item.name === "Administrador");
    if (assignment.status !== "Active" || !role) continue;
    const company = await read(h, page, `/api/companies/${assignment.companyId}`);
    assert.equal(company.id, assignment.companyId);
    if (company.status !== "Active") continue;
    await addCompany(h, page, memberId, company, role); prepared.push({ companyId: company.id, roleId: role.id });
    const after = await read(h, page, `/api/users/${memberId}`);
    assert.equal(after.userId, before.userId); assert.equal(after.state, "Active"); assert.deepEqual(after.roles, before.roles);
    assert.ok(after.version > before.version); assert.equal(after.companies.length, prepared.length);
    for (const expected of prepared) {
      const access = after.companies.find((item) => item.companyId === expected.companyId);
      assert.equal(access?.status, "Active"); assert.deepEqual(access.roles.map((item) => item.id), [expected.roleId]);
    }
  }
  assert.deepEqual(await read(h, page, `/api/users/${ownerMemberId}`), original, "Preparar a la suplente no modifica al propietario original.");
}
async function sendCode(page, button, route) {
  const response = await sendWithCooldown(async () => {
    const waiting = page.waitForResponse((reply) => pathOf(reply) === route && reply.request().method() === "POST"); void waiting.catch(() => {}); await button.click({ timeout: 90_000 }); return waiting;
  }); assert.equal(response.status(), 202); return response;
}
export async function chooseDomainMemberState(h, page, active) {
  const label = active ? "Activo" : "Deshabilitado";
  if (h.width === 390) {
    const state = page.getByRole("region", { name: "Acceso a la organización", exact: true }).getByRole("button", { name: /^Estado/u });
    await state.click();
    const sheet = page.getByRole("dialog", { name: "Estado", exact: true });
    // RadioRow conserva el input sr-only para el teclado; su etiqueta visible recibe el toque.
    await sheet.getByText(label, { exact: true }).click(); await sheet.waitFor({ state: "hidden" });
    await state.getByText(label, { exact: true }).waitFor();
  }
  else { await page.getByRole("combobox", { name: "Estado", exact: true }).click(); await page.getByRole("option", { name: label, exact: true }).click(); }
}
async function memberState(h, page, memberId, active, onSaved = () => {}) {
  await page.goto(new URL(`/org/usuarios/${memberId}`, h.base).href); await chooseDomainMemberState(h, page, active);
  const save = page.getByRole("button", { name: "Guardar cambios", exact: true });
  if (active) await clickDomainForResponse(page, save, `/api/users/${memberId}`, "PUT");
  else { await save.click(); await clickDomainForResponse(page, page.getByRole("dialog").getByRole("button", { name: "Deshabilitar y guardar", exact: true }), `/api/users/${memberId}`, "PUT"); }
  onSaved();
  assert.equal((await read(h, page, `/api/users/${memberId}`)).state, active ? "Active" : "Inactive");
}
async function prepareManagedProof(h, page) {
  await page.goto(new URL("/login", h.base).href); await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(preparedEmail);
  const before = new Set(await h.env.files()); await sendCode(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code");
  const code = await h.env.code(preparedEmail, before); await fillOtp(page, code); return code;
}
async function rejectManagedPersonal(h, page) {
  // El OTP ya estaba emitido mientras la membresía era activa. No se reemplaza
  // por otro desafío antes de verificarlo: el rechazo prueba la disponibilidad.
  await requireManagedLoginRejection(await clickForResponse(page, page.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/login-code/verify", "POST", 400));
  await page.getByText("El código no es válido.", { exact: true }).waitFor();
  await requireProblem(await page.request.get(new URL("/api/me", h.base).href), 401, "Http.Unauthorized");
  await page.goto(new URL("/login", h.base).href); await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(preparedEmail);
  const before = new Set(await h.env.files()); await sendCode(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code");
  // El host bombea el pickup cada250ms; no se consulta un código inexistente.
  await delay(1000);
  assert.equal((await h.env.messages(preparedEmail, before)).filter((message) => pickupCode(message.body)).length, 0);
  await requireProblem(await page.request.get(new URL("/api/me", h.base).href), 401, "Http.Unauthorized");
}

export async function runDomainSupplementCases(h) {
  requireSyntheticEmail(h.env.businessEmail);
  const page = await h.newPage(); const proofPage = await h.newPage(); const outcomes = new Map(); let capturePage = page; let session = false; let owner; let backup; let memberId; let fixture; let inactive = false; let newEmail;
  const run = (number, dependencies, action) => runBusinessDependencyCase(h, outcomes, `DOM-${String(number).padStart(2, "0")}`, dependencies.map((id) => `DOM-${String(id).padStart(2, "0")}`), () => capturePage, action);
  const leave = async () => { if (session) { await h.signOut(page); session = false; } };
  const enter = async (email, access = "business") => { await leave(); const me = await h.login(page, email, access); session = true; return me; };
  const restoreOwner = async () => { if (inactive && backup && memberId) { await enter(backup.email); await memberState(h, page, memberId, true, () => { inactive = false; }); } };
  try {
    await run(1, [], async () => {
      owner = await enter(h.env.businessEmail); assert.ok(owner.activeTenantId);
      const domains = await read(h, page, "/api/organization/settings/domains/paged?page=1&pageSize=100"); fixture = requirePreparedDomain(domains.items, await read(h, page, "/api/me/login-methods"), owner.activeTenantId);
      const settings = await read(h, page, "/api/organization/settings"); assert.ok(settings.name);
      const members = await read(h, page, "/api/users/paged?page=1&pageSize=100"); memberId = members.items.find((item) => item.userId === owner.id)?.memberId; assert.ok(memberId);
      await leave(); backup = await h.registerPerson(page); session = true; await leave(); await enter(h.env.businessEmail);
      await page.goto(new URL("/org/usuarios", h.base).href); await page.getByRole("button", { name: "Invitar usuario", exact: true }).click(); const dialog = page.getByRole("dialog", { name: "Invitar usuario", exact: true });
      await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill(backup.email); await dialog.getByRole("button", { name: "Roles de la organización", exact: true }).click(); await page.getByRole("menuitemcheckbox", { name: "Dueño", exact: true }).click(); await page.keyboard.press("Escape");
      await clickForResponse(page, dialog.getByRole("button", { name: "Invitar", exact: true }), "/api/users/invitations", "POST", 201); await dialog.waitFor({ state: "hidden" });
      const otherOwner = await enter(backup.email); assert.equal(otherOwner.activeTenantId, owner.activeTenantId); assert.ok(otherOwner.effectivePermissions.organization.includes("users.manage"));
      await prepareDomainBackupAdministration(h, page, { ownerMemberId: memberId, ownerId: owner.id, backupMe: otherOwner, backupEmail: backup.email, organizationId: owner.activeTenantId });
      // El código se emite después de preparar los administradores, con el propietario todavía activo.
      await leave(); await prepareManagedProof(h, proofPage); await enter(backup.email);
      await memberState(h, page, memberId, false, () => { inactive = true; }); await leave(); capturePage = proofPage; await rejectManagedPersonal(h, proofPage);
      return "El dominio Verified y el vínculo original existen; el OTP real anterior fue rechazado400 tras deshabilitar la membresía. Otro pedido202 no llegó al pickup ni autenticó Personal.";
    });
    await restoreOwner();
    await run(2, [1], async () => {
      capturePage = page;
      const me = await enter(h.env.businessEmail); assert.equal(me.activeTenantId, owner.activeTenantId);
      const current = requirePreparedDomain((await read(h, page, "/api/organization/settings/domains/paged?page=1&pageSize=100")).items, await read(h, page, "/api/me/login-methods"), owner.activeTenantId);
      await page.goto(new URL("/org/configuracion", h.base).href); await page.getByRole("button", { name: `Acciones de ${preparedDomain}`, exact: true }).click(); await page.getByRole("menuitem", { name: "Quitar", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: `¿Quitar ${preparedDomain}?`, exact: true });
      const removed = await clickForResponse(page, dialog.getByRole("button", { name: "Quitar", exact: true }), `/api/organization/settings/domains/${current.domain.id}`, "DELETE", 204);
      assert.equal(new URL(removed.request().url()).searchParams.get("version"), String(current.domain.version)); await dialog.waitFor({ state: "hidden" });
      await page.getByRole("button", { name: `Acciones de ${preparedDomain}`, exact: true }).waitFor({ state: "hidden" });
      const after = await read(h, page, "/api/organization/settings/domains/paged?page=1&pageSize=100"); assert.equal(after.items.some((item) => item.id === fixture.domain.id && item.status !== "Removed"), false);
      requirePreservedDomainBinding(fixture.managed, await read(h, page, "/api/me/login-methods"));
      newEmail = `e2e-posterior-${h.width}-${randomUUID().slice(0, 8)}@${preparedDomain}`; await page.goto(new URL("/cuenta", h.base).href); const add = await openAccountEmailDialog(page); await add.getByRole("textbox", { name: "Correo", exact: true }).fill(newEmail);
      const before = new Set(await h.env.files()); const pending = await sendCode(page, add.getByRole("button", { name: "Enviar código", exact: true }), "/api/me/login-methods"); const methodId = (await pending.json()).methodId; assert.ok(methodId);
      await fillOtp(add, await h.env.code(newEmail, before)); await clickForResponse(page, add.getByRole("button", { name: "Verificar", exact: true }), `/api/me/login-methods/${methodId}/verify`, "POST", 204); await add.waitFor({ state: "hidden" });
      await page.reload(); await page.getByRole("heading", { name: "Mi cuenta", exact: true }).waitFor(); requirePreservedDomainBinding(fixture.managed, await read(h, page, "/api/me/login-methods"), newEmail);
      return "La propietaria retiró el dominio con la versión vigente. El método previo mantuvo ManagedByTenantId y el correo posterior, verificado por OTP real, quedó sin vínculo automático tras F5.";
    });
    await run(3, [1, 2], async () => {
      await leave(); await prepareManagedProof(h, proofPage);
      await enter(backup.email); await memberState(h, page, memberId, false, () => { inactive = true; }); await leave(); capturePage = proofPage; await rejectManagedPersonal(h, proofPage);
      const personal = await enter(h.env.businessEmail, "consumer"); assert.equal(personal.id, owner.id); assert.equal(personal.access, "consumer");
      await page.goto(new URL("/cuenta", h.base).href); capturePage = page; requirePreservedDomainBinding(fixture.managed, await read(h, page, "/api/me/login-methods"), newEmail);
      return "Retirar el dominio no devolvió Personal al correo administrado: OTP anterior rechazado400 y nuevo pedido202 sin correo/sesión antes y después con membresía inactiva. El vínculo persistió y el método propio original conservó Personal.";
    });
  } finally {
    try { await restoreOwner(); }
    finally { try { await leave(); } finally { await Promise.allSettled([page.close(), proofPage.close()]); } }
  }
}
