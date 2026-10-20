import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { expect } from "playwright/test";
import { clickForResponse, requireProblem } from "./e2e-completo-negocio.mjs";
import { syntheticEmail } from "./e2e-completo-soporte.mjs";
import { assertViewport } from "./e2e-completo-personal.mjs";

const definition = (number, actor, action, route, expected, covers) => ({ id: `CIERRE-${number}`, area: "Cierre de cobertura local", actor, action, route, expected, covers, critical: true, source: "scripts/e2e-completo-cierre-local.mjs" });
export const localClosureDefinitions = [
  definition("01", "Persona con correo propio", "Iniciar vínculo Google desde Mi cuenta", "/cuenta", "El botón emite POST200 y una navegación HTTPS al host exacto de Google, sin pedir OTP local. Se detiene antes de contactar al proveedor; completar Google queda a mano.", ["BACK-CU-011"]),
  definition("02", "Única Dueña activa", "Intentar quitarse el rol Dueño", "/org/usuarios/:id", "Guardar sin Dueño responde409 Tenancy.Member.LastTenantAdmin, muestra explicación y conserva miembro, roles y versión.", ["BACK-OR-017"]),
  definition("03", "Dueña de organización propia", "Crear desde Roles, abrir un usuario desde el listado y sumarlo a una empresa con su rol", "/org/roles · /org/usuarios · /org/empresas/:id", "Crear rol abre el formulario; el listado abre la ficha correcta y la empresa agrega el miembro activo con el rol elegido, confirmado por GET real.", ["GUIA-crear-un-rol-y-asignarlo-03", "GUIA-sumar-una-empresa-03", "GUIA-sumar-una-empresa-04"]),
  { ...definition("04", "Operador completo", "Cerrar Plataforma y comprobar el ancho de la portada", "/plataforma · /", "La salida vuelve a la portada; tras el render, viewport y captura conservan 1440 o 390 px sin desborde horizontal.", []), critical: false, severity: "low", probableArea: "Front · portada pública o captura tras restaurar el viewport." },
];

export const localClosureProofGroups = {
  "BACK-IN-001": [["SUP-BIZ-13", "BIZ-06", "BIZ-07", "AS-SUP-01"]],
  "GUIA-crear-un-rol-y-asignarlo-01": [["CIERRE-03", "BIZ-26", "SUP-RO-02"]],
  "GUIA-operador-en-la-puerta-publica-04": [["PLAT-10"]],
  "GUIA-operador-en-la-puerta-publica-05": [["PLAT-11", "PLAT-C-13", "AS-SUP-05"]],
  "SCREEN-auditoria-org": [["PUB-C-08"]],
};

export function requireGoogleChallenge(body, observedHost) {
  const url = new URL(body.redirectUrl);
  assert.equal(url.protocol, "https:"); assert.equal(url.hostname, "accounts.google.com");
  assert.equal(observedHost, "accounts.google.com"); return true;
}
export function requireOwnerPreserved(before, after, problem) {
  assert.equal(problem.code, "Tenancy.Member.LastTenantAdmin"); assert.ok(problem.traceId);
  assert.equal(before.state, "Active"); assert.ok(before.roles.some((role) => role.name === "Dueño"));
  assert.deepEqual(after, before, "El rechazo no cambia membresía, roles ni versión.");
}

const read = async (h, page, route) => { const response = await h.api(page, route); assert.equal(response.status(), 200); return response.json(); };
async function rolePicker(page, label, name, selected = true) {
  await page.getByRole("button", { name: new RegExp(`^${label}`) }).click();
  const sheet = page.getByRole("dialog", { name: label, exact: true });
  const option = page.getByRole("menuitemcheckbox", { name, exact: true });
  await sheet.or(option).filter({ visible: true }).first().waitFor();
  if (await sheet.isVisible()) {
    await sheet.getByRole("checkbox", { name, exact: true }).setChecked(selected);
    await sheet.getByRole("button", { name: "Listo", exact: true }).click();
  } else {
    if (await option.getAttribute("aria-checked") !== String(selected)) await option.click();
    await page.keyboard.press("Escape");
  }
}
async function createRole(h, page, name, company) {
  await page.goto(new URL("/org/roles", h.base).href);
  await page.getByRole("heading", { name: "Roles y permisos", exact: true }).waitFor();
  await page.getByRole("link", { name: "Crear rol", exact: true }).filter({ visible: true }).first().click();
  await page.waitForURL((url) => url.pathname === "/org/roles/nuevo");
  await page.getByRole("textbox", { name: "Nombre", exact: true }).fill(name);
  await page.getByRole("combobox", { name: "Vale en", exact: true }).click();
  await page.getByRole("option", { name: company.name, exact: true }).click();
  await page.getByRole("button", { name: "Abrir o cerrar Miembros", exact: true }).click();
  await page.getByRole("checkbox", { name: "Ver miembros", exact: true }).check();
  const response = await clickForResponse(page, page.getByRole("button", { name: "Crear rol", exact: true }), "/api/roles", "POST", 201);
  const id = await response.json(); await page.getByRole("heading", { name, exact: true }).waitFor(); return { id, name };
}
async function discard(page) {
  const cancel = page.getByRole("dialog").getByRole("button", { name: "Cancelar", exact: true }).first(); if (await cancel.isVisible()) await cancel.click();
  const button = page.getByRole("button", { name: "Descartar cambios", exact: true }).filter({ visible: true }).first(); if (await button.isVisible()) await button.click();
}

export async function runLocalClosureCases(h) {
  const page = await h.newPage(); const failures = []; let signedIn = false;
  const leave = async () => { await discard(page); await h.signOut(page); signedIn = false; };
  const clean = async () => { if (signedIn) await leave(); };
  try {
    await h.record("CIERRE-01", () => page, async () => {
      await h.registerPerson(page); signedIn = true; await page.goto(new URL("/cuenta", h.base).href);
      await page.getByRole("button", { name: "Vincular Google", exact: true }).waitFor();
      const matches = (url) => url.hostname === "accounts.google.com";
      const handler = (route) => route.abort(); await page.route(matches, handler);
      try {
        const navigation = page.waitForEvent("requestfailed", { predicate: (request) => new URL(request.url()).hostname === "accounts.google.com" }); void navigation.catch(() => {});
        const response = await clickForResponse(page, page.getByRole("button", { name: "Vincular Google", exact: true }), "/api/me/external/google", "POST", 200);
        const challenge = await response.json(); const requested = await navigation;
        requireGoogleChallenge(challenge, new URL(requested.url()).hostname);
        await page.goto(new URL("/cuenta", h.base).href); await page.getByRole("button", { name: "Vincular Google", exact: true }).waitFor();
        assert.equal(await page.getByRole("textbox", { name: "Código 1", exact: true }).count(), 0);
        return "POST200 real y navegación dirigida a Google observada y detenida antes del proveedor; sin OTP local ni vínculo verificado. Mi cuenta sigue disponible; Google completo queda a mano.";
      } finally { await page.unroute(matches, handler); }
    });
    await clean();
    await h.record("CIERRE-02", () => page, async () => {
      const owner = await h.registerBusiness(page); signedIn = true;
      const users = await read(h, page, "/api/users/paged?pageSize=100"); const member = users.items.find((item) => item.userId === owner.me.id); assert.ok(member?.memberId);
      const route = `/api/users/${member.memberId}`; const before = await read(h, page, route);
      await page.goto(new URL(`/org/usuarios/${member.memberId}`, h.base).href);
      await rolePicker(page, "Roles de la organización", "Dueño", false);
      const response = await clickForResponse(page, page.getByRole("button", { name: "Guardar cambios", exact: true }), route, "PUT", 409);
      const problem = await requireProblem(response, 409, "Tenancy.Member.LastTenantAdmin");
      requireOwnerPreserved(before, await read(h, page, route), problem);
      await expect(page.getByRole("alert").first()).toContainText(/Tiene que quedar al menos un Dueño/);
      return "Quitar Dueño desde la ficha respondió409 LastTenantAdmin con explicación; la lectura posterior conserva exactamente miembro activo, roles y versión.";
    });
    await clean();
    await h.record("CIERRE-03", () => page, async () => {
      const owner = await h.registerBusiness(page); signedIn = true;
      const list = await read(h, page, "/api/companies/paged?pageSize=100"); const company = list.items.find((item) => item.name === owner.companyName); assert.ok(company?.id);
      const role = await createRole(h, page, `Rol propio cierre ${randomUUID().slice(0, 8)}`, company);
      const email = syntheticEmail("cierre-miembro"); await page.goto(new URL("/org/usuarios", h.base).href);
      await page.getByRole("button", { name: "Invitar usuario", exact: true }).filter({ visible: true }).first().click();
      const invitation = page.getByRole("dialog", { name: "Invitar usuario", exact: true }); await invitation.getByRole("textbox", { name: "Correo", exact: true }).fill(email);
      const issued = await clickForResponse(page, invitation.getByRole("button", { name: "Invitar", exact: true }), "/api/users/invitations", "POST", 201); const invitationId = (await issued.json()).invitationId;
      await invitation.waitFor({ state: "hidden" });
      const reserved = (await read(h, page, `/api/users/paged?search=${encodeURIComponent(email)}&pageSize=100`)).items.find((item) => item.invitationId === invitationId); assert.ok(reserved?.memberId);
      await leave(); await h.login(page, email, "business"); signedIn = true;
      await page.goto(new URL("/cuenta", h.base).href); await page.getByRole("textbox", { name: "Nombre", exact: true }).fill(`Miembro cierre ${randomUUID().slice(0, 8)}`);
      await clickForResponse(page, page.getByRole("button", { name: "Guardar cambios", exact: true }), "/api/me", "PUT");
      await leave(); await h.login(page, owner.email, "business"); signedIn = true;
      await page.goto(new URL("/org/usuarios", h.base).href); await page.getByRole("heading", { name: "Usuarios", exact: true }).waitFor();
      const memberLink = page.locator(`a[href="/org/usuarios/${reserved.memberId}"]`).filter({ visible: true }).first(); await memberLink.click();
      await page.waitForURL((url) => url.pathname === `/org/usuarios/${reserved.memberId}`);
      const active = await read(h, page, `/api/users/${reserved.memberId}`); assert.equal(active.state, "Active"); assert.equal(active.companies.length, 0);
      await page.goto(new URL(`/org/empresas/${company.id}`, h.base).href); await page.getByRole("heading", { name: company.name, exact: true }).waitFor();
      await page.getByRole("button", { name: "Agregar miembro", exact: true }).filter({ visible: true }).first().click(); const dialog = page.getByRole("dialog", { name: "Agregar miembro", exact: true });
      await dialog.getByRole("combobox", { name: "Usuario", exact: true }).click(); await page.getByRole("option", { name: active.displayName, exact: true }).click();
      await rolePicker(page, "Roles en la empresa", role.name);
      await clickForResponse(page, dialog.getByRole("button", { name: "Agregar miembro", exact: true }), `/api/companies/${company.id}/members`, "POST", 204); await dialog.waitFor({ state: "hidden" });
      const after = await read(h, page, `/api/users/${reserved.memberId}`); assert.deepEqual(after.roles, active.roles); assert.ok(after.companies.some((item) => item.companyId === company.id && item.roles.some((assigned) => assigned.id === role.id)));
      await page.getByText(active.displayName, { exact: true }).first().waitFor();
      return "La Dueña creó desde el listado Roles, abrió el miembro desde Usuarios y lo agregó desde la ficha de su empresa con el rol propio seleccionado; membresía y asignación confirmadas por GET real.";
    });
    await clean();
    await h.record("CIERRE-04", () => page, async () => {
      await h.login(page, h.width === 1440 ? "e2e-e9a-operator@example.test" : "e2e-e9b-operator@example.test", "platform"); signedIn = true;
      await leave(); await page.getByRole("link", { name: "Ingresá", exact: true }).filter({ visible: true }).first().waitFor();
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(page.viewportSize().width, h.width); await assertViewport(page);
      return `Salida de Plataforma por UI y portada renderizada sin desborde; el viewport conservó ${h.width} px antes de la captura.`;
    });
  } catch (error) { failures.push(error); }
  finally {
    try { await clean(); } catch (error) { failures.push(error); }
    try { await page.close(); } catch (error) { failures.push(error); }
  }
  if (failures.length) throw new AggregateError(failures, "Falló la preparación o salida del cierre local.");
}
