import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { plainTextBody } from "./test-e2e-real-mail.mjs";
import { sendWithCooldown } from "./recorrido-usuario-whatsapp.mjs";
import { openBarMenu, chooseBarAction } from "./e2e-completo-menu-barra.mjs";
import { selectMobileBarCases } from "./e2e-completo-seleccion-movil.mjs";

const definition = (id, actor, action, route, expected, covers = []) => ({
  id: `BIZ-${id}`, area: "Administración y aislamiento", actor, action, route, expected, covers, critical: true,
});

export const businessDefinitions = [
  definition("01", "Dueño A", "Registrar organización y empresa inicial", "/registro/empresa", "Alta por UI y OTP del pickup, Dueño y empresa propia, sin Personal automático.", ["BACK-OR-001"]),
  definition("02", "Dueño A", "Crear rol de lectura de Usuarios", "/org/roles/nuevo", "El rol nuevo tiene sólo users.read.", ["BACK-RO-002"]),
  definition("03", "Dueño A", "Invitar sin permisos y asignar el rol nuevo desde Usuario", "/org/usuarios", "La ficha guarda el rol creado y el invitado puede usarlo al ingresar.", ["BACK-OR-015"]),
  definition("04", "Dueño A", "Invitar miembro sin roles ni empresa", "/org/usuarios", "La invitación conserva un conjunto de permisos vacío."),
  definition("05", "Dueño A", "Invitar administrador de la empresa sin roles organizacionales", "/org/usuarios", "Sólo la empresa inicial recibe Administrador; no recibe Dueño."),
  definition("06", "Miembro parcial A", "Aceptar por OTP y consultar Usuarios sin poder administrar", "/org/usuarios", "Sólo users.read; lista visible, sin Invitar, y escrituras/otras áreas denegadas.", ["BACK-OR-010", "BACK-OR-019", "BACK-IN-002"]),
  definition("07", "Miembro sin permisos", "Aceptar por OTP y abrir Inicio y Usuarios", "/org", "Inicio-Miembro sin áreas privadas; URL y API Usuarios deniegan el permiso.", ["BACK-OR-020", "BACK-IN-004"]),
  definition("08", "Administrador de empresa", "Abrir su empresa sin permisos organizacionales", "/org/empresas/:id", "Tus empresas y ficha disponibles; Users y listado general de empresas denegados.", ["BACK-EM-006"]),
  definition("09", "Administrador de empresa", "Agregar un miembro desde su empresa", "/org/empresas/:id", "Selector sólo de candidatos activos y roles de la empresa; el guardado crea la membresía.", ["BACK-EM-008"]),
  definition("10", "Dos pestañas del Dueño A", "Guardar un rol desde una versión anterior", "/org/roles/:id", "Un guardado gana, el segundo da 409 real y muestra Ver lo nuevo/Seguir editando sin pisar al primero.", ["BACK-RO-003", "BACK-HT-001"]),
  definition("11", "Dos pestañas de la misma cuenta", "Guardar Mi cuenta desde una versión anterior", "/cuenta", "El segundo formulario da 409 real y conserva la edición ganadora.", ["BACK-CU-002"]),
  definition("12", "Dueño A", "Agregar un dominio sintético y leer el desafío", "/org/configuracion", "Alta por UI deja el dominio pendiente y abre Verificar con el TXT, sin modificar DNS.", ["BACK-CF-004"]),
  definition("13", "Dueño B", "Registrar una segunda organización independiente", "/registro/empresa", "Otra cuenta y otro tenant con una empresa propia; datos creados por esta prueba."),
  definition("14", "Dueño B", "Invitar al mismo miembro con otro rol", "/org/usuarios", "El rol de B sólo concede roles.read; la cuenta puede tener dos membresías sin mezclar permisos."),
  definition("15", "Dueño A", "Consultar IDs reales de B desde A", "/api/companies/:id", "Empresa, rol, miembro e invitación de B responden 404; los IDs existen y A conserva su token.", ["BACK-OR-014", "BACK-OR-018", "BACK-EM-014", "BACK-RO-011"]),
  definition("16", "Miembro de A y B", "Cambiar desde A a B por Perfiles", "/org", "B tiene sólo roles.read: Roles responde 200 y Usuarios 403; el token y la caché siguen B.", ["BACK-ID-018", "BACK-OR-022"]),
  definition("17", "Miembro de A y B", "Volver a A y recargar", "/org", "A recupera sólo users.read y tras F5 conserva tenant A; roles de B no aparecen.", ["BACK-OR-022"]),
  definition("18", "La misma persona en B2C", "Entrar a Personal y llamar APIs empresariales", "/", "Token consumer, sin Crear empresa, y las APIs Business responden 403.", ["BACK-ID-020", "BACK-HT-006"]),
  definition("19", "Dueño A", "Reenviar una invitación pendiente propia", "/org/usuarios/:id", "Encola otro correo real, renueva la invitación y el enlace anterior responde inválido."),
  definition("20", "Dueño A", "Revocar la invitación reenviada", "/org/usuarios/:id", "La UI revoca y el nuevo enlace también queda inválido; no hay acceso activo.", ["BACK-OR-013"]),
  definition("21", "Dueño A", "Inactivar su empresa", "/org/empresas/:id", "El PUT versionado y GET confirman Inactive; escritorio muestra Inactiva y móvil ofrece Activar en Más acciones. Conserva la identidad y los datos de la empresa."),
  definition("22", "Dueño A", "Reactivar su empresa", "/org/empresas/:id", "La empresa recupera el estado activo con los mismos miembros.", ["BACK-EM-005"]),
  definition("23", "Dueño A", "Deshabilitar una membresía sin borrar sus roles", "/org/usuarios/:id", "Un guardado versionado cambia a Deshabilitado y conserva el rol de lectura."),
  definition("24", "Dueño A", "Rehabilitar la membresía", "/org/usuarios/:id", "Vuelve a Activo con las mismas asignaciones guardadas."),
  definition("25", "Dueño que edita su propio acceso", "Intentar deshabilitar su propia membresía", "/org/usuarios/:id", "403 Tenancy.Member.CannotDisableSelf y franja de explicación; la membresía, sus roles y versión se conservan."),
  definition("26", "Dueño A", "Crear rol específico y filtrar por su empresa", "/org/roles", "El rol vale sólo en A Centro y el filtro Vale en conserva companyId en URL/API.", ["BACK-RO-004"]),
  definition("27", "Dueño A", "Asignar rol de empresa e intentar inactivarlo con personas", "/org/roles", "La opción Inactivar queda apagada con motivo y el DELETE real rechaza HasUsers; alcance tampoco es editable.", ["BACK-RO-007"]),
  definition("28", "Dueño A", "Inactivar un rol de empresa sin asignaciones", "/org/roles", "Confirma por UI y DELETE 204; una lectura posterior da 404."),
  definition("29", "Dueño A", "Dar sólo lectura de Configuración a otro miembro", "/org/usuarios/:id", "La ficha asigna un rol nuevo que sólo concede settings.read."),
  definition("30", "Miembro con settings.read", "Consultar Configuración sin poder modificarla", "/org/configuracion", "Valores como texto, sin Guardar ni Agregar dominio; un PUT directo da403.", ["BACK-CF-003"]),
  definition("31", "Miembro sin audit.read", "Abrir historial por URL y API", "/org/auditoria", "No obtiene eventos ni opciones de actores y la UI muestra permiso denegado.", ["BACK-CF-008"]),
  definition("32", "Dueño A", "Crear empresa con CUIT inválido", "/org/empresas", "Error junto al CUIT conserva el formulario y no emite POST de creación."),
  definition("33", "Visitante con correo probado", "Intentar alta con slug inválido, reservado y ocupado", "/registro/empresa", "Cada dirección rechazada informa el motivo en su campo y no crea organización.", ["BACK-OR-003"]),
  definition("34", "Dueño A", "Quitar al miembro parcial después de probar sus accesos", "/org/usuarios/:id", "DELETE versionado termina su membresía, la ficha posterior da404 y deja de aparecer en Usuarios.", ["BACK-OR-016"]),
  definition("35", "Dueño A", "Crear otra empresa con CUIT sintético ya usado", "/org/empresas", "El primer alta es201 y el segundo nombre con igual CUIT recibe409 en el campo, sin duplicar empresas.", ["BACK-EM-004"]),
  definition("36", "Miembro sin permisos de A", "Abrir una empresa existente de su propia organización", "/org/empresas/:id", "La membresía organizacional no concede la ficha: UI sin permiso y APIs de empresa/miembros 403, sin acciones.", ["BACK-EM-015"]),
  definition("37", "Miembro B con roles.read", "Leer un rol sin crear, editar, inactivar ni asignar", "/org/roles", "Listado y ficha legibles; acciones ausentes y las cuatro escrituras HTTP devuelven403 sin modificar el rol.", ["BACK-RO-010"]),
  definition("38", "Miembro B con una pestaña ya autenticada", "Reusar el token observado después de quitarle roles.read por UI", "/api/roles/paged", "El mismo usuario y organización pasan de200 a403 sin reingreso ni recarga de esa pestaña; /api/me refleja cero permisos.", ["BACK-RO-012"]),
  definition("39", "Único Administrador de la empresa B, también Dueño", "Intentar quitarse el rol Administrador y salir de su empresa", "/org/empresas/:id", "Ambas acciones UI responden409 Companies.Membership.LastCompanyAdmin; la membresía activa y el rol permanecen.", ["BACK-EM-011"]),
  definition("40", "Administrador de empresa A", "Agregar otra vez a un miembro existente", "/api/companies/:id/members", "409 Companies.Membership.AlreadyExists sin duplicar ni cambiar la membresía."),
  definition("41", "Otra cuenta con sesión pública", "Abrir una invitación válida ajena y continuar como su destinatario", "/invitacion", "WrongSession y aceptación403 no vinculan la cuenta ajena; Salir y seguir permite aceptar con la cuenta correcta.", ["BACK-OR-011"]),
  definition("42", "Dueño A", "Asignar un rol organizacional dentro de una empresa", "/api/users/:id", "400 Roles.RoleAssignment.CompanyNotAllowed sin cambiar roles, empresas ni versión."),
  definition("43", "Administrador de empresa A", "Agregar una persona deshabilitada en la organización", "/api/companies/:id/members", "409 Companies.Membership.MemberInactive sin cambiar la membresía; ya se probó el duplicado activo.", ["BACK-EM-009"]),
  definition("44", "Dueño A", "Asignar un rol de empresa sin indicar empresa", "/api/users/:id", "400 Roles.RoleAssignment.CompanyRequired y ninguna asignación nueva."),
  definition("45", "Dueño A", "Asignar un rol específico a otra empresa del mismo tenant", "/api/users/:id", "400 Roles.RoleAssignment.CompanyMismatch sin privilegios nuevos; las otras dos variantes de alcance también rechazadas.", ["BACK-RO-009"]),
];

export const businessRepairDefinitions = businessDefinitions.filter((entry) => ["BIZ-25", "BIZ-41"].includes(entry.id));
export const businessAccessRepairDefinitions = businessDefinitions.filter((entry) => ["23", "24", "25", "26", "27", "28", "31", "34", "38", "42", "43", "44", "45"].includes(entry.id.slice(4)));
export const businessAccessPendingRepairDefinitions = businessAccessRepairDefinitions.filter(({ id }) => id !== "BIZ-34");
export const businessMobileBarDefinitions = ["19", "20", "21", "22", "34"].map((id) => businessDefinitions.find((entry) => entry.id === `BIZ-${id}`));

export async function runBusinessMobileBarCases(h, { run = runBusinessCases } = {}) {
  return run(selectMobileBarCases(h, {
    targets: businessMobileBarDefinitions.map(({ id }) => id),
    prepare: ["01", "02", "03", "06", "23", "24", "31"].map((id) => `BIZ-${id}`),
  }));
}

export const openBusinessBarMenu = (page, options) => openBarMenu(page, page.getByRole("button", { name: "Más acciones", exact: true }), options);
export const chooseBusinessBarAction = (page, action, options) => chooseBarAction(page, page.getByRole("button", { name: "Más acciones", exact: true }), action, options);

/** Un recurso que existe en otra organización debe producir ProblemDetails, nunca datos ni un 403 ambiguo. */
export async function requireProblem(response, status, code) {
  assert.equal(response.status(), status, `La API real debe responder ${status}.`);
  const problem = await response.json();
  assert.ok(typeof problem.code === "string" && problem.code.length > 0, "ProblemDetails debe tener code.");
  assert.ok(typeof problem.traceId === "string" && problem.traceId.length > 0, "ProblemDetails debe tener traceId.");
  if (code) assert.equal(problem.code, code);
  return problem;
}

/** Compara permisos efectivos, sin aceptar ampliaciones accidentales de roles o del acceso anterior. */
export function requireOrganizationPermissions(me, expected) {
  assert.equal(me.access, "business", "La sesión debe ser empresarial.");
  assert.ok(me.activeTenantId, "El token debe identificar su organización activa.");
  assert.deepEqual([...(me.effectivePermissions?.organization ?? [])].sort(), [...expected].sort());
  assert.deepEqual(me.effectivePermissions?.platform ?? [], [], "Business no hereda permisos de Plataforma.");
}

/** SystemRoles.CompanyAdmin aporta assistant.use por la proyección explícita de empresa, aun con el módulo apagado. */
export function requireBusinessCompanyAdministrator(me, organizationId, companyId) {
  requireOrganizationPermissions(me, ["assistant.use"]);
  assert.equal(me.activeTenantId, organizationId, "El Administrador debe pertenecer a la organización propia de la fixture.");
  const companies = me.effectivePermissions?.companies ?? {};
  assert.deepEqual(Object.keys(companies), [companyId], "El rol de empresa sólo debe aportar permisos de la empresa propia.");
  assert.deepEqual([...companies[companyId]].sort(), ["assistant.use", "company.members.manage", "company.members.read"]);
}

/** El control de último Administrador necesita una sola asignación efectiva, no sólo una fila cualquiera. */
export function requireSoleCompanyAdministrator(members, memberId) {
  const active = members.filter((member) => member.state === "Active" && member.membershipStatus === "Active"
    && member.roles.some((role) => role.isSystemRole && role.name === "Administrador"));
  assert.equal(active.length, 1, "La fixture debe tener exactamente un Administrador efectivo.");
  assert.equal(active[0].memberId, memberId, "El actor debe ser ese último Administrador.");
  return active[0];
}

/** Cada variante infringe sólo la regla de alcance que se quiere comprobar, con IDs reales del mismo tenant. */
export function roleScopeNegativeAssignment(kind, original, { organizationRoleId, companyRoleId, companyId, otherCompanyId }) {
  assert.ok(companyId && otherCompanyId && companyId !== otherCompanyId, "La fixture necesita dos empresas diferentes de la misma organización.");
  const base = { roleIds: original.roles.map((role) => role.id), companies: original.companies.map((company) => ({ companyId: company.companyId, roleIds: company.roles.map((role) => role.id) })), version: original.version };
  if (kind === "CompanyNotAllowed") return { ...base, companies: [...base.companies, { companyId, roleIds: [organizationRoleId] }] };
  if (kind === "CompanyRequired") return { ...base, roleIds: [...base.roleIds, companyRoleId] };
  assert.equal(kind, "CompanyMismatch", "La variante debe pertenecer al contrato cerrado de alcance.");
  return { ...base, companies: [...base.companies, { companyId: otherCompanyId, roleIds: [companyRoleId] }] };
}

/** prompt=login es la puerta pública existente para ingresar otra cuenta sin revocar el token de la pestaña viva. */
export async function forceBusinessLogin(h, page, email) {
  await page.goto(new URL("/login/empresa?prompt=login", h.base).href);
  await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(email);
  const before = new Set(await h.env.files());
  const sent = await sendWithCooldown(() => clickForResponse(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code", "POST", null));
  assert.equal(sent.status(), 202, "El ingreso forzado debe enviar el OTP real.");
  await page.getByRole("heading", { name: "Revisá tu correo", exact: true }).waitFor();
  await fillOtp(page, await h.env.code(email, before));
  await clickForResponse(page, page.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/login-code/verify", "POST", 200);
  await page.waitForURL((url) => url.pathname === "/org");
  await page.getByRole("navigation", { name: h.width === 390 ? "Secciones" : "Áreas de la organización", exact: true }).waitFor();
  return read(h, page, "/api/me");
}

/** Un fallo de preparación bloquea sólo sus dependientes; no se convierte en aprobación ni corta los demás casos. */
export async function runBusinessDependencyCase(h, outcomes, id, dependencies, getPage, action) {
  const missing = dependencies.filter((dependency) => outcomes.get(dependency)?.ok !== true);
  if (missing.length) {
    const result = { ok: false, blocked: true };
    outcomes.set(id, result);
    await h.block(id, `Falta una preparación comprobada: ${missing.join(", ")}.`, getPage());
    return result;
  }
  const result = await h.record(id, getPage, action);
  outcomes.set(id, result);
  return result;
}

const pathOf = (response) => new URL(response.url()).pathname;
export async function clickForResponse(page, button, route, method, status = 200) {
  const pending = page.waitForResponse((response) => pathOf(response) === route && response.request().method() === method);
  // Si el clic falla antes, el timeout del waiter sigue observado; el caso conserva el error original del clic.
  void pending.catch(() => {});
  await button.click();
  const response = await pending;
  if (status !== null) assert.equal(response.status(), status, `La acción UI debe responder ${status}.`);
  return response;
}

async function read(h, page, route) {
  const response = await h.api(page, route);
  assert.equal(response.status(), 200, "La lectura autenticada real debe responder 200.");
  return response.json();
}

export async function prepareBusinessRepairMemberProfile(h, page, before, name) {
  requireOrganizationPermissions(before, ["users.read"]);
  await page.goto(new URL("/cuenta", h.base).href); await page.getByRole("heading", { name: "Mi cuenta", exact: true }).waitFor();
  await page.getByRole("textbox", { name: "Nombre", exact: true }).fill(name); await page.getByRole("textbox", { name: "Apellido", exact: true }).fill("");
  const response = await clickForResponse(page, page.getByRole("button", { name: "Guardar cambios", exact: true }), "/api/me", "PUT", 200);
  assert.deepEqual(response.request().postDataJSON(), { firstName: name, lastName: null, culture: before.culture, timeZoneId: before.timeZoneId, version: before.version });
  const saved = await response.json(); const after = await read(h, page, "/api/me");
  assert.equal(after.id, before.id); assert.equal(after.activeTenantId, before.activeTenantId); assert.equal(after.access, before.access);
  requireOrganizationPermissions(after, ["users.read"]); assert.deepEqual(after.effectivePermissions, before.effectivePermissions);
  assert.equal(after.displayName, name); assert.equal(after.firstName, name); assert.equal(after.lastName, null);
  assert.equal(after.version, saved.version); assert.notEqual(after.version, before.version);
  return after;
}

export async function addBusinessRepairCompanyMember(page, companyId, memberId) {
  // Candidatos busca sólo por nombre y puede rotular con correo tapado: no usar el correo completo de Me como opción.
  const candidateRoute = `/api/companies/${companyId}/candidates/paged`;
  const pending = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === candidateRoute && response.request().method() === "GET" && !(url.searchParams.get("search") ?? "").trim();
  });
  void pending.catch(() => {});
  await page.getByRole("button", { name: "Agregar miembro", exact: true }).first().click();
  const dialog = page.getByRole("dialog", { name: "Agregar miembro", exact: true }); await dialog.getByRole("combobox", { name: "Usuario", exact: true }).click();
  const response = await pending; assert.equal(response.status(), 200); const candidates = await response.json();
  assert.equal(candidates.page, 1); assert.equal(candidates.totalCount, 1); assert.notEqual(candidates.hasNext, true); assert.notEqual(candidates.hasMore, true);
  assert.deepEqual(candidates.items.map((candidate) => candidate.memberId), [memberId], "La fixture requiere sólo el candidato propio, sin escoger el primero de varios.");
  const candidate = candidates.items[0]; assert.ok(typeof candidate.displayName === "string" && candidate.displayName.trim().length > 0, "El candidato real debe tener un rótulo legible.");
  const option = page.getByRole("listbox").getByRole("option", { name: candidate.displayName, exact: true }); await option.waitFor(); assert.equal(await option.count(), 1); await option.click();
  const added = await clickForResponse(page, dialog.getByRole("button", { name: "Agregar miembro", exact: true }), `/api/companies/${companyId}/members`, "POST", 204);
  assert.deepEqual(added.request().postDataJSON(), { memberId, roleIds: [] }); await dialog.waitFor({ state: "hidden" });
}

async function createReadRole(h, page, name, permissionLabel, { companyName, area } = {}) {
  await page.goto(new URL("/org/roles/nuevo", h.base).href);
  await page.getByRole("textbox", { name: "Nombre", exact: true }).fill(name);
  await page.getByRole("combobox", { name: "Vale en", exact: true }).click();
  await page.getByRole("option", { name: companyName ?? "Toda la organización", exact: true }).click();
  const group = area ?? (permissionLabel === "Ver usuarios" ? "Usuarios" : "Roles");
  await page.getByRole("button", { name: `Abrir o cerrar ${group}`, exact: true }).click();
  await page.getByRole("checkbox", { name: permissionLabel, exact: true }).check();
  const response = await clickForResponse(page, page.getByRole("button", { name: "Crear rol", exact: true }), "/api/roles", "POST", 201);
  const id = await response.json();
  assert.match(id, /^[0-9a-f-]{36}$/i);
  await page.getByRole("heading", { name, exact: true }).waitFor();
  return { id, name };
}

async function invite(h, page, email, { roleName, companyName } = {}) {
  await page.goto(new URL("/org/usuarios", h.base).href);
  await page.getByRole("button", { name: "Invitar usuario", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Invitar usuario", exact: true });
  await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill(email);
  if (roleName) {
    await dialog.getByRole("button", { name: "Roles de la organización", exact: true }).click();
    await page.getByRole("menuitemcheckbox", { name: roleName, exact: true }).click();
    await page.keyboard.press("Escape");
  }
  if (companyName) {
    await dialog.getByRole("combobox", { name: "Empresa", exact: true }).click();
    await page.getByRole("option", { name: companyName, exact: true }).click();
    await dialog.getByRole("button", { name: "Roles en la empresa", exact: true }).click();
    await page.getByRole("menuitemcheckbox", { name: "Administrador", exact: true }).click();
    await page.keyboard.press("Escape");
  }
  const response = await clickForResponse(page, dialog.getByRole("button", { name: "Invitar", exact: true }), "/api/users/invitations", "POST", 201);
  const issued = await response.json();
  assert.ok(issued.invitationId);
  await dialog.waitFor({ state: "hidden" });
  const list = await read(h, page, `/api/users/paged?search=${encodeURIComponent(email)}&page=1&pageSize=100`);
  const member = list.items.find((entry) => entry.invitationId === issued.invitationId);
  assert.ok(member?.memberId, "El listado debe contener la membresía reservada de esta invitación.");
  return { ...issued, memberId: member.memberId };
}

async function chooseOrganizationRole(page, width, roleName, selected = true) {
  await page.getByRole("button", { name: /Roles de la organización/ }).click();
  if (width === 390) {
    const sheet = page.getByRole("dialog", { name: "Roles de la organización", exact: true });
    await sheet.getByRole("checkbox", { name: roleName, exact: true }).setChecked(selected);
    await sheet.getByRole("button", { name: "Listo", exact: true }).click();
  } else {
    const option = page.getByRole("menuitemcheckbox", { name: roleName, exact: true });
    if (await option.getAttribute("aria-checked") !== String(selected)) await option.click();
    await page.keyboard.press("Escape");
  }
}

async function switchOrganization(h, page, organization, tenantId) {
  // /org puede ser la ruta anterior y la siguiente: esperar sólo la URL permitiría leer el token anterior.
  const switched = page.waitForResponse(async (response) => pathOf(response) === "/api/me" && response.status() === 200
    && (await response.json()).activeTenantId === tenantId);
  void switched.catch(() => {});
  if (h.width === 390) {
    await page.goto(new URL("/mas", h.base).href);
    await page.getByRole("list", { name: "Perfiles", exact: true }).getByRole("button", { name: new RegExp(`^${escapeRegex(organization)}`) }).click();
  } else {
    await page.getByRole("button", { name: /, .+$/ }).filter({ visible: true }).last().click();
    await page.getByRole("menuitemradio", { name: new RegExp(`^${escapeRegex(organization)}`) }).click();
  }
  await switched;
  await page.waitForURL((url) => url.pathname === "/org");
  await page.getByRole("navigation", { name: h.width === 390 ? "Secciones" : "Áreas de la organización" }).waitFor();
}
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function invitationTokenFromMessage(body, base) {
  const link = plainTextBody(body)?.match(/https:\/\/[^\s]+\/invitacion#[A-Za-z0-9_-]+/)?.[0];
  if (!link) return null;
  const url = new URL(link);
  assert.equal(url.origin, base.origin, "El correo de prueba debe apuntar al origen aislado.");
  assert.equal(url.search, "");
  return url.hash.slice(1);
}

async function invitationTokenFromMail(h, email, before) {
  const deadline = Date.now() + 95_000;
  while (Date.now() < deadline) {
    for (const { body } of await h.env.messages(email, before)) {
      const token = invitationTokenFromMessage(body, h.base);
      if (token) return token;
    }
    await delay(250);
  }
  throw new Error("No llegó el correo de invitación al pickup aislado.");
}

async function openInvalidInvitation(h, page, token) {
  const preview = page.waitForResponse((response) => pathOf(response) === "/api/invitations/preview" && response.request().method() === "POST");
  void preview.catch(() => {});
  // La página pide antiforgery por el camino real y retira el fragmento antes de capturar.
  await page.goto(new URL(`/invitacion#${token}`, h.base).href);
  const response = await preview;
  assert.equal(response.status(), 200, "La vista previa comunica el estado funcional en su cuerpo.");
  assert.equal((await response.json()).state, "Invalid");
  await page.getByRole("heading", { name: "Esta invitación ya no sirve", exact: true }).waitFor();
  assert.ok(new URL(page.url()).hash === "", "La prueba secreta no debe quedar en la URL de la captura.");
}

export async function changeMemberState(h, page, memberId, active, status = 200) {
  await page.goto(new URL(`/org/usuarios/${memberId}`, h.base).href);
  const label = active ? "Activo" : "Deshabilitado";
  if (h.width === 390) {
    await page.getByRole("region", { name: "Acceso a la organización", exact: true }).getByRole("button", { name: /^Estado/ }).click();
    const sheet = page.getByRole("dialog", { name: "Estado", exact: true });
    await sheet.getByText(label, { exact: true }).click();
    await sheet.waitFor({ state: "hidden" });
  } else {
    await page.getByRole("combobox", { name: "Estado", exact: true }).click();
    await page.getByRole("option", { name: label, exact: true }).click();
  }
  const save = page.getByRole("button", { name: "Guardar cambios", exact: true });
  if (active) return clickForResponse(page, save, `/api/users/${memberId}`, "PUT", status);
  await save.click();
  return clickForResponse(page, page.getByRole("dialog").getByRole("button", { name: "Deshabilitar y guardar", exact: true }), `/api/users/${memberId}`, "PUT", status);
}

export async function checkMemberStateChange(h, page, memberId, active) {
  const before = await read(h, page, `/api/users/${memberId}`);
  assert.equal(before.state, active ? "Inactive" : "Active", "El cambio necesita la membresía en el estado inicial real.");
  await changeMemberState(h, page, memberId, active);
  const after = await read(h, page, `/api/users/${memberId}`);
  assert.equal(after.state, active ? "Active" : "Inactive");
  assert.ok(Number.isInteger(after.version) && after.version > before.version, "El guardado debe avanzar la versión real.");
  assert.equal(after.userId, before.userId); assert.equal(after.memberId, before.memberId);
  assert.deepEqual(after.roles, before.roles, "Cambiar el estado no cambia los roles.");
  assert.deepEqual(after.companies, before.companies, "Cambiar el estado no cambia las asignaciones de empresa.");
  await page.getByText(active ? "Activo" : "Deshabilitado", { exact: true }).first().waitFor();
  return { before, after };
}

/** M-Empresa muestra CUIT/zona en el subtítulo; la acción inversa comunica el estado en su menú. */
export async function assertCompanyStateVisible(h, page, status) {
  assert.ok(["Active", "Inactive"].includes(status), "El estado debe pertenecer al contrato de empresas.");
  if (h.width === 390) {
    const opened = await openBusinessBarMenu(page, { activation: "Enter" });
    await opened.menu.getByRole("menuitem", { name: status === "Inactive" ? "Activar" : "Inactivar", exact: true }).waitFor();
    return opened;
  } else await page.getByText(status === "Inactive" ? "Inactiva" : "Activa", { exact: true }).first().waitFor();
}

export async function checkSelfDisable(h, page, personId) {
  const users = await read(h, page, "/api/users/paged?page=1&pageSize=100");
  const owner = users.items.find((entry) => entry.userId === personId);
  assert.ok(owner?.memberId, "La membresía propia debe existir en la organización de la fixture.");
  const before = await read(h, page, `/api/users/${owner.memberId}`);
  assert.equal(before.userId, personId);
  assert.equal(before.state, "Active");
  assert.ok(before.roles.some((role) => role.isSystemRole && role.scope === "Organization" && role.name === "Dueño"));
  const response = await changeMemberState(h, page, owner.memberId, false, 403);
  await requireProblem(response, 403, "Tenancy.Member.CannotDisableSelf");
  await page.getByText("No podés deshabilitarte a vos misma.", { exact: true }).waitFor();
  assert.deepEqual(await read(h, page, `/api/users/${owner.memberId}`), before, "El rechazo debe conservar la membresía, roles y versión.");
  return "El intento de deshabilitarse respondió403 CannotDisableSelf con explicación visible; la membresía, roles y versión siguieron intactos.";
}

/** Revalida sólo25/41, con una organización propia y las capturas antes de cerrar sus pestañas. */
export async function runBusinessRepairCases(h) {
  const page = await h.newPage();
  const results = new Map();
  let fixture;
  try {
    results.set("BIZ-25", await h.record("BIZ-25", () => page, async () => {
      fixture = await h.registerBusiness(page);
      assert.equal(fixture.me.access, "business");
      assert.equal(fixture.me.hasPersonalSpace, false);
      return checkSelfDisable(h, page, fixture.me.id);
    }));
    if (!fixture) {
      await h.block("BIZ-41", "No se completó el alta de la organización propia.", page);
      results.set("BIZ-41", { ok: false, blocked: true });
      return results;
    }
    const discard = page.getByRole("button", { name: "Descartar cambios", exact: true }).filter({ visible: true }).first();
    if (await discard.isVisible()) await discard.click();
    let flow;
    let ownerRestored = false;
    try {
      results.set("BIZ-41", await h.record("BIZ-41", () => flow ?? page, async () => {
        flow = await h.newPage();
        return checkWrongSessionInvitation(h, page, flow, fixture, { onOwnerAuthenticated: () => { ownerRestored = true; } });
      }));
    } finally {
      if (flow) await finishInvitationFlow(h, page, flow, fixture, ownerRestored);
    }
    return results;
  } finally {
    try {
      if (fixture) {
        const discard = page.getByRole("button", { name: "Descartar cambios", exact: true }).filter({ visible: true }).first();
        if (await discard.isVisible()) await discard.click();
        await h.signOut(page);
      }
    } finally { await page.close(); }
  }
}

/** Los doce pendientes comparten callbacks y fixtures del runner de reparación, sin repetir34. */
export async function runBusinessAccessPendingRepairCases(h, { run = runBusinessAccessRepairCases } = {}) {
  const selected = new Set(businessAccessPendingRepairDefinitions.map(({ id }) => id));
  return run({ ...h,
    record: (id, ...args) => selected.has(id) ? h.record(id, ...args) : { ok: false, skipped: true },
    block: (id, ...args) => selected.has(id) ? h.block(id, ...args) : { ok: false, skipped: true },
  });
}

/** Sólo los trece afectados originales; las altas propias son preparación y no acreditan otros registros. */
export async function runBusinessAccessRepairCases(h) {
  const page = await h.newPage(); let capturePage = page; let live;
  const outcomes = new Map(); const tag = randomUUID().slice(0, 8);
  const partialEmail = `e2e-repara-parcial-${tag}@example.test`; const adminEmail = `e2e-repara-admin-${tag}@example.test`;
  let owner; let company; let partial; let partialName; let empty; let role; let companyRole; let sibling; let currentEmail; let prepared = false; let rolesBefore;
  const run = (id, dependencies, action) => runBusinessDependencyCase(h, outcomes, `BIZ-${id}`, dependencies.map((value) => `BIZ-${value}`), () => capturePage, async () => { capturePage = page; return action(); });
  const discard = async () => {
    const cancel = page.getByRole("dialog").getByRole("button", { name: "Cancelar", exact: true }).first(); if (await cancel.isVisible()) await cancel.click();
    const reset = page.getByRole("button", { name: "Descartar cambios", exact: true }).filter({ visible: true }).first(); if (await reset.isVisible()) await reset.click();
  };
  const leave = async () => { await discard(); await h.signOut(page); currentEmail = null; };
  const as = async (email) => {
    capturePage = page;
    if (currentEmail === email) { await discard(); return read(h, page, "/api/me"); }
    if (currentEmail) await leave();
    const me = await h.login(page, email, "business"); currentEmail = email; return me;
  };
  const prepare = async () => {
    owner = await h.registerBusiness(page); currentEmail = owner.email;
    assert.equal(owner.me.access, "business"); assert.equal(owner.me.hasPersonalSpace, false);
    company = (await read(h, page, "/api/companies/paged?page=1&pageSize=100")).items.find((item) => item.name === owner.companyName); assert.ok(company?.id);
    role = await createReadRole(h, page, `Lectura Usuarios reparación ${tag}`, "Ver usuarios");
    assert.deepEqual((await read(h, page, `/api/roles/${role.id}`)).permissions, ["users.read"]);
    partial = await invite(h, page, partialEmail, { roleName: role.name });
    empty = await invite(h, page, `e2e-repara-vacio-${tag}@example.test`);
    await invite(h, page, adminEmail, { companyName: company.name });
    const member = await as(partialEmail); requireOrganizationPermissions(member, ["users.read"]); assert.equal(member.activeTenantId, owner.me.activeTenantId);
    const named = await prepareBusinessRepairMemberProfile(h, page, member, `Miembro reparación ${tag}`); partialName = named.displayName;
    const admin = await as(adminEmail); requireBusinessCompanyAdministrator(admin, owner.me.activeTenantId, company.id); assert.equal((await h.api(page, `/api/companies/${company.id}`)).status(), 200);
    await as(owner.email); await page.goto(new URL(`/org/empresas/${company.id}`, h.base).href);
    await addBusinessRepairCompanyMember(page, company.id, partial.memberId);
    await as(adminEmail);
    const route = `/api/companies/${company.id}/members/paged?page=1&pageSize=100`; const before = await read(h, page, route);
    assert.equal(before.items.filter((item) => item.memberId === partial.memberId).length, 1); assert.equal(before.items.find((item) => item.memberId === partial.memberId).displayName, partialName);
    await requireProblem(await h.api(page, `/api/companies/${company.id}/members`, { method: "POST", headers: { "Idempotency-Key": randomUUID() }, data: { memberId: partial.memberId, roleIds: [] } }), 409, "Companies.Membership.AlreadyExists");
    assert.deepEqual(await read(h, page, route), before); await as(owner.email); prepared = true;
  };
  try {
    await run("23", [], async () => {
      try { await prepare(); } catch (error) { error.message = `Preparación propia de la reparación de membresía: ${error.message}`; throw error; }
      const changed = await checkMemberStateChange(h, page, partial.memberId, false); rolesBefore = changed.before.roles;
      return "La membresía propia pasó a Deshabilitado por PUT200 versionado, sin cambiar sus roles ni sus asignaciones de empresa.";
    });
    if (!owner) {
      for (const entry of businessAccessRepairDefinitions.filter((item) => item.id !== "BIZ-23")) { await h.block(entry.id, "No se completó el alta propia de la reparación.", page); outcomes.set(entry.id, { ok: false, blocked: true }); }
      return outcomes;
    }
    if (!prepared) {
      await run("25", [], async () => { await as(owner.email); return checkSelfDisable(h, page, owner.me.id); });
      for (const entry of businessAccessRepairDefinitions.filter((item) => !outcomes.has(item.id))) { await h.block(entry.id, "No se completaron las membresías y roles propios de la reparación.", page); outcomes.set(entry.id, { ok: false, blocked: true }); }
      return outcomes;
    }
    await run("43", ["23"], async () => {
      await as(adminEmail); const route = `/api/companies/${company.id}/members/paged?page=1&pageSize=100`; const before = await read(h, page, route);
      assert.equal(before.items.find((item) => item.memberId === partial.memberId)?.state, "Inactive");
      await requireProblem(await h.api(page, `/api/companies/${company.id}/members`, { method: "POST", headers: { "Idempotency-Key": randomUUID() }, data: { memberId: partial.memberId, roleIds: [] } }), 409, "Companies.Membership.MemberInactive");
      assert.deepEqual(await read(h, page, route), before); await page.goto(new URL(`/org/empresas/${company.id}`, h.base).href); await page.getByText(partialName, { exact: true }).first().waitFor();
      return "Administrador propio recibió409 MemberInactive sin cambiar miembros; el duplicado activo también fue rechazado durante la preparación.";
    });
    await run("24", ["23"], async () => { await as(owner.email); const changed = await checkMemberStateChange(h, page, partial.memberId, true); assert.deepEqual(changed.after.roles, rolesBefore); return "Membresía rehabilitada por PUT200, versión nueva y mismas asignaciones guardadas."; });
    await run("25", [], async () => { await as(owner.email); return checkSelfDisable(h, page, owner.me.id); });
    await run("26", [], async () => {
      await as(owner.email); companyRole = await createReadRole(h, page, `Lectura empresa reparación ${tag}`, "Ver miembros", { companyName: company.name, area: "Miembros" });
      const detail = await read(h, page, `/api/roles/${companyRole.id}`); assert.equal(detail.scope, "SpecificCompany"); assert.equal(detail.companyId, company.id); assert.deepEqual(detail.permissions, ["company.members.read"]);
      await filterRolesByCompany(h, page, company); await page.getByRole("link", { name: companyRole.name, exact: true }).waitFor(); return "Rol específico propio creado y listado con filtro UI, companyId API200 y vale en URL.";
    });
    await run("27", ["24", "26"], async () => {
      await as(owner.email); await page.goto(new URL(`/org/empresas/${company.id}`, h.base).href);
      await page.getByRole("button", { name: `Acciones para ${partialName}`, exact: true }).click(); await page.getByRole("menuitem", { name: "Cambiar roles", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: `Roles de ${partialName}`, exact: true }); await dialog.getByRole("button", { name: "Roles en la empresa", exact: true }).click();
      await page.getByRole("menuitemcheckbox", { name: companyRole.name, exact: true }).click(); await page.keyboard.press("Escape");
      await clickForResponse(page, dialog.getByRole("button", { name: "Guardar cambios", exact: true }), `/api/companies/${company.id}/members/${partial.memberId}/roles`, "PUT");
      const assigned = await read(h, page, `/api/roles/${companyRole.id}`); assert.equal(assigned.userCount, 1); await page.goto(new URL(`/org/roles/${companyRole.id}`, h.base).href);
      assert.equal(await page.getByRole("combobox", { name: "Vale en", exact: true }).isDisabled(), true); await filterRolesByCompany(h, page, company);
      await page.getByRole("button", { name: `Acciones para ${companyRole.name}`, exact: true }).click(); assert.equal(await page.getByRole("menuitem", { name: "Inactivar", exact: true }).getAttribute("aria-disabled"), "true");
      await page.getByText("Lo tiene 1 usuario. Quitáselo primero.", { exact: true }).waitFor(); await requireProblem(await h.api(page, `/api/roles/${companyRole.id}`, { method: "DELETE", data: { version: assigned.version } }), 409, "Roles.Role.HasUsers");
      return "Rol propio asignado por UI; alcance bloqueado, Inactivar apagado con motivo y DELETE409 HasUsers.";
    });
    await run("28", [], async () => {
      await as(owner.email); const disposable = await createReadRole(h, page, `Sin asignar reparación ${tag}`, "Ver miembros", { companyName: company.name, area: "Miembros" }); await filterRolesByCompany(h, page, company);
      await page.getByRole("button", { name: `Acciones para ${disposable.name}`, exact: true }).click(); await page.getByRole("menuitem", { name: "Inactivar", exact: true }).click();
      await clickForResponse(page, page.getByRole("dialog").getByRole("button", { name: "Inactivar", exact: true }), `/api/roles/${disposable.id}`, "DELETE", 204);
      await requireProblem(await h.api(page, `/api/roles/${disposable.id}`), 404, "Roles.Role.NotFound"); return "Rol propio sin personas inactivado por UI204 y lectura404.";
    });
    await run("31", ["24"], async () => { await as(partialEmail); await requireProblem(await h.api(page, "/api/organization/audit"), 403); await requireProblem(await h.api(page, "/api/organization/audit/actors/paged"), 403); await page.goto(new URL("/org/auditoria", h.base).href); await page.getByRole("heading", { name: "No tenés permiso para ver esta página", exact: true }).waitFor(); return "Miembro propio sin audit.read no obtuvo eventos, actores ni pantalla privada."; });
    await run("38", ["31"], async () => {
      await as(owner.email); const cachedRole = await createReadRole(h, page, `Lectura Roles reparación ${tag}`, "Ver roles"); const email = `e2e-repara-cache-${tag}@example.test`; const cachedMember = await invite(h, page, email, { roleName: cachedRole.name });
      await leave(); live = await h.newPage(); capturePage = live; const logged = await h.login(live, email, "business"); currentEmail = email; requireOrganizationPermissions(logged, ["roles.read"]);
      await live.goto(new URL("/org/roles", h.base).href); await live.getByRole("heading", { name: "Roles y permisos", exact: true }).waitFor(); const original = await read(h, live, "/api/me"); assert.equal(original.activeTenantId, owner.me.activeTenantId); assert.equal((await h.api(live, "/api/roles/paged")).status(), 200);
      capturePage = page; const restored = await forceBusinessLogin(h, page, owner.email); currentEmail = owner.email; assert.equal(restored.id, owner.me.id);
      capturePage = live; assert.equal((await read(h, live, "/api/me")).id, original.id); assert.equal((await h.api(live, "/api/roles/paged")).status(), 200);
      capturePage = page; await page.goto(new URL(`/org/usuarios/${cachedMember.memberId}`, h.base).href); await chooseOrganizationRole(page, h.width, cachedRole.name, false); await clickForResponse(page, page.getByRole("button", { name: "Guardar cambios", exact: true }), `/api/users/${cachedMember.memberId}`, "PUT"); assert.deepEqual((await read(h, page, `/api/users/${cachedMember.memberId}`)).roles, []);
      capturePage = live; await requireProblem(await h.api(live, "/api/roles/paged"), 403, "Http.Forbidden"); const changed = await read(h, live, "/api/me"); assert.equal(changed.id, original.id); assert.equal(changed.activeTenantId, original.activeTenantId); requireOrganizationPermissions(changed, []);
      return "Pestaña viva propia conservó identidad/token y pasó Roles200→403 sin recarga ni reingreso después de retirar roles.read por UI; Me quedó sin permisos.";
    });
    await run("34", ["24", "31"], async () => {
      await as(owner.email); await page.goto(new URL(`/org/usuarios/${partial.memberId}`, h.base).href); await page.getByRole("button", { name: "Más acciones", exact: true }).click(); await page.getByRole("menuitem", { name: "Quitar de la organización", exact: true }).click();
      await clickForResponse(page, page.getByRole("dialog").getByRole("button", { name: "Quitar", exact: true }), `/api/users/${partial.memberId}`, "DELETE", 204); await page.waitForURL((url) => url.pathname === "/org/usuarios"); await requireProblem(await h.api(page, `/api/users/${partial.memberId}`), 404); assert.equal((await read(h, page, `/api/users/paged?search=${encodeURIComponent(partialEmail)}&page=1&pageSize=100`)).items.some((item) => item.memberId === partial.memberId), false); return "Membresía propia retirada por UI, ausente de Usuarios y ficha404.";
    });
    for (const [id, kind, dependencies] of [["42", "CompanyNotAllowed", ["26"]], ["44", "CompanyRequired", ["26"]], ["45", "CompanyMismatch", ["42", "44"]]]) await run(id, dependencies, async () => {
      await as(owner.email);
      if (!sibling) {
        const name = `Hermana reparación ${tag}`; await page.goto(new URL("/org/empresas", h.base).href); await page.getByRole("button", { name: "Crear empresa", exact: true }).click(); const dialog = page.getByRole("dialog", { name: "Crear empresa", exact: true }); await dialog.getByRole("textbox", { name: "Nombre", exact: true }).fill(name); await clickForResponse(page, dialog.getByRole("button", { name: "Crear empresa", exact: true }), "/api/companies", "POST", 201); await dialog.waitFor({ state: "hidden" }); sibling = (await read(h, page, "/api/companies/paged?page=1&pageSize=100")).items.find((item) => item.name === name); assert.ok(sibling?.id);
      }
      assert.equal((await read(h, page, `/api/companies/${sibling.id}`)).id, sibling.id); const before = await read(h, page, `/api/users/${empty.memberId}`); const data = roleScopeNegativeAssignment(kind, before, { organizationRoleId: role.id, companyRoleId: companyRole.id, companyId: company.id, otherCompanyId: sibling.id });
      await requireProblem(await h.api(page, `/api/users/${empty.memberId}`, { method: "PUT", data }), 400, `Roles.RoleAssignment.${kind}`); assert.deepEqual(await read(h, page, `/api/users/${empty.memberId}`), before); await page.goto(new URL(`/org/usuarios/${empty.memberId}`, h.base).href); await page.getByRole("region", { name: "Acceso a la organización", exact: true }).waitFor(); return `${kind}:400 con dos empresas y roles reales del mismo tenant, sin cambiar membresía, asignaciones ni versión.`;
    });
    return outcomes;
  } finally {
    try { if (currentEmail) { await discard(); await page.goto(new URL("/org", h.base).href); await h.signOut(page); } }
    finally { await Promise.allSettled([page.close(), ...(live ? [live.close()] : [])]); }
  }
}

/** Un body CDP de un documento ya retirado se vuelve a leer; ningún rechazo HTTP o estado funcional se ignora. */
export async function readInvitationPreviewResponse(response, expectedState, reload) {
  assert.equal(response.status(), 200, "La vista previa real debe responder200.");
  let body;
  try { body = await response.json(); }
  catch (error) {
    const stale = error instanceof Error
      && error.message.includes("Protocol error (Network.getResponseBody): No resource with given identifier found")
      && error.message.includes("Response body is not available for a response that was navigated away from");
    if (!stale || !reload) throw error;
    const fresh = await reload();
    assert.equal(fresh.status(), 200, "La vista previa posterior debe responder200.");
    body = await fresh.json();
  }
  assert.equal(body.state, expectedState, "La vista previa debe comunicar el estado funcional esperado.");
  return body;
}

async function freshInvitationPreview(h, flow, token) {
  const csrf = await flow.request.get(new URL("/api/auth/external/google/antiforgery", h.base).href);
  assert.equal(csrf.status(), 200);
  const { requestToken } = await csrf.json();
  assert.ok(requestToken);
  return flow.request.post(new URL("/api/invitations/preview", h.base).href, {
    headers: { RequestVerificationToken: requestToken }, data: { token },
  });
}

export async function checkWrongSessionInvitation(h, page, flow, a, { onSignedOut = () => {}, onOwnerAuthenticated = () => {} } = {}) {
  const recipientEmail = `e2e-integral-sesion-ajena-${randomUUID()}@example.test`;
  const mailBefore = new Set(await h.env.files());
  const issued = await invite(h, page, recipientEmail);
  const token = await invitationTokenFromMail(h, recipientEmail, mailBefore);
  const original = await read(h, page, `/api/users/${issued.memberId}`);
  assert.equal(original.state, "Invited"); assert.equal(original.userId, null);
  const ownerMethods = await read(h, page, "/api/me/login-methods");
  const preview = flow.waitForResponse((response) => pathOf(response) === "/api/invitations/preview" && response.request().method() === "POST")
    .then((response) => readInvitationPreviewResponse(response, "WrongSession", () => freshInvitationPreview(h, flow, token)));
  void preview.catch(() => {});
  await flow.goto(new URL(`/invitacion#${token}`, h.base).href);
  await preview;
  assert.ok(new URL(flow.url()).hash === "", "El secreto de la invitación no queda en la URL.");
  await flow.getByRole("heading", { name: `Te sumás a ${a.organization}`, exact: true }).waitFor();
  const switchAccount = flow.getByRole("button", { name: `Salir y seguir como ${recipientEmail}`, exact: true });
  await switchAccount.waitFor();
  assert.equal(await flow.getByRole("button", { name: "Aceptar invitación", exact: true }).count(), 0);
  const csrf = await read(h, page, "/api/auth/external/google/antiforgery");
  assert.ok(csrf.requestToken);
  await requireProblem(await h.api(page, "/api/invitations/accept", { method: "POST", headers: { RequestVerificationToken: csrf.requestToken, "Idempotency-Key": randomUUID() }, data: { token, acceptedTerms: true } }), 403, "Invitations.Invitation.WrongAccount");
  assert.deepEqual(await read(h, page, `/api/users/${issued.memberId}`), original);
  assert.deepEqual(await read(h, page, "/api/me/login-methods"), ownerMethods, "La sesión ajena no adquiere el método del destinatario.");
  await switchAccount.click(); onSignedOut();
  await flow.getByText("Al aceptar creamos tu cuenta con este correo y aceptás los Términos y la Política de privacidad.", { exact: true }).waitFor();
  await flow.getByRole("button", { name: "Aceptar invitación", exact: true }).waitFor();
  // Se consulta la cookie real después del logout y de la vista NoAccount, sin depender del body de otro documento.
  await readInvitationPreviewResponse(await freshInvitationPreview(h, flow, token), "NoAccount");
  await clickForResponse(flow, flow.getByRole("button", { name: "Aceptar invitación", exact: true }), "/api/invitations/accept", "POST", 200);
  await flow.getByRole("heading", { name: `Te sumaste a ${a.organization}`, exact: true }).waitFor();
  await flow.getByRole("button", { name: "Más tarde", exact: true }).click();
  await flow.waitForURL((url) => url.pathname === "/org");
  await flow.getByRole("heading", { name: "Tus empresas", exact: true }).waitFor();
  const recipient = await read(h, flow, "/api/me");
  assert.notEqual(recipient.id, a.me.id); assert.equal(recipient.activeTenantId, a.me.activeTenantId);
  requireOrganizationPermissions(recipient, []);
  const owner = await forceBusinessLogin(h, page, a.email);
  onOwnerAuthenticated();
  assert.equal(owner.id, a.me.id);
  const accepted = await read(h, page, `/api/users/${issued.memberId}`);
  assert.equal(accepted.state, "Active"); assert.equal(accepted.userId, recipient.id);
  assert.deepEqual(await read(h, page, "/api/me/login-methods"), ownerMethods);
  return "La cuenta ajena recibió WrongSession y403 sin activar ni vincularse; Salir y seguir mostró NoAccount y permitió aceptar con el destinatario correcto. La Dueña recuperó su sesión por UI.";
}

async function finishInvitationFlow(h, page, flow, a, ownerRestored) {
  try {
    if (!ownerRestored) {
      await flow.goto(new URL("/org", h.base).href);
      const frame = flow.getByRole("navigation", { name: h.width === 390 ? "Secciones" : "Áreas de la organización", exact: true });
      const loginField = flow.getByRole("textbox", { name: "Correo electrónico", exact: true });
      await frame.or(loginField).filter({ visible: true }).first().waitFor();
      if (await frame.isVisible()) await h.signOut(flow);
      const owner = await forceBusinessLogin(h, page, a.email);
      assert.equal(owner.id, a.me.id);
    }
  } finally { await flow.close(); }
}

export async function filterRolesByCompany(h, page, company) {
  await page.goto(new URL("/org/roles", h.base).href);
  const filtered = page.waitForResponse((response) => pathOf(response) === "/api/roles/paged"
    && new URL(response.url()).searchParams.get("companyId") === company.id && response.status() === 200);
  void filtered.catch(() => {});
  if (h.width === 390) {
    await page.getByRole("button", { name: "Filtrar roles", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Filtrar roles", exact: true });
    await sheet.getByText(company.name, { exact: true }).click();
    await sheet.waitFor({ state: "hidden" });
  } else {
    await page.getByRole("button", { name: /^Vale en: todos/ }).click();
    await page.getByRole("menuitemradio", { name: new RegExp(`^${escapeRegex(company.name)}`) }).click();
  }
  await filtered;
  assert.equal(new URL(page.url()).searchParams.get("vale"), company.id);
}

export async function runBusinessCases(h) {
  const page = await h.newPage();
  let capturePage = page;
  let currentEmail = null;
  let a; let b; let roleA; let roleB; let companyA; let companyB; let siblingCompany; let memberB;
  let partial; let empty; let companyAdmin; let invitationB; let ownInvitation; let firstInvitationToken; let resentInvitationToken;
  let companyRole; let settingsRole; let membersBeforeDeactivation; let rolesBeforeSuspension;
  let incompleteBusinessIdentity = false;
  const tag = randomUUID().slice(0, 8);
  const partialEmail = `e2e-integral-parcial-${tag}@example.test`;
  const emptyEmail = `e2e-integral-vacio-${tag}@example.test`;
  const adminEmail = `e2e-integral-empresa-${tag}@example.test`;
  const partialName = `Persona parcial ${tag}`;
  const outcomes = new Map();
  const run = (id, dependencies, action) => runBusinessDependencyCase(h, outcomes, `BIZ-${id}`, dependencies.map((value) => `BIZ-${value}`), () => capturePage, async () => {
    capturePage = page;
    return action();
  });
  const endSession = async () => {
    // Un rechazo de producto puede haber dejado abierto Crear empresa. Se conserva en su captura y luego se cancela
    // antes de cambiar de identidad; el siguiente caso no debe fallar por un diálogo del anterior.
    const cancel = page.getByRole("dialog").getByRole("button", { name: "Cancelar", exact: true }).first();
    if (await cancel.isVisible()) await cancel.click();
    await h.signOut(page);
    currentEmail = null;
  };
  const as = async (email, access = "business") => {
    if (currentEmail !== email) {
      if (currentEmail) await endSession();
      currentEmail = null;
      const me = await h.login(page, email, access);
      currentEmail = email;
      return me;
    }
    return read(h, page, "/api/me");
  };

  await run("01", [], async () => {
    a = await h.registerBusiness(page); currentEmail = a.email;
    assert.equal(a.me.access, "business"); assert.equal(a.me.hasPersonalSpace, false);
    const companies = await read(h, page, "/api/companies/paged?page=1&pageSize=100");
    companyA = companies.items.find((entry) => entry.name === a.companyName);
    assert.ok(companyA?.id);
    return "La organización A y su empresa nacieron por UI con la cuenta Dueña propia.";
  });
  await run("02", ["01"], async () => {
    roleA = await createReadRole(h, page, `Lectura Usuarios ${tag}`, "Ver usuarios");
    const detail = await read(h, page, `/api/roles/${roleA.id}`);
    assert.deepEqual(detail.permissions, ["users.read"]);
    return "Rol creado por UI con exactamente users.read.";
  });
  await run("03", ["01", "02"], async () => {
    partial = await invite(h, page, partialEmail);
    await page.goto(new URL(`/org/usuarios/${partial.memberId}`, h.base).href);
    await chooseOrganizationRole(page, h.width, roleA.name);
    await clickForResponse(page, page.getByRole("button", { name: "Guardar cambios", exact: true }), `/api/users/${partial.memberId}`, "PUT");
    const detail = await read(h, page, `/api/users/${partial.memberId}`);
    assert.deepEqual(detail.roles.map((role) => role.id), [roleA.id]);
    return "La ficha Usuario guardó el rol recién creado en la invitación de la persona parcial.";
  });
  await run("04", ["01"], async () => {
    empty = await invite(h, page, emptyEmail);
    const detail = await read(h, page, `/api/users/${empty.memberId}`);
    assert.deepEqual(detail.roles, []); assert.deepEqual(detail.companies, []);
    return "Invitación real emitida sin roles ni empresas.";
  });
  await run("05", ["01"], async () => {
    companyAdmin = await invite(h, page, adminEmail, { companyName: a.companyName });
    const detail = await read(h, page, `/api/users/${companyAdmin.memberId}`);
    assert.deepEqual(detail.roles, []);
    assert.equal(detail.companies.length, 1); assert.equal(detail.companies[0].companyId, companyA.id);
    return "Invitación real con Administrador sólo en la empresa A, sin roles organizacionales.";
  });
  await run("06", ["03"], async () => {
    const me = await as(partialEmail);
    requireOrganizationPermissions(me, ["users.read"]);
    assert.equal(me.activeTenantId, a.me.activeTenantId);
    await page.goto(new URL("/org/usuarios", h.base).href);
    await page.getByRole("heading", { name: "Usuarios", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Invitar usuario", exact: true }).count(), 0);
    assert.equal((await h.api(page, "/api/users/paged")).status(), 200);
    await requireProblem(await h.api(page, "/api/companies/paged"), 403);
    await requireProblem(await h.api(page, "/api/roles", { method: "POST", data: { name: `No autorizado ${tag}`, scope: "Organization", permissions: ["users.read"] }, headers: { "Idempotency-Key": randomUUID() } }), 403);
    await page.goto(new URL("/cuenta", h.base).href);
    await page.getByRole("textbox", { name: "Nombre", exact: true }).fill(partialName);
    await clickForResponse(page, page.getByRole("button", { name: "Guardar cambios", exact: true }), "/api/me", "PUT");
    await page.goto(new URL("/org/usuarios", h.base).href);
    await page.getByRole("heading", { name: "Usuarios", exact: true }).waitFor();
    return "El miembro aceptó al ingresar, puede leer Usuarios y no invitar, crear roles ni listar empresas.";
  });
  await run("07", ["04"], async () => {
    const me = await as(emptyEmail);
    requireOrganizationPermissions(me, []);
    await page.getByRole("heading", { name: "Tus empresas", exact: true }).waitFor();
    await requireProblem(await h.api(page, "/api/users/paged"), 403);
    await page.goto(new URL("/org/usuarios", h.base).href);
    await page.getByRole("heading", { name: "No tenés permiso para ver esta página", exact: true }).waitFor();
    return "El miembro sin permisos ve su Inicio y la ruta/API Usuarios rechazan el acceso.";
  });
  await run("36", ["07", "01"], async () => {
    await as(emptyEmail);
    await requireProblem(await h.api(page, `/api/companies/${companyA.id}`), 403, "Http.Forbidden");
    await requireProblem(await h.api(page, `/api/companies/${companyA.id}/members/paged`), 403, "Http.Forbidden");
    await page.goto(new URL(`/org/empresas/${companyA.id}`, h.base).href);
    await page.getByRole("heading", { name: "No tenés permiso para ver esta página", exact: true }).waitFor();
    assert.equal(await page.getByRole("heading", { name: a.companyName, exact: true }).count(), 0);
    for (const name of ["Editar empresa", "Agregar miembro", "Más acciones"]) assert.equal(await page.getByRole("button", { name, exact: true }).count(), 0);
    return "La empresa existe en A, pero su miembro sin permisos recibió403 en ambas APIs y Sin permiso en la ficha, sin datos ni acciones.";
  });
  await run("08", ["05"], async () => {
    const me = await as(adminEmail);
    const permissions = me.effectivePermissions.organization;
    assert.deepEqual(permissions.filter((value) => value !== "assistant.use"), []);
    await page.getByRole("heading", { name: "Tus empresas", exact: true }).waitFor();
    await requireProblem(await h.api(page, "/api/users/paged"), 403);
    await requireProblem(await h.api(page, "/api/companies/paged"), 403);
    assert.equal((await h.api(page, `/api/companies/${companyA.id}`)).status(), 200);
    await page.goto(new URL(`/org/empresas/${companyA.id}`, h.base).href);
    await page.getByRole("heading", { name: a.companyName, exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Editar empresa", exact: true }).count(), 0);
    assert.equal(await page.getByRole("tablist").count(), 0);
    return "El Administrador abre su ficha y miembros sin poder leer toda la organización ni editar la empresa.";
  });
  await run("09", ["06", "08"], async () => {
    await as(adminEmail);
    await page.goto(new URL(`/org/empresas/${companyA.id}`, h.base).href);
    await page.getByRole("button", { name: "Agregar miembro", exact: true }).first().click();
    const dialog = page.getByRole("dialog", { name: "Agregar miembro", exact: true });
    await dialog.getByRole("combobox", { name: "Usuario", exact: true }).click();
    await page.getByRole("option", { name: partialName, exact: true }).click();
    await clickForResponse(page, dialog.getByRole("button", { name: "Agregar miembro", exact: true }), `/api/companies/${companyA.id}/members`, "POST", 204);
    await dialog.waitFor({ state: "hidden" });
    const list = await read(h, page, `/api/companies/${companyA.id}/members/paged?page=1&pageSize=100`);
    assert.ok(list.items.some((entry) => entry.memberId === partial.memberId));
    await page.getByText(partialName, { exact: true }).first().waitFor();
    return "Agregó al candidato activo desde la ficha por UI sin users.read ni roles organizacionales.";
  });
  await run("40", ["09"], async () => {
    await as(adminEmail);
    const before = await read(h, page, `/api/companies/${companyA.id}/members/paged?page=1&pageSize=100`);
    assert.equal(before.items.filter((entry) => entry.memberId === partial.memberId).length, 1);
    await requireProblem(await h.api(page, `/api/companies/${companyA.id}/members`, { method: "POST", headers: { "Idempotency-Key": randomUUID() }, data: { memberId: partial.memberId, roleIds: [] } }), 409, "Companies.Membership.AlreadyExists");
    const after = await read(h, page, `/api/companies/${companyA.id}/members/paged?page=1&pageSize=100`);
    assert.deepEqual(after, before);
    await page.goto(new URL(`/org/empresas/${companyA.id}`, h.base).href);
    await page.getByText(partialName, { exact: true }).first().waitFor();
    return "El Administrador no duplicó una membresía ya activa:409 y mismo listado, roles y versiones.";
  });
  await run("10", ["02"], async () => {
    await as(a.email);
    const stale = await h.newPage(); capturePage = stale;
    await page.goto(new URL(`/org/roles/${roleA.id}`, h.base).href);
    await stale.goto(new URL(`/org/roles/${roleA.id}`, h.base).href);
    await stale.getByRole("textbox", { name: "Descripción", exact: true }).fill(`Edición que debe perder ${tag}`);
    const winner = `Edición ganadora ${tag}`;
    await page.getByRole("textbox", { name: "Descripción", exact: true }).fill(winner);
    await clickForResponse(page, page.getByRole("button", { name: "Guardar cambios", exact: true }), `/api/roles/${roleA.id}`, "PUT");
    const conflict = await clickForResponse(stale, stale.getByRole("button", { name: "Guardar cambios", exact: true }), `/api/roles/${roleA.id}`, "PUT", 409);
    await requireProblem(conflict, 409, "General.ConcurrencyConflict");
    await stale.getByRole("button", { name: "Ver lo nuevo", exact: true }).waitFor();
    await stale.getByRole("button", { name: "Seguir editando", exact: true }).waitFor();
    assert.equal((await read(h, page, `/api/roles/${roleA.id}`)).description, winner);
    return "Dos formularios reales: 200 ganador y 409 con las dos salidas, sin sobrescritura.";
  });
  await run("11", ["01"], async () => {
    await as(a.email);
    const stale = await h.newPage(); capturePage = stale;
    await page.goto(new URL("/cuenta", h.base).href);
    await stale.goto(new URL("/cuenta", h.base).href);
    await stale.getByRole("textbox", { name: "Nombre", exact: true }).fill(`Perfil viejo ${tag}`);
    const winner = `Perfil vigente ${tag}`;
    await page.getByRole("textbox", { name: "Nombre", exact: true }).fill(winner);
    await clickForResponse(page, page.getByRole("button", { name: "Guardar cambios", exact: true }), "/api/me", "PUT");
    const conflict = await clickForResponse(stale, stale.getByRole("button", { name: "Guardar cambios", exact: true }), "/api/me", "PUT", 409);
    await requireProblem(conflict, 409, "General.ConcurrencyConflict");
    await stale.getByRole("button", { name: "Ver lo nuevo", exact: true }).waitFor();
    assert.equal((await read(h, page, "/api/me")).firstName, winner);
    return "Mi cuenta rechazó la versión anterior en la UI y conservó el nombre que ganó.";
  });
  await run("12", ["01"], async () => {
    await as(a.email);
    await page.goto(new URL("/org/configuracion", h.base).href);
    await page.getByRole("button", { name: "Agregar dominio", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Agregar dominio", exact: true });
    const domain = `prueba-${tag}.example.test`;
    await dialog.getByRole("textbox", { name: "Dominio", exact: true }).fill(domain);
    const reply = await clickForResponse(page, dialog.getByRole("button", { name: "Siguiente", exact: true }), "/api/organization/settings/domains", "POST", 201);
    const created = await reply.json(); assert.equal(created.status, "Pending");
    await page.getByRole("dialog", { name: `Verificar ${domain}`, exact: true }).waitFor();
    const domains = await read(h, page, "/api/organization/settings/domains/paged?page=1&pageSize=100");
    assert.ok(domains.items.some((entry) => entry.domain === domain && entry.status === "Pending" && entry.txtRecordName && entry.txtRecordValue));
    return "Dominio sintético pendiente con desafío TXT real. No se acredita verificación DNS externa.";
  });
  // La captura conserva el diálogo abierto; después se cierra por UI para que el próximo logout sea operable.
  if (outcomes.get("BIZ-12")?.ok) await page.getByRole("dialog").getByRole("button", { name: "Cancelar", exact: true }).click();
  await run("13", [], async () => {
    if (currentEmail) await endSession();
    b = await h.registerBusiness(page); currentEmail = b.email;
    const companies = await read(h, page, "/api/companies/paged?page=1&pageSize=100");
    companyB = companies.items.find((entry) => entry.name === b.companyName); assert.ok(companyB?.id);
    const users = await read(h, page, "/api/users/paged?page=1&pageSize=100");
    memberB = users.items.find((entry) => entry.userId === b.me.id); assert.ok(memberB?.memberId);
    if (a) assert.notEqual(b.me.activeTenantId, a.me.activeTenantId);
    return "La segunda organización tiene otra cuenta, empresa y miembro propietario, creados por UI.";
  });
  await run("14", ["06", "13"], async () => {
    roleB = await createReadRole(h, page, `Lectura Roles ${tag}`, "Ver roles");
    invitationB = await invite(h, page, partialEmail, { roleName: roleB.name });
    return "La misma persona parcial quedó invitada a B con un rol distinto: sólo roles.read.";
  });
  await run("15", ["01", "13", "14"], async () => {
    await as(a.email);
    const me = await read(h, page, "/api/me"); assert.equal(me.activeTenantId, a.me.activeTenantId);
    for (const route of [`/api/companies/${companyB.id}`, `/api/companies/${companyB.id}/members/paged`, `/api/roles/${roleB.id}`, `/api/users/${memberB.memberId}`]) {
      await requireProblem(await h.api(page, route), 404);
    }
    await requireProblem(await h.api(page, `/api/users/invitations/${invitationB.invitationId}/resend`, { method: "POST", headers: { "Idempotency-Key": randomUUID() } }), 404, "Invitations.Invitation.NotFound");
    await page.goto(new URL(`/org/empresas/${companyB.id}`, h.base).href);
    await page.getByRole("heading", { name: "No encontramos esta página", exact: true }).waitFor();
    return "Cuatro lecturas y un reenvío sobre recursos existentes de B dieron 404 desde A; la ficha UI tampoco reveló datos.";
  });
  await run("16", ["06", "14"], async () => {
    const me = await as(partialEmail);
    assert.ok(me.organizations.some((org) => org.id === a.me.activeTenantId));
    assert.ok(me.organizations.some((org) => org.id === b.me.activeTenantId));
    if (me.activeTenantId !== a.me.activeTenantId) await switchOrganization(h, page, a.organization, a.me.activeTenantId);
    await switchOrganization(h, page, b.organization, b.me.activeTenantId);
    const active = await read(h, page, "/api/me"); assert.equal(active.activeTenantId, b.me.activeTenantId);
    requireOrganizationPermissions(active, ["roles.read"]);
    assert.equal((await h.api(page, "/api/roles/paged")).status(), 200);
    await requireProblem(await h.api(page, "/api/users/paged"), 403);
    await page.goto(new URL("/org/roles", h.base).href);
    await page.getByRole("heading", { name: "Roles y permisos", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Crear rol", exact: true }).count(), 0);
    assert.equal(await page.getByRole("link", { name: "Crear rol", exact: true }).count(), 0);
    return "Perfiles cambió a B: sólo lee Roles y no hereda users.read de A.";
  });
  await run("37", ["16", "14"], async () => {
    requireOrganizationPermissions(await read(h, page, "/api/me"), ["roles.read"]);
    const role = await read(h, page, `/api/roles/${roleB.id}`);
    await page.goto(new URL("/org/roles", h.base).href);
    await page.getByRole("heading", { name: "Roles y permisos", exact: true }).waitFor();
    assert.equal(await page.getByRole("link", { name: "Crear rol", exact: true }).count(), 0);
    await page.getByRole("button", { name: `Acciones para ${roleB.name}`, exact: true }).click();
    await page.getByRole("menuitem", { name: "Ver permisos", exact: true }).waitFor();
    for (const name of ["Editar", "Inactivar"]) assert.equal(await page.getByRole("menuitem", { name, exact: true }).count(), 0);
    await page.keyboard.press("Escape");
    await page.goto(new URL(`/org/roles/${roleB.id}`, h.base).href);
    await page.getByRole("heading", { name: roleB.name, exact: true }).waitFor();
    assert.equal(await page.getByRole("textbox", { name: "Nombre", exact: true }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "Guardar cambios", exact: true }).count(), 0);
    const body = { name: role.name, description: role.description, scope: role.scope, companyId: role.companyId, permissions: role.permissions };
    await requireProblem(await h.api(page, "/api/roles", { method: "POST", headers: { "Idempotency-Key": randomUUID() }, data: { ...body, name: `No crear ${tag}` } }), 403, "Http.Forbidden");
    await requireProblem(await h.api(page, `/api/roles/${role.id}`, { method: "PUT", data: { ...body, description: "No editar", version: role.version } }), 403, "Http.Forbidden");
    await requireProblem(await h.api(page, `/api/roles/${role.id}`, { method: "DELETE", data: { version: role.version } }), 403, "Http.Forbidden");
    await requireProblem(await h.api(page, `/api/users/${invitationB.memberId}`, { method: "PUT", data: { roleIds: [], companies: [], version: 1 } }), 403, "Http.Forbidden");
    assert.deepEqual(await read(h, page, `/api/roles/${role.id}`), role);
    return "Con sólo roles.read leyó listado y ficha de Roles; la UI ocultó edición/inactivación y crear, editar, borrar y asignar respondieron403 sin cambiar el rol.";
  });
  await run("17", ["16"], async () => {
    await switchOrganization(h, page, a.organization, a.me.activeTenantId);
    await page.reload();
    const active = await read(h, page, "/api/me"); assert.equal(active.activeTenantId, a.me.activeTenantId);
    requireOrganizationPermissions(active, ["users.read"]);
    assert.equal((await h.api(page, "/api/users/paged")).status(), 200);
    await requireProblem(await h.api(page, "/api/roles/paged"), 403);
    await page.goto(new URL("/org/usuarios", h.base).href);
    await page.getByRole("heading", { name: "Usuarios", exact: true }).waitFor();
    return "Volvió a A y F5 conservó tenant A con users.read y sin roles.read de B.";
  });
  await run("18", ["06"], async () => {
    if (currentEmail) await endSession();
    const me = await h.login(page, partialEmail, "consumer"); currentEmail = partialEmail;
    assert.equal(me.access, "consumer");
    await requireProblem(await h.api(page, "/api/users/paged"), 403);
    await requireProblem(await h.api(page, "/api/companies/paged"), 403);
    assert.equal(await page.getByRole("button", { name: /^Crear empresa$/ }).count(), 0);
    assert.equal(await page.getByRole("link", { name: /^Crear empresa$/ }).count(), 0);
    return "El acceso Personal mantiene sus datos y no autoriza las APIs empresariales de sus membresías.";
  });
  await run("19", ["01"], async () => {
    await as(a.email);
    const email = `e2e-integral-reenvio-${tag}@example.test`;
    const firstMail = new Set(await h.env.files());
    ownInvitation = await invite(h, page, email);
    firstInvitationToken = await invitationTokenFromMail(h, email, firstMail);
    await page.goto(new URL(`/org/usuarios/${ownInvitation.memberId}`, h.base).href);
    const opened = await openBusinessBarMenu(page);
    const nextMail = new Set(await h.env.files());
    const response = await clickForResponse(page, opened.menu.getByRole("menuitem", { name: "Reenviar invitación", exact: true }), `/api/users/invitations/${ownInvitation.invitationId}/resend`, "POST");
    await opened.waitForClosed();
    const nextId = await response.json(); assert.match(nextId, /^[0-9a-f-]{36}$/i);
    ownInvitation.invitationId = nextId;
    resentInvitationToken = await invitationTokenFromMail(h, email, nextMail);
    assert.ok(resentInvitationToken !== firstInvitationToken, "Reenviar debe emitir otra prueba.");
    const detail = await read(h, page, `/api/users/${ownInvitation.memberId}`);
    assert.equal(detail.state, "Invited"); assert.equal(detail.invitationId, nextId);
    await openInvalidInvitation(h, page, firstInvitationToken);
    return "Reenvío por UI produjo otro .eml y otra prueba; la anterior quedó inválida sin activar al miembro.";
  });
  await run("20", ["19"], async () => {
    await page.goto(new URL(`/org/usuarios/${ownInvitation.memberId}`, h.base).href);
    await chooseBusinessBarAction(page, "Revocar invitación");
    await clickForResponse(page, page.getByRole("dialog").getByRole("button", { name: "Revocar", exact: true }), `/api/users/invitations/${ownInvitation.invitationId}`, "DELETE", 204);
    await page.goto(new URL("/org/usuarios", h.base).href);
    await page.getByRole("heading", { name: "Usuarios", exact: true }).waitFor();
    const list = await read(h, page, "/api/users/paged?page=1&pageSize=100");
    assert.equal(list.items.some((entry) => entry.memberId === ownInvitation.memberId && entry.state === "Active"), false);
    await openInvalidInvitation(h, page, resentInvitationToken);
    return "Revocar por UI invalidó el enlace reenviado y no creó un miembro activo.";
  });
  await run("21", ["01"], async () => {
    await as(a.email);
    membersBeforeDeactivation = await read(h, page, `/api/companies/${companyA.id}/members/paged?page=1&pageSize=100`);
    await page.goto(new URL(`/org/empresas/${companyA.id}`, h.base).href);
    await chooseBusinessBarAction(page, "Inactivar");
    await clickForResponse(page, page.getByRole("dialog").getByRole("button", { name: "Inactivar", exact: true }), `/api/companies/${companyA.id}/status`, "PUT");
    const detail = await read(h, page, `/api/companies/${companyA.id}`); assert.equal(detail.status, "Inactive");
    await assertCompanyStateVisible(h, page, "Inactive");
    return `La empresa quedó Inactive por PUT y GET; ${h.width === 390 ? "el menú móvil ofrece Activar" : "la ficha muestra Inactiva"}, con la misma identidad y datos.`;
  });
  await run("22", ["01"], async () => {
    await as(a.email);
    const inactive = await read(h, page, `/api/companies/${companyA.id}`);
    assert.equal(inactive.status, "Inactive", "La restauración comprueba el estado real aunque el caso21 haya fallado en su UI.");
    await page.goto(new URL(`/org/empresas/${companyA.id}`, h.base).href);
    const opened = await openBusinessBarMenu(page);
    await clickForResponse(page, opened.menu.getByRole("menuitem", { name: "Activar", exact: true }), `/api/companies/${companyA.id}/status`, "PUT");
    await opened.waitForClosed();
    const detail = await read(h, page, `/api/companies/${companyA.id}`); assert.equal(detail.status, "Active");
    const after = await read(h, page, `/api/companies/${companyA.id}/members/paged?page=1&pageSize=100`);
    assert.ok(membersBeforeDeactivation?.items, "La conservación necesita la lectura inicial de miembros.");
    assert.deepEqual(after.items.map((entry) => entry.memberId).sort(), membersBeforeDeactivation.items.map((entry) => entry.memberId).sort());
    await assertCompanyStateVisible(h, page, "Active");
    return "Activar por UI recuperó la empresa con los mismos miembros.";
  });
  await run("23", ["06"], async () => {
    await as(a.email);
    const { before } = await checkMemberStateChange(h, page, partial.memberId, false);
    rolesBeforeSuspension = before.roles.map((role) => role.id).sort();
    return "La membresía pasó a Deshabilitado y conservó el rol users.read guardado.";
  });
  await run("43", ["23", "40"], async () => {
    await as(adminEmail);
    const before = await read(h, page, `/api/companies/${companyA.id}/members/paged?page=1&pageSize=100`);
    assert.equal(before.items.find((entry) => entry.memberId === partial.memberId)?.state, "Inactive");
    await requireProblem(await h.api(page, `/api/companies/${companyA.id}/members`, { method: "POST", headers: { "Idempotency-Key": randomUUID() }, data: { memberId: partial.memberId, roleIds: [] } }), 409, "Companies.Membership.MemberInactive");
    assert.deepEqual(await read(h, page, `/api/companies/${companyA.id}/members/paged?page=1&pageSize=100`), before);
    await page.goto(new URL(`/org/empresas/${companyA.id}`, h.base).href);
    await page.getByText(partialName, { exact: true }).first().waitFor();
    return "El Administrador recibió409 MemberInactive para la persona deshabilitada; no cambió la empresa ni duplicó miembros. El duplicado activo también se rechazó en40.";
  });
  await run("24", ["23"], async () => {
    // El negativo43 se hace como Administrador; la rehabilitación siempre vuelve a la Dueña, aun si43 falló.
    await as(a.email);
    const { after: detail } = await checkMemberStateChange(h, page, partial.memberId, true);
    assert.deepEqual(detail.roles.map((role) => role.id).sort(), rolesBeforeSuspension);
    await page.getByText("Activo", { exact: true }).first().waitFor();
    return "Rehabilitó la membresía por UI con las mismas asignaciones de roles.";
  });
  await run("25", ["01"], async () => {
    await as(a.email);
    return checkSelfDisable(h, page, a.me.id);
  });
  await run("26", ["01", "22"], async () => {
    companyRole = await createReadRole(h, page, `Lectura empresa ${tag}`, "Ver miembros", { companyName: a.companyName, area: "Miembros" });
    const detail = await read(h, page, `/api/roles/${companyRole.id}`);
    assert.equal(detail.scope, "SpecificCompany"); assert.equal(detail.companyId, companyA.id);
    assert.deepEqual(detail.permissions, ["company.members.read"]);
    await filterRolesByCompany(h, page, companyA);
    await page.getByRole("link", { name: companyRole.name, exact: true }).waitFor();
    return "Rol específico creado por UI y listado bajo el filtro de su empresa con companyId real.";
  });
  await run("27", ["09", "26"], async () => {
    await page.goto(new URL(`/org/empresas/${companyA.id}`, h.base).href);
    await page.getByRole("button", { name: `Acciones para ${partialName}`, exact: true }).click();
    await page.getByRole("menuitem", { name: "Cambiar roles", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: `Roles de ${partialName}`, exact: true });
    await dialog.getByRole("button", { name: "Roles en la empresa", exact: true }).click();
    await page.getByRole("menuitemcheckbox", { name: companyRole.name, exact: true }).click();
    await page.keyboard.press("Escape");
    await clickForResponse(page, dialog.getByRole("button", { name: "Guardar cambios", exact: true }), `/api/companies/${companyA.id}/members/${partial.memberId}/roles`, "PUT");
    const assigned = await read(h, page, `/api/roles/${companyRole.id}`); assert.equal(assigned.userCount, 1);
    await page.goto(new URL(`/org/roles/${companyRole.id}`, h.base).href);
    assert.equal(await page.getByRole("combobox", { name: "Vale en", exact: true }).isDisabled(), true);
    await filterRolesByCompany(h, page, companyA);
    await page.getByRole("button", { name: `Acciones para ${companyRole.name}`, exact: true }).click();
    const inactivate = page.getByRole("menuitem", { name: "Inactivar", exact: true });
    assert.equal(await inactivate.getAttribute("aria-disabled"), "true");
    await page.getByText("Lo tiene 1 usuario. Quitáselo primero.", { exact: true }).waitFor();
    await requireProblem(await h.api(page, `/api/roles/${companyRole.id}`, { method: "DELETE", data: { version: assigned.version } }), 409, "Roles.Role.HasUsers");
    return "Rol de empresa asignado por UI: alcance bloqueado, Inactivar apagado con motivo y API rechaza HasUsers.";
  });
  await run("28", ["01", "22"], async () => {
    const disposable = await createReadRole(h, page, `Sin asignar ${tag}`, "Ver miembros", { companyName: a.companyName, area: "Miembros" });
    await filterRolesByCompany(h, page, companyA);
    await page.getByRole("button", { name: `Acciones para ${disposable.name}`, exact: true }).click();
    await page.getByRole("menuitem", { name: "Inactivar", exact: true }).click();
    await clickForResponse(page, page.getByRole("dialog").getByRole("button", { name: "Inactivar", exact: true }), `/api/roles/${disposable.id}`, "DELETE", 204);
    await requireProblem(await h.api(page, `/api/roles/${disposable.id}`), 404, "Roles.Role.NotFound");
    return "El rol sin personas se inactivó por UI y dejó de ser un recurso accesible.";
  });
  await run("29", ["07"], async () => {
    await as(a.email);
    settingsRole = await createReadRole(h, page, `Lectura Configuración ${tag}`, "Ver la configuración", { area: "Configuración" });
    await page.goto(new URL(`/org/usuarios/${empty.memberId}`, h.base).href);
    await chooseOrganizationRole(page, h.width, settingsRole.name);
    await clickForResponse(page, page.getByRole("button", { name: "Guardar cambios", exact: true }), `/api/users/${empty.memberId}`, "PUT");
    const detail = await read(h, page, `/api/users/${empty.memberId}`);
    assert.deepEqual(detail.roles.map((role) => role.id), [settingsRole.id]);
    return "El miembro vacío recibió por UI únicamente el rol de lectura de Configuración.";
  });
  await run("30", ["29"], async () => {
    const me = await as(emptyEmail); requireOrganizationPermissions(me, ["settings.read"]);
    await page.goto(new URL("/org/configuracion", h.base).href);
    await page.getByRole("heading", { name: "Configuración", exact: true }).waitFor();
    await page.getByText(a.organization, { exact: true }).first().waitFor();
    assert.equal(await page.getByRole("textbox", { name: "Nombre de la organización", exact: true }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "Guardar cambios", exact: true }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "Agregar dominio", exact: true }).count(), 0);
    const original = await read(h, page, "/api/organization/settings");
    await requireProblem(await h.api(page, "/api/organization/settings", { method: "PUT", data: original }), 403);
    return "Configuración ofrece valores de lectura y el backend rechaza el intento de escribirlos.";
  });
  await run("31", ["06", "24"], async () => {
    await as(partialEmail);
    await requireProblem(await h.api(page, "/api/organization/audit"), 403);
    await requireProblem(await h.api(page, "/api/organization/audit/actors/paged"), 403);
    await page.goto(new URL("/org/auditoria", h.base).href);
    await page.getByRole("heading", { name: "No tenés permiso para ver esta página", exact: true }).waitFor();
    return "Ni eventos ni selector de actores se obtuvieron sin audit.read; URL mostró permiso denegado.";
  });
  await run("38", ["17", "31", "37"], async () => {
    await as(partialEmail);
    await switchOrganization(h, page, b.organization, b.me.activeTenantId);
    const live = await h.newPage();
    try {
      await live.goto(new URL("/org/roles", h.base).href);
      await live.getByRole("heading", { name: "Roles y permisos", exact: true }).waitFor();
      const original = await read(h, live, "/api/me");
      requireOrganizationPermissions(original, ["roles.read"]);
      assert.equal(original.activeTenantId, b.me.activeTenantId);
      assert.equal((await h.api(live, "/api/roles/paged")).status(), 200);
      // No se cierra la sesión del miembro: Salir revocaría su autorización e invalidaría esta prueba de caché.
      const owner = await forceBusinessLogin(h, page, b.email); currentEmail = b.email;
      assert.equal(owner.id, b.me.id);
      assert.equal((await read(h, live, "/api/me")).id, original.id, "La pestaña conserva el token real del miembro, pese a la otra cookie del navegador.");
      assert.equal((await h.api(live, "/api/roles/paged")).status(), 200, "El token viejo debe seguir válido antes de revocar el permiso.");
      await page.goto(new URL(`/org/usuarios/${invitationB.memberId}`, h.base).href);
      await chooseOrganizationRole(page, h.width, roleB.name, false);
      await clickForResponse(page, page.getByRole("button", { name: "Guardar cambios", exact: true }), `/api/users/${invitationB.memberId}`, "PUT");
      assert.deepEqual((await read(h, page, `/api/users/${invitationB.memberId}`)).roles, []);
      await requireProblem(await h.api(live, "/api/roles/paged"), 403, "Http.Forbidden");
      const changed = await read(h, live, "/api/me");
      assert.equal(changed.id, original.id); assert.equal(changed.activeTenantId, original.activeTenantId);
      requireOrganizationPermissions(changed, []);
      return "La pestaña viva del miembro conservó identidad/token: Roles pasó200→403 inmediatamente después del guardado UI de la Dueña, sin recargar ni reingresar.";
    } finally { await live.close(); }
  });
  await run("39", ["13"], async () => {
    await as(b.email);
    const before = await read(h, page, `/api/companies/${companyB.id}/members/paged?page=1&pageSize=100`);
    const sole = requireSoleCompanyAdministrator(before.items, memberB.memberId);
    await page.goto(new URL(`/org/empresas/${companyB.id}`, h.base).href);
    await page.getByRole("button", { name: `Acciones para ${sole.displayName}`, exact: true }).click();
    await page.getByRole("menuitem", { name: "Cambiar roles", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: `Roles de ${sole.displayName}`, exact: true });
    await dialog.getByRole("button", { name: "Roles en la empresa", exact: true }).click();
    await page.getByRole("menuitemcheckbox", { name: "Administrador", exact: true }).click();
    await page.keyboard.press("Escape");
    const roles = await clickForResponse(page, dialog.getByRole("button", { name: "Guardar cambios", exact: true }), `/api/companies/${companyB.id}/members/${sole.memberId}/roles`, "PUT", 409);
    const problem = await requireProblem(roles, 409, "Companies.Membership.LastCompanyAdmin");
    await dialog.getByText(problem.detail, { exact: true }).waitFor();
    await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
    await page.getByRole("button", { name: `Acciones para ${sole.displayName}`, exact: true }).click();
    await page.getByRole("menuitem", { name: "Quitar de la empresa", exact: true }).click();
    const status = await clickForResponse(page, page.getByRole("dialog").getByRole("button", { name: "Quitar", exact: true }), `/api/companies/${companyB.id}/members/${sole.memberId}/status`, "PUT", 409);
    const rejected = await requireProblem(status, 409, "Companies.Membership.LastCompanyAdmin");
    await page.getByText(rejected.detail, { exact: true }).first().waitFor();
    const after = await read(h, page, `/api/companies/${companyB.id}/members/paged?page=1&pageSize=100`);
    assert.deepEqual(requireSoleCompanyAdministrator(after.items, sole.memberId), sole);
    return "El único Administrador efectivo no pudo quitar su rol ni inactivar su propia membresía: ambos guardados UI dieron409 y conservaron la misma asignación y versión.";
  });
  await run("34", ["24", "31"], async () => {
    await as(a.email);
    await page.goto(new URL(`/org/usuarios/${partial.memberId}`, h.base).href);
    await chooseBusinessBarAction(page, "Quitar de la organización");
    await clickForResponse(page, page.getByRole("dialog").getByRole("button", { name: "Quitar", exact: true }), `/api/users/${partial.memberId}`, "DELETE", 204);
    await page.waitForURL((url) => url.pathname === "/org/usuarios");
    await requireProblem(await h.api(page, `/api/users/${partial.memberId}`), 404);
    const list = await read(h, page, `/api/users/paged?search=${encodeURIComponent(partialEmail)}&page=1&pageSize=100`);
    assert.equal(list.items.some((entry) => entry.memberId === partial.memberId), false);
    return "La membresía ya probada se quitó por UI, no aparece en Usuarios y la ficha devuelve404.";
  });
  await run("32", ["01"], async () => {
    await as(a.email);
    await page.goto(new URL("/org/empresas", h.base).href);
    await page.getByRole("button", { name: "Crear empresa", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Crear empresa", exact: true });
    await dialog.getByRole("textbox", { name: "Nombre", exact: true }).fill(`CUIT inválido ${tag}`);
    const tax = dialog.getByRole("textbox", { name: "CUIT", exact: true });
    await tax.fill("123");
    let writes = 0;
    const watch = (request) => { if (new URL(request.url()).pathname === "/api/companies" && request.method() === "POST") writes++; };
    page.on("request", watch);
    try {
      await dialog.getByRole("button", { name: "Crear empresa", exact: true }).click();
      await dialog.getByText("Revisá el CUIT: son 11 números.", { exact: true }).waitFor();
      assert.equal(await tax.getAttribute("aria-invalid"), "true");
      assert.equal(writes, 0, "Un CUIT inválido no debe llegar a crear una empresa.");
      assert.equal(await tax.inputValue(), "123");
    } finally { page.off("request", watch); }
    return "La UI conserva el CUIT inválido, informa el largo en el campo y no envía el alta.";
  });
  if (outcomes.get("BIZ-32")?.ok) await page.getByRole("dialog").getByRole("button", { name: "Cancelar", exact: true }).click();
  await run("35", ["32"], async () => {
    await as(a.email);
    // Identificación fabricada usada por CompanyDialog.taxId.test.tsx; no se consulta ni se copia una empresa real.
    const syntheticTaxId = "33333333339";
    const firstName = `Fiscal sintética ${tag}`;
    await page.goto(new URL("/org/empresas", h.base).href);
    await page.getByRole("button", { name: "Crear empresa", exact: true }).click();
    let dialog = page.getByRole("dialog", { name: "Crear empresa", exact: true });
    await dialog.getByRole("textbox", { name: "Nombre", exact: true }).fill(firstName);
    await dialog.getByRole("textbox", { name: "CUIT", exact: true }).fill(syntheticTaxId);
    const created = await clickForResponse(page, dialog.getByRole("button", { name: "Crear empresa", exact: true }), "/api/companies", "POST", 201);
    const companyId = await created.json(); assert.match(companyId, /^[0-9a-f-]{36}$/i);
    siblingCompany = { id: companyId, name: firstName };
    await dialog.waitFor({ state: "hidden" });
    await page.mouse.move(0, 0);
    await page.getByText(`Creamos ${firstName}. Quedaste con el rol Administrador.`, { exact: true }).waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Crear empresa", exact: true }).click();
    dialog = page.getByRole("dialog", { name: "Crear empresa", exact: true });
    const secondName = `Fiscal repetida ${tag}`;
    await dialog.getByRole("textbox", { name: "Nombre", exact: true }).fill(secondName);
    const tax = dialog.getByRole("textbox", { name: "CUIT", exact: true });
    await tax.fill(syntheticTaxId);
    const duplicate = await clickForResponse(page, dialog.getByRole("button", { name: "Crear empresa", exact: true }), "/api/companies", "POST", 409);
    const problem = await requireProblem(duplicate, 409, "Tenancy.Company.TaxIdAlreadyUsed");
    await dialog.getByText(problem.detail, { exact: true }).waitFor();
    assert.equal(await tax.getAttribute("aria-invalid"), "true");
    const list = await read(h, page, "/api/companies/paged?page=1&pageSize=100");
    assert.ok(list.items.some((entry) => entry.id === companyId));
    assert.equal(list.items.some((entry) => entry.name === secondName), false);
    return "Un CUIT sintético válido creó la primera empresa; otro nombre con igual CUIT dio409 en el campo y no se guardó.";
  });
  if (outcomes.get("BIZ-35")?.ok) await page.getByRole("dialog").getByRole("button", { name: "Cancelar", exact: true }).click();
  for (const [id, kind, dependencies] of [
    ["42", "CompanyNotAllowed", ["02", "26", "29", "35"]],
    ["44", "CompanyRequired", ["02", "26", "29", "35"]],
    ["45", "CompanyMismatch", ["42", "44"]],
  ]) await run(id, dependencies, async () => {
    await as(a.email);
    // Las dos empresas existen en A. Un ID de B probaría404 por tenant, no la regla de alcance400.
    assert.equal((await read(h, page, `/api/companies/${siblingCompany.id}`)).id, siblingCompany.id);
    const original = await read(h, page, `/api/users/${empty.memberId}`);
    const request = roleScopeNegativeAssignment(kind, original, { organizationRoleId: roleA.id, companyRoleId: companyRole.id,
      companyId: companyA.id, otherCompanyId: siblingCompany.id });
    await requireProblem(await h.api(page, `/api/users/${empty.memberId}`, { method: "PUT", data: request }), 400, `Roles.RoleAssignment.${kind}`);
    assert.deepEqual(await read(h, page, `/api/users/${empty.memberId}`), original, "El rechazo de alcance no cambia ninguna asignación ni la versión.");
    await page.goto(new URL(`/org/usuarios/${empty.memberId}`, h.base).href);
    await page.getByRole("region", { name: "Acceso a la organización", exact: true }).waitFor();
    return `${kind}:400 real con los roles y las dos empresas de A creados por UI; la ficha conserva exactamente roles, empresas y versión originales.`;
  });
  let invitationFlow;
  let invitationOwnerRestored = false;
  try {
    await run("41", ["01"], async () => {
      await as(a.email);
      invitationFlow = await h.newPage(); capturePage = invitationFlow;
      return checkWrongSessionInvitation(h, page, invitationFlow, a, {
        onSignedOut: () => { currentEmail = null; },
        onOwnerAuthenticated: () => { currentEmail = a.email; invitationOwnerRestored = true; },
      });
    });
  } finally {
    if (invitationFlow) {
      try { await finishInvitationFlow(h, page, invitationFlow, a, invitationOwnerRestored); currentEmail = a.email; }
      finally { capturePage = page; }
    }
  }
  await run("33", ["01"], async () => {
    if (currentEmail) await endSession();
    const email = `e2e-integral-slug-${tag}@example.test`;
    await page.goto(new URL("/registro/empresa", h.base).href);
    await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
    await page.getByRole("textbox", { name: "Tu correo electrónico", exact: true }).fill(email);
    const before = new Set(await h.env.files());
    await clickForResponse(page, page.getByRole("button", { name: "Continuar", exact: true }), "/api/auth/business-signup/code", "POST", 202);
    await page.getByRole("heading", { name: "Revisá tu correo", exact: true }).waitFor();
    await fillOtp(page, await h.env.code(email, before));
    await clickForResponse(page, page.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/business-signup/verify", "POST", 204);
    incompleteBusinessIdentity = true;
    await page.getByRole("heading", { name: "Tu organización", exact: true }).waitFor();
    await page.getByRole("textbox", { name: "Nombre de la organización", exact: true }).fill(`Slug inválido ${tag}`);
    await page.getByRole("textbox", { name: "Primera empresa", exact: true }).fill(`Slug Centro ${tag}`);
    const slug = page.getByRole("textbox", { name: /Dirección de tu página/ });
    let writes = 0;
    const watch = (request) => { if (new URL(request.url()).pathname === "/api/auth/business-signup" && request.method() === "POST") writes++; };
    page.on("request", watch);
    try {
      for (const value of ["ab", "admin", ...(a ? [a.slug] : [])]) {
        const checked = page.waitForResponse((response) => pathOf(response) === "/api/public-site/slug-availability"
          && new URL(response.url()).searchParams.get("slug") === value);
        void checked.catch(() => {});
        await slug.fill(value); await checked;
        await page.getByRole("button", { name: "Crear organización", exact: true }).click();
        await page.waitForFunction(() => document.querySelector('input[name="slug"]')?.getAttribute("aria-invalid") === "true");
        assert.equal(writes, 0, "Ningún slug rechazado debe crear una organización.");
      }
    } finally { page.off("request", watch); }
    return "Slug de dos caracteres, reservado y ocupado se rechazaron en el campo sin POST de creación.";
  });
  if (incompleteBusinessIdentity) {
    // La prueba del correo ya dejó cookie pública, aunque la dirección impidió crear la organización.
    // Elegir Persona interactivamente permite abandonar esa identidad por Salir en el mismo navegador.
    await page.goto(new URL("/login", h.base).href);
    await page.waitForURL((url) => url.pathname === "/");
    await endSession();
    currentEmail = null;
  }
  // El contexto conserva sesiones entre casos; al terminar se abandona la identidad pública por la UI.
  if (currentEmail) await endSession();
  return outcomes;
}
