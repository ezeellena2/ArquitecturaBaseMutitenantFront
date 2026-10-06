import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { boardChoices, capturePaths, otpMaskStyle, startCanvasServer, validateManifest } from "./capturar-etapa-3a.mjs";
import { platformReasons } from "../src/test/mocks/platformReasons.ts";
import { platformTenantsCaptureResponses } from "../src/test/mocks/platformTenants.ts";
import { platformOrganizationCaptureResponses } from "../src/test/mocks/platformOrganization.ts";
import { platformOrganizationAdministrationCaptureResponses } from "../src/test/mocks/platformOrganizationAdministration.ts";
import { platformAccountRows, platformAccountsCaptureResponses } from "../src/test/mocks/platformAccounts.ts";
import { platformAccountDetailFixture, platformAccountDetailCaptureResponses } from "../src/test/mocks/platformAccountDetail.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const canvas = path.join(root, "docs/design/lienzo");
export const output = path.join(root, "docs/design/capturas/etapa-5");
export const manifestFile = path.join(output, "manifest.json");
export const boardsOutput = path.join(output, "tableros");

const click = (name, role = "button") => ({ type: "click", role, name });
const clickSelector = (selector) => ({ type: "click", selector });
const fill = (name, value, role = "textbox") => ({ type: "fill", role, name, value });
const slug = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const base = (note) => ({ kind: "base", note });
const drawn = { kind: "drawn" };

function recoveryApp(entry) {
  const oldEmail = "lucia.fernandez@delta.ejemplo.com";
  const newEmail = "lucia.fer@gmail.com";
  const previous = [fill("Correo electrónico", oldEmail), click("Seguir")];
  const send = [...previous, fill("Correo electrónico nuevo", newEmail), click("Enviar código")];
  const pair = entry.pair;
  let actions = [];
  let readyHeading;
  let readyText;
  let route = "/recuperar";
  // El tablero dibuja el reenvío disponible. La espera real de 60 s se prueba en la pantalla; estos casos fotografían ese estado.
  const responses = [
    { method: "POST", path: "/api/account-recovery/code", status: 202, body: { resendAfterSeconds: 0 } },
    { method: "POST", path: "/api/account-recovery/verify", status: 204 },
    { method: "POST", path: "/api/account-recovery", status: 202 },
  ];
  switch (pair) {
    case "recuperar-paso-1": readyHeading = "Recuperar mi cuenta"; break;
    case "recuperar-paso-2": actions = previous; readyHeading = "¿Dónde te escribimos?"; break;
    case "recuperar-paso-3":
      actions = [...send, { type: "otp", value: "123456" }, click("Verificar")];
      readyHeading = "Recibimos tu pedido";
      break;
    case "recuperar-correo-anterior-vacio": actions = [click("Seguir")]; readyText = entry.boardReadyText; break;
    case "recuperar-correo-anterior-invalido": actions = [fill("Correo electrónico", "lucia"), click("Seguir")]; readyText = entry.boardReadyText; break;
    case "recuperar-correo-nuevo-vacio": actions = [...previous, click("Enviar código")]; readyText = entry.boardReadyText; break;
    case "recuperar-correo-nuevo-invalido": actions = [...previous, fill("Correo electrónico nuevo", "lucia"), click("Enviar código")]; readyText = entry.boardReadyText; break;
    case "recuperar-correo-nuevo-igual": actions = [...previous, fill("Correo electrónico nuevo", oldEmail), click("Enviar código")]; readyText = entry.boardReadyText; break;
    case "recuperar-codigo": actions = send; readyHeading = "Revisá tu correo"; break;
    case "recuperar-codigo-incompleto": actions = [...send, { type: "otp", value: "1" }, click("Verificar")]; readyText = entry.boardReadyText; break;
    case "recuperar-codigo-reenviado": actions = [...send, click("Reenviar código")]; readyText = entry.boardReadyText; break;
    case "recuperar-enlace-persona":
    case "recuperar-enlace-empresa":
      route = `${pair.endsWith("empresa") ? "/login/empresa" : "/login"}?returnUrl=%2Fconnect%2Fauthorize%3Fcapture%3D1`;
      readyText = "Recuperá tu cuenta";
      break;
    default: throw new Error(`Recuperar: falta el recorrido de ${pair}.`);
  }
  return { ...entry.app, path: `/src/test/visualApp.html?as=visual-personal&route=${encodeURIComponent(route)}`,
    captureMode: "harness", userFixture: "visual-personal", responses, actions,
    ...(readyHeading ? { readyHeading } : {}), ...(readyText ? { readyText } : {}) };
}

function organizationsApp(entry) {
  const pair = entry.pair;
  const phone = entry.viewport.width === 390;
  let actions = [];
  let readyText = "Gamma S.A.";
  let readyHeading;
  let readySelector = "main";
  if (pair.startsWith("organizaciones-menu-")) {
    const names = { "espera-aprobacion": "Gamma S.A.", activa: "Grupo Delta", suspendida: "Beta S.R.L.", "fallo-alta": "Sigma S.A.", cerrada: "Kappa S.R.L." };
    actions = [click(`Acciones de ${names[pair.slice("organizaciones-menu-".length)]}`)];
    readySelector = phone ? '[role="dialog"]' : '[role="menu"]';
  } else if (pair.startsWith("organizaciones-crear")) {
    actions = [click("Crear organización")];
    readyHeading = "Crear organización";
    readySelector = '[role="dialog"]';
    if (pair === "organizaciones-crear-correo-invalido") actions.push(fill("Correo del Dueño", "lucia"));
    if (pair !== "organizaciones-crear") {
      actions.push(click("Crear organización"));
      readyText = pair.endsWith("correo-invalido") ? "Revisá el correo: no parece válido." : "Escribí el nombre de la organización.";
    }
  } else if (pair.startsWith("organizaciones-confirmacion") || pair === "organizaciones-409") {
    actions = [click("Acciones de Grupo Delta"), click("Suspender", "menuitem")];
    readyHeading = "¿Suspender Grupo Delta?";
    readySelector = '[role="dialog"]';
    if (pair.endsWith("motivo")) actions.push(fill("Motivo", "Dos meses sin pago."));
    if (pair.endsWith("error")) { actions.push(click("Suspender")); readyText = "Escribí el motivo."; }
    if (pair.endsWith("409")) {
      actions.push(fill("Motivo", "Revisión simultánea."), click("Suspender")); readyText = "La organización no puede pasar a ese estado.";
    }
  } else if (pair === "organizaciones-sin-coincidencias") {
    actions = [...(phone ? [click("Buscar")] : []), fill("Buscar por nombre o correo", "sin coincidencias", "searchbox")];
    readyText = "Ninguna organización coincide con los filtros";
  } else if (pair === "organizaciones-50-filas") {
    actions = phone ? [click("Cargar más"), { ...click("Cargar más"), waitFor: "Organización de prueba 20" }]
      : [click("Filas por página", "combobox"), click("50 por página", "option")];
    readyText = "Organización de prueba 50";
  }
  return { ...entry.app,
    path: "/src/test/visualApp.html?as=visual-operator&route=%2Fplataforma", captureMode: "harness", userFixture: "visual-operator",
    scenario: `${pair}: lista real T21b`, actions, readySelector,
    responses: platformTenantsCaptureResponses({ many: pair === "organizaciones-50-filas", conflict: pair === "organizaciones-409" }),
    ...(readyText ? { readyText } : {}), ...(readyHeading ? { readyHeading } : {}),
  };
}

function accountsApp(entry) {
  const pair = entry.pair;
  const phone = entry.viewport.width === 390;
  const actions = [];
  let readySelector = "main";
  let readyHeading;
  let readyText = "Lucía Fernández";
  let scenario = `${pair}: lista real T22a`;
  const invitationError = pair.endsWith("invitacion-existente") ? "InvitationExists" : pair.endsWith("cuenta-existente") ? "AccountExists" : undefined;
  if (pair.startsWith("cuentas-menu-")) {
    const name = pair.slice("cuentas-menu-".length);
    const row = platformAccountRows.find((item) => slug(item.displayName || item.primaryEmail || "") === name);
    if (!row) throw new Error(`Cuentas: falta la fila de ${pair}.`);
    if (row.id === "martin-sosa") {
      // Para decidir 5: el tablero conserva un menú, pero tu propia cuenta es de sólo lectura.
      scenario += ": propia cuenta sin acciones (diferencia aprobada)";
      readyText = "Martín Sosa";
    } else {
      if (row.id === "account-julieta" && !phone) actions.push(click("Página siguiente"));
      actions.push(click(`Acciones de ${row.displayName || row.primaryEmail}`));
      readySelector = phone ? '[role="dialog"]' : '[role="menu"]';
      readyText = undefined;
    }
  } else if (pair.startsWith("cuentas-invitar-")) {
    actions.push(click("Invitar operador"));
    readySelector = '[role="dialog"]';
    readyHeading = "Invitar operador";
    readyText = undefined;
    if (pair === "cuentas-invitar-con-permisos") {
      actions.push(fill("Correo", "julieta.molina@arquitecturabase.ejemplo.com"), click("Permisos de plataforma"), { ...click("Ver organizaciones", "menuitemcheckbox"), exact: false });
      // La capa modal del menú oculta el título del diálogo a la accesibilidad mientras está abierto.
      readySelector = '[role="menu"]';
      readyHeading = undefined;
      readyText = "El listado y la ficha de cada organización.";
    } else if (pair.startsWith("cuentas-invitar-error-")) {
      const email = pair.endsWith("vacio") ? "" : pair.endsWith("invalido") ? "lucia"
        : invitationError === "InvitationExists" ? "julieta.molina@arquitecturabase.ejemplo.com" : "lucia.fernandez@delta.ejemplo.com";
      actions.push(fill("Correo", email), click("Invitar"));
      readyText = pair.endsWith("vacio") ? "Escribí el correo." : pair.endsWith("invalido") ? "Revisá el correo: no parece válido."
        : invitationError === "InvitationExists" ? "Ese correo ya tiene una invitación. Reenviala desde la lista."
          : "Ese correo ya tiene una cuenta. Un operador no puede tener perfiles de persona.";
    }
  } else if (pair.startsWith("cuentas-baja-")) {
    const name = pair.endsWith("bloqueada") ? "Lucía Fernández" : "Beto Ramírez";
    actions.push(click(`Acciones de ${name}`), { ...click("Dar de baja", "menuitem"), exact: true });
    readySelector = '[role="dialog"]';
    readyHeading = `¿Dar de baja la cuenta de ${name}?`;
    readyText = pair.endsWith("bloqueada") ? "Es el único Dueño de Grupo Delta." : undefined;
  }
  return { ...entry.app, path: "/src/test/visualApp.html?as=visual-operator&route=%2Fplataforma%2Fcuentas",
    captureMode: "harness", userFixture: "visual-operator", scenario, now: "2026-09-27T20:35:00Z", actions, readySelector,
    responses: platformAccountsCaptureResponses({ invitationError, mobile: phone, includeAll: pair === "cuentas-menu-julio-perez" || pair === "cuentas-menu-laura-diaz" }), ...(readyHeading ? { readyHeading } : {}), ...(readyText ? { readyText } : {}) };
}

function accountDetailApp(entry) {
  const pair = entry.pair;
  const phone = entry.viewport.width === 390;
  // Una referencia base de teléfono no cambia el estado real de la app.
  const state = { activa: "Activa", suspendida: "Suspendida", "necesita-recuperacion": "Necesita recuperación", "baja-pedida": "Baja pedida", "baja-iniciada-por-la-plataforma": "Baja iniciada por la plataforma", eliminada: "Eliminada" }[pair.slice("cuenta-estado-".length)] ?? "Activa";
  const kind = { persona: "Persona", operador: "Operador", "operador-acciones": "Operador: acciones", "operador-cambiar-permisos": "Operador: cambiar permisos", "operador-quitar-operador": "Operador: quitar operador", "invitacion-de-operador-pendiente": "Invitación de operador pendiente", "invitacion-de-operador-vencida": "Invitación de operador vencida" }[pair.slice("cuenta-tipo-".length)] ?? "Persona";
  const detail = platformAccountDetailFixture({ state, kind });
  const actions = [];
  let readyText = detail.displayName ?? detail.primaryEmail;
  let readySelector = "main";
  let readyHeading;
  if (pair.startsWith("cuenta-pestana-")) {
    const tab = { "metodos-de-ingreso": "Métodos de ingreso", organizaciones: "Organizaciones", "historial-de-seguridad": "Historial de seguridad" }[pair.slice("cuenta-pestana-".length)];
    actions.push({ ...click(tab, "tab"), exact: false });
    readyText = tab === "Historial de seguridad" ? "Ingresó con un código por correo" : tab === "Organizaciones" ? "Beta S.R.L." : "lu•••@gmail.com";
  } else if (kind === "Operador: acciones") {
    actions.push(click("Acciones de Laura Díaz"));
    readySelector = '[role="menu"]';
    readyText = "Quitar operador";
  } else if (kind === "Operador: cambiar permisos") {
    actions.push(...(phone ? [click("Acciones de Laura Díaz"), click("Cambiar permisos", "menuitem")] : [click("Cambiar permisos")]),
      click("Permisos de plataforma"), { ...click("Ver la auditoría", "menuitemcheckbox"), exact: false });
    // El tablero móvil dibuja el desplegable cerrado; el de escritorio, expandido.
    if (phone) actions.push({ type: "press", role: "menuitemcheckbox", name: "Ver la auditoría", exact: false, key: "Escape" });
    readySelector = phone ? '[role="dialog"]' : '[role="menu"]';
    readyText = phone ? "Cambiar permisos de Laura Díaz" : "Los eventos de seguridad de todo el servicio.";
  } else if (kind === "Operador: quitar operador") {
    actions.push(click("Acciones de Laura Díaz"), click("Quitar operador", "menuitem"), fill("Motivo", "Dejó el equipo de soporte."), click("Quitar"));
    readySelector = '[role="dialog"]';
    readyHeading = "¿Quitar a Laura Díaz como operador?";
    readyText = "Tiene que quedar al menos un operador activo que pueda administrar operadores.";
  } else if (detail.state === "NeedsRecovery") readyText = "Su único método de ingreso era un correo administrado por Kappa S.R.L.";
  else if (detail.state === "Suspended") readyText = "Denuncia de uso indebido.";
  else if (detail.state === "PendingDeletion") readyText = detail.deletion.requestedByPlatform ? "La plataforma inició la baja el" : "Pidió la baja el";
  else if (detail.state === "Deleted") readyText = "No tiene métodos de ingreso.";
  else if (kind.startsWith("Invitación")) readyText = kind.endsWith("vencida") ? "Invitación vencida" : "Invitación pendiente";
  return { ...entry.app, path: `/src/test/visualApp.html?as=visual-operator&route=${encodeURIComponent(`/plataforma/cuentas/${detail.id}`)}`,
    captureMode: "harness", userFixture: "visual-operator", scenario: `${pair}: ficha real T22b`,
    now: kind.endsWith("vencida") ? "2026-10-05T20:35:00Z" : "2026-09-27T20:35:00Z", actions, readySelector,
    responses: platformAccountDetailCaptureResponses({ state, kind, lastManager: kind === "Operador: quitar operador" }),
    ...(readyText ? { readyText } : {}), ...(readyHeading ? { readyHeading } : {}) };
}

const isOrganizationDetailCase = (entry) => entry.group === "plataforma-organizacion"
  && /^organizacion-(estado-|duenos-|confirmar-|confirmacion-error$|pestana-(historial|duenos)$)/.test(entry.pair);

const isOrganizationAdministrationCase = (entry) => entry.group === "plataforma-organizacion"
  && /^organizacion-(pagina-|dominio-|modulo-|pestana-(modulos|dominio-verificado|pagina-publica)$)/.test(entry.pair);

function organizationAdministrationApp(entry) {
  const pair = entry.pair;
  const moduleCase = pair.includes("modulo");
  const domainCase = pair.includes("dominio");
  const tab = moduleCase ? "Módulos" : domainCase ? "Dominio verificado" : "Página pública";
  const pendingDomain = ["organizacion-dominio-pendiente", "organizacion-dominio-verificar"].includes(pair);
  const pageState = ["organizacion-pagina-despublicada-por-la-plataforma", "organizacion-pagina-permitir-publicar"].includes(pair) ? "Blocked"
    : pair === "organizacion-pagina-borrador" ? "Draft" : "Published";
  const actions = [{ ...click(tab, "tab"), exact: false }];
  let readySelector = "main";
  let readyHeading = "Grupo Delta";
  let readyText = moduleCase ? "Prueba hasta" : domainCase ? pendingDomain ? "ab-verificacion=7f3c9a2e41b8d605" : "Verificado"
    : pageState === "Blocked" ? "Datos de contacto falsos." : pageState === "Draft" ? "Borrador" : "Publicada";
  const confirmation = {
    "organizacion-modulo-apagar": ["WhatsApp", "Apagar", "¿Apagar WhatsApp?"],
    "organizacion-modulo-prender": ["Módulo B", "Prender", "¿Prender Módulo B?"],
    "organizacion-modulo-extender-prueba": ["Módulo B", "Extender prueba", "¿Extender la prueba de Módulo B?"],
    "organizacion-dominio-quitar": ["delta.ejemplo.com", "Quitar", "¿Quitar delta.ejemplo.com?"],
    "organizacion-pagina-despublicar": ["delta.plataforma.com", "Despublicar", "¿Despublicar delta.plataforma.com?"],
    "organizacion-pagina-permitir-publicar": ["delta.plataforma.com", "Permitir publicar", "¿Permitir publicar delta.plataforma.com?"],
  }[pair];
  if (confirmation || pair === "organizacion-dominio-verificar") {
    const [resource, action, title] = confirmation ?? ["delta.ejemplo.com", "Verificar"];
    actions.push({ ...click(`Acciones de ${resource}`), exact: true }, { ...click(action, "menuitem"), exact: true });
    if (confirmation) { readySelector = '[role="dialog"]'; readyHeading = title; readyText = undefined; }
    else { readyText = "Verificamos delta.ejemplo.com."; }
  }
  return { ...entry.app,
    path: "/src/test/visualApp.html?as=visual-operator&route=%2Fplataforma%2Forganizaciones%2Ftenant-1", captureMode: "harness", userFixture: "visual-operator",
    scenario: `${pair}: administración real T21d`, now: "2026-09-27T20:35:00Z", actions, readySelector, readyHeading,
    responses: platformOrganizationAdministrationCaptureResponses({ pendingDomain, pageState }), ...(readyText ? { readyText } : {}),
  };
}

function organizationApp(entry) {
  const phone = entry.viewport.width === 390;
  // Las propiedades son del tablero; una referencia base móvil no describe el estado de la app.
  const confirmation = entry.pair.startsWith("organizacion-confirmar-") ? entry.pair.slice("organizacion-confirmar-".length)
    : entry.pair === "organizacion-confirmacion-error" ? "suspender" : undefined;
  const state = { activa: "Activa", "espera-aprobacion": "Espera aprobación", "fallo-el-alta": "Falló el alta", suspendida: "Suspendida", cerrada: "Cerrada" }[entry.pair.slice("organizacion-estado-".length)]
    ?? (confirmation === "aprobar" || confirmation === "rechazar" ? "Espera aprobación" : confirmation === "reactivar" || confirmation === "cerrar" ? "Suspendida" : "Activa");
  const owners = { "con-su-dueno": "Con su Dueño", "sin-dueno-todavia": "Sin Dueño todavía", "con-el-dueno-suspendido": "Con el Dueño suspendido" }[entry.pair.slice("organizacion-duenos-".length)] ?? "Con su Dueño";
  const tab = entry.pair.startsWith("organizacion-duenos-") || entry.pair === "organizacion-pestana-duenos" ? "Dueños" : "Historial";
  let actions = tab === "Dueños" ? [click("Dueños", "tab")] : [];
  let readyText = tab === "Dueños" ? owners === "Sin Dueño todavía" ? "Invitación pendiente"
    : owners === "Con el Dueño suspendido" ? "Suspendido" : "Activo"
    : state === "Activa" ? "Reactivó la organización" : state === "Suspendida" ? "Suspendió la organización"
      : state === "Cerrada" ? "Cerró la organización" : "Pidió crear la organización";
  let readyHeading = "Grupo Delta";
  let readySelector = "main";
  if (phone && state === "Falló el alta" && !confirmation) {
    actions = [{ ...click("Acciones de Grupo Delta"), exact: true }];
    readySelector = '[role="menu"]';
    readyHeading = undefined;
    readyText = "Reintentar el alta";
  }
  if (confirmation) {
    const action = { aprobar: "Aprobar", rechazar: "Rechazar", suspender: "Suspender", reactivar: "Reactivar", cerrar: "Cerrar" }[confirmation];
    actions = phone ? [click("Acciones de Grupo Delta"), { ...click(action, "menuitem"), exact: true }] : [{ ...click(action), exact: true }];
    readySelector = '[role="dialog"]';
    readyHeading = `¿${action} Grupo Delta?`;
    readyText = undefined;
    if (entry.pair === "organizacion-confirmacion-error") { actions.push(click(action)); readyText = "Escribí el motivo."; }
  }
  return { ...entry.app,
    path: "/src/test/visualApp.html?as=visual-operator&route=%2Fplataforma%2Forganizaciones%2Ftenant-1", captureMode: "harness", userFixture: "visual-operator",
    scenario: `${entry.pair}: ficha real T21c`, now: "2026-09-27T20:35:00Z", actions, readySelector, readyHeading,
    responses: platformOrganizationCaptureResponses({ state, owners }), ...(readyText ? { readyText } : {}),
  };
}

function reasonApp(entry) {
  const fixture = platformReasons[entry.pair];
  let actions = [];
  let readyText;
  if (entry.pair === "organizaciones-confirmacion-motivo") actions = [fill("Motivo", "Dos meses sin pago.")];
  if (entry.pair === "organizaciones-confirmacion-error") {
    actions = [click(fixture.confirmLabel)]; readyText = "Escribí el motivo.";
  }
  if (fixture.failure) {
    actions = [fill("Motivo", "Revisión simultánea."), click(fixture.confirmLabel)]; readyText = fixture.failure.detail;
  }
  return { ...entry.app,
    path: `/src/test/visualApp.html?as=visual-operator&frame=platform&reason=${entry.pair}&route=${encodeURIComponent(entry.app.path)}`,
    captureMode: "harness", userFixture: "visual-operator", readySelector: '[role="dialog"]', readyHeading: fixture.title,
    scenario: `${entry.pair}: diálogo real T20d, contenido pendiente T21–T23`, actions,
    ...(readyText ? { readyText } : {}) };
}

export function buildCases() {
  const cases = [];
  // Igual que E6, cada caso tiene su tablero móvil propio. Una referencia base nunca dice representar un estado ausente.
  const both = ({ pair, group, board, mobileBoard, route, mobileRoute = route, props = {}, mobileProps = props,
    boardActions = [], mobileBoardActions = boardActions, boardReference = drawn, mobileReference = boardReference,
    readyText, mobileReadyText = readyText, readySelector, mobileReadySelector = readySelector, actions = [], mobileActions = actions, scenario = pair }) => {
    for (const [width, height, device] of [[1440, 900, "escritorio"], [390, 844, "movil"]]) {
      const mobile = device === "movil";
      const reference = mobile ? mobileReference : boardReference;
      const text = reference.kind === "drawn" ? (mobile ? mobileReadyText : readyText) : undefined;
      const selector = reference.kind === "drawn" ? (mobile ? mobileReadySelector : readySelector) : undefined;
      cases.push({ id: `${pair}-${device}`, pair, group, board: mobile ? mobileBoard : board,
        props: mobile ? mobileProps : props, viewport: { width, height },
        boardActions: mobile ? mobileBoardActions : boardActions,
        boardReference: reference,
        ...(text ? { boardReadyText: text } : {}),
        ...(selector ? { boardReadySelector: selector } : {}),
        // Las pantallas/fixtures de Plataforma se agregan en T19–T23; ahora solo se captura el lienzo.
        app: { path: mobile ? mobileRoute : route, scenario, actions: mobile ? mobileActions : actions },
      });
    }
  };

  const staticMobile = (board, detail) => base(`${board} v111 solo dibuja la referencia base; ${detail}. La app móvil se revisa al implementarla (decisión 12).`);
  const list = { group: "plataforma-organizaciones", board: "Organizaciones", mobileBoard: "M-Organizaciones", route: "/plataforma" };
  const listMobile = staticMobile(list.mobileBoard, "sus botones no abren menús ni diálogos");
  const listAction = (pair, boardActions, readyText, extra = {}) => both({ ...list, pair, boardActions, readyText,
    mobileBoardActions: [], mobileReadyText: undefined, mobileReference: listMobile, ...extra });

  both({ ...list, group: "plataforma-marco", pair: "marco-gestion", mobileReference: staticMobile("M-Organizaciones", "no existe panel lateral de Gestión"), readyText: "Organizaciones" });
  both({ group: "plataforma-marco", pair: "marco-administracion", board: "Config-Plat", mobileBoard: "M-Mas-Plat", route: "/plataforma/configuracion", mobileRoute: "/plataforma/mas", readyText: "Administración" });
  both({ ...list, group: "plataforma-marco", pair: "marco-tu-menu", boardActions: [clickSelector("button.um-btn")], readyText: "Mi cuenta",
    mobileBoard: "M-Mas-Plat", mobileRoute: "/plataforma/mas", mobileBoardActions: [], mobileReference: base("M-Mas-Plat dibuja las opciones del operador en Más; no un menú desplegable de usuario."), mobileReadyText: "Mi cuenta" });
  both({ ...list, group: "plataforma-marco", pair: "marco-barra-inferior", boardReference: base("Organizaciones es la referencia desktop del marco; la barra inferior es exclusiva del tablero móvil."),
    mobileReference: drawn, readyText: "Organizaciones" });
  both({ group: "plataforma-marco", pair: "marco-mas", board: "Config-Plat", mobileBoard: "M-Mas-Plat", route: "/plataforma/configuracion", mobileRoute: "/plataforma/mas",
    boardReference: base("Config-Plat aporta el panel Administración desktop; Más solo está dibujado para móvil."), mobileReference: drawn, mobileReadyText: "Más" });

  both({ ...list, pair: "organizaciones-lista", readyText: "Organizaciones" });
  listAction("organizaciones-50-filas", [click("10 por página"), click("50 por página", "option")], "50", {
    boardReference: base("El selector permite 50 por página, pero el tablero contiene solo las 7 organizaciones originales; no dibuja una lista de 50 filas."),
    mobileReference: base("M-Organizaciones contiene sus filas originales y no dibuja 50 filas ni selector de tamaño.") });
  listAction("organizaciones-sin-coincidencias", [fill("Buscar por nombre o correo", "sin coincidencias", "searchbox")], "Ninguna organización coincide con los filtros");
  for (const [state, name] of [["espera-aprobacion", "Gamma S.A."], ["activa", "Grupo Delta"], ["suspendida", "Beta S.R.L."], ["fallo-alta", "Sigma S.A."], ["cerrada", "Kappa S.R.L."]]) {
    listAction(`organizaciones-menu-${state}`, [click(`Acciones de ${name}`)], undefined, { readySelector: '[role="menu"]', mobileReadySelector: undefined });
  }
  listAction("organizaciones-crear", [click("Crear organización")], undefined, { readySelector: '[role="dialog"]', mobileReadySelector: undefined });
  listAction("organizaciones-crear-errores", [click("Crear organización"), clickSelector('[role="dialog"] button.b-pri')], "Escribí el nombre de la organización.");
  listAction("organizaciones-crear-correo-invalido", [click("Crear organización"), fill("Correo del Dueño", "lucia"), clickSelector('[role="dialog"] button.b-pri')], "Revisá el correo: no parece válido.");
  const suspend = [click("Acciones de Grupo Delta"), click("Suspender", "menuitem")];
  listAction("organizaciones-confirmacion-motivo", [...suspend, fill("Motivo", "Dos meses sin pago.")], "¿Suspender Grupo Delta?");
  listAction("organizaciones-confirmacion-error", [...suspend, clickSelector('[role="alertdialog"] button.b-pel')], "Escribí el motivo.");
  both({ ...list, pair: "organizaciones-409", boardReference: base("Organizaciones v111 no simula conflicto de versión 409; se conserva la lista real para comparar la app cuando exista."),
    mobileReference: base("M-Organizaciones v111 no dibuja el 409; conserva la lista de referencia."), scenario: "Conflicto 409 al confirmar una acción con versión anterior, según T19/T24." });

  const organization = { group: "plataforma-organizacion", board: "Organizacion", mobileBoard: "M-Organizacion", route: "/plataforma/organizaciones/tenant-1" };
  const orgChoices = boardChoices(path.join(canvas, "Organizacion.dc.html"));
  const orgBaseProps = { estado: "Historial" };
  const orgMobile = staticMobile("M-Organizacion", "no dibuja esta pestaña, estado o confirmación");
  const orgAction = (pair, props, boardActions, readyText, extra = {}) => both({ ...organization, pair, props, boardActions, readyText,
    mobileProps: orgBaseProps, mobileBoardActions: [], mobileReadyText: undefined, mobileReference: orgMobile, ...extra });
  for (const state of orgChoices.estado) {
    const represented = state === "Activa" || state === "Falló el alta";
    both({ ...organization, pair: `organizacion-estado-${slug(state)}`, props: { estado: state, pestana: "Historial" },
      mobileProps: { estado: state === "Falló el alta" ? state : "Historial" }, readyText: state,
      mobileReadyText: represented ? (state === "Activa" ? "Grupo Delta" : state) : undefined,
      mobileReference: represented ? drawn : orgMobile });
  }
  for (const tab of orgChoices.pestana) both({ ...organization, pair: `organizacion-pestana-${slug(tab)}`, props: { estado: "Activa", pestana: tab },
    mobileProps: { estado: tab === "Dueños" ? "Dueños" : "Historial" },
    mobileReference: ["Historial", "Dueños"].includes(tab) ? drawn : orgMobile,
    readySelector: `[role="tab"][aria-selected="true"]`, mobileReadySelector: null,
    ...(tab === "Historial" ? { readyText: "Reactivó la organización", mobileReadyText: "Reactivó la organización" } : { mobileReadyText: undefined }) });
  for (const state of orgChoices.pagina) orgAction(`organizacion-pagina-${slug(state)}`, { pestana: "Página pública", pagina: state }, [], state);
  for (const state of orgChoices.dominio) orgAction(`organizacion-dominio-${slug(state)}`, { pestana: "Dominio verificado", dominio: state }, [], state);
  const ownerMobile = { "Con su Dueño": "Dueños", "Sin Dueño todavía": "Dueños: sin Dueño todavía", "Con el Dueño suspendido": "Dueños: Dueño suspendido" };
  const ownerText = { "Con su Dueño": "Activo", "Sin Dueño todavía": "Invitación pendiente", "Con el Dueño suspendido": "Suspendido" };
  for (const state of orgChoices.duenos) both({ ...organization, pair: `organizacion-duenos-${slug(state)}`, props: { pestana: "Dueños", duenos: state },
    mobileProps: { estado: ownerMobile[state] }, readyText: ownerText[state] });
  for (const [action, state] of [["Aprobar", "Espera aprobación"], ["Rechazar", "Espera aprobación"], ["Suspender", "Activa"], ["Reactivar", "Suspendida"], ["Cerrar", "Suspendida"]]) {
    orgAction(`organizacion-confirmar-${slug(action)}`, { estado: state }, [click(action)], `¿${action} Grupo Delta?`);
  }
  orgAction("organizacion-confirmacion-error", { estado: "Activa" }, [click("Suspender"), clickSelector('[role="alertdialog"] button.b-pel')], "Escribí el motivo.");
  orgAction("organizacion-pagina-despublicar", { pestana: "Página pública", pagina: "Publicada" }, [click("Acciones de delta.plataforma.com"), click("Despublicar", "menuitem")], "¿Despublicar delta.plataforma.com?");
  orgAction("organizacion-pagina-permitir-publicar", { pestana: "Página pública", pagina: "Despublicada por la plataforma" }, [click("Acciones de delta.plataforma.com"), click("Permitir publicar", "menuitem")], "¿Permitir publicar delta.plataforma.com?");
  orgAction("organizacion-dominio-quitar", { pestana: "Dominio verificado", dominio: "Verificado" }, [click("Acciones de delta.ejemplo.com"), click("Quitar", "menuitem")], "¿Quitar delta.ejemplo.com?");
  orgAction("organizacion-dominio-verificar", { pestana: "Dominio verificado", dominio: "Pendiente" }, [click("Acciones de delta.ejemplo.com"), click("Verificar", "menuitem")], "Verificamos delta.ejemplo.com.");
  for (const [module, action, title] of [["WhatsApp", "Apagar", "¿Apagar WhatsApp?"], ["Módulo B", "Prender", "¿Prender Módulo B?"],
    ["Módulo B", "Extender prueba", "¿Extender la prueba de Módulo B?"]]) {
    orgAction(`organizacion-modulo-${slug(action)}`, { pestana: "Módulos" }, [click(`Acciones de ${module}`), click(action, "menuitem")], title);
  }

  const accounts = { group: "plataforma-cuentas", board: "Cuentas", mobileBoard: "M-Cuentas", route: "/plataforma/cuentas" };
  const accountsMobile = staticMobile("M-Cuentas", "no abre sus menús ni dibuja invitar o confirmar baja");
  const accountAction = (pair, boardActions, readyText, extra = {}) => both({ ...accounts, pair, boardActions, readyText,
    mobileBoardActions: [], mobileReadyText: undefined, mobileReference: accountsMobile, ...extra });
  both({ ...accounts, pair: "cuentas-lista", readyText: "Cuentas" });
  const rowNames = ["Lucía Fernández", "Beto Ramírez", "Ana Gómez", "mariana.lopez@gmail.com", "Julio Pérez", "Pablo Ortiz", "Martín Sosa", "Laura Díaz", "julieta.molina@arquitecturabase.ejemplo.com"];
  for (const name of rowNames) accountAction(`cuentas-menu-${slug(name)}`, [
    ...(name.startsWith("julieta") ? [click("Página siguiente")] : []), click(`Acciones de ${name}`),
  ], undefined, { readySelector: '[role="menu"]', mobileReadySelector: undefined });
  accountAction("cuentas-invitar-operador", [click("Invitar operador")], undefined, { readySelector: '[role="dialog"]', mobileReadySelector: undefined });
  accountAction("cuentas-invitar-con-permisos", [click("Invitar operador"), fill("Correo", "julieta.molina@arquitecturabase.ejemplo.com"), click("Permisos de plataforma"), clickSelector('label.op2:first-child input')], "Ver organizaciones");
  for (const [suffix, email, error] of [["vacio", "", "Escribí el correo."], ["invalido", "lucia", "Revisá el correo: no parece válido."],
    ["invitacion-existente", "julieta.molina@arquitecturabase.ejemplo.com", "Ese correo ya tiene una invitación. Reenviala desde la lista."],
    ["cuenta-existente", "lucia.fernandez@delta.ejemplo.com", "Ese correo ya tiene una cuenta. Un operador no puede tener perfiles de persona."]]) {
    accountAction(`cuentas-invitar-error-${suffix}`, [click("Invitar operador"), fill("Correo", email), click("Invitar")], error);
  }
  accountAction("cuentas-baja-bloqueada", [click("Acciones de Lucía Fernández"), click("Dar de baja", "menuitem")], "Es el único Dueño de Grupo Delta.");
  accountAction("cuentas-baja-permitida", [click("Acciones de Beto Ramírez"), click("Dar de baja", "menuitem")], "¿Dar de baja la cuenta de Beto Ramírez?");

  const account = { group: "plataforma-cuenta", board: "Cuenta-Plat", mobileBoard: "M-Cuenta-Plat", route: "/plataforma/cuentas/account-lucia" };
  const accountChoices = boardChoices(path.join(canvas, "Cuenta-Plat.dc.html"));
  const personMobile = staticMobile("M-Cuenta-Plat", "Persona solo muestra la ficha activa y métodos de ingreso");
  for (const state of accountChoices.estado) both({ ...account, pair: `cuenta-estado-${slug(state)}`, props: { cuenta: "Persona", estado: state }, mobileProps: { estado: "Persona" },
    readyText: state === "Baja iniciada por la plataforma" ? "La plataforma inició la baja el" : state,
    mobileReadyText: state === "Activa" ? "Lucía Fernández" : undefined, mobileReference: state === "Activa" ? drawn : personMobile });
  for (const tab of accountChoices.pestana) both({ ...account, pair: `cuenta-pestana-${slug(tab)}`, props: { cuenta: "Persona", pestana: tab }, mobileProps: { estado: "Persona" },
    readySelector: '[role="tab"][aria-selected="true"]', mobileReadySelector: null,
    mobileReference: tab === "Métodos de ingreso" ? drawn : personMobile });
  for (const kind of accountChoices.cuenta) both({ ...account, pair: `cuenta-tipo-${slug(kind)}`, props: { cuenta: kind }, mobileProps: { estado: kind },
    readyText: kind === "Operador: cambiar permisos" ? "Cambiar permisos" : kind === "Operador: quitar operador" ? "¿Quitar a Laura Díaz como operador?" : kind === "Invitación de operador pendiente" ? "Invitación pendiente" : kind === "Invitación de operador vencida" ? "Invitación vencida" : kind.startsWith("Operador") ? "Laura Díaz" : "Lucía Fernández",
    ...(kind === "Operador: acciones" ? { readySelector: '[role="menu"]' } : {}) });

  const recoveries = { group: "plataforma-recuperaciones", board: "Recuperaciones", mobileBoard: "M-Recuperaciones", route: "/plataforma/recuperaciones" };
  const recoveriesMobile = staticMobile("M-Recuperaciones", "solo dibuja la lista, sin detalle, resolución ni errores");
  const recoveryAction = (pair, props, boardActions, readyText) => both({ ...recoveries, pair, props, boardActions, readyText,
    mobileProps: {}, mobileBoardActions: [], mobileReadyText: undefined, mobileReference: recoveriesMobile });
  for (const choice of boardChoices(path.join(canvas, "Recuperaciones.dc.html")).caso) both({ ...recoveries, pair: `recuperaciones-${slug(choice)}`, props: { caso: choice },
    mobileProps: {}, readyText: choice === "Revisar un pedido" ? "Revisar el pedido" : choice,
    mobileReadyText: choice === "Pedidos" ? "Recuperaciones" : undefined, mobileReference: choice === "Pedidos" ? drawn : recoveriesMobile });
  recoveryAction("recuperaciones-resuelto-aprobado", {}, [click("Acciones de el pedido del 22/09/2026 09:40"), click("Ver detalle", "menuitem")], "Confirmó sus datos por videollamada.");
  recoveryAction("recuperaciones-resuelto-rechazado", {}, [click("Acciones de el pedido del 15/09/2026 13:12"), click("Ver detalle", "menuitem")], "No pudo confirmar que la cuenta es suya.");
  recoveryAction("recuperaciones-sin-cuenta", {}, [click("Acciones de el pedido del 26/09/2026 18:05"), click("Revisar", "menuitem")], "Ninguna");
  for (const action of ["Aprobar", "Rechazar"]) recoveryAction(`recuperaciones-error-${slug(action)}`, { caso: "Revisar un pedido" }, [click(action)], "Escribí el motivo.");

  const legal = { group: "plataforma-legales", board: "Legales", mobileBoard: "M-Legales", route: "/plataforma/legales" };
  const legalMobile = staticMobile("M-Legales", "solo dibuja los documentos, sin formulario, errores ni confirmación");
  const legalAction = (pair, props, boardActions, readyText) => both({ ...legal, pair, props, boardActions, readyText,
    mobileProps: {}, mobileBoardActions: [], mobileReadyText: undefined, mobileReference: legalMobile });
  for (const choice of boardChoices(path.join(canvas, "Legales.dc.html")).pantalla) both({ ...legal, pair: `legales-${slug(choice)}`, props: { pantalla: choice }, mobileProps: {},
    readyText: choice === "Documentos" ? "Documentos legales" : choice, mobileReadyText: choice === "Documentos" ? "Documentos legales" : undefined,
    mobileReference: choice === "Documentos" ? drawn : legalMobile });
  const newLegal = { pantalla: "Publicar versión nueva" };
  legalAction("legales-errores", newLegal, [click("Publicar")], "Escribí la fecha de vigencia.");
  legalAction("legales-fecha-invalida", newLegal, [fill("Vigente desde", "01/11"), click("Publicar")], "Escribí la fecha como dd/mm/aaaa.");
  // Entradas para abrir una confirmación dibujada: fecha ya presente y títulos de campos del mismo tablero.
  legalAction("legales-confirmacion", newLegal, [fill("Vigente desde", "01/11/2026"), fill("En español", "En español"), fill("En inglés", "En inglés"), click("Publicar")], "¿Publicar la versión 3 de Términos y condiciones?");

  const audit = { group: "plataforma-auditoria", board: "Auditoria-Plat", mobileBoard: "M-Auditoria-Plat", route: "/plataforma/auditoria" };
  both({ ...audit, pair: "auditoria-lista", readyText: "Auditoría" });
  both({ ...audit, pair: "auditoria-filtrada", boardActions: [fill("Buscar en la auditoría", "Grupo Delta", "searchbox")], readyText: "Reactivó la organización", mobileBoardActions: [], mobileReadyText: undefined,
    mobileReference: staticMobile("M-Auditoria-Plat", "no simula filtros") });
  both({ ...audit, pair: "auditoria-detalle", boardActions: [click("Ver el detalle: Suspendió la cuenta")], readyText: "Dirección IP", mobileBoard: "M-Auditoria-Plat-Detalle", mobileBoardActions: [], mobileReadyText: "Dirección IP" });

  const settings = { group: "plataforma-configuracion", board: "Config-Plat", mobileBoard: "M-Config-Plat", route: "/plataforma/configuracion" };
  const settingsMobile = staticMobile("M-Config-Plat", "sus campos y botones son estáticos; no dibuja cambios, errores ni confirmación");
  const settingsAction = (pair, boardActions, readyText, extra = {}) => both({ ...settings, pair, boardActions, readyText,
    mobileBoardActions: [], mobileReadyText: undefined, mobileReference: settingsMobile, ...extra });
  both({ ...settings, pair: "configuracion-sin-cambios", readyText: "Configuración" });
  settingsAction("configuracion-con-cambios", [fill("Organizaciones propias por persona", "4", "spinbutton")], "Cambios sin guardar");
  settingsAction("configuracion-errores", [fill("Organizaciones propias por persona", "0", "spinbutton"), fill("Correo de ventas", "ventas"), fill("Correo de soporte", "soporte"), click("Guardar cambios")], "Usá un número de 1 a 50.");
  settingsAction("configuracion-confirmacion", [fill("Organizaciones propias por persona", "4", "spinbutton"), click("Guardar cambios")], "¿Guardar la configuración?");
  settingsAction("configuracion-confirmacion-error", [fill("Organizaciones propias por persona", "4", "spinbutton"), click("Guardar cambios"), clickSelector('[role="alertdialog"] button.b-pri')], "Escribí el motivo.");
  settingsAction("configuracion-409", [], undefined, { boardReference: base("Config-Plat v111 no simula conflicto 409; se conserva la configuración real para la captura futura de app."),
    scenario: "Conflicto 409 al guardar con versión anterior, conservando cambios y ofreciendo volver a cargar, según T23/T24." });

  const recovery = { group: "recuperar", board: "Recuperar", mobileBoard: "M-Recuperar", route: "/recuperar" };
  const withoutWhatsApp = "Sin WhatsApp (hasta la Etapa 8)";
  const steps = boardChoices(path.join(canvas, "Recuperar.dc.html")).paso;
  for (const [index, step] of steps.entries()) both({ ...recovery, pair: `recuperar-paso-${index + 1}`,
    props: { paso: step, whatsapp: withoutWhatsApp }, readyText: ["Recuperar mi cuenta", "¿Dónde te escribimos?", "Recibimos tu pedido"][index] });
  const old = { paso: steps[0], whatsapp: withoutWhatsApp };
  const next = { paso: steps[1], whatsapp: withoutWhatsApp };
  const code = [fill("Correo electrónico nuevo", "lucia.fer@gmail.com"), click("Enviar código")];
  const emailError = "Ingresá un correo electrónico válido.";
  for (const [pair, props, boardActions, readyText] of [
    ["recuperar-correo-anterior-vacio", old, [click("Seguir")], emailError],
    ["recuperar-correo-anterior-invalido", old, [fill("Correo electrónico", "lucia"), click("Seguir")], emailError],
    ["recuperar-correo-nuevo-vacio", next, [click("Enviar código")], emailError],
    ["recuperar-correo-nuevo-invalido", next, [fill("Correo electrónico nuevo", "lucia"), click("Enviar código")], emailError],
    ["recuperar-correo-nuevo-igual", next, [fill("Correo electrónico nuevo", "lucia.fernandez@delta.ejemplo.com"), click("Enviar código")], "Tiene que ser un correo distinto del de antes."],
    ["recuperar-codigo", next, code, "Revisá tu correo"],
    ["recuperar-codigo-incompleto", next, [...code, fill("Código 1", "1"), click("Verificar")], "Escribí los 6 números del código."],
    ["recuperar-codigo-reenviado", next, [...code, click("Reenviar código")], "Te mandamos un código nuevo."],
  ]) both({ ...recovery, pair, props, boardActions, readyText });
  for (const door of ["Persona", "Empresa"]) both({ group: "recuperar", pair: `recuperar-enlace-${slug(door)}`,
    board: "Ingreso", mobileBoard: "M-Ingreso", props: { estado: "Correo", puerta: door },
    route: door === "Empresa" ? "/login/empresa" : "/login", readyText: "Recuperá tu cuenta" });
  return cases.map((entry) => {
    if (entry.group === "recuperar") return { ...entry, app: recoveryApp(entry) };
    if (entry.group === "plataforma-organizaciones") return { ...entry, app: organizationsApp(entry) };
    if (entry.group === "plataforma-cuentas") return { ...entry, app: accountsApp(entry) };
    if (entry.group === "plataforma-cuenta") return { ...entry, app: accountDetailApp(entry) };
    if (isOrganizationDetailCase(entry)) return { ...entry, app: organizationApp(entry) };
    if (isOrganizationAdministrationCase(entry)) return { ...entry, app: organizationAdministrationApp(entry) };
    if (entry.pair in platformReasons) return { ...entry, app: reasonApp(entry) };
    if (entry.group === "plataforma-marco") {
      const realMore = entry.viewport.width === 390 && entry.app.path === "/plataforma/mas";
      return { ...entry, app: {
        ...entry.app,
        path: `/src/test/visualApp.html?as=visual-operator&${realMore ? "" : "frame=platform&"}route=${encodeURIComponent(entry.app.path)}`,
        captureMode: "harness", userFixture: "visual-operator", readySelector: "main",
        scenario: `${entry.pair}: ${realMore ? "Más real T20c" : "marco real"}, contenido pendiente T21–T23`,
        ...(realMore ? { readyHeading: "Más" } : {}),
        actions: entry.pair === "marco-tu-menu" && entry.viewport.width === 1440 ? [click("Martín Sosa, Plataforma")] : [],
      } };
    }
    return entry;
  });
}

export async function writeManifest() {
  mkdirSync(output, { recursive: true });
  const cases = buildCases();
  writeFileSync(manifestFile, `${JSON.stringify({ version: 1, lienzoVersion: 111, captureScope: "tableros", cases }, null, 2)}\n`);
  validateManifest(manifestFile, canvas);
  return cases;
}

export function assertCapturedBoards(cases, directory = boardsOutput) {
  for (const entry of cases) {
    const file = capturePaths(directory, entry).board;
    const bytes = readFileSync(file);
    if (bytes.length < 24 || bytes.toString("hex", 0, 8) !== "89504e470d0a1a0a" ||
        bytes.readUInt32BE(16) !== entry.viewport.width || bytes.readUInt32BE(20) !== entry.viewport.height) {
      throw new Error(`${entry.id}: falta un PNG del tamaño aprobado (${file}).`);
    }
  }
}

async function captureBoard(browser, entry, canvasUrl) {
  const context = await browser.newContext({ viewport: entry.viewport, deviceScaleFactor: 1 });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(7000);
    await page.goto(`${canvasUrl}/${entry.board}.dc.html`, { waitUntil: "load" });
    await page.waitForFunction(() => typeof window.__dcSetProps === "function" && window.__dcRootName?.());
    await page.evaluate((props) => window.__dcSetProps(window.__dcRootName(), props), entry.props);
    await page.locator("[data-sc-name]").first().waitFor({ state: "visible" });
    await page.waitForTimeout(200);
    for (const action of entry.boardActions) {
      const target = action.selector ? page.locator(action.selector) : page.getByRole(action.role, { name: action.name, exact: true });
      if (action.type === "click") await target.click({ force: action.force ?? false });
      else if (action.type === "fill") await target.fill(action.value);
      else throw new Error(`${entry.id}: acción de tablero desconocida (${action.type}).`);
    }
    if (entry.boardReadyText) await page.getByText(entry.boardReadyText, { exact: false }).first().waitFor({ state: "visible" });
    if (entry.boardReadySelector) await page.locator(entry.boardReadySelector).first().waitFor({ state: "visible" });
    const mask = otpMaskStyle.replace('input[inputmode="numeric"]', 'input[inputmode="numeric"][maxlength="1"]');
    await page.addStyleTag({ content: `@font-face { font-family: Inter; font-style: normal; font-weight: 100 900; src: url('${canvasUrl}/_fonts/inter-latin-wght-normal.woff2') format('woff2'); } ${mask}` });
    await page.evaluate(async () => { await document.fonts.load('13px "Inter"'); await document.fonts.ready; });
    const file = capturePaths(boardsOutput, entry).board;
    mkdirSync(path.dirname(file), { recursive: true });
    await page.screenshot({ path: file, fullPage: false, animations: "disabled" });
  } finally { await context.close(); }
}

async function main() {
  const cases = await writeManifest();
  const option = (name) => { const index = process.argv.indexOf(name); return index < 0 ? null : process.argv[index + 1]; };
  const group = option("--group");
  const pair = option("--pair");
  const ids = option("--id")?.split(",");
  const selected = cases.filter((entry) => (!group || entry.group === group) && (!pair || entry.pair === pair) && (!ids || ids.includes(entry.id)));
  if (!selected.length) throw new Error("No hay capturas para ese filtro.");
  if (process.argv.includes("--manifest-only")) { console.log(`${cases.length} casos E5 registrados.`); return; }
  if (process.argv.includes("--verify")) {
    assertCapturedBoards(selected);
    console.log(`${selected.length} PNG de tableros E5 verificados.`);
    return;
  }
  const browser = await chromium.launch({ headless: true });
  const server = await startCanvasServer(canvas);
  try {
    const failed = [];
    for (const entry of selected) {
      try {
        await captureBoard(browser, entry, server.url);
        console.log(`${entry.id}: tablero (${entry.boardReference.kind})`);
      } catch (error) {
        failed.push(entry.id);
        console.error(`${entry.id}: ${error.message}`);
      }
    }
    if (failed.length) throw new Error(`Fallaron ${failed.length} tableros: ${failed.join(", ")}`);
    assertCapturedBoards(selected);
  } finally { await server.close(); await browser.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
