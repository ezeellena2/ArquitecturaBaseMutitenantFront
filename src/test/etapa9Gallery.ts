import { readFileSync } from "node:fs";
import path from "node:path";
import type { PlatformAuditEventResponse, RoleResponse } from "@/shared/api/types";
import { api, click, fill, galleryApp, galleryCase, otp, press, scroll, type GalleryAction, type GalleryApiResponse, type GalleryCase, type GalleryPending } from "./gallery";
import { currentUsers } from "./mocks/currentUsers";
import { platformAccountDetailFixture } from "./mocks/platformAccountDetail";
import { platformAuditCaptureResponses } from "./mocks/platformAudit";
import { platformLegalCaptureResponses } from "./mocks/platformLegal";
import { platformRecoveriesCaptureResponses } from "./mocks/platformRecoveries";
import { platformSettingsCaptureResponses } from "./mocks/platformSettings";

// Galería de la E9 (scripts/capturas/etapa-9.json): solo las pantallas nuevas o cambiadas en la etapa, al lado de su
// tablero de la v125. Datos ficticios del arnés: no acredita el back. El Asistente y Usuarios parten de los casos de la 8b
// y de la 11, que ya tienen sus datos.

/** La hora de los tableros de Cuenta-Plat: el último ingreso de Laura fue hace 5 días. */
const now = "2026-09-27T21:00:00Z";
const operator = api("GET", "/api/me", currentUsers["visual-operator"]);
const factorPath = "/api/auth/platform-factor";
const loginRoute = `/login?${new URLSearchParams({ returnUrl: "/connect/authorize?client_id=web&access=platform", factor: "pending" })}`;
const expiresAtUtc = "2026-09-27T21:10:00Z";
const verifyChallenge = api("GET", factorPath, { state: "verify", expiresAtUtc });
const setupChallenge = api("GET", factorPath, { state: "setup", expiresAtUtc, secret: "JBSWY3DPEHPK3PXP",
  otpauthUri: "otpauth://totp/ArquitecturaBase:martin.sosa%40arquitecturabase.ejemplo.com?secret=JBSWY3DPEHPK3PXP&issuer=ArquitecturaBase" });
// Los ocho códigos del tablero Ingreso («Operador: guardar los códigos»).
const recoveryCodes = ["7KQ2-M9XD", "P4TZ-8WNE", "H2RC-QA6V", "ZL9B-3YFK", "E5MU-T7JP", "W8GD-2NHS", "C3XV-R6LQ", "N9AF-K4PB"];
const codesChallenge = api("GET", factorPath, { state: "recoveryCodes", expiresAtUtc, recoveryCodes });
const verifyFails = (body: unknown, status = 400): GalleryApiResponse => api("POST", `${factorPath}/verify`, body, status);

// F2: la escritura sin una confirmación reciente; el diálogo «Confirmá que sos vos» y sus respuestas.
const reauthenticationRequired = { code: "Auth.Platform.ReauthenticationRequired", detail: "Confirmá que sos vos para continuar." };
const reauthenticationFails = (body: unknown, status = 400): GalleryApiResponse => api("POST", "/api/platform/reauthentication", body, status);
const confirmDialog = { role: "dialog", name: "Confirmá que sos vos" } as const;
// P2: el 429 de un límite de uso, con la espera del tablero (0:41).
const rateLimited = { code: "Security.RateLimit.Exceeded", detail: "Too many requests.", retryAfter: 41 };

function ingreso(board: "Ingreso" | "M-Ingreso"): GalleryCase[] {
  const login = (state: string, responses: GalleryApiResponse[], readyText: string, actions: GalleryAction[] = []) =>
    galleryCase("ingreso", board, state, galleryApp("anonymous", loginRoute, responses, { now, readyText, actions }));
  return [
    login("Operador: segundo factor", [verifyChallenge], "Escribí el código de 6 números de tu app de autenticación."),
    login("Operador: código del autenticador incorrecto", [verifyChallenge, verifyFails({ code: "Auth.TwoFactor.Invalid" })],
      "Revisá que la hora de tu celular esté bien.", [otp("120934"), click("Verificar")]),
    login("Operador: demasiados códigos incorrectos", [verifyChallenge, verifyFails({ code: "Identity.Account.LockedOut", retryAfter: 900 }, 429)],
      "Probá de nuevo en 15 minutos.", [otp("774201"), click("Verificar")]),
    login("Operador: código de recuperación", [verifyChallenge], "Escribí uno de los códigos de recuperación que guardaste.", [click("Usar un código de recuperación")]),
    login("Operador: código de recuperación incorrecto", [verifyChallenge, verifyFails({ code: "Auth.TwoFactor.RecoveryInvalid" })],
      "Ese código no es válido o ya lo usaste.", [click("Usar un código de recuperación"), fill("Código de recuperación", "P4TZ-8WNE"), click("Verificar")]),
    login("Operador: configurar el autenticador", [setupChallenge], "JBSW Y3DP EHPK 3PXP"),
    login("Operador: configurar · código incorrecto", [setupChallenge, verifyFails({ code: "Auth.TwoFactor.Invalid" })],
      "Revisá que la hora de tu celular esté bien.", [otp("551203"), click("Activar")]),
    login("Operador: guardar los códigos", [codesChallenge], "N9AF-K4PB"),
  ];
}

function cuentaPlat(board: "Cuenta-Plat" | "M-Cuenta-Plat"): GalleryCase[] {
  const laura = platformAccountDetailFixture({ kind: "Operador" });
  const route = `/plataforma/cuentas/${laura.id}`;
  const responses = [api("GET", `/api/platform/accounts/${laura.id}`, laura), operator];
  const props = (state: string) => board === "Cuenta-Plat" ? { stateKey: "cuenta", props: { estado: "Activa", cuenta: state } } : {};
  // En la compu el ⋮ es un desplegable; en el teléfono abre la hoja de abajo con un toque (M-Cuenta-Plat).
  const open = board === "Cuenta-Plat" ? press("Acciones de Laura Díaz", "button", "ArrowDown") : click("Acciones de Laura Díaz");
  const reset = (state: string, readyText: string, actions: GalleryAction[]) => galleryCase("cuenta-plat", board, state,
    galleryApp("visual-operator", route, responses, { now, readyText, actions }), props(state));
  // «Cambiar permisos» con «Administrar cuentas» de más y su motivo; guardar pide «Confirmá que sos vos» (tablero, v125).
  const form = { role: "dialog", name: "Cambiar permisos de Laura Díaz" } as const;
  const permissions: GalleryAction[] = [...board === "Cuenta-Plat" ? [click("Cambiar permisos")] : [open, click("Cambiar permisos", "menuitem")],
    press("Permisos de plataforma", "button", "ArrowDown"), click("Administrar cuentas", "menuitemcheckbox"), click("Ver la auditoría", "menuitemcheckbox"),
    press("Ver la auditoría", "menuitemcheckbox", "Escape"),
    fill("Motivo", "Va a atender las bajas de cuentas.", form), click("Guardar cambios", "button", form)];
  const confirm = (state: string, readyText: string, actions: GalleryAction[] = [], proof: GalleryApiResponse[] = []) => galleryCase("cuenta-plat", board, state,
    galleryApp("visual-operator", route, [...responses, api("PUT", `/api/platform/accounts/${laura.id}/operator`, reauthenticationRequired, 403), ...proof],
      { now, readyText, actions: [...permissions, ...actions] }), props(state));
  const confirmWith = click("Confirmar", "button", confirmDialog);
  const recovery = click("Usar un código de recuperación", "button", confirmDialog);
  return [
    reset("Operador: acciones", "Restablecer el autenticador", [open]),
    reset("Operador: restablecer el autenticador", "Se cierran sus sesiones y sus códigos de recuperación dejan de servir.", [open, click("Restablecer el autenticador", "menuitem"),
      fill("Motivo", "Cambió de celular y perdió los códigos.", { role: "dialog", name: "¿Restablecer el autenticador de Laura Díaz?" })]),
    confirm("Operador: confirmar que sos vos", "Para guardar los permisos de Laura Díaz, escribí el código de tu app de autenticación."),
    confirm("Operador: confirmar que sos vos · código incorrecto", "El código no es válido. Revisá que la hora de tu celular esté bien.",
      [otp("120934"), confirmWith], [reauthenticationFails({ code: "Auth.TwoFactor.Invalid" })]),
    confirm("Operador: confirmar con un código de recuperación", "Para guardar los permisos de Laura Díaz, escribí uno de los códigos de recuperación que guardaste.", [recovery]),
    confirm("Operador: confirmar · código de recuperación incorrecto", "Ese código no es válido o ya lo usaste.",
      [recovery, fill("Código de recuperación", "P4TZ-8WNE", confirmDialog), confirmWith], [reauthenticationFails({ code: "Auth.TwoFactor.RecoveryInvalid" })]),
    confirm("Operador: confirmar · demasiados intentos", "Tu cuenta está bloqueada por unos minutos por demasiados intentos fallidos. Probá de nuevo en 15 minutos.",
      [otp("774201"), confirmWith], [reauthenticationFails({ code: "Identity.Account.LockedOut", retryAfter: 900 }, 429)]),
    // Cancelar vuelve a «Cambiar permisos» con lo cargado.
    confirm("Operador: cancelar la confirmación", "Cambiar permisos de Laura Díaz", [click("Cancelar", "button", confirmDialog)]),
  ];
}

/** Recuperaciones y Documentos legales: «Confirmá que sos vos» reemplaza al diálogo de la acción (v125). */
function otrasConfirmaciones(): GalleryCase[] {
  // Fila 2 del tablero: el método nuevo es un teléfono («•••• 3310»).
  const withPhone = (body: unknown) => body && typeof body === "object" && "items" in body && Array.isArray(body.items)
    ? { ...body, items: body.items.map((item: { id?: string }) => item.id === "r2" ? { ...item, newMethodType: "Phone", newMethod: "•••• 3310" } : item) } : body;
  const recoveries = (platformRecoveriesCaptureResponses() as GalleryApiResponse[]).map((response) => ({ ...response, body: withPhone(response.body) }));
  const legal = platformLegalCaptureResponses() as GalleryApiResponse[];
  return [
    galleryCase("recuperaciones", "Recuperaciones", "Aprobar: confirmá que sos vos", galleryApp("visual-operator", "/plataforma/recuperaciones",
      [api("POST", "/api/platform/recoveries/r1/approve", reauthenticationRequired, 403), ...recoveries, operator], {
        now, readyText: "Para aprobar el pedido de Pablo Ortiz, escribí el código de tu app de autenticación.",
        actions: [press("Acciones de Pablo Ortiz", "button", "ArrowDown"), click("Revisar", "menuitem"), fill("Motivo", "Confirmó sus datos por videollamada."), click("Aprobar")],
      }), { stateKey: "caso" }),
    galleryCase("legales", "Legales", "Publicar: confirmá que sos vos", galleryApp("visual-operator", "/plataforma/legales/nueva",
      [api("POST", "/api/platform/legal-documents", reauthenticationRequired, 403), ...legal, operator], {
        now, readyText: "Para publicar la versión 3 de Términos y condiciones, escribí el código de tu app de autenticación.",
        actions: [fill("Vigente desde", "01/11/2026"), fill("En español", "Estos términos regulan el uso del servicio por parte de las personas y las organizaciones."),
          fill("En inglés", "These terms govern the use of the service by people and organizations."), click("Publicar"),
          click("Publicar", "button", { role: "alertdialog", name: "¿Publicar la versión 3 de Términos y condiciones?" })],
      }), { stateKey: "pantalla" }),
  ];
}

/** F4: los doce límites de uso en Configuración, con el motivo, «Confirmá que sos vos» y otra persona que cambió (v125). */
function configPlat(board: "Config-Plat" | "M-Config-Plat"): GalleryCase[] {
  const quick = "Pedidos · Consultas fijas";
  const reason = { role: "dialog", name: "¿Guardar la configuración?" } as const;
  const changed = [fill(quick, "30")];
  const phone = board === "M-Config-Plat";
  const toReason = [...changed, click("Guardar cambios"), fill("Motivo", "Más consultas fijas para la campaña de octubre.", reason)];
  const settings = (state: string, options: { readyText?: string; readyTexts?: string[]; actions?: GalleryAction[]; responses?: GalleryApiResponse[]; conflict?: boolean }) =>
    galleryCase("config-plat", board, state, galleryApp("visual-operator", "/plataforma/configuracion",
      [...options.responses ?? [], ...platformSettingsCaptureResponses({ conflict: options.conflict }) as GalleryApiResponse[], operator],
      { now, readyText: options.readyText, readyTexts: options.readyTexts, actions: options.actions }));
  return [
    settings("Sin cambios", { readyText: "Límites de uso" }),
    settings("Con cambios", { readyText: "Límites de uso", actions: [...changed, scroll()] }),
    settings("Límite fuera de rango", { readyTexts: ["Usá un número de 1 a 1.000.000.", "Usá un tiempo de 1 segundo a 24 horas."], actions: [fill(quick, "0"),
      fill("Cada · Probar una clave nueva", "48"), press("Unidad · Probar una clave nueva", "combobox", "Enter"), click("horas", "option"), click("Guardar cambios"),
      ...phone ? [scroll("Pedidos · Conversaciones")] : []] }),
    settings("Guardar: motivo", { readyText: "¿Guardar la configuración?", actions: toReason }),
    settings("Guardar: confirmá que sos vos", { readyText: "Para guardar la configuración, escribí el código de tu app de autenticación.",
      actions: [...toReason, click("Guardar", "button", reason)], responses: [api("PUT", "/api/platform/settings", reauthenticationRequired, 403)] }),
    settings("Otra persona cambió la configuración", { readyText: "Otra persona cambió esto mientras lo editabas.",
      actions: [...toReason, click("Guardar", "button", reason), ...phone ? [scroll()] : []], conflict: true }),
  ];
}

const root = path.resolve(import.meta.dirname, "../..");
const previousCases = (stage: string) => (JSON.parse(readFileSync(path.join(root, `scripts/capturas/etapa-${stage}.json`), "utf8")) as { cases: GalleryCase[] }).cases;
const caseOf = (cases: GalleryCase[], id: string) => {
  const found = cases.find((entry) => entry.id === id);
  if (!found) throw new Error(`Falta el caso ${id}`);
  return found;
};

/** P2 en el Asistente: la conversación nueva de la 8b; una consulta fija choca con un límite y lo escrito queda (v125). */
function asistente(board: "Asistente-Org" | "M-Asistente-Org"): GalleryCase {
  const base = caseOf(previousCases("8b"), board === "Asistente-Org" ? "asistente-org-quedan-10-consultas" : "m-asistente-org-quedan-10-consultas");
  // Lejos del tope del día: el aviso es el del límite de uso, no el de «Quedan 10 consultas».
  const responses = base.app.responses.map((response) => response.method === "GET" && response.path === "/api/organization/assistant"
    ? { ...response, body: { ...response.body as object, remainingMessages: 40 } } : response);
  const { readyTexts: _readyTexts, ...app } = base.app;
  return galleryCase("asistente", board, "Demasiadas consultas seguidas", { ...app, readySelector: "main", readyText: "Hiciste muchas consultas seguidas.",
    responses: [api("POST", "/api/organization/assistant/quick/active_users", rateLimited, 429), ...responses],
    actions: [click("Usuarios activos"), fill("Tu consulta", "¿Quiénes entraron esta semana?")] }, { stateKey: "asistente" });
}

/** P2 en Usuarios: la lista de la 11 que no carga por un límite (v125). */
function usuarios(board: "Usuarios" | "M-Usuarios"): GalleryCase {
  const base = caseOf(previousCases("11"), board === "Usuarios" ? "usuarios-lista" : "m-usuarios-lista");
  const responses = base.app.responses.map((response) => response.method === "GET" && response.path === "/api/users/paged"
    ? { method: response.method, path: response.path, status: 429, body: rateLimited } : response);
  const { readyTexts: _readyTexts, readyText: _readyText, ...app } = base.app;
  return galleryCase("usuarios", board, "Demasiados pedidos", { ...app, readySelector: "main", readyText: "No pudimos cargar los usuarios.", responses, actions: [] });
}

// Los roles del tablero Roles: tres «Solo lectura», uno por empresa; el de Delta S.A. lo tienen 4 usuarios.
const companies = [["company-delta", "Delta S.A."], ["company-delta-sur", "Delta Sur S.R.L."], ["company-delta-norte", "Delta Norte S.A."]] as const;
const organizationPermissions = ["users.read", "users.invite", "users.manage", "roles.read", "roles.manage", "companies.read", "companies.manage", "settings.read", "settings.manage", "publicpage.manage", "audit.read", "assistant.use"];
const role = (id: string, name: string, description: string, userCount: number, permissions: string[], scope: RoleResponse["scope"], company?: readonly [string, string], isSystemRole = false): RoleResponse =>
  ({ id, name, description, scope, companyId: company?.[0] ?? null, companyName: company?.[1] ?? null, isSystemRole, userCount, permissions, version: 3, createdAtUtc: "2026-09-01T12:00:00Z" });
const boardRoles: RoleResponse[] = [
  role("role-owner", "Dueño", "Tiene todos los permisos de la organización.", 1, organizationPermissions, "Organization", undefined, true),
  role("role-hr", "Recursos humanos", "Invita, edita y deshabilita usuarios.", 0, ["users.read", "users.invite", "users.manage"], "Organization"),
  role("role-auditor", "Auditor", "Ve los usuarios y la auditoría. No cambia nada.", 1, ["users.read", "audit.read"], "Organization"),
  role("role-company-admin", "Administrador", "Administra la empresa: sus miembros y sus roles.", 2, ["company.members.read", "company.members.manage"], "AnyCompany", undefined, true),
  ...companies.map(([id, name], index) => role(`role-reader-${id}`, "Solo lectura", "Ve los miembros de la empresa. No cambia nada.", [4, 1, 0][index], ["company.members.read"], "SpecificCompany", [id, name])),
];
const companiesPage = { items: companies.map(([id, name]) => ({ id, name, taxId: null, timeZoneId: "America/Argentina/Buenos_Aires", status: "Active", memberCount: 4, version: 1, createdAtUtc: "2026-09-01T12:00:00Z" })),
  page: 1, pageSize: 100, totalCount: companies.length, totalPages: 1, hasPrevious: false, hasNext: false };
const owner = api("GET", "/api/me", currentUsers["visual-owner"]);

/** R10 en Roles: el ⋮ del «Solo lectura» de Delta S.A. con «Inactivar» apagado y su motivo (v125). */
function roles(): GalleryCase {
  const counts = { matching: { all: 7, organization: 3, company: 4 }, total: { all: 7, organization: 3, company: 4 }, anyCompany: 1,
    companies: Object.fromEntries(companies.map(([id]) => [id, 2])) };
  return galleryCase("roles", "Roles", "Menú de un rol con usuarios", galleryApp("visual-owner", "/org/roles", [
    api("GET", "/api/roles/paged", { items: boardRoles, page: 1, pageSize: 10, totalCount: boardRoles.length, totalPages: 1, hasPrevious: false, hasNext: false }),
    api("GET", "/api/roles/filter-counts", counts), api("GET", "/api/companies/paged", companiesPage), owner,
  ], { now, readyText: "Lo tienen 4 usuarios. Quitáselo primero.", actions: [press("Acciones para Solo lectura", "button", "Enter", 0)] }),
  { boardActions: [{ type: "click", selector: '[aria-label="Acciones de Solo lectura"]' }] });
}

/** P2 en Rol: guardar el «Solo lectura» de Delta S.A. con la descripción nueva choca con un límite (v125). */
function rol(board: "Rol" | "M-Rol"): GalleryCase {
  const reader = boardRoles[4];
  const permissionGroups = [
    { area: "users", name: "Usuarios", permissions: [{ code: "users.read", name: "Ver usuarios", description: "Quién está en la organización." }] },
    { area: "company", name: "Miembros", permissions: [
      { code: "company.members.read", name: "Ver miembros", description: "Quién está en la empresa y con qué roles." },
      { code: "company.members.manage", name: "Administrar miembros", description: "Agregar y quitar miembros y cambiarles los roles." },
    ] },
  ];
  return galleryCase("rol", board, "Guardar: demasiados pedidos", galleryApp("visual-owner", `/org/roles/${reader.id}`, [
    api("PUT", `/api/roles/${reader.id}`, rateLimited, 429), api("GET", `/api/roles/${reader.id}`, reader), api("GET", "/api/permissions", permissionGroups),
    api("GET", "/api/companies/paged", companiesPage), owner,
  ], { now, readyText: "Hiciste muchos pedidos seguidos. Esperá un momento.",
    actions: [fill("Descripción", "Ve los miembros de la empresa y sus datos de contacto. No cambia nada."), { ...click("Guardar cambios"), nth: 0 }] }),
  board === "Rol" ? { stateKey: "modo" } : {});
}

/** F3 en Auditoría (v125): las filas del tablero, con los eventos del autenticador arriba; 6 en la compu y 10 en el
 * teléfono, y «Cargar más». Las fechas del tablero son de Buenos Aires. */
function auditoria(board: "Auditoria-Plat" | "M-Auditoria-Plat"): GalleryCase {
  const event = (id: number, occurredAtUtc: string, type: string, summary: string, target: string, actor: string, actorRole: string, reason: string | null): PlatformAuditEventResponse =>
    ({ id: `a0000000-0000-4000-8000-${String(900 + id).padStart(12, "0")}`, occurredAtUtc, type, action: "Gallery", summary, target, targetTenantId: null,
      targetAccountId: null, actor, actorRole, reason, ipAddress: "181.45.178.•••" });
  const events = [
    event(1, "2026-09-27T14:40:00Z", "accounts", "Restableció el autenticador", "Laura Díaz", "Martín Sosa", "Operador", "Cambió de celular."),
    event(2, "2026-09-27T14:38:00Z", "signins", "Confirmó con el autenticador", "Plataforma", "Martín Sosa", "Operador", null),
    event(3, "2026-09-27T14:05:00Z", "signins", "Ingresó con un código de recuperación", "Plataforma", "Laura Díaz", "Operador", null),
    event(4, "2026-09-27T13:58:00Z", "signins", "Configuró el autenticador", "Plataforma", "Julieta Molina", "Operador", null),
    event(5, "2026-09-27T13:55:00Z", "signins", "Ingresó con el autenticador", "Plataforma", "Martín Sosa", "Operador", null),
    event(6, "2026-09-27T13:20:00Z", "signins", "Cuenta bloqueada 15 minutos por 10 códigos incorrectos", "mariana.lopez@gmail.com", "Sistema", "Automático", null),
    event(7, "2026-09-27T12:55:00Z", "organizations", "Falló el alta de la organización", "Sigma S.A.", "Sistema", "Automático", null),
    event(8, "2026-09-26T20:30:00Z", "accounts", "Suspendió la cuenta", "Ana Gómez", "Laura Díaz", "Operador", "Denuncia de uso indebido."),
    event(9, "2026-09-22T15:00:00Z", "settings", "Cambió el alta de organizaciones a Requiere aprobación", "Plataforma", "Martín Sosa", "Operador", "Muchas altas de prueba."),
    event(10, "2026-09-20T14:02:00Z", "organizations", "Reactivó la organización", "Grupo Delta", "Martín Sosa", "Operador", "Regularizó el pago."),
    event(11, "2026-09-18T19:45:00Z", "organizations", "Suspendió la organización", "Beta S.R.L.", "Martín Sosa", "Operador", "Dos meses sin pago."),
    event(12, "2026-09-15T13:10:00Z", "operators", "Invitó a laura.diaz@arquitecturabase.ejemplo.com como operador", "Plataforma", "Martín Sosa", "Operador", "Suma al equipo de soporte."),
  ];
  const shown = board === "Auditoria-Plat" ? 6 : 10;
  const responses = [api("GET", "/api/platform/audit", { items: events.slice(0, shown), nextCursor: "AQjfFlZMHwaAAAAAoAAAAECAAAAAAAAQGQ", hasMore: true }),
    ...(platformAuditCaptureResponses() as GalleryApiResponse[]).filter((response) => response.path !== "/api/platform/audit"), operator];
  return galleryCase("auditoria", board, "Eventos del segundo factor", galleryApp("visual-operator", "/plataforma/auditoria", responses,
    { now, readyText: "Restableció el autenticador" }), { props: {} });
}

export const etapa9GalleryCases: GalleryCase[] = [
  ...ingreso("Ingreso"), ...ingreso("M-Ingreso"), ...cuentaPlat("Cuenta-Plat"), ...cuentaPlat("M-Cuenta-Plat"), ...otrasConfirmaciones(),
  ...configPlat("Config-Plat"), ...configPlat("M-Config-Plat"), asistente("Asistente-Org"), asistente("M-Asistente-Org"),
  rol("Rol"), rol("M-Rol"), usuarios("Usuarios"), usuarios("M-Usuarios"), roles(), auditoria("Auditoria-Plat"), auditoria("M-Auditoria-Plat"),
];

/** Los estados de la v125 que no se fotografían: ninguno queda pendiente. */
export const etapa9GalleryPending: GalleryPending[] = [];
