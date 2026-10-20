import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { sendWithCooldown } from "./recorrido-usuario-whatsapp.mjs";
import { clickForResponse, invitationTokenFromMessage, requireProblem, runBusinessDependencyCase } from "./e2e-completo-negocio.mjs";

const definition = (suffix, actor, action, route, expected, covers) => ({ id: `SUP-BIZ-${suffix}`, area: "Administración complementaria", actor, action, route, expected, covers, critical: true });
export const supplementBusinessDefinitions = [
  definition("01", "Dueña de una organización nueva", "Crear y editar una empresa con identificación fiscal", "/org/empresas", "El alta inicial escribe y guarda CUIT; otra empresa crea201, abre su ficha y guarda nombre/zona conservando su tipo y número fiscal.", ["BACK-EM-001", "BACK-EM-003", "GUIA-registrar-empresa-04"]),
  definition("02", "Dueña", "Buscar, filtrar y abrir empresas de la organización", "/org/empresas", "Total3 y estados reales; búsqueda devuelve sus dos empresas nuevas, filtro Inactivas una, y su ficha coincide.", ["BACK-EM-002"]),
  definition("03", "Dueña", "Repetir nombres de roles entre empresas y corregir duplicados", "/org/roles/nuevo", "Mismo nombre permitido en empresas distintas; duplicados en la misma empresa y sin empresa409; corregir envía una operación nueva.", ["BACK-RO-005", "BACK-RO-006"]),
  definition("04", "Persona con cuenta Personal previa", "Aceptar el enlace de invitación usando su cuenta destinataria", "/invitacion", "La vista previa exige ingresar; el OTP y la aceptación activan Business con la misma identidad y su Personal ya existente.", ["BACK-OR-009"]),
  definition("05", "Persona invitada sin cuenta", "Aceptar el enlace que concede Administrador de empresa", "/invitacion", "Preview informa empresa/rol; la aceptación crea identidad Business sin Personal y la ficha reserva/activa el mismo miembro.", ["BACK-OR-008"]),
  definition("06", "Dueña", "Buscar miembros por nombre/correo y cruzar estado, empresa y paginado", "/org/usuarios", "Doce invitados cuentan una vez; facets conservan el filtro opuesto y la segunda página conserva estado/empresa.", ["BACK-OR-007"]),
  definition("07", "Administrador de una empresa", "Cambiar roles, quitar y volver a sumar a otro miembro", "/org/empresas/:id", "Cada acción usa versión vigente; sólo cambia esta empresa, sin tocar cuenta, membresía/roles organizacionales ni la segunda empresa.", ["BACK-EM-010"]),
  definition("08", "Administrador sin users.invite", "Reenviar y revocar una invitación exclusiva de su empresa", "/org/empresas/:id", "La fila ofrece ambas acciones; reenvío emite otro correo y revocación invalida el enlace sin activar al miembro.", ["BACK-EM-012"]),
  definition("09", "Administrador sin users.invite", "Intentar resolver invitaciones multiempresa y con rol organizacional", "/org/empresas/:id", "Ambas filas ocultan IDs/acciones de gestión; reenviar y revocar con sus IDs reales devuelve404.", ["BACK-EM-013"]),
  definition("10", "Dueña", "Abrir Ver todos de once dominios pendientes", "/org", "Inicio muestra10 elementos y total11; Ver todos lleva a Configuración con domainStatus=Pending y sus11 dominios reales.", ["BACK-IN-005"]),
  definition("11", "Visitante", "Abrir Crear mi cuenta desde la portada", "/", "El enlace visible abre el registro personal con título, correo y términos disponibles.", ["GUIA-registrarse-01"]),
  definition("12", "Visitante", "Abrir Registrá tu empresa desde la portada", "/", "El enlace visible abre el alta empresarial con título, correo y términos disponibles.", ["GUIA-registrar-empresa-01"]),
  definition("13", "Dueña", "Leer el Inicio de la organización nueva", "/org", "Atajos o tarjetas de Usuarios, Roles y Empresas coinciden con la respuesta real; Para resolver contiene la página en borrador.", ["SCREEN-inicio-org"]),
];

export function assertUserFacetCounts(counts, expected) {
  assert.equal(counts.all, counts.active + counts.invited + counts.expired + counts.pendingDeletion + counts.inactive, "Cada persona tiene un único estado contado.");
  for (const [field, value] of Object.entries(expected)) {
    if (field === "companies") for (const [company, total] of Object.entries(value)) assert.equal(counts.companies?.[company] ?? 0, total, "El facet de empresa conserva el estado seleccionado.");
    else assert.equal(counts[field], value, `El conteo ${field} debe conservar el filtro cruzado.`);
  }
}

export function assertMemberChangesStayInCompany(before, after, companyId) {
  const outside = (member) => ({ ...member, companies: member.companies.filter((company) => company.companyId !== companyId).sort((left, right) => left.companyId.localeCompare(right.companyId)) });
  assert.deepEqual(outside(after), outside(before), "La gestión de una empresa no cambia identidad, organización ni otras empresas.");
}

export function requireHomeGroupPreview(home, kind, total) {
  assert.ok(total > 10);
  const group = home.pendingGroups?.find((entry) => entry.kind === kind);
  assert.ok(group, "El grupo debe existir en la respuesta real de Inicio.");
  assert.equal(group.totalCount, total); assert.equal(group.items.length, 10);
  assert.equal(new Set(group.items.map((item) => item.targetId)).size, 10, "La vista previa no repite filas.");
  return group;
}

const pathOf = (response) => new URL(response.url()).pathname;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const heading = (page, name) => page.getByRole("heading", { name, exact: true }).waitFor();
const read = async (h, page, route) => { const response = await h.api(page, route); assert.equal(response.status(), 200); return response.json(); };
const waitRead = (page, route, match = () => true) => {
  const response = page.waitForResponse((reply) => pathOf(reply) === route && reply.request().method() === "GET" && reply.status() === 200 && match(new URL(reply.url())));
  void response.catch(() => {}); return response;
};

async function createCompany(h, page, name, taxId) {
  await page.goto(new URL("/org/empresas", h.base).href);
  await page.getByRole("button", { name: "Crear empresa", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Crear empresa", exact: true });
  await dialog.getByRole("textbox", { name: "Nombre", exact: true }).fill(name);
  if (taxId) await dialog.getByRole("textbox", { name: "CUIT", exact: true }).fill(taxId);
  const response = await clickForResponse(page, dialog.getByRole("button", { name: "Crear empresa", exact: true }), "/api/companies", "POST", 201);
  const id = await response.json(); assert.match(id, /^[0-9a-f-]{36}$/i);
  await dialog.waitFor({ state: "hidden" }); return read(h, page, `/api/companies/${id}`);
}

async function fillRole(h, page, name, company, label = "Ver miembros", area = "Miembros") {
  await page.goto(new URL("/org/roles/nuevo", h.base).href);
  await page.getByRole("textbox", { name: "Nombre", exact: true }).fill(name);
  await page.getByRole("combobox", { name: "Vale en", exact: true }).click();
  await page.getByRole("option", { name: company?.name ?? "Toda la organización", exact: true }).click();
  await page.getByRole("button", { name: `Abrir o cerrar ${area}`, exact: true }).click();
  await page.getByRole("checkbox", { name: label, exact: true }).check();
}
async function saveRole(h, page) {
  const response = await clickForResponse(page, page.getByRole("button", { name: "Crear rol", exact: true }), "/api/roles", "POST", 201);
  const id = await response.json(); return read(h, page, `/api/roles/${id}`);
}

async function addCompanyToUser(h, page, memberId, company, roleName) {
  await page.goto(new URL(`/org/usuarios/${memberId}`, h.base).href);
  await page.getByRole("button", { name: "Sumar empresa", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Sumar empresa", exact: true });
  await dialog.getByRole("combobox", { name: "Empresa", exact: true }).click();
  await page.getByRole("option", { name: company.name, exact: true }).click();
  if (roleName) { await dialog.getByRole("button", { name: "Roles en la empresa", exact: true }).click(); await page.getByRole("menuitemcheckbox", { name: roleName, exact: true }).click(); await page.keyboard.press("Escape"); }
  await clickForResponse(page, dialog.getByRole("button", { name: "Sumar", exact: true }), `/api/users/${memberId}`, "PUT");
  await dialog.waitFor({ state: "hidden" });
}

async function invite(h, page, email, company, { companyRole, organizationRole } = {}) {
  await page.goto(new URL("/org/usuarios", h.base).href);
  await page.getByRole("button", { name: "Invitar usuario", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Invitar usuario", exact: true });
  await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill(email);
  if (organizationRole) { await dialog.getByRole("button", { name: "Roles de la organización", exact: true }).click(); await page.getByRole("menuitemcheckbox", { name: organizationRole, exact: true }).click(); await page.keyboard.press("Escape"); }
  await dialog.getByRole("combobox", { name: "Empresa", exact: true }).click(); await page.getByRole("option", { name: company.name, exact: true }).click();
  if (companyRole) { await dialog.getByRole("button", { name: "Roles en la empresa", exact: true }).click(); await page.getByRole("menuitemcheckbox", { name: companyRole, exact: true }).click(); await page.keyboard.press("Escape"); }
  const response = await clickForResponse(page, dialog.getByRole("button", { name: "Invitar", exact: true }), "/api/users/invitations", "POST", 201);
  const issued = await response.json(); await dialog.waitFor({ state: "hidden" });
  const list = await read(h, page, `/api/users/paged?search=${encodeURIComponent(email)}&pageSize=100`);
  const member = list.items.find((entry) => entry.invitationId === issued.invitationId); assert.ok(member?.memberId);
  return { ...issued, memberId: member.memberId, email };
}

async function mailToken(h, email, before) {
  const deadline = Date.now() + 95_000;
  while (Date.now() < deadline) {
    for (const message of await h.env.messages(email, before)) { const token = invitationTokenFromMessage(message.body, h.base); if (token) return token; }
    await delay(250);
  }
  throw new Error("La invitación no llegó al pickup sintético.");
}
async function openInvitation(h, page, token, state) {
  const preview = page.waitForResponse((response) => pathOf(response) === "/api/invitations/preview" && response.request().method() === "POST"); void preview.catch(() => {});
  await page.goto(new URL(`/invitacion#${token}`, h.base).href);
  const response = await preview; assert.equal(response.status(), 200);
  const body = await response.json(); assert.equal(body.state, state);
  assert.ok(new URL(page.url()).hash === "", "El token no queda en la captura."); return body;
}

async function chooseFilter(h, page, { label, index, key, value, option }) {
  if (h.width === 390) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.getByRole("dialog", { name: label, exact: true }).locator(`input[type="radio"][name="${key}"][value="${value}"]`).check();
  } else {
    await page.locator('[data-slot="filter-pills"] button').nth(index).click();
    await page.getByRole("menuitemradio", { name: new RegExp(`^${escapeRegex(option)}(?:\\s|$)`) }).click();
  }
}
async function searchUsers(h, page, value) {
  const field = page.getByRole("searchbox", { name: "Buscar por nombre o correo", exact: true });
  if (!await field.isVisible()) await page.getByRole("button", { name: "Buscar por nombre o correo", exact: true }).click();
  const response = waitRead(page, "/api/users/paged", (url) => url.searchParams.get("search") === value);
  await field.fill(value); return (await response).json();
}

async function changeCompanyMemberRoles(h, page, company, member, roleName) {
  await page.goto(new URL(`/org/empresas/${company.id}?search=${encodeURIComponent(member.displayName)}`, h.base).href);
  await page.getByRole("button", { name: `Acciones para ${member.displayName}`, exact: true }).click(); await page.getByRole("menuitem", { name: "Cambiar roles", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: `Roles de ${member.displayName}`, exact: true });
  await dialog.getByRole("button", { name: "Roles en la empresa", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: roleName, exact: true }).click(); await page.keyboard.press("Escape");
  const response = await clickForResponse(page, dialog.getByRole("button", { name: "Guardar cambios", exact: true }), `/api/companies/${company.id}/members/${member.memberId}/roles`, "PUT");
  assert.equal(response.request().postDataJSON().version, member.version); await dialog.waitFor({ state: "hidden" });
}

export async function runSupplementBusinessCases(h) {
  const page = await h.newPage(); let currentEmail = null; let owner; let a; let b; let inactive; let readerA; let readerB; let orgReader; let existing; let member; let administrator; let admin;
  const pending = []; const outcomes = new Map(); const tag = randomUUID().slice(0, 8); const prefix = `Complemento ${tag}`;
  const run = (id, dependencies, action) => runBusinessDependencyCase(h, outcomes, `SUP-BIZ-${id}`, dependencies.map((suffix) => `SUP-BIZ-${suffix}`), () => page, action);
  const signOut = async () => {
    const cancel = page.getByRole("dialog").getByRole("button", { name: "Cancelar", exact: true }).first(); if (await cancel.isVisible()) await cancel.click();
    await h.signOut(page); currentEmail = null;
  };
  const as = async (email) => { if (currentEmail !== email) { if (currentEmail) await signOut(); const me = await h.login(page, email, "business"); currentEmail = email; return me; } return read(h, page, "/api/me"); };
  try {
    await run("11", [], async () => {
      await page.goto(h.base.href); await page.getByRole("link", { name: "Crear mi cuenta", exact: true }).filter({ visible: true }).first().click();
      await heading(page, "Creá tu cuenta"); await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).waitFor();
      await page.getByRole("checkbox", { name: /Acepto los Términos/ }).waitFor(); assert.equal(new URL(page.url()).pathname, "/registro");
      return "Crear mi cuenta abrió el formulario completo de registro desde la portada.";
    });
    await run("12", [], async () => {
      await page.goto(h.base.href); await page.getByRole("link", { name: "Registrá tu empresa", exact: true }).filter({ visible: true }).first().click();
      await heading(page, "Registrá tu empresa"); await page.getByRole("textbox", { name: "Tu correo electrónico", exact: true }).waitFor();
      await page.getByRole("checkbox", { name: /Acepto los Términos/ }).waitFor(); assert.equal(new URL(page.url()).pathname, "/registro/empresa");
      return "Registrá tu empresa abrió su formulario completo desde la portada.";
    });
    await run("01", [], async () => {
      owner = await h.registerBusiness(page, { taxId: "33333333339" }); currentEmail = owner.email;
      a = (await read(h, page, "/api/companies/paged?pageSize=100")).items.find((item) => item.name === owner.companyName); assert.ok(a?.id);
      assert.equal(a.taxId?.number, "33333333339", "El CUIT escrito en el registro empresarial debe persistir en la primera empresa.");
      // Identificaciones fabricadas: ambas comparten el prefijo sintético33 y tienen su dígito verificador correcto.
      b = await createCompany(h, page, `${prefix} Fiscal`, "33333333320"); assert.ok(b.taxId?.type && b.taxId?.number);
      await page.goto(new URL(`/org/empresas/${b.id}`, h.base).href); await heading(page, b.name);
      const before = b; const catalog = await read(h, page, "/api/reference-data");
      const zone = catalog.timeZones.find((item) => item.isEnabled && item.id !== b.timeZoneId && catalog.timeZones.filter((other) => other.city === item.city).length === 1); assert.ok(zone);
      if (h.width === 390) { await page.getByRole("button", { name: "Más acciones", exact: true }).click(); await page.getByRole("menuitem", { name: "Editar empresa", exact: true }).click(); }
      else await page.getByRole("button", { name: "Editar empresa", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Editar empresa", exact: true });
      const renamed = `${prefix} Fiscal editada`; await dialog.getByRole("textbox", { name: "Nombre", exact: true }).fill(renamed);
      await dialog.getByRole("combobox", { name: "Zona de negocio", exact: true }).click();
      await page.getByRole("searchbox", { name: "Buscar zona horaria", exact: true }).fill(zone.city);
      await page.getByRole("option", { name: new RegExp(escapeRegex(zone.city)) }).first().click();
      await clickForResponse(page, dialog.getByRole("button", { name: "Guardar cambios", exact: true }), `/api/companies/${b.id}`, "PUT");
      b = await read(h, page, `/api/companies/${b.id}`); assert.equal(b.name, renamed); assert.equal(b.timeZoneId, zone.id); assert.deepEqual(b.taxId, before.taxId); assert.notEqual(b.version, before.version);
      await page.reload(); await heading(page, b.name);
      inactive = await createCompany(h, page, `${prefix} Inactiva`);
      await page.goto(new URL(`/org/empresas/${inactive.id}`, h.base).href);
      await page.getByRole("button", { name: "Más acciones", exact: true }).click(); await page.getByRole("menuitem", { name: "Inactivar", exact: true }).click();
      await clickForResponse(page, page.getByRole("dialog").getByRole("button", { name: "Inactivar", exact: true }), `/api/companies/${inactive.id}/status`, "PUT");
      assert.equal((await read(h, page, `/api/companies/${inactive.id}`)).status, "Inactive");
      return "Empresa fiscal creada201, ficha abierta y edición UI versionada de nombre/zona; su identificación fiscal siguió idéntica tras F5. Tercera empresa preparada inactiva.";
    });

    await run("13", ["01"], async () => {
      await as(owner.email); await page.goto(new URL("/org", h.base).href);
      const home = await read(h, page, "/api/home"); assert.ok(home.organization, "La Dueña debe recibir el contenido organizacional.");
      const companies = await read(h, page, "/api/companies/filter-counts");
      const users = await read(h, page, "/api/users/filter-counts"); const roles = await read(h, page, "/api/roles/paged?pageSize=100");
      assert.equal(home.organization.companies.total, companies.all); assert.equal(home.organization.users.total, users.all); assert.equal(home.organization.roles.total, roles.totalCount);
      const section = page.getByRole("region", { name: "Para resolver", exact: true }); await section.getByText("Página pública", { exact: true }).waitFor(); await section.getByText("Borrador", { exact: true }).waitFor();
      const areas = page.getByRole("navigation", { name: "Áreas de la organización", exact: true }).last();
      for (const [label, total] of [["Usuarios", users.all], [h.width === 390 ? "Roles" : "Roles y permisos", roles.totalCount], ["Empresas", companies.all]]) {
        const card = areas.getByRole("link", { name: new RegExp(escapeRegex(label)) }).filter({ visible: true }).first(); await card.waitFor();
        if (h.width !== 390) assert.match(await card.innerText(), new RegExp(`\\b${total}\\b`));
      }
      return "Inicio mostró los atajos/tarjetas de las tres áreas reales y la página en borrador dentro de Para resolver; en escritorio cada tarjeta muestra también su total verificado.";
    });

    await run("02", ["01"], async () => {
      await as(owner.email); assert.equal((await read(h, page, "/api/me")).activeTenantId, owner.me.activeTenantId);
      assert.deepEqual(await read(h, page, "/api/companies/filter-counts"), { all: 3, active: 2, inactive: 1 });
      await page.goto(new URL(`/org/empresas?search=${encodeURIComponent(prefix)}`, h.base).href); await heading(page, "Empresas");
      let list = await read(h, page, `/api/companies/paged?search=${encodeURIComponent(prefix)}&pageSize=100`); assert.equal(list.totalCount, 2); assert.deepEqual(list.items.map((item) => item.id).sort(), [b.id, inactive.id].sort());
      assert.deepEqual(await read(h, page, `/api/companies/filter-counts?search=${encodeURIComponent(prefix)}`), { all: 2, active: 1, inactive: 1 });
      const filtered = waitRead(page, "/api/companies/paged", (url) => url.searchParams.get("status") === "Inactive");
      await chooseFilter(h, page, { label: "Filtrar empresas", index: 0, key: "status", value: "Inactive", option: "Inactivas" });
      list = await (await filtered).json(); assert.equal(list.totalCount, 1); assert.equal(list.items[0].id, inactive.id);
      assert.equal(new URL(page.url()).searchParams.get("search"), prefix); assert.equal(new URL(page.url()).searchParams.get("status"), "Inactive");
      await page.getByRole("link", { name: new RegExp(`^${escapeRegex(inactive.name)}`) }).first().click(); await heading(page, inactive.name);
      assert.equal((await read(h, page, `/api/companies/${inactive.id}`)).status, "Inactive");
      return "La organización nueva mostró3 empresas, dos coinciden con la búsqueda y una inactiva; filtro y ficha conservaron el recurso y estado correctos.";
    });

    await run("03", ["01"], async () => {
      await as(owner.email); const name = `Lectura compartida ${tag}`;
      await fillRole(h, page, name, a); readerA = await saveRole(h, page);
      await fillRole(h, page, name, b); readerB = await saveRole(h, page); assert.notEqual(readerA.id, readerB.id); assert.equal(readerA.companyId, a.id); assert.equal(readerB.companyId, b.id);
      await fillRole(h, page, `Consulta usuarios ${tag}`, null, "Ver usuarios", "Usuarios"); orgReader = await saveRole(h, page);
      for (const [duplicateName, company, label, area] of [[name, a, "Ver miembros", "Miembros"], [orgReader.name, null, "Ver usuarios", "Usuarios"]]) {
        await fillRole(h, page, duplicateName, company, label, area);
        const duplicate = await clickForResponse(page, page.getByRole("button", { name: "Crear rol", exact: true }), "/api/roles", "POST", 409);
        const problem = await requireProblem(duplicate, 409, "Roles.Role.AlreadyExists"); await page.getByText(problem.detail, { exact: true }).first().waitFor();
        assert.equal(await page.getByRole("textbox", { name: "Nombre", exact: true }).getAttribute("aria-invalid"), "true");
        const oldKey = duplicate.request().headers()["idempotency-key"]; assert.ok(oldKey);
        await page.getByRole("textbox", { name: "Nombre", exact: true }).fill(`${duplicateName} corregido`);
        const corrected = await clickForResponse(page, page.getByRole("button", { name: "Crear rol", exact: true }), "/api/roles", "POST", 201);
        assert.ok(corrected.request().headers()["idempotency-key"] !== oldKey, "Corregir debe emitir otra operación.");
        await heading(page, `${duplicateName} corregido`);
      }
      return "Nombre idéntico permitido en dos empresas; el mismo alcance de empresa y el ámbito sin empresa rechazaron409. Cada corrección creó con otra clave real.";
    });

    await run("04", ["03"], async () => {
      await signOut(); existing = await h.registerPerson(page); currentEmail = existing.email;
      await page.goto(new URL("/cuenta", h.base).href); await page.getByRole("textbox", { name: "Nombre", exact: true }).fill(`Miémbro Complemento ${tag}`);
      await clickForResponse(page, page.getByRole("button", { name: "Guardar cambios", exact: true }), "/api/me", "PUT");
      await as(owner.email); const before = new Set(await h.env.files()); member = await invite(h, page, existing.email, a, { companyRole: readerA.name }); const token = await mailToken(h, existing.email, before);
      await signOut(); const preview = await openInvitation(h, page, token, "SignInRequired"); assert.equal(preview.organizationId, owner.me.activeTenantId);
      await page.getByRole("button", { name: "Ingresá para aceptar", exact: true }).click();
      await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(existing.email); const mailBefore = new Set(await h.env.files());
      const sent = await sendWithCooldown(() => clickForResponse(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code", "POST", null)); assert.equal(sent.status(), 202);
      await fillOtp(page, await h.env.code(existing.email, mailBefore)); await clickForResponse(page, page.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/login-code/verify", "POST", 200);
      // El OTP puede consumir la invitación durante el ingreso; si queda Ready, la misma pantalla ofrece Aceptar.
      const accept = page.getByRole("button", { name: "Aceptar invitación", exact: true });
      await accept.or(page.getByRole("heading", { name: "Tus empresas", exact: true })).filter({ visible: true }).first().waitFor();
      if (await accept.isVisible()) await clickForResponse(page, accept, "/api/invitations/accept", "POST", 200);
      await page.waitForURL((url) => url.pathname === "/org"); await heading(page, "Tus empresas"); currentEmail = existing.email;
      const me = await read(h, page, "/api/me"); assert.equal(me.id, existing.me.id); assert.equal(me.hasPersonalSpace, true); assert.equal(me.activeTenantId, owner.me.activeTenantId);
      await as(owner.email); const detail = await read(h, page, `/api/users/${member.memberId}`); assert.equal(detail.state, "Active"); assert.equal(detail.userId, existing.me.id);
      await addCompanyToUser(h, page, member.memberId, b, readerB.name);
      return "Una cuenta Personal existente aceptó el enlace tras probar su correo: conserva la misma identidad/Personal y suma Business. El Dueño preparó acceso de lectura en dos empresas.";
    });

    await run("05", ["01"], async () => {
      await as(owner.email); const email = `e2e-supp-admin-${tag}@example.test`; const before = new Set(await h.env.files()); administrator = await invite(h, page, email, a, { companyRole: "Administrador" }); const token = await mailToken(h, email, before);
      const reserved = await read(h, page, `/api/users/${administrator.memberId}`); assert.equal(reserved.userId, null); assert.equal(reserved.state, "Invited");
      await signOut(); const preview = await openInvitation(h, page, token, "NoAccount"); assert.equal(preview.organizationId, owner.me.activeTenantId); assert.ok(preview.companies.includes(a.name)); assert.ok(preview.roles.includes("Administrador"));
      await clickForResponse(page, page.getByRole("button", { name: "Aceptar invitación", exact: true }), "/api/invitations/accept", "POST", 200);
      await page.getByRole("button", { name: "Más tarde", exact: true }).click(); await page.waitForURL((url) => url.pathname === "/org"); await heading(page, "Tus empresas"); currentEmail = email;
      admin = await read(h, page, "/api/me"); assert.equal(admin.hasPersonalSpace, false); assert.equal(admin.access, "business"); assert.equal(admin.activeTenantId, owner.me.activeTenantId); assert.equal(admin.effectivePermissions.organization.includes("users.invite"), false);
      await as(owner.email); const active = await read(h, page, `/api/users/${administrator.memberId}`); assert.equal(active.userId, admin.id); assert.equal(active.state, "Active");
      return "El enlace informó Administrador y empresa, activó la membresía reservada y creó sólo Business, sin Personal ni users.invite.";
    });

    await run("06", ["03", "04", "05"], async () => {
      await as(owner.email);
      for (let index = 0; index < 12; index++) pending.push(await invite(h, page, `e2e-supp-${tag}-${index}@example.test`, a, { companyRole: readerA.name, organizationRole: index === 2 ? orgReader.name : undefined }));
      await addCompanyToUser(h, page, pending[1].memberId, b, readerB.name);
      await page.goto(new URL("/org/usuarios", h.base).href); await heading(page, "Usuarios");
      let found = await searchUsers(h, page, "miembro"); assert.equal(found.totalCount, 1); assert.equal(found.items[0].memberId, member.memberId);
      found = await searchUsers(h, page, existing.email); assert.equal(found.totalCount, 1); assert.equal(found.items[0].userId, existing.me.id);
      await page.goto(new URL("/org/usuarios", h.base).href); await heading(page, "Usuarios");
      let changed = waitRead(page, "/api/users/paged", (url) => url.searchParams.get("state") === "Invited");
      await chooseFilter(h, page, { label: "Filtrar usuarios", index: 0, key: "state", value: "Invited", option: "Invitación pendiente" }); await changed;
      changed = waitRead(page, "/api/users/paged", (url) => url.searchParams.get("state") === "Invited" && url.searchParams.get("companyId") === a.id);
      await chooseFilter(h, page, { label: "Filtrar usuarios", index: 1, key: "companyId", value: a.id, option: a.name }); const first = await (await changed).json();
      assert.equal(first.totalCount, 12); assert.equal(first.items.length, 10);
      const facets = await read(h, page, `/api/users/filter-counts?state=Invited&companyId=${a.id}`);
      assertUserFacetCounts(facets, { all: 15, active: 3, invited: 12, companyAll: 12, companies: { [a.id]: 12, [b.id]: 1 } });
      const next = waitRead(page, "/api/users/paged", (url) => url.searchParams.get("companyId") === a.id && url.searchParams.get("state") === "Invited" && (url.searchParams.get("page") === "2" || Number(url.searchParams.get("pageSize")) > 10));
      await page.getByRole("button", { name: h.width === 390 ? "Cargar más" : "Página siguiente", exact: true }).click(); const second = await (await next).json();
      if (h.width === 390) assert.equal(second.items.length, 12); else { assert.equal(second.items.length, 2); assert.equal(second.items.some((item) => first.items.some((prior) => prior.memberId === item.memberId)), false); }
      assert.equal(second.totalCount, 12); assert.equal(new URL(page.url()).searchParams.get("companyId"), a.id); assert.equal(new URL(page.url()).searchParams.get("state"), "Invited");
      return "Nombre sin acento y correo verificado encontraron la misma persona. Doce invitaciones distintas conservaron total y conteos cruzados en la segunda página/Cargar más.";
    });

    await run("07", ["03", "04", "05"], async () => {
      await as(owner.email); const original = await read(h, page, `/api/users/${member.memberId}`);
      await as(administrator.email); assert.equal((await read(h, page, "/api/me")).effectivePermissions.organization.includes("users.manage"), false);
      let list = await read(h, page, `/api/companies/${a.id}/members/paged?pageSize=100`); let target = list.items.find((item) => item.memberId === member.memberId); assert.ok(target);
      await changeCompanyMemberRoles(h, page, a, target, readerA.name);
      list = await read(h, page, `/api/companies/${a.id}/members/paged?pageSize=100`); target = list.items.find((item) => item.memberId === member.memberId); assert.deepEqual(target.roles, []);
      await page.goto(new URL(`/org/empresas/${a.id}?search=${encodeURIComponent(existing.email)}`, h.base).href); await page.getByRole("button", { name: `Acciones para ${target.displayName}`, exact: true }).click(); await page.getByRole("menuitem", { name: "Quitar de la empresa", exact: true }).click();
      const removed = await clickForResponse(page, page.getByRole("dialog").getByRole("button", { name: "Quitar", exact: true }), `/api/companies/${a.id}/members/${target.memberId}/status`, "PUT"); assert.equal(removed.request().postDataJSON().version, target.version);
      list = await read(h, page, `/api/companies/${a.id}/members/paged?pageSize=100`); target = list.items.find((item) => item.memberId === member.memberId); assert.equal(target.membershipStatus, "Inactive");
      await as(owner.email); assertMemberChangesStayInCompany(original, await read(h, page, `/api/users/${member.memberId}`), a.id);
      await as(administrator.email); await page.goto(new URL(`/org/empresas/${a.id}?search=${encodeURIComponent(existing.email)}`, h.base).href); await page.getByRole("button", { name: `Acciones para ${target.displayName}`, exact: true }).click();
      const restored = await clickForResponse(page, page.getByRole("menuitem", { name: "Volver a sumar", exact: true }), `/api/companies/${a.id}/members/${target.memberId}/status`, "PUT"); assert.equal(restored.request().postDataJSON().version, target.version);
      target = (await read(h, page, `/api/companies/${a.id}/members/paged?pageSize=100`)).items.find((item) => item.memberId === member.memberId); assert.equal(target.membershipStatus, "Active"); assert.deepEqual(target.roles, []);
      await changeCompanyMemberRoles(h, page, a, target, readerA.name);
      await as(owner.email); const final = await read(h, page, `/api/users/${member.memberId}`); assertMemberChangesStayInCompany(original, final, a.id); assert.equal(final.companies.find((company) => company.companyId === a.id).roles[0].id, readerA.id);
      return "El Administrador quitó un rol, quitó la membresía empresarial y la restauró con su rol, usando cada versión actual. La organización y la segunda empresa permanecieron idénticas.";
    });

    await run("08", ["05", "06"], async () => {
      await as(administrator.email); assert.equal((await read(h, page, "/api/me")).effectivePermissions.organization.includes("users.invite"), false);
      let row = (await read(h, page, `/api/companies/${a.id}/members/paged?pageSize=100`)).items.find((item) => item.memberId === pending[0].memberId); assert.equal(row.invitationId, pending[0].invitationId);
      await page.goto(new URL(`/org/empresas/${a.id}?search=${encodeURIComponent(pending[0].email)}`, h.base).href); await page.getByRole("button", { name: `Acciones para ${row.displayName}`, exact: true }).click();
      const before = new Set(await h.env.files()); const resent = await clickForResponse(page, page.getByRole("menuitem", { name: "Reenviar invitación", exact: true }), `/api/companies/${a.id}/invitations/${row.invitationId}/resend`, "POST"); const newId = await resent.json(); assert.match(newId, /^[0-9a-f-]{36}$/i);
      const token = await mailToken(h, pending[0].email, before); row = (await read(h, page, `/api/companies/${a.id}/members/paged?pageSize=100`)).items.find((item) => item.memberId === pending[0].memberId); assert.equal(row.invitationId, newId);
      await page.goto(new URL(`/org/empresas/${a.id}?search=${encodeURIComponent(pending[0].email)}`, h.base).href); await page.getByRole("button", { name: `Acciones para ${row.displayName}`, exact: true }).click(); await page.getByRole("menuitem", { name: "Revocar invitación", exact: true }).click();
      await clickForResponse(page, page.getByRole("dialog").getByRole("button", { name: "Revocar", exact: true }), `/api/companies/${a.id}/invitations/${newId}`, "DELETE", 204);
      await openInvitation(h, page, token, "Invalid"); await heading(page, "Esta invitación ya no sirve");
      await page.goto(new URL(`/org/empresas/${a.id}`, h.base).href); await heading(page, a.name);
      const after = (await read(h, page, `/api/companies/${a.id}/members/paged?pageSize=100`)).items.find((item) => item.memberId === pending[0].memberId); assert.ok(!after || after.state !== "Active");
      return "Sin users.invite, la invitación exclusiva expuso gestión; Reenviar emitió otro correo real y Revocar invalidó su enlace sin activar al miembro.";
    });

    await run("09", ["05", "06"], async () => {
      await as(administrator.email); const members = await read(h, page, `/api/companies/${a.id}/members/paged?pageSize=100`);
      for (const issued of [pending[1], pending[2]]) {
        const row = members.items.find((item) => item.memberId === issued.memberId); assert.ok(row); assert.equal(row.invitationId, null); assert.equal(row.invitationExpiresAtUtc, null);
        await requireProblem(await h.api(page, `/api/companies/${a.id}/invitations/${issued.invitationId}/resend`, { method: "POST", headers: { "Idempotency-Key": randomUUID() } }), 404, "Invitations.Invitation.NotFound");
        await requireProblem(await h.api(page, `/api/companies/${a.id}/invitations/${issued.invitationId}`, { method: "DELETE" }), 404, "Invitations.Invitation.NotFound");
        await page.goto(new URL(`/org/empresas/${a.id}?search=${encodeURIComponent(issued.email)}`, h.base).href); await heading(page, a.name);
        await page.getByText(row.displayName, { exact: true }).filter({ visible: true }).first().waitFor();
        assert.equal(await page.getByRole("button", { name: `Acciones para ${row.displayName}`, exact: true }).count(), 0);
      }
      return "La invitación multiempresa y la que también otorga rol organizacional ocultaron IDs/acciones, y sus cuatro intentos de gestión devolvieron404 con el Administrador real.";
    });

    await run("10", ["01"], async () => {
      await as(owner.email);
      for (let index = 0; index < 11; index++) {
        await page.goto(new URL("/org/configuracion", h.base).href); await page.getByRole("button", { name: "Agregar dominio", exact: true }).click();
        const dialog = page.getByRole("dialog", { name: "Agregar dominio", exact: true }); const domain = `pendiente-${index}-${tag}.example.test`;
        await dialog.getByRole("textbox", { name: "Dominio", exact: true }).fill(domain);
        const response = await clickForResponse(page, dialog.getByRole("button", { name: "Siguiente", exact: true }), "/api/organization/settings/domains", "POST", 201); assert.equal((await response.json()).status, "Pending");
        await page.getByRole("dialog", { name: `Verificar ${domain}`, exact: true }).getByRole("button", { name: "Cancelar", exact: true }).click();
      }
      await page.goto(new URL("/org", h.base).href); const home = await read(h, page, "/api/home"); requireHomeGroupPreview(home, "domainUnverified", 11);
      const section = page.getByRole("region", { name: "Para resolver", exact: true }); await section.getByText("Dominios por verificar", { exact: true }).waitFor();
      await section.getByText("11", { exact: true }).first().waitFor();
      assert.equal(await section.getByRole("link", { name: "Verificar", exact: true }).count(), 10);
      const all = section.getByRole("link", { name: "Ver todos", exact: true }); assert.equal(await all.getAttribute("href"), "/org/configuracion?domainStatus=Pending");
      await all.click(); await heading(page, "Configuración"); assert.equal(new URL(page.url()).searchParams.get("domainStatus"), "Pending");
      const domains = await read(h, page, "/api/organization/settings/domains/paged?status=Pending&pageSize=100"); assert.equal(domains.totalCount, 11); assert.ok(domains.items.every((domain) => domain.status === "Pending"));
      return "Once dominios .example.test agregados por UI, sin DNS: Inicio dio total11/vista10 y Ver todos abrió el filtro Pending con los11 dominios.";
    });
  } finally {
    const cookies = await h.context.cookies(h.base.href);
    if (cookies.some((cookie) => cookie.name === ".AspNetCore.Identity.Application")) {
      // Los fallos en la invitación pueden dejar el marco público; /org permite salir de la propia cookie por UI.
      await page.goto(new URL("/org", h.base).href);
      const frame = page.getByRole("navigation", { name: h.width === 390 ? "Secciones" : "Áreas de la organización", exact: true });
      const login = page.getByRole("textbox", { name: "Correo electrónico", exact: true }); const exit = page.getByRole("button", { name: "Salir", exact: true });
      await frame.or(login).or(exit).filter({ visible: true }).first().waitFor();
      if (await frame.isVisible()) await h.signOut(page);
      else if (await exit.isVisible()) { await exit.click(); await page.getByRole("link", { name: "Ingresá", exact: true }).filter({ visible: true }).first().waitFor(); }
    }
  }
  return outcomes;
}
