import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { plainTextBody } from "./test-e2e-real-mail.mjs";

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
  definition("21", "Dueño A", "Inactivar su empresa", "/org/empresas/:id", "La transición versionada conserva miembros y datos, y deja de conceder permisos de empresa."),
  definition("22", "Dueño A", "Reactivar su empresa", "/org/empresas/:id", "La empresa recupera el estado activo con los mismos miembros.", ["BACK-EM-005"]),
  definition("23", "Dueño A", "Deshabilitar una membresía sin borrar sus roles", "/org/usuarios/:id", "Un guardado versionado cambia a Deshabilitado y conserva el rol de lectura."),
  definition("24", "Dueño A", "Rehabilitar la membresía", "/org/usuarios/:id", "Vuelve a Activo con las mismas asignaciones guardadas."),
  definition("25", "Único Dueño de A", "Intentar deshabilitar su propia membresía", "/org/usuarios/:id", "409 Tenancy.Member.LastTenantAdmin y franja de explicación; la membresía y el Dueño siguen activos.", ["BACK-OR-017"]),
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
];

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
  assert.equal(response.status(), status, `La acción UI debe responder ${status}.`);
  return response;
}

async function read(h, page, route) {
  const response = await h.api(page, route);
  assert.equal(response.status(), 200, "La lectura autenticada real debe responder 200.");
  return response.json();
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

async function chooseOrganizationRole(page, width, roleName) {
  await page.getByRole("button", { name: /Roles de la organización/ }).click();
  if (width === 390) {
    const sheet = page.getByRole("dialog", { name: "Roles de la organización", exact: true });
    await sheet.getByRole("checkbox", { name: roleName, exact: true }).check();
    await sheet.getByRole("button", { name: "Listo", exact: true }).click();
  } else {
    await page.getByRole("menuitemcheckbox", { name: roleName, exact: true }).click();
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

async function changeMemberState(h, page, memberId, active, status = 200) {
  await page.goto(new URL(`/org/usuarios/${memberId}`, h.base).href);
  const label = active ? "Activo" : "Deshabilitado";
  if (h.width === 390) {
    await page.getByRole("region", { name: "Acceso a la organización", exact: true }).getByRole("button", { name: /^Estado/ }).click();
    await page.getByRole("dialog", { name: "Estado", exact: true }).getByRole("radio", { name: label, exact: true }).check();
  } else {
    await page.getByRole("combobox", { name: "Estado", exact: true }).click();
    await page.getByRole("option", { name: label, exact: true }).click();
  }
  const save = page.getByRole("button", { name: "Guardar cambios", exact: true });
  if (active) return clickForResponse(page, save, `/api/users/${memberId}`, "PUT", status);
  await save.click();
  return clickForResponse(page, page.getByRole("dialog").getByRole("button", { name: "Deshabilitar y guardar", exact: true }), `/api/users/${memberId}`, "PUT", status);
}

async function filterRolesByCompany(h, page, company) {
  await page.goto(new URL("/org/roles", h.base).href);
  const filtered = page.waitForResponse((response) => pathOf(response) === "/api/roles/paged"
    && new URL(response.url()).searchParams.get("companyId") === company.id && response.status() === 200);
  void filtered.catch(() => {});
  if (h.width === 390) {
    await page.getByRole("button", { name: "Filtrar roles", exact: true }).click();
    await page.getByRole("dialog", { name: "Filtrar roles", exact: true }).getByRole("radio", { name: new RegExp(`^${escapeRegex(company.name)}`) }).check();
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
  let a; let b; let roleA; let roleB; let companyA; let companyB; let memberB;
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
    await page.getByRole("button", { name: "Más acciones", exact: true }).click();
    const nextMail = new Set(await h.env.files());
    const response = await clickForResponse(page, page.getByRole("menuitem", { name: "Reenviar invitación", exact: true }), `/api/users/invitations/${ownInvitation.invitationId}/resend`, "POST");
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
    await page.getByRole("button", { name: "Más acciones", exact: true }).click();
    await page.getByRole("menuitem", { name: "Revocar invitación", exact: true }).click();
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
    await page.getByRole("button", { name: "Más acciones", exact: true }).click();
    await page.getByRole("menuitem", { name: "Inactivar", exact: true }).click();
    await clickForResponse(page, page.getByRole("dialog").getByRole("button", { name: "Inactivar", exact: true }), `/api/companies/${companyA.id}/status`, "PUT");
    const detail = await read(h, page, `/api/companies/${companyA.id}`); assert.equal(detail.status, "Inactive");
    await page.getByText("Inactiva", { exact: true }).first().waitFor();
    return "La empresa quedó inactiva por UI; conserva su identidad y datos.";
  });
  await run("22", ["21"], async () => {
    await page.goto(new URL(`/org/empresas/${companyA.id}`, h.base).href);
    await page.getByRole("button", { name: "Más acciones", exact: true }).click();
    await clickForResponse(page, page.getByRole("menuitem", { name: "Activar", exact: true }), `/api/companies/${companyA.id}/status`, "PUT");
    const detail = await read(h, page, `/api/companies/${companyA.id}`); assert.equal(detail.status, "Active");
    const after = await read(h, page, `/api/companies/${companyA.id}/members/paged?page=1&pageSize=100`);
    assert.deepEqual(after.items.map((entry) => entry.memberId).sort(), membersBeforeDeactivation.items.map((entry) => entry.memberId).sort());
    await page.getByText("Activa", { exact: true }).first().waitFor();
    return "Activar por UI recuperó la empresa con los mismos miembros.";
  });
  await run("23", ["06"], async () => {
    await as(a.email);
    rolesBeforeSuspension = (await read(h, page, `/api/users/${partial.memberId}`)).roles.map((role) => role.id).sort();
    await changeMemberState(h, page, partial.memberId, false);
    const detail = await read(h, page, `/api/users/${partial.memberId}`);
    assert.equal(detail.state, "Inactive");
    assert.deepEqual(detail.roles.map((role) => role.id).sort(), rolesBeforeSuspension);
    await page.getByText("Deshabilitado", { exact: true }).first().waitFor();
    return "La membresía pasó a Deshabilitado y conservó el rol users.read guardado.";
  });
  await run("24", ["23"], async () => {
    await changeMemberState(h, page, partial.memberId, true);
    const detail = await read(h, page, `/api/users/${partial.memberId}`);
    assert.equal(detail.state, "Active");
    assert.deepEqual(detail.roles.map((role) => role.id).sort(), rolesBeforeSuspension);
    await page.getByText("Activo", { exact: true }).first().waitFor();
    return "Rehabilitó la membresía por UI con las mismas asignaciones de roles.";
  });
  await run("25", ["01"], async () => {
    await as(a.email);
    const users = await read(h, page, "/api/users/paged?page=1&pageSize=100");
    const owner = users.items.find((entry) => entry.userId === a.me.id); assert.ok(owner?.memberId);
    const response = await changeMemberState(h, page, owner.memberId, false, 409);
    await requireProblem(response, 409, "Tenancy.Member.LastTenantAdmin");
    await page.getByText("Tiene que quedar al menos un Dueño. Dale el rol a otra persona antes de quitártelo.", { exact: true }).waitFor();
    const detail = await read(h, page, `/api/users/${owner.memberId}`); assert.equal(detail.state, "Active");
    assert.ok(detail.roles.some((role) => role.isSystemRole && role.scope === "Organization"));
    return "El guardado del único Dueño respondió 409 real y conservó su membresía activa.";
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
  await run("34", ["24", "31"], async () => {
    await as(a.email);
    await page.goto(new URL(`/org/usuarios/${partial.memberId}`, h.base).href);
    await page.getByRole("button", { name: "Más acciones", exact: true }).click();
    await page.getByRole("menuitem", { name: "Quitar de la organización", exact: true }).click();
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
    await dialog.waitFor({ state: "hidden" });
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
