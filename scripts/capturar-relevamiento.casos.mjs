// Los casos del relevamiento: cada pantalla y estado de las etapas 1 a 6, contra el tablero vigente del lienzo.
// Los datos de prueba y los pasos de la app salen de los manifiestos de las etapas (los escriben sus generadores);
// acá se decide solo el lado del tablero: cuál, con qué estado y con qué pasos.
import { readFileSync } from "node:fs";
import path from "node:path";
import { auditResponses } from "./capturar-etapa-6.mjs";

const desktop = { width: 1440, height: 900 };
const phone = { width: 390, height: 844 };

// Los CUIT de los datos de prueba son los del lienzo, que pasan el dígito verificador (Delta S.A. y Delta Sur S.R.L.); los
// manifiestos de las etapas guardan los de antes y no se reescriben (son la foto de cada etapa).
const boardCuits = [["30712345678", "30712345671"], ["30715554442", "30715554441"]];
const withBoardCuits = (text) => boardCuits.reduce((result, [before, now]) => result.replaceAll(before, now), text);

// Los manifiestos tampoco se reescriben cuando cambia el contrato del back: lo que cambió después de la etapa se completa
// acá, como lo devuelve hoy el back (R3c).
// - La auditoría, con la forma de las tandas 4f y 4g del back: el detalle por nombre y sin ids, y «Quién» con «Sistema» y
//   «Plataforma». Los datos son los del generador de la etapa 6, al día con el tablero Auditoria-Org (v107).
// - Cada dominio, con `managedEmailCount` («Verificado · 10 correos administrados por …» del tablero Configuracion).
// - La ficha de una empresa, con la ruta de sus roles (B4): los de cualquier empresa y los suyos, filtrados como el back.
// - Las rutas que cambiaron de nombre: crear un rol es /org/roles/nuevo (frontend.md §3, tanda 6a).
const currentAudit = new Map(auditResponses().map((item) => [item.path, item]));
const renamedRoutes = [["route=%2Forg%2Froles%2Fnew", "route=%2Forg%2Froles%2Fnuevo"]];
function withCurrentRoute(entry) {
  const path = entry.app?.path;
  if (typeof path !== "string") return entry;
  const next = renamedRoutes.reduce((result, [before, now]) => result.replace(before, now), path);
  return next === path ? entry : { ...entry, app: { ...entry.app, path: next } };
}
function withCurrentContract(entry) {
  const responses = entry.app?.responses;
  if (!responses) return entry;
  const next = responses.map((item) => {
    if (item.method === "GET" && currentAudit.has(item.path)) return currentAudit.get(item.path);
    if (item.method === "GET" && item.path === "/api/organization/settings/domains" && Array.isArray(item.body)) {
      return { ...item, body: item.body.map((domain) => ({ managedEmailCount: domain.status === "Verified" ? 10 : 0, ...domain })) };
    }
    return item;
  });
  const companyId = next.map((item) => item.method === "GET" && item.path.startsWith("/api/companies/company-") && item.path.split("/").length === 4 ? item.path.split("/")[3] : null).find(Boolean);
  const roles = next.find((item) => item.method === "GET" && item.path === "/api/roles/paged" && item.query?.scope === "Company");
  const rolesPath = `/api/companies/${companyId}/roles/paged`;
  if (companyId && roles && !next.some((item) => item.path === rolesPath)) {
    const items = roles.body.items.filter((role) => role.scope === "AnyCompany" || role.companyId === companyId);
    next.push({ method: "GET", path: rolesPath, body: { ...roles.body, items, pageSize: 100, totalCount: items.length, totalPages: 1, hasNext: false }, status: 200 });
  }
  return { ...entry, app: { ...entry.app, responses: next } };
}

const manifests = new Map();
function stageCases(root, name) {
  if (!manifests.has(name)) {
    manifests.set(name, JSON.parse(withBoardCuits(readFileSync(path.join(root, "docs/design/capturas", name, "manifest.json"), "utf8"))).cases.map(withCurrentContract).map(withCurrentRoute));
  }
  return manifests.get(name);
}

/// Un estado a 1440 y a 390. La app sale de la etapa de origen (`stage`, `pair`); `desktop` y `phone` cambian el tablero de
/// cada tamaño (`board`, `props`, `boardActions`, `state`, `section`), y `app` / `phoneApp` ajustan la app en uno o en el otro.
function pairCases(root, { stage, pair, id = pair, group, state, desktop: onDesktop = {}, phone: onPhone = {}, app = {}, phoneApp = {} }) {
  const entries = stageCases(root, stage).filter((entry) => entry.pair === pair);
  const pick = (width) => entries.find((entry) => entry.viewport.width === width);
  return [["escritorio", desktop, pick(1440), onDesktop, app], ["movil", phone, pick(390), onPhone, phoneApp]].map(([suffix, viewport, source, board, patch]) => {
    if (!source) throw new Error(`La etapa ${stage} no tiene «${pair}» en ${viewport.width}.`);
    const section = board.section ?? source.section;
    return {
      id: `${id}-${suffix}`, pair: id, group, state: board.state ?? state ?? source.state,
      board: board.board ?? source.board, props: board.props ?? source.props ?? {}, boardActions: board.boardActions ?? source.boardActions ?? [],
      ...(section ? { section } : {}), viewport, app: { ...source.app, ...patch },
    };
  });
}

const click = (selector) => ({ type: "click", selector });
const fill = (name, value) => ({ type: "fill", name, value });
const appFill = (name, value) => ({ type: "fill", role: "textbox", name, value });

// Etapa 3a: ingresos, registro, inicios, errores y sesión (los tableros ya son los vigentes).
const stage3a = [
  ["landing", "publicas", "Portada (la primera pantalla de la página)"],
  ["legal-terms", "publicas", "Términos y condiciones"],
  ["legal-privacy", "publicas", "Política de privacidad"],
  ["ingreso-persona-correo", "ingreso", "Ingreso de persona: pide el correo"],
  ["ingreso-empresa-correo", "ingreso", "Ingreso de empresa: pide el correo"],
  ["ingreso-correo-invalido", "ingreso", "Ingreso: correo inválido"],
  ["ingreso-espera", "ingreso", "Ingreso: esperá para pedir otro código"],
  ["ingreso-demasiados", "ingreso", "Ingreso: demasiados pedidos"],
  ["ingreso-google-error", "ingreso", "Ingreso: no pudimos entrar con Google"],
  ["ingreso-codigo-enviado", "ingreso", "Ingreso: código enviado"],
  ["ingreso-codigo-incorrecto", "ingreso", "Ingreso: código incorrecto"],
  ["ingreso-codigo-vencido", "ingreso", "Ingreso: código vencido"],
  ["ingreso-sin-intentos", "ingreso", "Ingreso: sin intentos"],
  ["ingreso-cuenta-bloqueada", "ingreso", "Ingreso: cuenta bloqueada"],
  ["ingreso-cuenta-suspendida", "ingreso", "Ingreso: cuenta suspendida"],
  ["ingreso-empresa-sin-perfil", "ingreso", "Ingreso de empresa: la cuenta no está en ninguna empresa"],
  ["ingreso-empresa-inactiva", "ingreso", "Ingreso de empresa: acceso deshabilitado"],
  ["ingreso-sesion-vencida", "ingreso", "Ingreso: tu sesión venció"],
  ["registro-correo", "registro", "Registro: pide el correo"],
  ["registro-correo-invalido", "registro", "Registro: correo inválido"],
  ["registro-cerrado", "registro", "Registro cerrado"],
  ["registro-codigo-enviado", "registro", "Registro: código enviado"],
  ["registro-codigo-incorrecto", "registro", "Registro: código incorrecto"],
  ["inicio-personal", "inicios", "Inicio personal, sin aviso"],
  ["inicio-org", "inicios", "Inicio de la organización"],
  ["perfiles-personal", "inicios", "Inicio personal con el menú de perfiles abierto (en el teléfono, «Más»)"],
  ["perfiles-org", "inicios", "Inicio de la organización con el menú de perfiles abierto (en el teléfono, «Más»)"],
  ["error-org-403", "errores", "Sin permiso (403)"],
  ["error-org-404", "errores", "Página no encontrada (404)"],
  ["perfil-suspendido", "errores", "Organización suspendida"],
  ["perfil-espera", "errores", "Organización en espera de aprobación"],
  ["perfil-cerrado", "errores", "Organización cerrada"],
  ["sesion-iniciando", "sesion", "Iniciando sesión"],
  ["sesion-grupo-delta", "sesion", "Cambiando de lado: a Grupo Delta"],
  ["sesion-personal", "sesion", "Cambiando de lado: a Personal"],
  ["sesion-cerrando", "sesion", "Cerrando sesión"],
  ["sesion-error", "sesion", "No pudimos iniciar tu sesión"],
];

// Etapa 3c: aceptar una invitación (los tableros ya son los vigentes). Los correos no son pantallas y quedan afuera.
// Cada estado espera su encabezado, como capturar-etapa-3c; carga, envío y error son estados transitorios de la app.
const invitation = "Te sumás a Empresa E2E";
const accept = { type: "click", role: "button", name: "Aceptar invitación" };
const stage3c = [
  ["sin-cuenta", "Invitación: sin cuenta", { readyHeading: invitation }],
  ["cuenta-sin-sesion", "Invitación: con cuenta y sin sesión", { readyHeading: invitation }],
  ["sesion-propia", "Invitación: con la sesión de la misma persona", { readyHeading: invitation }],
  ["sesion-ajena", "Invitación: con la sesión de otra persona", { readyHeading: invitation }],
  ["vencida", "Invitación vencida", { readyHeading: "Esta invitación venció" }],
  ["ya-no-sirve", "Invitación que ya no sirve", { readyHeading: "Esta invitación ya no sirve" }],
  ["organizacion-suspendida", "Invitación a una organización suspendida", { readyHeading: "Empresa E2E no está disponible" }],
  ["aceptada-sin-metodo-personal", "Invitación aceptada: solo con el correo de la empresa", { readyHeading: "Te sumaste a Empresa E2E" }],
];

// R3d · Ingreso y registro: lo que muestra la invitación mientras se carga, mientras se acepta y si falla al aceptar.
// Desde v106 el lienzo los dibuja («Sin cuenta: cargando», «aceptando» y «error al aceptar»); antes se comparaban con
// «Sin cuenta». Los datos y los pasos de la app siguen siendo los de la etapa 3c.
const invitationV106 = [
  ["carga", "Invitación: cargando", "Sin cuenta: cargando", { hang: "/api/auth/external/google/antiforgery", readySelector: '[role="status"]' }],
  ["envio", "Invitación: aceptando", "Sin cuenta: aceptando", { hang: "/api/invitations/accept", readyHeading: invitation, actions: [accept], readyText: "Aceptando…" }],
  ["error", "Invitación: error al aceptar", "Sin cuenta: error al aceptar", { readyHeading: invitation, actions: [accept], readyText: "Algo salió mal. Probá de nuevo en un rato." }],
];

function invitationV106Cases(root) {
  return invitationV106.flatMap(([pair, state, estado, app]) => pairCases(root, { stage: "etapa-3c", pair, id: `invitacion-${pair}`, group: "invitacion", state,
    desktop: { props: { estado } }, phone: { props: { estado } }, app: { userFixture: "visual-personal", ...app }, phoneApp: { userFixture: "visual-personal", ...app } }));
}

// Etapa 3b (el lienzo vigente ya no tiene los estados que inyectaba): aceptar términos, ingreso con la baja pedida y el aviso del inicio.
const checkTerms = { boardActions: [click("label.chk input")] };
const stage3b = [
  ["aceptar-ambos-sin-marcar", "terminos", "Aceptar términos: cambiaron los dos, sin marcar", {}],
  ["aceptar-ambos-marcado", "terminos", "Aceptar términos: cambiaron los dos, con la casilla marcada", checkTerms],
  ["aceptar-terminos-sin-marcar", "terminos", "Aceptar términos: cambiaron los términos, sin marcar", {}],
  ["aceptar-terminos-marcado", "terminos", "Aceptar términos: cambiaron los términos, con la casilla marcada", checkTerms],
  ["aceptar-privacidad-sin-marcar", "terminos", "Aceptar términos: cambió la privacidad, sin marcar", {}],
  ["aceptar-privacidad-marcado", "terminos", "Aceptar términos: cambió la privacidad, con la casilla marcada", checkTerms],
  ["ingreso-baja-persona", "ingreso", "Ingreso de persona con la baja de la cuenta pedida", {}],
  ["ingreso-baja-empresa", "ingreso", "Ingreso de empresa con la baja de la cuenta pedida", {}],
  ["inicio-aviso-personal", "inicios", "Inicio personal con el aviso «Agregá un correo personal»", { props: {} }],
];

// Mi cuenta: el estado base y los diálogos son de la etapa 4; el teléfono ya tiene su hoja en el lienzo (M-Cuenta-*).
const stage4Account = [
  ["cuenta", "cuenta", "Mi cuenta", {}],
  ["agregar-correo", "cuenta", "Mi cuenta: agregar correo o teléfono (el primer paso, el correo)", { board: "M-Cuenta-Agregar" }],
  ["verificar-correo", "cuenta", "Mi cuenta: verificar un correo o teléfono sin verificar", { board: "M-Cuenta-Verificar" }],
  ["baja-cuenta", "cuenta", "Mi cuenta: dar de baja", { board: "M-Cuenta-Baja" }],
];

// Roles: etapa 4 (las cuatro formas del editor); la lista y la edición de Recursos humanos de la etapa 6 son los mismos estados.
// Desde v107, M-Rol dibuja las cuatro: el teléfono se compara con la suya (tanda 6a).
const stage4Roles = [
  ["rol-crear", "roles", "Rol: crear un rol", "Crear un rol"],
  ["rol-recursos-humanos", "roles", "Rol: editar Recursos humanos (de la organización)", "Editar el rol Recursos humanos"],
  ["rol-solo-lectura", "roles", "Rol: editar Solo lectura (de una empresa)", "Editar el rol Solo lectura"],
  ["rol-dueno", "roles", "Rol: ver el rol Dueño (de sistema)", "Ver el rol Dueño"],
];

// Etapa 6: Organización. Cada teléfono se compara con su `M-*` del lienzo vigente (la etapa 6 usaba el de la compu donde no había).
const stage6 = [
  ["registro-empresa", "registro", "Registro de empresa: «Tu organización» (después de ingresar con Google)", {}],
  ["usuarios-lista", "usuarios", "Usuarios: la lista", {}],
  ["usuarios-invitar", "usuarios", "Usuarios: el diálogo para invitar", {}],
  ["usuario-activo", "usuarios", "Usuario: la ficha de una persona activa", {}],
  // Desde v106, el lienzo dibuja las hojas del teléfono de Usuario y de Empresa (R3b).
  ["usuario-roles-empresa", "usuarios", "Usuario: cambiar los roles en una empresa", { props: { estado: "Roles en una empresa" } }],
  ["roles-lista", "roles", "Roles y permisos: la lista", {}],
  ["empresas-lista", "empresas", "Empresas: la lista", {}],
  ["empresas-crear", "empresas", "Empresas: crear una empresa", { props: { estado: "Crear empresa" } }],
  ["empresa-miembros", "empresas", "Empresa: la ficha, pestaña Miembros", {}],
  ["empresa-roles", "empresas", "Empresa: la ficha, pestaña Roles", { state: "Empresa en el teléfono: pestaña Roles (el tablero dibuja una sola pestaña)" }],
  ["empresa-editar", "empresas", "Empresa: editar los datos", { props: { estado: "Editar empresa" } }],
  ["configuracion-verificada", "configuracion", "Configuración: dominio verificado", {}],
  ["configuracion-pendiente", "configuracion", "Configuración: dominio pendiente de verificar",
    { board: "M-Configuracion", props: {}, state: "Configuración en el teléfono: dominio pendiente (el tablero dibuja solo el verificado)" }],
  ["configuracion-agregar-dominio", "configuracion", "Configuración: agregar un dominio", { board: "M-Configuracion-Dominio", props: {} }],
  ["configuracion-quitar-dominio", "configuracion", "Configuración: quitar un dominio", { board: "M-Configuracion-Quitar", props: {} }],
  ["pagina-publica-publicada", "pagina-publica", "Página pública: publicada", { board: "M-Pagina-Org", props: {} }],
  ["pagina-publica-borrador", "pagina-publica", "Página pública: borrador",
    { board: "M-Pagina-Org", props: {}, state: "Página pública en el teléfono: borrador (el tablero dibuja un solo estado)" }],
  ["pagina-publica-bloqueada", "pagina-publica", "Página pública: despublicada por la plataforma, con el motivo",
    { board: "M-Pagina-Org", props: {}, boardActions: [], state: "Página pública en el teléfono: despublicada por la plataforma (el tablero dibuja un solo estado)" }],
  ["auditoria-lista", "auditoria", "Auditoría: la lista", {}],
  ["error-organizacion", "errores", "Organización: sin permiso (403) dentro de /org", { board: "M-Error-Org", props: { caso: "Sin permiso (403)" } }],
  ["aviso-guardado", "avisos", "Aviso «Guardamos los cambios» después de guardar la configuración", { board: "M-Avisos", props: { caso: "Guardado" } }],
];

// Consolidación F7: los estados con cambios sin guardar, el 409 y los errores de guardado (ya tienen sus tableros vigentes).
// El tercer dato cambia el tablero del teléfono: desde v106 el lienzo dibuja esos estados en su `M-*` (R3b).
const stageF7 = [
  ["configuracion-cambios-sin-guardar", "configuracion"],
  ["configuracion-salir-sin-guardar", "configuracion"],
  ["configuracion-otra-persona-cambio", "configuracion"],
  ["pagina-publica-cambios-sin-guardar", "pagina-publica"],
  ["pagina-publica-error-al-guardar", "pagina-publica"],
  ["pagina-publica-salir-sin-guardar", "pagina-publica"],
  ["usuario-salir-sin-guardar", "usuarios"],
  ["usuario-error-al-guardar", "usuarios", { props: { estado: "Error al guardar" }, state: "Ficha de Usuario en el teléfono: el error al guardar, con el texto del back, en la banda debajo de la barra (M-Usuario, v106)" }],
  ["usuario-dialogo-error", "usuarios", { props: { estado: "Otra persona cambió esto" }, state: "Ficha de Usuario en el teléfono: el 409 de «Sumar empresa» en la franja de la hoja, arriba de los botones" }],
  ["usuario-sumar-empresa", "usuarios"],
  ["empresa-roles-error", "empresas", { props: { estado: "Roles de un miembro: error" }, state: "Ficha de Empresa en el teléfono: la hoja de roles, desde abajo, con su franja" }],
  ["empresas-dialogo-error", "empresas", { props: { estado: "Crear empresa: ya hay una con ese CUIT" }, state: "Empresas en el teléfono: la hoja de crear, desde abajo, con su franja" }],
  ["sesion-error-api-me", "errores"],
];

/// Un estado que ningún generador de etapa tiene todavía: el tablero y la app se definen acá, a 1440 y a 390.
function custom({ id, group, state, desktop: onDesktop, phone: onPhone, app, phoneApp = app }) {
  return [["escritorio", desktop, onDesktop, app], ["movil", phone, onPhone, phoneApp]].map(([suffix, viewport, board, appConfig]) => ({
    id: `${id}-${suffix}`, pair: id, group, state: board.state ?? state, board: board.board, props: board.props ?? {}, boardActions: board.boardActions ?? [],
    ...(board.section ? { section: board.section } : {}), viewport, app: appConfig,
  }));
}

const api = (method, apiPath, body, status = 200, query) => ({ method, path: apiPath, body, status, ...(query ? { query } : {}) });
const appClick = (role, name, extra = {}) => ({ type: "click", role, name, ...extra });
const dialog = { readySelector: '[role="dialog"]' };

// Las descripciones de los roles del lienzo (tablero Usuario): las de Dueño y Administrador las da el back (roles de
// sistema); las demás son las que la organización escribió al crear el rol.
const roleDescriptions = new Map([
  ["Dueño", "Tiene todos los permisos de la organización."], ["Recursos humanos", "Invita, edita y deshabilita usuarios."],
  ["Auditor", "Ve los usuarios y la auditoría. No cambia nada."], ["Administrador", "Administra la empresa: sus miembros y sus roles."],
  ["Solo lectura", "Ve los miembros de la empresa. No cambia nada."],
]);
const withRoleDescriptions = (app) => ({ ...app, responses: app.responses.map((item) => item.path.endsWith("/roles/paged")
  ? { ...item, body: { ...item.body, items: item.body.items.map((role) => ({ ...role, description: roleDescriptions.get(role.name) ?? role.description })) } }
  : item) });

// Registro de empresa: los seis estados del tablero que la app ya tiene (el de «Tu organización» es de la etapa 6).
const signupEmail = "mariana.lopez@gmail.com";
const slugAvailable = api("GET", "/api/public-site/slug-availability", { slug: "omega", availability: "Available" });
const createdOrganization = (requiresApproval) => api("POST", "/api/auth/business-signup", {
  tenantId: "11111111-1111-4111-8111-111111111111", organizationName: "Grupo Omega", slug: "omega", requiresApproval,
  firstCompanyId: "22222222-2222-4222-8222-222222222222", status: requiresApproval ? "PendingApproval" : "Active", notificationEmail: signupEmail,
}, 201);
const createOrganization = [
  appFill("Nombre de la organización", "Grupo Omega"), appFill("Dirección de tu página", "omega"), appFill("Primera empresa", "Omega S.A."),
  appClick("button", "Crear organización", { waitFor: "Disponible" }),
];

function signupCases(root) {
  const afterGoogle = stageCases(root, "etapa-6").find((entry) => entry.pair === "registro-empresa" && entry.viewport.width === 1440).app;
  const estado = (value) => ({ board: "Registro-Empresa", props: { estado: value } });
  const estadoPhone = (value) => ({ board: "M-Registro-Empresa", props: { estado: value } });
  const withGoogle = (responses, actions, ready) => ({ ...afterGoogle, responses: [...afterGoogle.responses, slugAvailable, ...responses], actions, ...ready });
  return [
    ...custom({ id: "registro-empresa-correo", group: "registro", state: "Registro de empresa: pide el correo", desktop: estado("Correo"), phone: estadoPhone("Correo"),
      app: { path: "/registro/empresa", readySelector: "h1" } }),
    ...custom({ id: "registro-empresa-codigo", group: "registro", state: "Registro de empresa: código enviado", desktop: estado("Código enviado"), phone: estadoPhone("Código enviado"),
      app: { path: "/registro/empresa", readySelector: "h1", readyText: "Revisá tu correo", responses: [api("POST", "/api/auth/business-signup/code", { resendAfterSeconds: 60 }, 202)],
        actions: [appFill("Tu correo electrónico", signupEmail), appClick("checkbox", "Acepto los"), appClick("button", "Continuar")] } }),
    ...custom({ id: "registro-empresa-limite", group: "registro", state: "Registro de empresa: llegó al límite de organizaciones propias", desktop: estado("Llegó al límite"), phone: estadoPhone("Llegó al límite"),
      app: withGoogle([api("POST", "/api/auth/business-signup", { code: "Tenancy.Organization.LimitReached", limit: 3 }, 409)], createOrganization, { readyText: "Llegaste al límite" }) }),
    ...custom({ id: "registro-empresa-lista", group: "registro", state: "Registro de empresa: la organización está lista", desktop: estado("Lista"), phone: estadoPhone("Lista"),
      app: withGoogle([createdOrganization(false)], createOrganization, { readyText: "está lista" }) }),
    ...custom({ id: "registro-empresa-espera", group: "registro", state: "Registro de empresa: espera la aprobación", desktop: estado("Espera aprobación"), phone: estadoPhone("Espera aprobación"),
      app: withGoogle([createdOrganization(true)], createOrganization, { readyText: "Recibimos el pedido" }) }),
    ...custom({ id: "registro-empresa-cerrada", group: "registro", state: "Registro de empresa: el alta está cerrada", desktop: estado("Alta cerrada"), phone: estadoPhone("Alta cerrada"),
      app: { path: "/registro/empresa?error=Auth.BusinessSignup.Closed", readyText: "Por ahora no se pueden registrar empresas" } }),
  ];
}

// Otros estados de pantallas que ya existen y que el lienzo dibuja.
function extraCases(root) {
  const homeOf = (width) => stageCases(root, "etapa-3a").find((entry) => entry.pair === "inicio-org" && entry.viewport.width === width).app;
  const withoutPending = (app) => ({ ...app, responses: app.responses.map((item) => item.path === "/api/home" ? { ...item, body: { ...item.body, pending: [] } } : item) });
  const openStatus = { boardActions: [click('button.ct[aria-label="Estado"]')] };
  const openRoles = { boardActions: [click('button.ct[aria-label="Roles de la organización"]')] };
  const usuarioActivo = (width) => stageCases(root, "etapa-6").find((entry) => entry.pair === "usuario-activo" && entry.viewport.width === width).app;
  return [
    ...pairCases(root, { stage: "etapa-3a", pair: "inicio-org", id: "inicio-org-sin-pendientes", group: "inicios", state: "Inicio de la organización: nada para resolver",
      desktop: { props: { pendientes: "Nada para resolver" } }, app: withoutPending(homeOf(1440)), phoneApp: withoutPending(homeOf(390)) }),
    ...custom({ id: "inicio-miembro", group: "inicios", state: "Inicio de una persona con roles solo en una empresa («Tus empresas»)",
      desktop: { board: "Inicio-Miembro", props: { rol: "Solo lectura" } },
      phone: { board: "M-Inicio-Miembro", props: { rol: "Solo lectura" }, state: "Inicio de una persona con roles solo en una empresa, en el teléfono: la billetera con «Tus empresas» (v106)" },
      app: { path: "/src/test/visualApp.html?as=visual-error-org&route=%2Forg", captureMode: "harness", userFixture: "visual-error-org", readyText: "Tus empresas",
        responses: [api("GET", "/api/home", { organization: null, companies: [{ companyId: "33333333-3333-4333-8333-333333333333", name: "Delta Norte S.A.", roles: ["Solo lectura"], memberCount: 3 }], pending: [] })] } }),
    ...pairCases(root, { stage: "etapa-6", pair: "configuracion-pendiente", id: "configuracion-verificar-dominio", group: "configuracion", state: "Configuración: verificar el dominio (el registro TXT)",
      desktop: { board: "Configuracion-Verificar", props: {} }, phone: { board: "M-Configuracion-Verificar", props: {} },
      app: { actions: [appClick("button", "Verificar")], ...dialog }, phoneApp: { actions: [appClick("button", "Verificar")], ...dialog } }),
    ...pairCases(root, { stage: "etapa-6", pair: "usuario-activo", id: "usuario-elegir-estado", group: "usuarios", state: "Usuario: elegir el estado (activo o deshabilitado)",
      desktop: { ...openStatus }, phone: { props: { estado: "Elegir el estado" } },
      app: { actions: [appClick("combobox", "Estado")], readySelector: '[role="listbox"]' }, phoneApp: { actions: [appClick("button", "Estado")], ...dialog } }),
    ...pairCases(root, { stage: "etapa-6", pair: "usuario-activo", id: "usuario-elegir-roles", group: "usuarios", state: "Usuario: elegir los roles de la organización",
      desktop: { ...openRoles }, phone: { props: { estado: "Elegir los roles" } },
      app: withRoleDescriptions({ ...usuarioActivo(1440), actions: [appClick("button", "Roles de la organización")], readySelector: '[role="menu"]' }),
      phoneApp: withRoleDescriptions({ ...usuarioActivo(390), actions: [appClick("button", "Roles de la organización")], ...dialog }) }),
    ...alignmentCases(root),
    ...dialogCases(root),
    ...errorsAndButtonsCases(root),
  ];
}

// «Agregar miembro» pide además todos los miembros de la empresa (de a 100) para no ofrecer a quien ya está, y las
// personas de la organización: las que no están en la empresa son las del tablero Empresa (Julieta, Carolina y Sofía).
function addMemberResponses(root, width) {
  const { responses } = stageCases(root, "etapa-6").find((entry) => entry.pair === "empresa-miembros" && entry.viewport.width === width).app;
  const members = responses.find((item) => item.path === "/api/companies/company-1/members/paged");
  const users = responses.find((item) => item.path === "/api/users/paged");
  const [template] = users.body.items;
  const candidate = (id, displayName, email) => ({ ...template, memberId: `member-${id}`, userId: `user-${id}`, displayName, email, roles: [], companies: [] });
  const candidates = [candidate("julieta", "Julieta Sosa", "julieta.sosa@delta.ejemplo.com"), candidate("carolina", "Carolina Vega", "carolina.vega@delta.ejemplo.com"),
    candidate("sofia", "Sofía Herrera", "sofia.herrera@delta.ejemplo.com")];
  return [{ ...members, query: { page: "1", pageSize: "100" } }, { ...users, body: { ...users.body, items: candidates, totalCount: candidates.length } }, ...responses];
}

// Alineación R2c (errores, botones y tests): el 404 de una ficha, los errores arriba de los botones, los botones que ya
// no se apagan (el campo dice qué falta) y los diálogos con el ancho y el cuerpo de la pieza.
function errorsAndButtonsCases(root) {
  const stageApp = (stage, pair, width) => stageCases(root, stage).find((entry) => entry.pair === pair && entry.viewport.width === width).app;
  const fieldError = { readySelector: '[role="dialog"] [role="alert"]' };
  const notFound = { path: "/src/test/visualApp.html?as=visual-owner&route=%2Forg%2Fusuarios%2Fmember-1", captureMode: "harness", userFixture: "visual-owner",
    readySelector: "main", readyText: "No encontramos esta página",
    responses: [api("GET", "/api/users/member-1", { status: 404, code: "Tenancy.Member.NotFound", title: "No encontrado", detail: "No encontramos a esa persona." }, 404)] };
  const inviteFails = (width) => ({ ...stageApp("etapa-6", "usuarios-invitar", width), ...fieldError,
    responses: [api("POST", "/api/users/invitations", { status: 409, code: "Users.Invitation.UserInactive", title: "Conflicto",
      detail: "Esa persona tiene el acceso deshabilitado. Habilitala en vez de invitarla." }, 409), ...stageApp("etapa-6", "usuarios-invitar", width).responses],
    actions: [appClick("button", "Invitar usuario"), appFill("Correo", "marcos.diaz@delta.ejemplo.com"), appClick("button", "Invitar")] });
  const addWithoutCompany = { actions: [appClick("button", "Sumar empresa"), appClick("button", "Sumar")], ...fieldError };
  const addMemberApp = (width) => ({ responses: addMemberResponses(root, width),
    actions: [appClick("button", "Agregar miembro"), appClick("button", "Agregar miembro")], ...fieldError });
  const wrongCuit = { actions: [appClick("button", "Crear empresa"), appFill("Nombre", "Delta Oeste S.A."), appFill("CUIT", "3071234567"),
    appClick("button", "Crear empresa")], ...fieldError };
  const emptyDomain = { actions: [appClick("button", "Agregar dominio"), appClick("button", "Siguiente")], ...fieldError };
  const auditDetail = { actions: [appClick("button", "Ver el detalle de Cambió los roles de Tomás Acosta")], ...dialog };
  // En el teléfono, la fila entera abre el detalle: se nombra con lo que pasó.
  const auditDetailPhone = { actions: [appClick("button", "Cambió los roles de Tomás Acosta")], ...dialog };
  const preview = { actions: [appClick("button", "Vista previa")], ...dialog };
  return [
    ...custom({ id: "usuario-no-existe", group: "errores", state: "Ficha de Usuario de alguien que no existe (404): «No encontramos esta página» con «Ir al inicio»",
      desktop: { board: "Error-Org", props: { caso: "No encontrada (404)" } }, phone: { board: "M-Error-Org", props: { caso: "No encontrada (404)" } },
      app: notFound }),
    ...custom({ id: "usuarios-invitar-error", group: "usuarios", state: "«Invitar usuario»: el error, en la franja arriba de los botones (el tablero no dibuja el error)",
      desktop: { board: "Usuarios", boardActions: [click("button.b-pri")] }, phone: { board: "M-Usuarios-Invitar" },
      app: inviteFails(1440), phoneApp: inviteFails(390) }),
    ...pairCases(root, { stage: "consolidacion/f7", pair: "usuario-sumar-empresa", id: "usuario-sumar-empresa-sin-empresa", group: "usuarios",
      state: "«Sumar empresa»: «Sumar» sin empresa marca el campo con «Elegí una empresa.»",
      desktop: { boardActions: [click("button.cb-sec.ch"), click("text=Sumar")] },
      phone: { state: "«Sumar empresa» en el teléfono: «Sumar» sin empresa marca el campo (el tablero no dibuja el error)" },
      app: addWithoutCompany, phoneApp: addWithoutCompany }),
    ...pairCases(root, { stage: "etapa-6", pair: "empresa-miembros", id: "empresa-agregar-miembro-sin-usuario", group: "empresas",
      state: "«Agregar miembro» sin usuario marca el campo con «Elegí un usuario.»",
      desktop: { boardActions: [click("text=Agregar miembro"), click("text=Agregar miembro")] },
      phone: { state: "Empresa en el teléfono: «Agregar miembro» sin usuario (el tablero no dibuja esa hoja)" },
      app: addMemberApp(1440), phoneApp: addMemberApp(390) }),
    ...pairCases(root, { stage: "etapa-6", pair: "empresas-crear", id: "empresas-crear-cuit-mal", group: "empresas",
      state: "«Crear empresa» con el CUIT mal: el botón sigue activo y el campo dice qué corregir",
      desktop: { boardActions: [click("button.b-pri"), fill("Nombre", "Delta Oeste S.A."), fill("CUIT", "3071234567"), click(".dlg-f button.b-pri")] },
      phone: { state: "«Crear empresa» en el teléfono con el CUIT mal (el tablero no dibuja esa hoja)" },
      app: wrongCuit, phoneApp: wrongCuit }),
    ...pairCases(root, { stage: "etapa-6", pair: "configuracion-agregar-dominio", id: "configuracion-agregar-dominio-vacio", group: "configuracion",
      state: "«Agregar dominio»: «Siguiente» sin dominio marca el campo con «Escribí el dominio.» (el tablero no dibuja el error)",
      phone: { board: "M-Configuracion-Dominio", props: {} },
      app: emptyDomain, phoneApp: emptyDomain }),
    ...pairCases(root, { stage: "etapa-6", pair: "auditoria-lista", id: "auditoria-detalle", group: "auditoria",
      state: "Auditoría: el detalle de un movimiento, en el diálogo normal de 560",
      // El mismo movimiento que la app («Roles en la empresa: Sin roles → Solo lectura»): desde v107 no es la primera fila.
      desktop: { boardActions: [click('button.o-link:has-text("Cambió los roles de Tomás Acosta")')] },
      phone: { state: "Auditoría en el teléfono: el detalle de un movimiento (el tablero no dibuja esa hoja)" },
      app: auditDetail, phoneApp: auditDetailPhone }),
    ...pairCases(root, { stage: "etapa-6", pair: "pagina-publica-borrador", id: "pagina-publica-vista-previa", group: "pagina-publica",
      state: "Página pública: la vista previa, en el diálogo normal de 560 (el tablero no dibuja la vista previa)",
      phone: { board: "M-Pagina-Org", props: {} },
      app: preview, phoneApp: preview }),
  ];
}

// Alineación R2b (diálogos, hojas y campos): los diálogos de Empresa sin error y el desplegable con buscador, que en el
// teléfono es una hoja (SearchSelect).
function dialogCases(root) {
  const openRolesBoard = [click('button[aria-label="Acciones de Lucía Fernández"]'), click('[role="menu"] button[role="menuitem"]')];
  const openRolesApp = { actions: [appClick("button", "Acciones para Lucía Fernández"), appClick("menuitem", "Cambiar roles")], ...dialog };
  const addMemberApp = (width) => ({ responses: addMemberResponses(root, width), actions: [appClick("button", "Agregar miembro")], ...dialog });
  const timeZone = { board: "Cuenta-Agregar", props: { estado: "WhatsApp: elegir el país" } };
  // «Sumar empresa» con la empresa elegida: recién ahí aparece «Roles en la empresa» (v100). El tablero del teléfono
  // (M-Usuario-Empresa) ya la dibuja elegida.
  const pickCompanyBoard = [click("button.cb-sec.ch"), click('button.ct[aria-label="Empresa"]'), click('.o-lst[aria-label="Empresa"] button[role="option"]')];
  const pickCompanyApp = { actions: [appClick("button", "Sumar empresa"), appClick("combobox", "Empresa"), appClick("option", "Beta S.R.L.")], ...dialog };
  return [
    ...pairCases(root, { stage: "consolidacion/f7", pair: "usuario-sumar-empresa", id: "usuario-sumar-empresa-elegida", group: "usuarios",
      state: "Ficha de Usuario: «Sumar empresa» con la empresa elegida, y «Roles en la empresa», opcional",
      desktop: { boardActions: pickCompanyBoard }, app: pickCompanyApp, phoneApp: pickCompanyApp }),
    ...pairCases(root, { stage: "consolidacion/f7", pair: "empresa-roles-error", id: "empresa-roles-dialogo", group: "empresas",
      state: "Empresa: «Roles de …», el diálogo chico sin bajada",
      desktop: { boardActions: openRolesBoard },
      phone: { props: { estado: "Roles de un miembro: error" }, state: "Empresa en el teléfono: la hoja «Roles de …», desde abajo (v106 la dibuja con el error del back)" },
      app: openRolesApp, phoneApp: openRolesApp }),
    ...pairCases(root, { stage: "etapa-6", pair: "empresa-miembros", id: "empresa-agregar-miembro", group: "empresas",
      state: "Empresa: «Agregar miembro», el diálogo chico sin bajada",
      desktop: { boardActions: [click("text=Agregar miembro")] }, phone: { state: "Empresa en el teléfono: la hoja «Agregar miembro» (el tablero no dibuja esa hoja)" },
      app: addMemberApp(1440), phoneApp: addMemberApp(390) }),
    ...pairCases(root, { stage: "etapa-4", pair: "cuenta", id: "cuenta-zona-horaria", group: "cuenta",
      state: "Mi cuenta: elegir la zona horaria, el desplegable con buscador (el tablero más cercano es la lista de países de «Agregar»)",
      desktop: timeZone, phone: { ...timeZone, board: "M-Cuenta-Agregar" },
      app: { actions: [appClick("combobox", "Zona horaria")], readySelector: '[role="listbox"]' },
      phoneApp: { actions: [appClick("combobox", "Zona horaria")], ...dialog } }),
  ];
}

// Alineación R2a (avisos y errores): estados que la app ya tiene y ningún generador capturaba.
function alignmentCases(root) {
  // La ficha de Lucía, que es quien mira (F7, «usuario-error-al-guardar»): quitarse de la organización siendo la última
  // Dueña falla, y la franja de la ficha lo dice, como el tablero Usuario («Lucía (vos)»), no el aviso de abajo (R2c).
  const luciaApp = (width) => stageCases(root, "consolidacion/f7").find((entry) => entry.pair === "usuario-error-al-guardar" && entry.viewport.width === width).app;
  const leaving = (app) => ({ ...app, readySelector: 'main [role="alert"]', readyText: "antes de salir de la organización",
    responses: [...app.responses.filter((item) => item.method !== "PUT"), api("DELETE", "/api/users/member-lucia",
      { code: "Tenancy.Member.LastTenantAdmin", title: "Conflicto", detail: "Tiene que quedar al menos un Dueño activo." }, 409)],
    actions: [appClick("button", "Más acciones"), appClick("menuitem", "Quitar de la organización"), appClick("button", "Quitar")] });
  // Un error del servidor al guardar la Configuración: el aviso rojo de abajo, con «Copiar código» y ✕ (Avisos, «Error del
  // servidor»). Lo da el MutationCache: el arnés usa el QueryClient de la app.
  const settingsApp = (width) => stageCases(root, "consolidacion/f7").find((entry) => entry.pair === "configuracion-otra-persona-cambio" && entry.viewport.width === width).app;
  const serverError = (app) => ({ ...app, readySelector: "[data-sonner-toast]", readyText: "Algo salió mal",
    responses: [api("PUT", "/api/organization/settings", { status: 500, title: "Error", traceId: "00-r2c-01" }, 500),
      ...app.responses.filter((item) => item.method !== "PUT")] });
  const userFails = { path: "/src/test/visualApp.html?as=visual-owner&route=%2Forg%2Fusuarios%2Fmember-1", captureMode: "harness", userFixture: "visual-owner",
    readySelector: '[role="alert"]', readyText: "No pudimos abrir esta pantalla",
    responses: [api("GET", "/api/users/member-1", { status: 500, title: "Error", traceId: "00-r2a-02" }, 500)] };
  return [
    ...custom({ id: "aviso-error-servidor", group: "avisos", state: "Aviso rojo de un error del servidor al guardar la Configuración: abajo, con «Copiar código» y ✕",
      desktop: { board: "Avisos", props: { caso: "Error del servidor" } }, phone: { board: "M-Avisos", props: { caso: "Error del servidor" } },
      app: serverError(settingsApp(1440)), phoneApp: serverError(settingsApp(390)) }),
    ...custom({ id: "usuario-quitar-ultima-duena", group: "usuarios", state: "Ficha de Usuario: la última Dueña se quita de la organización y la franja le dice qué hacer",
      desktop: { board: "Usuario", props: { usuario: "Lucía (vos)" }, boardActions: [click('button[aria-label="Más acciones"]'), click("text=Quitar de la organización")] },
      phone: { board: "M-Usuario", state: "Ficha de Usuario en el teléfono: el error de «Quitar de la organización» en la franja (el tablero no dibuja el error)" },
      app: leaving(luciaApp(1440)), phoneApp: leaving(luciaApp(390)) }),
    ...custom({ id: "usuario-no-carga", group: "errores", state: "Ficha de Usuario que no carga: la «Pantalla de error» con «Reintentar»",
      desktop: { board: "Criterio-Avisos", section: "Cómo se ve cada uno", state: "Ficha de Usuario que no carga: la «Pantalla de error» (Criterio · Avisos › Pantalla de error)" },
      phone: { board: "M-Error-Org", props: { caso: "No se pudo abrir" } },
      app: userFails }),
  ];
}

// R3b · Fichas y hojas: los estados de v106 que ningún caso tenía. El inicio de quien administra su empresa (la billetera
// con su «Para resolver») y «Crear empresa» sin nombre, que el tablero Empresas marca al tocar el botón.
function r3bCases(root) {
  const home = (roles, pending) => ({ path: "/src/test/visualApp.html?as=visual-error-org&route=%2Forg", captureMode: "harness", userFixture: "visual-error-org",
    readyText: "Tus empresas", responses: [api("GET", "/api/home", { organization: null,
      companies: [{ companyId: "33333333-3333-4333-8333-333333333333", name: "Delta Norte S.A.", roles, memberCount: 3 }], pending })] });
  // B4: la invitación vencida de la empresa que administra trae la empresa (ADR 0040); «Desde», la fecha del tablero.
  const expired = { area: "users", kind: "invitationExpired", subject: "martin.paz@delta.ejemplo.com", urgent: false,
    sinceUtc: "2026-09-29T15:00:00Z", dueAtUtc: null, targetId: "member-martin",
    companyId: "33333333-3333-4333-8333-333333333333", companyName: "Delta Norte S.A." };
  const withoutName = { actions: [appClick("button", "Crear empresa"), appClick("button", "Crear empresa")], readySelector: '[role="dialog"] [role="alert"]' };
  return [
    ...custom({ id: "inicio-miembro-administra", group: "inicios", state: "Inicio de una persona que administra su empresa: «Tus empresas» y su «Para resolver»",
      desktop: { board: "Inicio-Miembro", props: { rol: "Administra su empresa" } }, phone: { board: "M-Inicio-Miembro", props: { rol: "Administra su empresa" } },
      app: home(["Administrador"], [expired]) }),
    ...pairCases(root, { stage: "etapa-6", pair: "empresas-crear", id: "empresas-crear-sin-nombre", group: "empresas",
      state: "«Crear empresa» sin nombre: el campo dice «Escribí el nombre de la empresa.», sin el aviso del navegador",
      desktop: { boardActions: [click("button.b-pri"), click(".dlg-f button.b-pri")] },
      phone: { props: { estado: "Crear empresa" }, state: "«Crear empresa» sin nombre, en el teléfono: la hoja desde abajo (el tablero no dibuja el error)" },
      app: withoutName, phoneApp: withoutName }),
  ];
}

// R3c · Contratos y auditoría: «Quién» con las personas, «Sistema» y «Plataforma» (tablero Auditoria-Org, v107). Los demás
// casos de R3c ya están en el catálogo (Auditoría y su detalle, Configuración y Empresa): cambian por los datos al día.
function r3cCases(root) {
  return pairCases(root, { stage: "etapa-6", pair: "auditoria-lista", id: "auditoria-filtro-quien", group: "auditoria",
    state: "Auditoría: «Quién» abierto, con las personas, «Sistema» y «Plataforma»",
    desktop: { boardActions: [click('button.pill-sel:has-text("Quién")')] },
    phone: { state: "Auditoría en el teléfono: la hoja de filtros, con «Quién» (el tablero no dibuja esa hoja)" },
    app: { actions: [appClick("button", "Quién: todos")], readySelector: '[role="menu"]' },
    // En el teléfono, «Quién» queda al final de la hoja: el foco en «Plataforma» la lleva hasta ahí.
    phoneApp: { actions: [appClick("button", "Filtros de auditoría"), { type: "press", role: "radio", name: "Plataforma", key: "Shift" }], ...dialog } });
}

// R3e · Piezas comunes: el estado «Guardando» de Button («Criterio · Botones», Estados) en una ficha, en el ingreso y en la
// invitación (que ya tenía su caso, «invitacion-envio»). Lo que se guarda o se manda queda sin respuesta.
function r3eCases(root) {
  const saving = (width) => {
    const app = stageCases(root, "consolidacion/f7").find((entry) => entry.pair === "usuario-error-al-guardar" && entry.viewport.width === width).app;
    return { ...app, responses: app.responses.filter((item) => item.method !== "PUT"), hang: { path: "/api/users/member-lucia", method: "PUT" },
      readySelector: "main", readyText: "Guardando…" };
  };
  const sending = { path: "/login?returnUrl=%2Fconnect%2Fauthorize", readySelector: "h1", readyText: "Enviando…", hang: { path: "/api/auth/login-code", method: "POST" },
    actions: [appFill("Correo electrónico", "lucia.fer@gmail.com"), appClick("button", "Enviar código")] };
  return [
    ...custom({ id: "usuario-guardando", group: "usuarios", state: "Ficha de Usuario mientras guarda: «Guardando…» con el aro, opacidad 0,85 y del mismo ancho",
      desktop: { board: "Criterio-Botones", section: "Estados", state: "Ficha de Usuario mientras guarda (Criterio · Botones › Estados: el tablero Usuario no dibuja el guardado)" },
      phone: { board: "M-Usuario", state: "Ficha de Usuario en el teléfono mientras guarda: el botón de abajo (el tablero no dibuja el guardado)" },
      app: saving(1440), phoneApp: saving(390) }),
    ...custom({ id: "ingreso-enviando", group: "ingreso", state: "Ingreso mientras manda el código: «Enviando…» con el aro (Criterio · Diálogos)",
      desktop: { board: "Ingreso", props: { estado: "Correo", puerta: "Persona" }, state: "Ingreso mientras manda el código (el tablero no dibuja el envío; el estado es el de Criterio · Botones)" },
      phone: { board: "M-Ingreso", props: { estado: "Correo", puerta: "Persona" }, state: "Ingreso en el teléfono mientras manda el código (el tablero no dibuja el envío)" },
      app: sending }),
  ];
}

// R3f · Vista previa de la Página pública y flecha del menú (lienzo v107): la vista previa, que el lienzo dibuja desde v107
// («Borrador: vista previa» de Pagina-Org y M-Pagina-Org). La flecha se ve en casos que ya están: en el menú, en
// «inicio-personal» (Personal), y en el panel de Administración, en «pagina-publica-borrador» (la organización).
function r3fCases(root) {
  const preview = { actions: [appClick("button", "Vista previa")], ...dialog };
  const board = { props: { estado: "Borrador: vista previa" } };
  return pairCases(root, { stage: "etapa-6", pair: "pagina-publica-borrador", id: "pagina-publica-vista-previa-tarjeta", group: "pagina-publica",
    state: "Página pública: la vista previa, con la tarjeta de la página pública en el diálogo de 640",
    desktop: { board: "Pagina-Org", ...board },
    phone: { board: "M-Pagina-Org", ...board, state: "Página pública en el teléfono: la vista previa, en la hoja desde abajo" },
    app: preview, phoneApp: preview });
}

// B6a · Roles como referencia (lienzo v107): el editor con un cambio sin guardar, «Crear rol» tocado sin datos («Criterio ·
// Botones»: no se apaga, cada campo dice qué falta) y la lista sin coincidencias. M-Rol y M-Roles no dibujan esos estados:
// el teléfono se compara con la forma del editor o con la lista.
function b6aCases(root) {
  const renamed = "Solo lectura y más";
  const rename = { actions: [appFill("Nombre", renamed)] };
  const emptyCreate = { actions: [appClick("button", "Crear rol")], readyText: "Escribí el nombre del rol." };
  const rolesList = (width) => stageCases(root, "etapa-6").find((entry) => entry.pair === "roles-lista" && entry.viewport.width === width).app;
  const noMatches = (width) => ({ ...rolesList(width), path: "/src/test/visualApp.html?as=visual-owner&route=%2Forg%2Froles%3Fsearch%3Dzzz",
    responses: [api("GET", "/api/roles/paged", { items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false }, 200, { search: "zzz" }), ...rolesList(width).responses],
    readyText: "Ningún rol coincide con los filtros" });
  return [
    ...pairCases(root, { stage: "etapa-4", pair: "rol-solo-lectura", id: "rol-cambios-sin-guardar", group: "roles",
      state: "Rol: Solo lectura con el nombre cambiado: «Cambios sin guardar» en la banda y «Guardar cambios» activo",
      desktop: { boardActions: [fill("Nombre", renamed)] },
      phone: { props: { estado: "Editar el rol Solo lectura" }, state: "Rol en el teléfono con el nombre cambiado (M-Rol no dibuja «Cambios sin guardar»)" },
      app: rename, phoneApp: rename }),
    ...pairCases(root, { stage: "etapa-4", pair: "rol-crear", id: "rol-crear-sin-datos", group: "roles",
      state: "Crear un rol: «Crear rol» tocado sin datos; cada campo dice qué falta",
      desktop: { boardActions: [fill("Nombre", " "), click("button.cb.cb-pri")], state: "Crear un rol: «Crear rol» tocado sin datos (el tablero apaga el botón con el formulario vacío; se escribe un espacio para tocarlo)" },
      phone: { props: { estado: "Crear un rol" }, state: "Crear un rol en el teléfono, tocado sin datos (M-Rol no dibuja los errores)" },
      app: emptyCreate, phoneApp: emptyCreate }),
    ...pairCases(root, { stage: "etapa-6", pair: "roles-lista", id: "roles-sin-coincidencias", group: "roles",
      state: "Roles y permisos: ningún rol coincide con la búsqueda, con «Limpiar filtros»",
      desktop: { boardActions: [{ type: "fill", selector: 'input[type="search"]', value: "zzz" }] },
      phone: { state: "Roles y permisos en el teléfono: ningún rol coincide (M-Roles no dibuja la lista vacía)" },
      app: noMatches(1440), phoneApp: noMatches(390) }),
  ];
}

// B6b · La ficha de Empresa, los estados y B4 (lienzo v107). La ficha como la abre quien administra solo su empresa (los
// tableros dibujan a la Dueña: sin «Editar empresa», el ⋮ ni la pestaña Roles, que piden permisos de la organización) y
// el filtro «Estado» abierto: el menú sin líneas entre opciones y con la elegida resaltada como el tablero.
function b6bCases(root) {
  const companyAdmin = { path: "/src/test/visualApp.html?as=visual-company-admin&route=%2Forg%2Fempresas%2Fcompany-1", userFixture: "visual-company-admin" };
  const stateFilter = { actions: [appClick("button", "Estado: todos")], readySelector: '[role="menu"]' };
  const openState = [click('button.pill-sel:has-text("Estado")')];
  return [
    ...pairCases(root, { stage: "etapa-6", pair: "empresa-miembros", id: "empresa-administrador", group: "empresas",
      state: "Empresa: la ficha como la abre su Administrador de empresa, sin roles de la organización (B4; el tablero dibuja a la Dueña, con «Editar empresa», el ⋮ y la pestaña Roles)",
      phone: { state: "Empresa en el teléfono como la abre su Administrador de empresa (B4; el tablero dibuja a la Dueña)" },
      app: companyAdmin, phoneApp: companyAdmin }),
    // M-Empresa no tiene filtros (FilterBar con phoneTools="none"): el teléfono muestra la ficha como su tablero.
    ...pairCases(root, { stage: "etapa-6", pair: "empresa-miembros", id: "empresa-filtro-estado", group: "empresas",
      state: "Empresa: el filtro «Estado» abierto, sin líneas entre opciones y con «Todos» resaltado",
      desktop: { boardActions: openState }, phone: { state: "Empresa en el teléfono: M-Empresa no tiene filtros; el menú del filtro es de la compu" },
      app: stateFilter }),
  ];
}

// Tanda 6c (los formularios como Roles): los diálogos de verificar de Mi cuenta (Cuenta-Verificar y M-Cuenta-Verificar,
// v107). Al agregar un correo, el título pasa a «Verificar tu correo» al pedir el código; el código incorrecto va debajo
// de los casilleros, en rojo, y no en una franja.
function b6cCases(root) {
  const stageApp = (pair, width) => stageCases(root, "etapa-4").find((entry) => entry.pair === pair && entry.viewport.width === width).app;
  const sentCode = (width) => ({
    responses: [...stageApp("agregar-correo", width).responses, api("POST", "/api/me/login-methods", { methodId: "nuevo", resendAfterSeconds: 60 }, 202)],
    actions: [...stageApp("agregar-correo", width).actions, appFill("Correo", "lucia.trabajo@gmail.com"), appClick("button", "Enviar código")],
    readySelector: undefined, readyText: "Te mandamos un código a lucia.trabajo@gmail.com.",
  });
  const wrongCode = (width) => ({
    responses: [...stageApp("verificar-correo", width).responses,
      api("POST", "/api/me/login-methods/4/verify", { status: 400, code: "Auth.LoginCode.Invalid", title: "Código", detail: "El código no es válido." }, 400)],
    actions: [appClick("button", "Verificar"), { type: "otp", value: "482910" }, appClick("button", "Verificar")],
    readySelector: '[role="dialog"] [role="alert"]',
  });
  const wrongCodeBoard = { props: { estado: "Correo: código incorrecto" } };
  return [
    ...pairCases(root, { stage: "etapa-4", pair: "agregar-correo", id: "agregar-correo-codigo", group: "cuenta",
      state: "Mi cuenta: al agregar un correo, después de «Enviar código» el diálogo dice «Verificar tu correo»",
      desktop: { board: "Cuenta-Verificar", props: {} }, phone: { board: "M-Cuenta-Verificar", props: {} },
      app: sentCode(1440), phoneApp: sentCode(390) }),
    ...pairCases(root, { stage: "etapa-4", pair: "verificar-correo", id: "verificar-correo-codigo-incorrecto", group: "cuenta",
      state: "Mi cuenta: el código incorrecto, debajo de los casilleros y en rojo",
      desktop: { board: "Cuenta-Verificar", ...wrongCodeBoard }, phone: { board: "M-Cuenta-Verificar", ...wrongCodeBoard },
      app: wrongCode(1440), phoneApp: wrongCode(390) }),
  ];
}

export function catalog(root) {
  const rename ={ board: "Cuenta", boardActions: [fill("Nombre y apellido", "Lucía Fernández Pérez")] };
  const renamePhone = { board: "M-Cuenta", boardActions: [], state: "Mi cuenta en el teléfono con el nombre cambiado (el tablero no dibuja «Cambios sin guardar»)" };
  const renameApp = { actions: [appFill("Nombre y apellido", "Lucía Fernández Pérez")] };
  return [
    ...stage3a.flatMap(([pair, group, state]) => pairCases(root, { stage: "etapa-3a", pair, group, state })),
    ...stage3c.flatMap(([pair, state, app]) => pairCases(root, { stage: "etapa-3c", pair, id: `invitacion-${pair}`, group: "invitacion", state, app: { userFixture: "visual-personal", ...app }, phoneApp: { userFixture: "visual-personal", ...app } })),
    ...invitationV106Cases(root),
    ...stage3b.flatMap(([pair, group, state, board]) => pairCases(root, { stage: "etapa-3b", pair, group, state, desktop: board, phone: board, app: { userFixture: "visual-personal" }, phoneApp: { userFixture: "visual-personal" } })),
    ...stage4Account.flatMap(([pair, group, state, onPhone]) => pairCases(root, { stage: "etapa-4", pair, group, state, phone: onPhone })),
    ...pairCases(root, { stage: "etapa-4", pair: "cuenta", id: "cuenta-cambios-sin-guardar", group: "cuenta", state: "Mi cuenta con el nombre cambiado: «Cambios sin guardar»",
      desktop: rename, phone: renamePhone, app: renameApp, phoneApp: renameApp }),
    ...stage4Roles.flatMap(([pair, group, state, estado]) => pairCases(root, { stage: "etapa-4", pair, group, state, phone: { props: { estado } } })),
    ...stage6.flatMap(([pair, group, state, onPhone]) => pairCases(root, { stage: "etapa-6", pair, group, state, phone: onPhone })),
    ...stageF7.flatMap(([pair, group, onPhone]) => pairCases(root, { stage: "consolidacion/f7", pair, group, phone: onPhone })),
    ...signupCases(root),
    ...extraCases(root),
    ...r3bCases(root),
    ...r3eCases(root),
    ...r3fCases(root),
    ...r3cCases(root),
    ...b6aCases(root),
    ...b6bCases(root),
    ...b6cCases(root),
  ];
}
