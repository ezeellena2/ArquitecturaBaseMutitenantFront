import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { confirmRecentAuthenticationWhenAsked, stopConfirmingRecentAuthentication } from "./platform-factor-real.mjs";
import { requireSyntheticEmail } from "./e2e-completo-soporte.mjs";

// Sólo se enlazan acciones ejercidas. Leer Módulos, Dominio o Página pública no acredita sus escrituras.
const coverage = {
  1: ["BACK-PL-003"],
  2: ["BACK-PL-003"],
  3: ["BACK-PL-003"],
  4: ["BACK-PL-003"],
  5: ["BACK-PL-003"],
  6: ["BACK-PL-003"],
  7: ["BACK-PL-003"],
  8: ["BACK-ID-001", "GUIA-registrarse-02", "GUIA-registrarse-03", "GUIA-registrarse-04", "GUIA-registrarse-05"],
  9: ["BACK-OR-001"],
  10: ["BACK-PL-001"],
  12: ["SCREEN-organizaciones", "SCREEN-organizacion"],
  13: ["SCREEN-organizacion"],
  14: ["SCREEN-organizacion"],
  15: ["SCREEN-organizacion"],
  16: ["SCREEN-organizacion"],
  17: ["SCREEN-organizacion"],
  18: ["SCREEN-cuentas", "SCREEN-cuenta-plat", "GUIA-suspender-y-reactivar-01"],
  19: ["SCREEN-cuenta-plat", "GUIA-suspender-y-reactivar-02"],
  20: ["SCREEN-cuenta-plat", "GUIA-suspender-y-reactivar-02"],
  21: ["SCREEN-cuenta-plat", "GUIA-suspender-y-reactivar-02"],
  22: ["BACK-PL-016", "GUIA-suspender-y-reactivar-02", "GUIA-suspender-y-reactivar-04"],
  23: ["BACK-ID-021", "BACK-PL-016"],
  24: ["BACK-PL-016", "GUIA-suspender-y-reactivar-04"],
  26: ["BACK-ID-022", "BACK-ID-023"],
  30: ["SCREEN-recuperaciones"],
  31: ["SCREEN-auditoria-plat"],
  32: ["SCREEN-legales"],
  33: ["SCREEN-config-plat"],
  34: ["BACK-PL-027", "SCREEN-config-plat"],
  35: ["BACK-PL-017"],
  37: ["BACK-PL-023"],
  38: ["BACK-PL-011"],
  39: ["BACK-PL-019"],
};

const definition = (number, actor, action, route, expected, critical = false) => ({
  id: `PLAT-${String(number).padStart(2, "0")}`, area: "Plataforma", actor, action, route, expected,
  source: "back:docs/features/plataforma.md; front:docs/design/guia/recorrido.py#5", critical, covers: coverage[number] ?? [],
});
const reduced = "Operador con pocos permisos";
const operator = "Operador con todos los permisos";
const deniedPages = [
  [2, "Cuentas", "/plataforma/cuentas", "/api/platform/accounts/paged?page=1&pageSize=10"],
  [3, "Configuración", "/plataforma/configuracion", "/api/platform/settings"],
  [4, "Auditoría", "/plataforma/auditoria", "/api/platform/audit?period=all&limit=10"],
  [5, "Recuperaciones", "/plataforma/recuperaciones", "/api/platform/recoveries/paged?page=1&pageSize=10"],
  [6, "Documentos legales", "/plataforma/legales", "/api/platform/legal-documents"],
];
const organizationTabs = [[13, "Historial"], [14, "Dueños"], [15, "Módulos"], [16, "Dominio verificado"], [17, "Página pública"]];
const accountTabs = [[19, "Métodos de ingreso"], [20, "Organizaciones"], [21, "Historial"]];

const platformRepairPlan = [
  [8, "personPage", []], [9, "businessPage", []], [10, "page", []], [12, "page", [9, 10]],
  ...organizationTabs.map(([number]) => [number, "page", [12]]), [18, "page", [8, 10]],
  ...accountTabs.map(([number]) => [number, "page", [18]]),
  [22, "page", [18]], [23, "personPage", [22]], [24, "page", [22]], [25, "page", [24]], [26, "personPage", [25]],
  [27, "page", [12]], [28, "businessPage", [27]], [29, "page", [27]], [35, "personPage", [26]], [39, "page", [8, 9, 10]],
];

export const platformDefinitions = [
  definition(1, reduced, "Ingresar y consultar Organizaciones sin controles de gestión", "/plataforma/organizaciones", "Sólo tiene platform.tenants.read, ve Organizaciones y no puede crear ni administrar.", true),
  ...deniedPages.map(([number, title, route]) => definition(number, reduced, `Abrir ${title} por su URL`, route, "La pantalla dice «No tenés permiso para ver esta página».", true)),
  definition(7, reduced, "Consultar por API áreas sin permiso", "/api/platform/*", "Cuentas, configuración, auditoría, recuperaciones y legales responden 403 con code y traceId.", true),
  definition(8, "Persona nueva", "Registrarse por UI para probar estados de cuenta", "/registro", "Cuenta sintética real creada por UI y acceso Personal cerrado antes de continuar."),
  definition(9, "Dueño nuevo", "Crear organización por UI para probar su suspensión", "/registro/empresa", "Organización sintética creada por UI, con empresa y Dueño."),
  definition(10, operator, "Ingresar con correo y autenticador", "/plataforma", "Entra con acceso platform y permisos de administración.", true),
  definition(11, operator, "Abrir Inicio de Plataforma", "/plataforma", "El marco de Plataforma y su página inicial se muestran sin acceso empresarial."),
  definition(12, operator, "Buscar y abrir la organización creada", "/plataforma/organizaciones", "La lista encuentra la organización y abre su ficha con el nombre correcto."),
  ...organizationTabs.map(([number, title]) => definition(number, operator, `Abrir organización › ${title}`, "/plataforma/organizaciones/:id", `La pestaña ${title} muestra datos o el vacío correspondiente de esa organización.`)),
  definition(18, operator, "Buscar y abrir la cuenta creada", "/plataforma/cuentas", "La lista encuentra el correo sintético y abre su ficha."),
  ...accountTabs.map(([number, title]) => definition(number, operator, `Abrir cuenta › ${title}`, "/plataforma/cuentas/:id", `La pestaña ${title} corresponde a la persona creada.`)),
  definition(22, operator, "Suspender la cuenta con motivo", "/plataforma/cuentas/:id", "Suspender responde 2xx, cierra el diálogo y la ficha indica Suspendida.", true),
  definition(23, "Cuenta suspendida", "Intentar ingresar con su código real", "/login", "La verificación devuelve 403 Identity.Account.Suspended, con aviso visible y sin acceso Personal.", true),
  definition(24, operator, "Reactivar la cuenta con motivo", "/plataforma/cuentas/:id", "La ficha vuelve a indicar Activa.", true),
  definition(25, operator, "Dar de baja una cuenta sin organizaciones", "/plataforma/cuentas/:id", "La ficha indica Baja pedida y conserva la fecha de eliminación.", true),
  definition(26, "Cuenta en baja", "Ingresar, ver la baja y cancelarla", "/login", "El código real lleva a «Tu cuenta tiene la baja pedida»; cancelar devuelve Personal.", true),
  definition(27, operator, "Suspender la organización con motivo", "/plataforma/organizaciones/:id", "La ficha indica Suspendida y sus miembros pierden acceso empresarial.", true),
  definition(28, "Dueño de organización suspendida", "Intentar entrar a la organización", "/login/empresa", "La organización suspendida no permite entrar a /org y muestra el motivo de indisponibilidad.", true),
  definition(29, operator, "Reactivar la organización con motivo", "/plataforma/organizaciones/:id", "La ficha indica Activa.", true),
  definition(30, operator, "Consultar Recuperaciones", "/plataforma/recuperaciones", "La lista de recuperaciones carga desde la API real."),
  definition(31, operator, "Consultar Auditoría", "/plataforma/auditoria", "Auditoría carga eventos reales del entorno, incluidos los cambios de cuenta."),
  definition(32, operator, "Consultar Documentos legales", "/plataforma/legales", "Se muestran las versiones y la opción Publicar versión nueva."),
  definition(33, operator, "Validar un límite de altas fuera de rango", "/plataforma/configuracion", "Cero organizaciones propias muestra «Usá un número de 1 a 50.» sin guardar."),
  definition(34, operator, "Guardar configuración desde dos pestañas con versión vieja", "/plataforma/configuracion", "Una escritura gana; la otra responde 409 General.ConcurrencyConflict y ofrece Ver lo nuevo. Se restaura el valor inicial.", true),
  definition(35, operator, "Cerrar las sesiones de la persona", "/plataforma/cuentas/:id", "La acción real cierra la sesión Personal: F5 ofrece volver a ingresar.", true),
  definition(37, operator, "Dar sólo lectura de cuentas al otro operador reducido", "/plataforma/cuentas/:id", "El catálogo tiene 14 permisos; la UI guarda motivo y operatorVersion, y la lectura conserva exactamente tenants.read y accounts.read, sin roles.", true),
  definition(38, "Operador con lectura de organizaciones y cuentas", "Consultar organización real e intentar crearla o cambiar su estado", "/plataforma/organizaciones/:id", "Consulta permitida y gestión oculta; crear, aprobar, rechazar, reintentar, suspender, reactivar y cerrar responden 403 Http.Forbidden con traceId.", true),
  definition(39, "Operador con lectura de cuentas", "Consultar cuenta real e intentar todas sus acciones de gestión", "/plataforma/cuentas/:id", "La ficha carga sin controles de gestión; suspender, reactivar, cerrar sesiones y dar de baja responden 403 Http.Forbidden con traceId.", true),
  definition(40, "Operador sin gestión de operadores", "Intentar invitar y cambiar permisos de otro operador", "/api/platform/operators/invitations", "Ambas escrituras responden 403 Http.Forbidden, sin pedir confirmación reciente ni conceder permisos.", true),
  definition(36, "Operador de esta suite", "Salir de Plataforma", "/plataforma", "La salida cierra el acceso Plataforma y presenta la portada pública."),
];

export const platformRepairDefinitions = platformRepairPlan.map(([number]) => platformDefinitions.find((entry) => entry.id === `PLAT-${String(number).padStart(2, "0")}`));
export const platformSessionRepairDefinitions = [26, 35, 28].map((number) => platformDefinitions.find((entry) => entry.id === `PLAT-${String(number).padStart(2, "0")}`));

export async function assertPlatformProblem(response, status, code) {
  assert.equal(response.status(), status, `Se esperaba HTTP ${status}.`);
  const problem = await response.json();
  assert.equal(problem.code, code, "El rechazo debe tener el código de negocio esperado.");
  assert.ok(typeof problem.traceId === "string" && problem.traceId.length > 0, "ProblemDetails debe tener traceId.");
  return problem;
}

export function assertReadOnlyPlatformPermissions(me) {
  assert.equal(me.access, "platform");
  assert.deepEqual([...me.effectivePermissions.platform].sort(), ["platform.accounts.read", "platform.tenants.read"]);
}

/** Los negativos usan IDs existentes y el cuerpo real: las acciones de cuenta no reciben versión. */
export function platformWriteAttempts({ tenant, account, operator: targetOperator, ownerEmail }) {
  for (const entity of [tenant, account, targetOperator]) assert.match(entity?.id ?? "", /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/iu);
  for (const version of [tenant.version, targetOperator.operatorVersion]) assert.ok(Number.isInteger(version) && version >= 0);
  requireSyntheticEmail(ownerEmail);
  const reason = "Prueba integral: escritura sin permiso de gestión.";
  const attempt = (route, data, method = "POST") => ({ route, method, data });
  return {
    organizations: [
      attempt("/api/platform/tenants", { name: "Organización no autorizada E2E", firstCompanyName: "Empresa no autorizada E2E", ownerEmail, culture: "es-AR", timeZoneId: "America/Argentina/Buenos_Aires" }),
      ...["approve", "retry-provisioning", "reject", "suspend", "reactivate", "close"].map((action) => attempt(`/api/platform/tenants/${tenant.id}/${action}`, action === "retry-provisioning" ? { version: tenant.version } : { version: tenant.version, reason })),
    ],
    accounts: ["suspend", "reactivate", "revoke-sessions", "deletion"].map((action) => attempt(`/api/platform/accounts/${account.id}/${action}`, { reason })),
    operators: [
      attempt("/api/platform/operators/invitations", { email: ownerEmail, permissions: ["platform.accounts.read"] }),
      attempt(`/api/platform/accounts/${targetOperator.id}/operator`, { version: targetOperator.operatorVersion, reason, permissions: ["platform.accounts.read"] }, "PUT"),
    ],
  };
}

export async function assertDeniedPlatformWrites(h, page, attempts) {
  for (const { route, method, data } of attempts) {
    await assertPlatformProblem(await h.api(page, route, { method, data, headers: { "Idempotency-Key": randomUUID() } }), 403, "Http.Forbidden");
  }
}

export function createPlatformRecorder(h) {
  const outcomes = new Map();
  return async (id, page, action, dependencies = []) => {
    const currentPage = typeof page === "function" ? page : () => page;
    const failed = dependencies.find((dependency) => outcomes.get(dependency)?.ok !== true);
    if (failed) {
      await h.block(id, `No se completó la dependencia ${failed}.`, currentPage());
      const blocked = { ok: false };
      outcomes.set(id, blocked);
      return blocked;
    }
    const outcome = await h.record(id, currentPage, action);
    outcomes.set(id, outcome);
    return outcome;
  };
}

const idOf = (number) => `PLAT-${String(number).padStart(2, "0")}`;
const responseAt = (page, route, method) => page.waitForResponse((response) => new URL(response.url()).pathname === route && response.request().method() === method && response.status() !== 403);

export async function openAction(page, label) {
  const name = label === "Cerrar sus sesiones" ? "Cerrar sesiones" : label;
  const button = page.getByRole("button", { name, exact: true }).filter({ visible: true }).first();
  const actions = page.getByRole("button", { name: /^Acciones de / }).filter({ visible: true }).first();
  await button.or(actions).first().waitFor();
  if (await button.isVisible()) await button.click();
  else {
    if (await actions.getAttribute("aria-haspopup") === "dialog") await actions.click();
    else { await actions.focus(); await actions.press("ArrowDown"); }
    await page.getByRole("menuitem", { name, exact: true }).click();
  }
}

async function searchPlatformList(h, page, value, name) {
  if (h.width === 390) await page.getByRole("button", { name, exact: true }).click();
  await page.getByRole("searchbox", { name, exact: true }).fill(value);
}

export const searchPlatformOrganizations = (h, page, value) => searchPlatformList(h, page, value, "Buscar por nombre o correo");
export const searchPlatformAccounts = (h, page, value) => searchPlatformList(h, page, value, "Buscar por nombre, correo o teléfono");

/** ListRow incluye fecha y estado en el nombre accesible; el recurso y su texto siguen siendo los mismos. */
export async function openPlatformListItem(page, route, label) {
  await page.getByRole("link").filter({ hasText: label }).and(page.locator(`a[href="${route}"]`)).click();
}

export async function assertPlatformSettingsConflict(page, expectedDraft) {
  await page.getByRole("alert").filter({ hasText: "Otra persona cambió esto mientras lo editabas." }).waitFor();
  for (const name of ["Seguir editando", "Ver lo nuevo"]) await page.getByRole("button", { name, exact: true }).waitFor();
  const value = await page.getByRole("textbox", { name: "Organizaciones propias por persona", exact: true }).inputValue();
  assert.equal(Number(value.replaceAll(".", "")), expectedDraft, "El 409 conserva el borrador del segundo editor.");
}

async function changeWithReason(page, label, route, reason) {
  await openAction(page, label);
  const dialog = page.getByRole("dialog").filter({ has: page.getByRole("textbox", { name: /^Motivo/ }) });
  await dialog.getByRole("textbox", { name: /^Motivo/ }).fill(reason);
  const answer = responseAt(page, route, "POST");
  await dialog.getByRole("button", { name: label === "Cerrar sus sesiones" ? "Cerrar sesiones" : label, exact: true }).click();
  // La acción siguiente también dispara el handler del autenticador si la prueba reciente venció.
  await dialog.waitFor({ state: "hidden" });
  assert.ok((await answer).ok(), "La acción de Plataforma debe responder 2xx.");
}

export function platformLoginProofUrl(base, access = "consumer", { forceLogin = false } = {}) {
  assert.ok(["consumer", "business"].includes(access), "La prueba pública conserva su acceso Personal o Empresa.");
  const target = new URL(access === "business" ? "/login/empresa" : "/login", base);
  if (forceLogin) target.searchParams.set("prompt", "login");
  return target;
}

export async function requireCancelledPersonalAccount(h, page, expectedId) {
  await page.waitForURL((target) => target.pathname === "/");
  await page.getByRole("navigation", { name: "Secciones", exact: true }).or(page.getByRole("button", { name: /, Personal$/u }))
    .filter({ visible: true }).first().waitFor();
  const response = await h.api(page, "/api/me"); assert.equal(response.status(), 200);
  const me = await response.json(); assert.equal(me.access, "consumer"); assert.equal(me.id, expectedId);
  return me;
}

async function proveLogin(h, page, email, access = "consumer", options) {
  requireSyntheticEmail(email);
  await page.goto(platformLoginProofUrl(h.base, access, options).href);
  await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(email);
  const before = new Set(await h.env.files());
  for (let attempt = 0; attempt < 2; attempt++) {
    const sent = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/auth/login-code" && response.request().method() === "POST", { timeout: 90_000 });
    // Si el envío anterior respondió 429, el botón permanece deshabilitado durante la espera que indicó la API.
    // El segundo clic espera a que la propia UI vuelva a habilitarlo, sin forzar ni eludir ese límite real.
    await page.getByRole("button", { name: "Enviar código", exact: true }).click({ timeout: 90_000 });
    const response = await sent;
    if (response.status() !== 429 || attempt === 1) { assert.ok(response.ok(), "El pedido de código debe responder 2xx."); break; }
    const problem = await response.json();
    assert.equal(problem.code, "Auth.LoginCode.ResendTooSoon", "Sólo se reintenta la espera real de ese destino.");
  }
  await page.getByRole("heading", { name: "Revisá tu correo", exact: true }).waitFor();
  await fillOtp(page, await h.env.code(email, before));
  const verified = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/auth/login-code/verify" && response.request().method() === "POST");
  await page.getByRole("button", { name: "Verificar", exact: true }).click();
  return verified;
}

async function settingsFields(page, value) {
  await page.getByRole("textbox", { name: "Organizaciones propias por persona", exact: true }).fill(String(value));
  for (const [label, email] of [["Correo de ventas", "e2e-sales@example.test"], ["Correo de soporte", "e2e-support@example.test"]]) {
    const input = page.getByRole("textbox", { name: label, exact: true });
    if (!(await input.inputValue())) await input.fill(email);
  }
}

async function saveSettings(page, expectedStatus, reason) {
  await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "¿Guardar la configuración?", exact: true });
  await dialog.getByRole("textbox", { name: /^Motivo/ }).fill(reason);
  const answer = responseAt(page, "/api/platform/settings", "PUT");
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  const response = await answer;
  assert.equal(response.status(), expectedStatus, "Estado del guardado de configuración.");
  if (expectedStatus === 409) await assertPlatformProblem(response, 409, "General.ConcurrencyConflict");
}

async function addAccountReadByUi(h, page, target, base) {
  assert.deepEqual(target.operatorPermissions, ["platform.tenants.read"], "La fixture reducida empieza sólo con lectura de organizaciones.");
  await page.goto(new URL(`/plataforma/cuentas/${target.id}`, base).href);
  await page.getByRole("heading", { name: target.displayName, exact: true }).waitFor();
  await openAction(page, "Cambiar permisos");
  const form = page.getByRole("dialog", { name: `Cambiar permisos de ${target.displayName}`, exact: true });
  const picker = form.getByRole("button", { name: "Permisos de plataforma", exact: true });
  await picker.focus(); await picker.press("ArrowDown");
  assert.equal(await page.getByRole("menuitemcheckbox").count(), 14, "Catálogo individual completo, con los módulos instalados.");
  assert.equal(await page.getByRole("menuitemcheckbox", { name: "Ver organizaciones", exact: true }).getAttribute("aria-checked"), "true");
  await page.getByRole("menuitemcheckbox", { name: "Ver cuentas", exact: true }).click();
  await page.keyboard.press("Escape");
  const reason = "Prueba integral: sólo consultar cuentas y organizaciones.";
  await form.getByRole("textbox", { name: /^Motivo/ }).fill(reason);
  const saved = responseAt(page, `/api/platform/accounts/${target.id}/operator`, "PUT");
  void saved.catch(() => {});
  await form.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  // El handler real de confirmación puede intervenir antes de esperar la respuesta final.
  await form.waitFor({ state: "hidden" });
  const response = await saved; assert.equal(response.status(), 200);
  const request = response.request().postDataJSON();
  assert.deepEqual(Object.keys(request).sort(), ["permissions", "reason", "version"], "La escritura de operador nunca recibe roles ni permisos organizacionales.");
  assert.equal(request.version, target.operatorVersion); assert.equal(request.reason, reason);
  const expected = ["platform.accounts.read", "platform.tenants.read"];
  assert.deepEqual([...request.permissions].sort(), expected);
  const changed = await response.json(); assert.notEqual(changed.version, target.operatorVersion);
  const persisted = await h.api(page, `/api/platform/accounts/${target.id}`); assert.equal(persisted.status(), 200);
  const detail = await persisted.json();
  assert.equal(detail.kind, "Operator"); assert.equal(detail.operatorVersion, changed.version);
  assert.deepEqual([...detail.operatorPermissions].sort(), expected);
  assert.equal(detail.hasPersonalSpace, false);
  return detail;
}

/** La reparación prepara37 por UI sin acreditarlo y conserva una fixture reducida ya preparada. */
export async function prepareReadOnlyPlatformOperator(h, page, email, fullOperatorId, { addReadByUi = addAccountReadByUi } = {}) {
  requireSyntheticEmail(email);
  const found = await h.api(page, `/api/platform/accounts/paged?page=1&pageSize=10&search=${encodeURIComponent(email)}`);
  assert.equal(found.status(), 200);
  const accounts = (await found.json()).items; assert.equal(accounts.length, 1);
  assert.notEqual(accounts[0].id, fullOperatorId, "El operador completo prepara a otra cuenta.");
  const response = await h.api(page, `/api/platform/accounts/${accounts[0].id}`); assert.equal(response.status(), 200);
  const current = await response.json(); assert.equal(current.kind, "Operator");
  const expected = ["platform.accounts.read", "platform.tenants.read"];
  if (JSON.stringify([...current.operatorPermissions].sort()) === JSON.stringify(expected)) return current;
  assert.deepEqual(current.operatorPermissions, ["platform.tenants.read"], "Sólo se prepara el operador reducido del recorrido.");
  return addReadByUi(h, page, current, h.base);
}

function createPlatformLifecycleActions(h, state) {
  const { page, personPage, businessPage, fullEmail } = state;
  const url = (route) => new URL(route, h.base).href;
  const accountRoute = () => `/plataforma/cuentas/${state.person.me.id}`;
  const organizationRoute = () => `/plataforma/organizaciones/${state.business.me.activeTenantId}`;
  return new Map([
    [8, async () => {
      state.person = await h.registerPerson(personPage); state.personSignedIn = true;
      assert.equal(state.person.me.access, "consumer");
      await h.signOut(personPage); state.personSignedIn = false;
      return "Persona nueva creada por registro real; se cerró su acceso Personal.";
    }],
    [9, async () => {
      state.business = await h.registerBusiness(businessPage); state.businessSignedIn = true;
      assert.ok(state.business.me.activeTenantId);
      await h.signOut(businessPage); state.businessSignedIn = false;
      return "Organización nueva con su Dueño y primera empresa creada desde la UI.";
    }],
    [10, async () => {
      const me = await h.login(page, fullEmail, "platform"); state.fullSignedIn = true; state.fullOperator = me;
      assert.equal(me.access, "platform");
      for (const permission of ["platform.accounts.manage", "platform.tenants.manage", "platform.settings.manage"]) assert.ok(me.effectivePermissions.platform.includes(permission));
      await confirmRecentAuthenticationWhenAsked(page, fullEmail);
      return "Operador completo ingresó por correo y autenticador, con acceso platform y permisos de gestión.";
    }],
    [12, async () => {
      await page.goto(url("/plataforma/organizaciones"));
      await searchPlatformOrganizations(h, page, state.business.organization);
      await openPlatformListItem(page, organizationRoute(), state.business.organization);
      await page.getByRole("heading", { name: state.business.organization, exact: true }).waitFor();
      assert.equal(new URL(page.url()).pathname, organizationRoute());
      return "La lista filtró la organización creada y abrió su ficha real.";
    }],
    ...organizationTabs.map(([number, title]) => [number, async () => {
      await page.goto(url(organizationRoute()));
      await page.getByRole("tab", { name: new RegExp(`^${title}`) }).click();
      const panel = page.getByRole("tabpanel");
      await panel.waitFor();
      await panel.getByRole("status").waitFor({ state: "hidden" });
      if (title === "Dominio verificado") await panel.getByText("Sin dominio de correo", { exact: true }).waitFor();
      else if (title === "Dueños") await panel.getByText(state.business.email, { exact: false }).first().waitFor();
      else if (title === "Página pública") await panel.getByText("Borrador", { exact: true }).first().waitFor();
      else assert.ok((await panel.innerText()).trim().length > 0, "La pestaña debe mostrar datos o un vacío explícito.");
      assert.equal(await panel.getByRole("alert").count(), 0, "La pestaña no debe mostrar un fallo de carga.");
      return `${title} de la organización creada cargó desde el sistema real.`;
    }]),
    [18, async () => {
      await page.goto(url("/plataforma/cuentas"));
      await searchPlatformAccounts(h, page, state.person.email);
      await openPlatformListItem(page, accountRoute(), state.person.email);
      await page.getByRole("heading", { name: state.person.email, exact: true }).waitFor();
      assert.equal(new URL(page.url()).pathname, accountRoute());
      return "Cuentas encontró a la persona nueva y abrió su ficha.";
    }],
    ...accountTabs.map(([number, title]) => [number, async () => {
      await page.goto(url(accountRoute()));
      await page.getByRole("tab", { name: new RegExp(`^${title}`) }).click();
      const panel = page.getByRole("tabpanel"); await panel.waitFor();
      assert.ok((await panel.innerText()).trim().length > 0);
      return `${title} de la persona muestra datos o vacío explícito.`;
    }]),
    [22, async () => {
      await page.goto(url(accountRoute()));
      await changeWithReason(page, "Suspender", `/api/platform/accounts/${state.person.me.id}/suspend`, "Prueba integral: suspensión de cuenta sintética.");
      await page.getByText("Suspendida", { exact: true }).first().waitFor();
      return "Se suspendió la cuenta por la UI con motivo; la ficha muestra Suspendida.";
    }],
    [23, async () => {
      await assertPlatformProblem(await proveLogin(h, personPage, state.person.email), 403, "Identity.Account.Suspended");
      await personPage.getByText("Tu cuenta está suspendida.", { exact: false }).first().waitFor();
      assert.equal(await personPage.getByRole("button", { name: /, Personal$/ }).count(), 0);
      return "El código real de la cuenta suspendida fue rechazado con 403 Identity.Account.Suspended y aviso visible.";
    }],
    [24, async () => {
      await page.goto(url(accountRoute()));
      await changeWithReason(page, "Reactivar", `/api/platform/accounts/${state.person.me.id}/reactivate`, "Prueba integral: reactivar cuenta sintética.");
      await page.getByText("Activa", { exact: true }).first().waitFor();
      return "La cuenta volvió a Activa desde Plataforma.";
    }],
    [25, async () => {
      await page.goto(url(accountRoute()));
      await changeWithReason(page, "Dar de baja", `/api/platform/accounts/${state.person.me.id}/deletion`, "Prueba integral: baja cancelable de cuenta sintética.");
      await page.getByText("Baja pedida", { exact: true }).first().waitFor();
      return "Plataforma pidió la baja; la cuenta sin organizaciones muestra Baja pedida.";
    }],
    [26, async () => {
      await assertPlatformProblem(await proveLogin(h, personPage, state.person.email), 403, "Identity.Account.PendingDeletion");
      await personPage.getByRole("heading", { name: "Tu cuenta tiene la baja pedida", exact: true }).waitFor();
      const cancelled = responseAt(personPage, "/api/auth/deletion/cancel", "POST");
      await personPage.getByRole("button", { name: "Cancelar la baja y entrar", exact: true }).click();
      assert.equal((await cancelled).status(), 200);
      state.personSignedIn = true;
      await requireCancelledPersonalAccount(h, personPage, state.person.me.id);
      return "La persona vio la baja pendiente y la canceló por UI; recuperó su acceso Personal.";
    }],
    [27, async () => {
      await page.goto(url(organizationRoute()));
      await changeWithReason(page, "Suspender", `/api/platform/tenants/${state.business.me.activeTenantId}/suspend`, "Prueba integral: suspensión de organización sintética.");
      await page.getByText("Suspendida", { exact: true }).first().waitFor();
      return "La organización sintética quedó Suspendida por UI con motivo.";
    }],
    [28, async () => {
      await assertPlatformProblem(await proveLogin(h, businessPage, state.business.email, "business", { forceLogin: true }), 403, "Tenancy.Tenant.Suspended");
      await businessPage.getByRole("heading", { name: `${state.business.organization} está suspendida`, exact: true }).waitFor();
      assert.notEqual(new URL(businessPage.url()).pathname, "/org");
      return "El Dueño no pudo entrar a la organización suspendida; recibió 403 Tenancy.Tenant.Suspended y aviso visible.";
    }],
    [29, async () => {
      await page.goto(url(organizationRoute()));
      await changeWithReason(page, "Reactivar", `/api/platform/tenants/${state.business.me.activeTenantId}/reactivate`, "Prueba integral: reactivar organización sintética.");
      await page.getByText("Activa", { exact: true }).first().waitFor();
      return "La organización volvió a Activa desde su ficha.";
    }],
    [35, async () => {
      await page.goto(url(accountRoute()));
      await changeWithReason(page, "Cerrar sus sesiones", `/api/platform/accounts/${state.person.me.id}/revoke-sessions`, "Prueba integral: cerrar sesiones de cuenta sintética.");
      await personPage.reload();
      await personPage.getByRole("button", { name: /, Personal$/ }).waitFor({ state: "hidden" });
      await personPage.getByRole("textbox", { name: "Correo electrónico", exact: true }).or(personPage.getByRole("link", { name: "Volver a ingresar", exact: true })).or(personPage.getByRole("link", { name: "Ingresá", exact: true })).first().waitFor();
      state.personSignedIn = false;
      return "Cerrar sesiones por Plataforma revocó el acceso Personal; F5 ofreció volver a ingresar.";
    }],
    [39, async () => {
      await state.enterReadOnly();
      await page.goto(url(accountRoute()));
      await page.getByRole("heading", { name: state.person.email, exact: true }).waitFor();
      const actual = await h.api(page, `/api/platform/accounts/${state.person.me.id}`); assert.equal(actual.status(), 200);
      assert.equal((await actual.json()).id, state.person.me.id);
      assert.equal(await page.getByRole("button", { name: /^Acciones de / }).count(), 0);
      for (const label of ["Suspender", "Reactivar", "Cerrar sus sesiones", "Dar de baja"]) {
        assert.equal(await page.getByRole("button", { name: label, exact: true }).count(), 0);
        assert.equal(await page.getByRole("menuitem", { name: label, exact: true }).count(), 0);
      }
      await assertDeniedPlatformWrites(h, page, (await state.negativeFixtures()).accounts);
      return "Con accounts.read la ficha real se consulta sin acciones de gestión; suspender, reactivar, cerrar sesiones y baja devolvieron 403 Http.Forbidden con traceId.";
    }],
  ]);
}

export async function runPlatformRepairCases(h) {
  const page = await h.newPage(); const personPage = await h.newPage(); const businessPage = await h.newPage();
  const pages = [page, personPage, businessPage];
  const state = { page, personPage, businessPage, fullEmail: h.width === 1440 ? "e2e-e9a-operator@example.test" : "e2e-e9b-operator@example.test" };
  const reducedEmail = h.width === 1440 ? "e2e-reduced@example.test" : "e2e-a2-operator@example.test";
  state.enterReadOnly = async () => {
    const reduced = await prepareReadOnlyPlatformOperator(h, page, reducedEmail, state.fullOperator.id);
    const own = await h.api(page, `/api/platform/accounts/${state.fullOperator.id}`); assert.equal(own.status(), 200);
    state.fullOperator = { ...state.fullOperator, ...await own.json() };
    await stopConfirmingRecentAuthentication(page);
    await h.signOut(page); state.fullSignedIn = false;
    const me = await h.login(page, reducedEmail, "platform"); state.reducedSignedIn = true;
    assertReadOnlyPlatformPermissions(me); assert.equal(me.id, reduced.id);
  };
  state.negativeFixtures = async () => {
    const response = await h.api(page, `/api/platform/tenants/${state.business.me.activeTenantId}`); assert.equal(response.status(), 200);
    const tenant = await response.json(); assert.equal(tenant.id, state.business.me.activeTenantId);
    return platformWriteAttempts({ tenant, account: { id: state.person.me.id }, operator: state.fullOperator, ownerEmail: `e2e-denied-${randomUUID()}@example.test` });
  };
  const actions = createPlatformLifecycleActions(h, state);
  const record = createPlatformRecorder(h);
  try {
    for (const [number, target, dependencies] of platformRepairPlan) {
      await record(idOf(number), state[target], actions.get(number), dependencies.map(idOf));
    }
  } finally {
    try {
      if (state.personSignedIn) await h.signOut(personPage);
      if (state.businessSignedIn) await h.signOut(businessPage);
      if (state.fullSignedIn || state.reducedSignedIn) await h.signOut(page);
    } finally {
      for (const target of pages) {
        await stopConfirmingRecentAuthentication(target);
        if (!target.isClosed()) await target.close();
      }
    }
  }
}

/** Sólo26/35/28 certifican acciones: sus altas, baja y suspensión son preparaciones propias sin resultados verdes. */
export async function runPlatformSessionRepairCases(h) {
  const page = await h.newPage(); const personPage = await h.newPage(); const businessPage = await h.newPage();
  const pages = [page, personPage, businessPage]; const failures = [];
  const state = { page, personPage, businessPage, fullEmail: h.width === 1440 ? "e2e-e9a-operator@example.test" : "e2e-e9b-operator@example.test" };
  const actions = createPlatformLifecycleActions(h, state); const record = createPlatformRecorder(h);
  let capturePage = personPage; let suspended = false;
  const ensureFull = async () => { if (!state.fullSignedIn) { capturePage = page; await actions.get(10)(); } };
  try {
    await record("PLAT-26", () => capturePage, async () => {
      capturePage = personPage; await actions.get(8)(); await ensureFull();
      capturePage = page; await actions.get(18)(); await actions.get(25)();
      capturePage = personPage; return actions.get(26)();
    });
    await record("PLAT-35", personPage, actions.get(35), ["PLAT-26"]);
    await record("PLAT-28", () => capturePage, async () => {
      //35 ya usó la sesión de26; si falló, se cierra por UI antes de preparar otra identidad pública.
      if (state.personSignedIn) { capturePage = personPage; await h.signOut(personPage); state.personSignedIn = false; }
      capturePage = businessPage; await actions.get(9)(); await ensureFull();
      capturePage = page; await actions.get(12)(); await actions.get(27)(); suspended = true;
      capturePage = businessPage; return actions.get(28)();
    });
  } finally {
    // Restaurar la organización propia no acredita29 ni vuelve a ejecutar su verificación oficial.
    if (suspended) { try { await actions.get(29)(); } catch (error) { failures.push(error); } }
    for (const [target, signedIn] of [[personPage, state.personSignedIn], [businessPage, state.businessSignedIn], [page, state.fullSignedIn]]) {
      if (signedIn) { try { await h.signOut(target); } catch (error) { failures.push(error); } }
    }
    for (const target of pages) {
      try { await stopConfirmingRecentAuthentication(target); if (!target.isClosed()) await target.close(); } catch (error) { failures.push(error); }
    }
  }
  if (failures.length) throw new AggregateError(failures, "Falló la restauración o salida por UI de la reparación de sesión.");
}

export async function runPlatformCases(h) {
  const step = createPlatformRecorder(h);
  const pages = [];
  const page = await h.newPage(); pages.push(page);
  const personPage = await h.newPage(); pages.push(personPage);
  const businessPage = await h.newPage(); pages.push(businessPage);
  const fullEmail = h.width === 1440 ? "e2e-e9a-operator@example.test" : "e2e-e9b-operator@example.test";
  const reducedEmail = h.width === 1440 ? "e2e-reduced@example.test" : "e2e-a2-operator@example.test";
  let person; let business; let fullOperator; let readOnlyOperator; let fullSignedIn = false; let reducedSignedIn = false;
  const url = (route) => new URL(route, h.base).href;
  const organizationRoute = () => `/plataforma/organizaciones/${business.me.activeTenantId}`;
  const record = (number, target, action, dependencies = []) => step(idOf(number), target, action, dependencies.map(idOf));
  const lifecycleState = {
    page, personPage, businessPage, fullEmail,
    get person() { return person; }, set person(value) { person = value; },
    get business() { return business; }, set business(value) { business = value; },
    get fullOperator() { return fullOperator; }, set fullOperator(value) { fullOperator = value; },
    get fullSignedIn() { return fullSignedIn; }, set fullSignedIn(value) { fullSignedIn = value; },
  };
  const lifecycleActions = createPlatformLifecycleActions(h, lifecycleState);
  const recordLifecycle = (number, dependenciesOverride) => {
    const [, target, dependencies] = platformRepairPlan.find(([id]) => id === number);
    return record(number, lifecycleState[target], lifecycleActions.get(number), dependenciesOverride ?? dependencies);
  };
  const enterReadOnly = async () => {
    if (reducedSignedIn) return;
    await stopConfirmingRecentAuthentication(page);
    if (fullSignedIn) { await h.signOut(page); fullSignedIn = false; }
    const me = await h.login(page, reducedEmail, "platform"); reducedSignedIn = true;
    assertReadOnlyPlatformPermissions(me); assert.equal(me.id, readOnlyOperator.id);
  };
  lifecycleState.enterReadOnly = enterReadOnly;
  try {
    await record(1, page, async () => {
      const me = await h.login(page, reducedEmail, "platform"); reducedSignedIn = true;
      assert.equal(me.access, "platform");
      assert.deepEqual(me.effectivePermissions.platform, ["platform.tenants.read"]);
      await page.goto(url("/plataforma/organizaciones"));
      await page.getByRole("heading", { name: "Organizaciones", exact: true }).waitFor();
      assert.equal(await page.getByRole("button", { name: "Crear organización", exact: true }).count(), 0);
      assert.equal(await page.getByRole("link", { name: "Cuentas", exact: true }).filter({ visible: true }).count(), 0);
      return "Operador reducido ingresó con autenticador; sólo consulta organizaciones y no tiene crear ni Cuentas en el menú.";
    });
    for (const [number, title, route] of deniedPages) await record(number, page, async () => {
      await page.goto(url(route));
      await page.getByRole("heading", { name: "No tenés permiso para ver esta página", exact: true }).waitFor();
      return `${title} por URL directa muestra el rechazo de permiso.`;
    }, [1]);
    await record(7, page, async () => {
      for (const [, , , route] of deniedPages) await assertPlatformProblem(await h.api(page, route), 403, "Http.Forbidden");
      return "Las cinco lecturas de API sin permiso devolvieron 403 Http.Forbidden y traceId.";
    }, [1]);
    if (reducedSignedIn) { await h.signOut(page).catch(() => {}); reducedSignedIn = false; }

    await recordLifecycle(8);
    await recordLifecycle(9);
    await recordLifecycle(10);
    await record(11, page, async () => {
      await page.goto(url("/plataforma"));
      await page.getByRole("main").waitFor();
      const me = await h.api(page, "/api/me"); assert.equal(me.status(), 200); assert.equal((await me.json()).access, "platform");
      return "Inicio real de Plataforma y su marco cargaron con la sesión operadora.";
    }, [10]);
    await recordLifecycle(12);
    for (const [number] of organizationTabs) await recordLifecycle(number);
    await recordLifecycle(18);
    for (const [number] of accountTabs) await recordLifecycle(number);
    for (const number of [22, 23, 24, 25, 26, 27, 28, 29]) await recordLifecycle(number);
    for (const [number, route, title, endpoint] of [[30, "/plataforma/recuperaciones", "Recuperaciones", "/api/platform/recoveries/paged"], [31, "/plataforma/auditoria", "Auditoría", "/api/platform/audit"], [32, "/plataforma/legales", "Documentos legales", "/api/platform/legal-documents"]]) await record(number, page, async () => {
      const loaded = responseAt(page, endpoint, "GET");
      await page.goto(url(route));
      await page.getByRole("heading", { name: title, exact: true }).waitFor();
      assert.equal((await loaded).status(), 200);
      if (number === 32) await page.getByRole("link", { name: "Publicar versión nueva", exact: true }).first().waitFor();
      return `${title} cargó desde su API real con HTTP 200.`;
    }, [10]);
    await record(33, page, async () => {
      await page.goto(url("/plataforma/configuracion"));
      const field = page.getByRole("textbox", { name: "Organizaciones propias por persona", exact: true });
      await field.fill("0");
      await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
      await page.getByText("Usá un número de 1 a 50.", { exact: true }).waitFor();
      assert.equal(await page.getByRole("dialog").count(), 0);
      const group = page.getByRole("group", { name: "Límites de uso", exact: true });
      assert.equal(await group.getByRole("textbox", { name: /^Pedidos · / }).count(), 12);
      await page.getByRole("button", { name: "Descartar cambios", exact: true }).click();
      return "Configuración rechazó cero organizaciones propias y muestra los doce perfiles de límites.";
    }, [10]);
    let conflictPage;
    await record(34, () => conflictPage ?? page, async () => {
      await page.goto(url("/plataforma/configuracion"));
      const field = page.getByRole("textbox", { name: "Organizaciones propias por persona", exact: true });
      const original = Number((await field.inputValue()).replaceAll(".", ""));
      assert.ok(Number.isInteger(original) && original >= 1 && original <= 50);
      conflictPage = await h.newPage(); pages.push(conflictPage);
      await confirmRecentAuthenticationWhenAsked(conflictPage, fullEmail);
      await conflictPage.goto(url("/plataforma/configuracion"));
      await settingsFields(page, original === 50 ? 49 : original + 1);
      const draft = original > 48 ? 47 : original + 2;
      await settingsFields(conflictPage, draft);
      try {
        await saveSettings(page, 200, "Prueba integral: primer editor de configuración.");
        await saveSettings(conflictPage, 409, "Prueba integral: segundo editor con versión vieja.");
        await assertPlatformSettingsConflict(conflictPage, draft);
      } finally {
        await settingsFields(page, original);
        await saveSettings(page, 200, "Prueba integral: restaurar límite original de altas.");
      }
      return "La segunda pestaña recibió 409 General.ConcurrencyConflict y ofrece Ver lo nuevo; se restauró el límite original.";
    }, [10]);
    // El 409 tiene su captura propia: conservar la pestaña ya fallada hasta que record haya capturado el caso.
    if (conflictPage) { await stopConfirmingRecentAuthentication(conflictPage); await conflictPage.close(); }
    await recordLifecycle(35);
    await record(37, page, async () => {
      assert.ok(fullOperator.effectivePermissions.platform.includes("platform.operators.manage"));
      const found = await h.api(page, `/api/platform/accounts/paged?page=1&pageSize=10&search=${encodeURIComponent(reducedEmail)}`);
      assert.equal(found.status(), 200);
      const accounts = (await found.json()).items; assert.equal(accounts.length, 1);
      assert.notEqual(accounts[0].id, fullOperator.id, "El operador completo cambia a otra cuenta.");
      const current = await h.api(page, `/api/platform/accounts/${accounts[0].id}`); assert.equal(current.status(), 200);
      readOnlyOperator = await addAccountReadByUi(h, page, await current.json(), h.base);
      const own = await h.api(page, `/api/platform/accounts/${fullOperator.id}`); assert.equal(own.status(), 200);
      fullOperator = { ...fullOperator, ...await own.json() };
      return "Cambiar permisos mostró 14 opciones y guardó operatorVersion/motivo por UI; la otra cuenta conserva exactamente lectura de organizaciones y cuentas, sin Personal ni roles.";
    }, [1, 10]);
    const negativeFixtures = async () => {
      const response = await h.api(page, `/api/platform/tenants/${business.me.activeTenantId}`); assert.equal(response.status(), 200);
      const tenant = await response.json(); assert.equal(tenant.id, business.me.activeTenantId);
      return platformWriteAttempts({ tenant, account: { id: person.me.id }, operator: fullOperator, ownerEmail: `e2e-denied-${randomUUID()}@example.test` });
    };
    lifecycleState.negativeFixtures = negativeFixtures;
    await record(38, page, async () => {
      await enterReadOnly();
      await page.goto(url("/plataforma/organizaciones"));
      await page.getByRole("heading", { name: "Organizaciones", exact: true }).waitFor();
      assert.equal(await page.getByRole("button", { name: "Crear organización", exact: true }).count(), 0);
      await page.goto(url(organizationRoute()));
      await page.getByRole("heading", { name: business.organization, exact: true }).waitFor();
      assert.equal(await page.getByRole("button", { name: /^Acciones de / }).count(), 0);
      for (const label of ["Aprobar", "Rechazar", "Reintentar alta", "Suspender", "Reactivar", "Cerrar organización", "Cerrar"]) {
        assert.equal(await page.getByRole("button", { name: label, exact: true }).count(), 0);
        assert.equal(await page.getByRole("menuitem", { name: label, exact: true }).count(), 0);
      }
      await assertDeniedPlatformWrites(h, page, (await negativeFixtures()).organizations);
      return "El operador con tenants.read consultó la organización real sin controles de gestión; sus siete POST de alta/transición devolvieron 403 Http.Forbidden con traceId antes del step-up.";
    }, [8, 9, 37]);
    await recordLifecycle(39, [8, 9, 37]);
    await record(40, page, async () => {
      await enterReadOnly();
      await assertDeniedPlatformWrites(h, page, (await negativeFixtures()).operators);
      const current = await h.api(page, "/api/me"); assert.equal(current.status(), 200);
      assertReadOnlyPlatformPermissions(await current.json());
      return "Invitar operador y cambiar los permisos de otro operador real devolvieron 403 Http.Forbidden; la sesión mantiene sólo sus dos permisos de lectura.";
    }, [8, 9, 37]);
    await record(36, page, async () => {
      await h.signOut(page); fullSignedIn = false; reducedSignedIn = false;
      return "La salida cerró la sesión de Plataforma y volvió a la portada pública.";
    }, [10]);
  } finally {
    if (lifecycleState.personSignedIn) await h.signOut(personPage).catch(() => {});
    if (lifecycleState.businessSignedIn) await h.signOut(businessPage).catch(() => {});
    if (fullSignedIn || reducedSignedIn) await h.signOut(page).catch(() => {});
    for (const target of pages) {
      if (!target.isClosed()) { await stopConfirmingRecentAuthentication(target); await target.close(); }
    }
  }
}
