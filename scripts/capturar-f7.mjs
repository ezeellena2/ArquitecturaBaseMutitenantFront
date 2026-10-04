// Capturas de F7 (consolidación del front): la edición con «Cambios sin guardar», «¿Salir sin guardar?», el 409 y el
// error de guardado. Mismo mecanismo que capturar-etapa-6.mjs (el lienzo servido en local, el arnés visual de la app y
// Playwright con el Chrome del sistema), con dos usos:
// - antes de programar, solo los tableros: node scripts/capturar-f7.mjs --tableros [--id <caso>]
// - mientras se programa, tablero y app lado a lado: node scripts/capturar-f7.mjs --app-url http://127.0.0.1:5187 [--pair <par>]
// `--verify` comprueba los pares. Siempre reescribe manifest.json, con la forma de los de las etapas (la vista en vivo
// de scripts/recorrido-lienzo lo lee).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  assertCapturedPairs, capturePaths, installApiMocks, otpMaskStyle, runAppActions, startCanvasServer, validateManifest, waitForAppFont,
} from "./capturar-etapa-3a.mjs";
import {
  api, companiesListResponses, companyDetailResponses, organizationUserRows, publicPageResponses, roleLists, settingsResponses, userCompanyOptions,
  userDetailResponses,
} from "./capturar-etapa-6.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canvas = path.join(root, "docs/design/lienzo");
export const output = path.join(root, "docs/design/capturas/consolidacion/f7");
export const manifestFile = path.join(output, "manifest.json");

const desktop = { width: 1440, height: 900 };
const phone = { width: 390, height: 844 };
const fill = (name, value) => ({ type: "fill", name, value });
const click = (selector) => ({ type: "click", selector });
const toggle = (selector, text) => ({ type: "toggle", selector, text });
const openOrgRoles = click('button[aria-label="Roles de la organización"]');
// Tablero Empresa: le sacás «Administrador» a Lucía, la única administradora, y guardás.
const empresaRolesErrorOnBoard = [
  click('button[aria-label="Acciones de Lucía Fernández"]'), click('[role="menu"] button[role="menuitem"]'),
  click('button[aria-labelledby="et-RolesM"]'), toggle("label.op2", "Administrador"), click(".velo button.capa"),
  click(".dlg-f button.b-pri"),
];

// Cada caso es un estado de un tablero. `section` captura solo esa sección de un tablero «Criterio».
export const boardCases = [
  { id: "configuracion-cambios-sin-guardar", viewport: desktop, board: "Configuracion", props: { dominio: "Verificado" },
    actions: [fill("Nombre de la organización", "Grupo Delta Sur")],
    state: "Configuración: editaste el nombre y la banda dice solo «Cambios sin guardar»." },
  { id: "configuracion-salir-sin-guardar", viewport: desktop, board: "Avisos", props: { caso: "Salir sin guardar" },
    state: "Configuración con cambios: el diálogo «¿Salir sin guardar?» (Avisos › Salir sin guardar)." },
  { id: "configuracion-otra-persona-cambio", viewport: desktop, board: "Avisos", props: { caso: "Alguien cambió esto" },
    state: "Configuración: el 409, cartel «Otra persona cambió esto…» con «Seguir editando» y «Ver lo nuevo» (Avisos › Alguien cambió esto)." },
  { id: "configuracion-error-del-servidor", viewport: desktop, board: "Avisos", props: { caso: "Error del servidor" },
    state: "Configuración: un 5xx al guardar va en el aviso rojo de abajo, con «Copiar código» (Avisos › Error del servidor)." },
  { id: "pagina-publica-cambios-sin-guardar", viewport: desktop, board: "Pagina-Org", props: { estado: "Publicada" },
    actions: [fill("Nombre de la página", "Grupo Delta Sur")],
    state: "Página pública: «Publicada · Cambios sin guardar» en la banda." },
  { id: "usuario-cambios-sin-guardar", viewport: desktop, board: "Usuario", props: { usuario: "Tomás (activo)" },
    actions: [openOrgRoles, toggle(".o-lst label.op", "Auditor"), click("button.o-capa")],
    state: "Ficha de Usuario: le sumaste un rol y la banda dice «Activo · Cambios sin guardar»." },
  { id: "usuario-error-al-guardar", viewport: desktop, board: "Usuario", props: { usuario: "Lucía (vos)" },
    actions: [openOrgRoles, toggle(".o-lst label.op", "Dueño"), click("button.o-capa"), click(".w-bnd .ac button.cb-pri")],
    state: "Ficha de Usuario: una regla rechaza el guardado y el error va en un cartel debajo de la banda." },
  { id: "usuario-sumar-empresa", viewport: desktop, board: "Usuario", props: { usuario: "Tomás (activo)" },
    actions: [click("button.cb-sec.ch")],
    state: "Ficha de Usuario: el diálogo «Sumar empresa», que guarda al momento (sin estado de error dibujado)." },
  { id: "empresa-roles-error", viewport: desktop, board: "Empresa", props: { pestana: "Miembros" },
    actions: empresaRolesErrorOnBoard,
    state: "Ficha de Empresa: el diálogo «Roles de Lucía Fernández» con el error arriba de los botones." },

  { id: "configuracion-salir-sin-guardar", viewport: phone, board: "M-Avisos", props: { caso: "Salir sin guardar" },
    state: "Configuración en el teléfono: «Cambios sin guardar» en la barra y la hoja «¿Salir sin guardar?»." },
  { id: "configuracion-otra-persona-cambio", viewport: phone, board: "M-Avisos", props: { caso: "Alguien cambió esto" },
    state: "Configuración en el teléfono: el 409, cartel debajo de la barra." },
  { id: "configuracion-error-del-servidor", viewport: phone, board: "M-Avisos", props: { caso: "Error del servidor" },
    state: "Configuración en el teléfono: un 5xx al guardar, en la franja oscura de abajo." },
  { id: "pagina-publica-base", viewport: phone, board: "M-Pagina-Org",
    state: "Página pública en el teléfono: el único estado dibujado (sin cambios)." },
  { id: "usuario-base", viewport: phone, board: "M-Usuario",
    state: "Ficha de Usuario en el teléfono: el único estado dibujado (sin cambios)." },
  { id: "usuario-sumar-empresa", viewport: phone, board: "M-Usuario-Empresa",
    state: "Ficha de Usuario en el teléfono: la hoja «Sumar empresa» (sin estado de error dibujado)." },
  { id: "empresa-base", viewport: phone, board: "M-Empresa",
    state: "Ficha de Empresa en el teléfono: el único estado dibujado (sin diálogos ni errores)." },

  { id: "criterio-avisos-donde-se-muestra", viewport: desktop, board: "Criterio-Avisos", section: "¿Dónde se muestra?",
    state: "Criterio · Avisos: dónde va cada cosa (el error de un formulario, en el formulario; el de una acción directa, en el aviso rojo)." },
  { id: "criterio-avisos-donde-queda", viewport: desktop, board: "Criterio-Avisos", section: "Dónde queda cada uno en la pantalla",
    state: "Criterio · Avisos: el cartel debajo de la banda y el aviso abajo a la derecha." },
  { id: "criterio-avisos-como-se-ve", viewport: desktop, board: "Criterio-Avisos", section: "Cómo se ve cada uno",
    state: "Criterio · Avisos: cómo se ve cada uno, con la pantalla de error y «Reintentar»." },
  { id: "criterio-avisos-prohibido", viewport: desktop, board: "Criterio-Avisos", section: "Prohibido",
    state: "Criterio · Avisos: prohibido, entre otros, el mismo error en dos lugares." },
  { id: "criterio-formularios-errores", viewport: desktop, board: "Criterio-Formularios", section: "Errores",
    state: "Criterio · Formularios: el error general, en una franja roja clara arriba de los botones." },
  { id: "criterio-dialogos-confirmar", viewport: desktop, board: "Criterio-Dialogos", section: "Confirmar algo que no se deshace",
    state: "Criterio · Diálogos: la confirmación de 420 px, sin ✕." },
  { id: "criterio-dialogos-como-se-comporta", viewport: desktop, board: "Criterio-Dialogos", section: "Cómo se comporta",
    state: "Criterio · Diálogos: se cierra con ✕, Cancelar o Escape; el error general, arriba de los botones." },
  { id: "criterio-dialogos-prohibido", viewport: desktop, board: "Criterio-Dialogos", section: "Prohibido",
    state: "Criterio · Diálogos: prohibido un diálogo arriba de otro." },
];

export function boardFile(entry) {
  const size = entry.section ? `${entry.viewport.width}` : `${entry.viewport.width}x${entry.viewport.height}`;
  return path.join(output, "tableros", `${entry.id}-${size}.png`);
}

// Las de la vista en vivo (un clic por selector CSS, `text=` o rol y nombre) más escribir en un campo.
async function runBoardActions(page, actions = []) {
  for (const action of actions) {
    if (action.type === "fill") {
      const field = page.getByRole("textbox", { name: action.name });
      await field.fill(action.value);
      await field.blur();
    } else if (action.type === "click" && action.selector?.startsWith("text=")) {
      await page.getByText(action.selector.slice(5), { exact: true }).last().click();
    } else if (action.type === "click") {
      await page.locator(action.selector).first().click();
    } else if (action.type === "toggle") {
      await page.locator(action.selector).filter({ has: page.getByText(action.text, { exact: true }) }).first()
        .locator('input[type="checkbox"]').click();
    } else {
      throw new Error(`Acción de tablero desconocida: ${action.type}`);
    }
    await page.waitForTimeout(150);
  }
}

export async function captureBoard(browser, canvasUrl, entry, file = boardFile(entry)) {
  mkdirSync(path.dirname(file), { recursive: true });
  const context = await browser.newContext({ viewport: entry.viewport, deviceScaleFactor: 1, locale: "es-AR" });
  try {
    const page = await context.newPage();
    await page.goto(`${canvasUrl}/${entry.board}.dc.html`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => typeof window.__dcSetProps === "function" && Boolean(window.__dcRootName?.()));
    await page.evaluate((props) => window.__dcSetProps(window.__dcRootName(), props), entry.props ?? {});
    await page.locator("[data-sc-name]").first().waitFor();
    await page.waitForTimeout(200);
    await runBoardActions(page, entry.actions ?? entry.boardActions);
    await page.addStyleTag({ content: '@font-face { font-family: Inter; src: url("/_fonts/inter-latin-wght-normal.woff2") format("woff2"); font-style: normal; font-weight: 100 900; font-display: swap; }' });
    await page.evaluate(() => document.fonts.load("700 54px Inter"));
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: otpMaskStyle });
    if (entry.section) {
      await page.locator("section").filter({ has: page.getByRole("heading", { level: 2, name: entry.section, exact: true }) })
        .first().screenshot({ path: file });
    } else {
      await page.screenshot({ path: file });
    }
  } finally {
    await context.close();
  }
  return file;
}

// --- Tablero y app lado a lado (fase 2 en adelante) ---

const harness = (fixture, route) => `/src/test/visualApp.html?as=${fixture}&route=${encodeURIComponent(route)}`;
// Lo que responde el back hoy (Errors.resx): el texto de cada error sale de ahí, no se inventa.
const problem = (method, apiPath, code, detail) => api(method, apiPath, { code, title: "Conflicto", detail }, 409);
const concurrency = (method, apiPath) => problem(method, apiPath, "General.ConcurrencyConflict",
  "Otra persona cambió esto. Revisá la versión más reciente antes de guardar.");
const lucia = organizationUserRows.find((row) => row.memberId === "member-lucia");
const appFill = (name, value) => ({ type: "fill", role: "textbox", name, value });
const appClick = (role, name) => ({ type: "click", role, name });
const appPress = (role, name, key) => ({ type: "press", role, name, key });
// Tablero Avisos: con la zona cambiada a Córdoba, como el formulario de fondo de «Salir sin guardar» y del 409.
const cordoba = [appClick("combobox", "Zona horaria predeterminada"), appClick("option", "Córdoba")];
const saveChanges = appClick("button", "Guardar cambios");
const leaveDialog = { readySelector: '[role="dialog"]', readyText: "¿Salir sin guardar?" };

/// Un estado a 1440 y a 390: cada tamaño con su tablero (o el más cercano, si ese estado no está dibujado) y la app con
/// sus datos y sus pasos. Mismos campos que los manifiestos de las etapas, más `state`, que dice qué se ve, y `section`,
/// para comparar con una sección de un tablero «Criterio».
function pair({ id, state, group = "fase-2", desktop: desk, phone: mobile, route, fixture = "visual-owner", responses, actions = [], phoneActions = actions, ready = {} }) {
  return [["escritorio", desktop, desk, actions], ["movil", phone, mobile, phoneActions]].map(([suffix, viewport, board, appActions]) => ({
    id: `${id}-${suffix}`, pair: id, group, state: board.state ?? state, board: board.board, props: board.props ?? {},
    boardActions: board.actions ?? [], ...(board.section ? { section: board.section } : {}), viewport,
    app: {
      path: harness(fixture, route), captureMode: "harness", userFixture: fixture, responses, actions: appActions,
      readySelector: ready.readySelector ?? "main", ...(ready.readyText ? { readyText: ready.readyText } : {}),
    },
  }));
}

function buildCases() {
  const settings = settingsResponses("Verified");
  const settingsConflict = [concurrency("PUT", "/api/organization/settings"), ...settings];
  const publicPage = publicPageResponses("Publicada");
  // El back responde el 409 de la página pública como el de Configuración: General.ConcurrencyConflict.
  const publicPageConflict = [concurrency("PUT", "/api/organization/public-page"), ...publicPage];
  const tomas = userDetailResponses();
  const tomasConflict = [concurrency("PUT", "/api/users/member-1"), ...tomas];
  // Lucía es quien mira (visual-owner, id «lucia»), como el «Lucía (vos)» del tablero: la franja le dice qué hacer.
  const luciaLastOwner = [api("GET", "/api/users/member-lucia", { ...lucia, userId: "lucia" }), ...roleLists, userCompanyOptions,
    problem("PUT", "/api/users/member-lucia", "Tenancy.Member.LastTenantAdmin", "Tiene que quedar al menos un Dueño activo.")];
  const avisosLeave = { board: "Avisos", props: { caso: "Salir sin guardar" } };
  const mAvisosLeave = { board: "M-Avisos", props: { caso: "Salir sin guardar" } };
  const orgRoleOnDesk = (name) => [appClick("button", "Roles de la organización"), appClick("menuitemcheckbox", name), appPress("menuitemcheckbox", name, "Escape")];
  const orgRoleOnPhone = (name) => [appClick("button", "Roles de la organización"), appClick("checkbox", name), appPress("checkbox", name, "Escape")];
  const addCompany = [appClick("button", "Sumar empresa"), appClick("combobox", "Empresa"), appClick("option", "Beta S.R.L."), appClick("button", "Sumar")];

  return [
    ...pair({ id: "configuracion-cambios-sin-guardar", route: "/org/configuracion", responses: settings,
      state: "Configuración con el nombre cambiado: «Cambios sin guardar», solo, en la banda.",
      desktop: { board: "Configuracion", props: { dominio: "Verificado" }, actions: [fill("Nombre de la organización", "Grupo Delta Sur")] },
      phone: { board: "M-Configuracion", state: "Configuración en el teléfono con el nombre cambiado (el tablero no dibuja «Cambios sin guardar»)." },
      actions: [appFill("Nombre de la organización", "Grupo Delta Sur")] }),
    ...pair({ id: "configuracion-salir-sin-guardar", route: "/org/configuracion", responses: settings,
      state: "Configuración con cambios: salir pregunta «¿Salir sin guardar?» (B11).", desktop: avisosLeave, phone: mAvisosLeave,
      actions: [...cordoba, appClick("link", "Empresas")], phoneActions: [...cordoba, appClick("link", "Volver a Más")], ready: leaveDialog }),
    ...pair({ id: "configuracion-otra-persona-cambio", route: "/org/configuracion", responses: settingsConflict,
      state: "Configuración: el 409, solo en su cartel, y «Cambios sin guardar» en la banda.",
      desktop: { board: "Avisos", props: { caso: "Alguien cambió esto" } }, phone: { board: "M-Avisos", props: { caso: "Alguien cambió esto" } },
      actions: [...cordoba, saveChanges], ready: { readyText: "Otra persona cambió esto mientras lo editabas." } }),
    ...pair({ id: "pagina-publica-cambios-sin-guardar", route: "/org/pagina", responses: publicPage,
      state: "Página pública con el nombre cambiado: «Publicada · Cambios sin guardar».",
      desktop: { board: "Pagina-Org", props: { estado: "Publicada" }, actions: [fill("Nombre de la página", "Grupo Delta Sur")] },
      phone: { board: "M-Pagina-Org", state: "Página pública en el teléfono con el nombre cambiado (el tablero no dibuja «Cambios sin guardar»)." },
      actions: [appFill("Nombre de la página", "Grupo Delta Sur")] }),
    ...pair({ id: "pagina-publica-error-al-guardar", route: "/org/pagina", responses: publicPageConflict,
      state: "Página pública: el 409 al guardar, solo en su cartel, como en Configuración (Avisos › Alguien cambió esto).",
      desktop: { board: "Avisos", props: { caso: "Alguien cambió esto" } }, phone: { board: "M-Avisos", props: { caso: "Alguien cambió esto" } },
      actions: [appFill("Nombre de la página", "Grupo Delta Sur"), saveChanges], ready: { readyText: "Otra persona cambió esto mientras lo editabas." } }),
    ...pair({ id: "pagina-publica-salir-sin-guardar", route: "/org/pagina", responses: publicPage,
      state: "Página pública con cambios: salir pregunta «¿Salir sin guardar?» (tablero Avisos).", desktop: avisosLeave, phone: mAvisosLeave,
      actions: [appFill("Nombre de la página", "Grupo Delta Sur"), appClick("link", "Empresas")],
      phoneActions: [appFill("Nombre de la página", "Grupo Delta Sur"), appClick("link", "Volver a Más")], ready: leaveDialog }),
    ...pair({ id: "usuario-salir-sin-guardar", route: "/org/usuarios/member-1", responses: tomas,
      state: "Ficha de Usuario con cambios: salir pregunta «¿Salir sin guardar?» (tablero Avisos).", desktop: avisosLeave, phone: mAvisosLeave,
      actions: [...orgRoleOnDesk("Auditor"), appClick("link", "Empresas")],
      phoneActions: [...orgRoleOnPhone("Auditor"), appClick("link", "Volver a Usuarios")], ready: leaveDialog }),
    ...pair({ id: "usuario-error-al-guardar", route: "/org/usuarios/member-lucia", responses: luciaLastOwner,
      state: "Ficha de Usuario: una regla rechaza el guardado y el error va en la franja debajo de la banda.",
      desktop: { board: "Usuario", props: { usuario: "Lucía (vos)" },
        actions: [openOrgRoles, click("text=Dueño"), click("button.o-capa"), click(".w-bnd .ac button.cb-pri")] },
      phone: { board: "M-Usuario", state: "Ficha de Usuario en el teléfono: la franja con el margen de las tarjetas (el tablero no dibuja el error)." },
      actions: [...orgRoleOnDesk("Dueño"), saveChanges], phoneActions: [...orgRoleOnPhone("Dueño"), saveChanges],
      ready: { readyText: "Tiene que quedar al menos un Dueño. Dale el rol a otra persona antes de quitártelo." } }),
    ...pair({ id: "usuario-dialogo-error", route: "/org/usuarios/member-1", responses: tomasConflict,
      state: "Ficha de Usuario: el 409 de «Sumar empresa» en la franja del diálogo, arriba de los botones (el tablero no dibuja el error).",
      desktop: { board: "Usuario", props: { usuario: "Tomás (activo)" }, actions: [click("button.cb-sec.ch")] },
      phone: { board: "M-Usuario-Empresa" },
      actions: addCompany, ready: { readySelector: '[role="dialog"] [role="alert"]' } }),
    ...phase3Cases(),
  ];
}

// Fase 3: los avisos que salían dos veces y los diálogos.
function phase3Cases() {
  const company = companyDetailResponses();
  const companies = companiesListResponses();
  const lastCompanyAdmin = problem("PUT", "/api/companies/company-1/members/member-lucia/roles", "Companies.Membership.LastCompanyAdmin",
    "Tiene que quedar al menos un administrador en la empresa.");
  const taxIdUsed = problem("POST", "/api/companies", "Tenancy.Company.TaxIdAlreadyUsed", "Ya hay una empresa con esa identificación fiscal.");
  const rolesError = [appClick("button", "Acciones para Lucía Fernández"), appClick("menuitem", "Cambiar roles"),
    appClick("button", "Roles en la empresa"), appClick("menuitemcheckbox", "Administrador"), appPress("menuitemcheckbox", "Administrador", "Escape"),
    appClick("button", "Guardar cambios")];
  const createCompany = appClick("button", "Crear empresa");
  const dialogAlert = { readySelector: '[role="dialog"] [role="alert"]' };
  return [
    ...pair({ id: "empresa-roles-error", group: "fase-3", route: "/org/empresas/company-1", responses: [lastCompanyAdmin, ...company],
      state: "Ficha de Empresa: el error del último administrador, una sola vez, en la franja del diálogo arriba de los botones.",
      desktop: { board: "Empresa", props: { pestana: "Miembros" }, actions: empresaRolesErrorOnBoard },
      phone: { board: "M-Empresa", state: "Ficha de Empresa en el teléfono: la hoja de roles con su franja (el tablero no dibuja la hoja ni el error)." },
      actions: rolesError, ready: dialogAlert }),
    ...pair({ id: "empresas-dialogo-error", group: "fase-3", route: "/org/empresas", responses: [taxIdUsed, ...companies],
      state: "Empresas: «Crear empresa» con un error del servidor, en la franja arriba de los botones (el tablero no dibuja ese error).",
      desktop: { board: "Empresas", actions: [click("button.b-pri")] },
      phone: { board: "M-Empresas", state: "Empresas en el teléfono: la hoja de crear con su franja (el tablero no dibuja la hoja ni el error)." },
      actions: [createCompany, appFill("Nombre", "Delta Oeste S.A."), appFill("CUIT", "30712345671"), createCompany], ready: dialogAlert }),
    ...pair({ id: "usuario-sumar-empresa", group: "fase-3", route: "/org/usuarios/member-1", responses: userDetailResponses(),
      state: "Ficha de Usuario: «Sumar empresa», el diálogo chico de 420 px.",
      desktop: { board: "Usuario", props: { usuario: "Tomás (activo)" }, actions: [click("button.cb-sec.ch")] },
      phone: { board: "M-Usuario-Empresa", state: "Ficha de Usuario en el teléfono: la hoja «Sumar empresa»." },
      actions: [appClick("button", "Sumar empresa")], ready: { readySelector: '[role="dialog"]' } }),
    ...pair({ id: "dialogo-fondo", group: "fase-3", route: "/org/empresas", responses: companies,
      state: "Un diálogo abierto: atrás, la pantalla solo oscurecida, sin difuminar (lienzo v97).",
      desktop: { board: "Empresas", actions: [click("button.b-pri")] },
      phone: { board: "M-Empresas", state: "Empresas en el teléfono: la hoja de crear sobre la lista oscurecida (el tablero no dibuja la hoja)." },
      actions: [createCompany], ready: { readySelector: '[role="dialog"]' } }),
    ...pair({ id: "sesion-error-api-me", group: "fase-3", route: "/org",
      responses: [api("GET", "/api/me", { status: 500, title: "Error", traceId: "00-f7-fase3-01" }, 500)],
      state: "Si falla /api/me: la «Pantalla de error», con «Reintentar».",
      desktop: { board: "Criterio-Avisos", section: "Cómo se ve cada uno",
        state: "Si falla /api/me: la «Pantalla de error», con «Reintentar» (Criterio · Avisos › Pantalla de error)." },
      phone: { board: "M-Error-Org", props: { caso: "No se pudo abrir" },
        state: "Si falla /api/me, en el teléfono: la «Pantalla de error» (M-Error-Org › No se pudo abrir); sin /api/me todavía no hay barra ni marco." },
      ready: { readySelector: '[role="alert"]', readyText: "No pudimos abrir esta pantalla" } }),
  ];
}

export function writeManifest() {
  mkdirSync(output, { recursive: true });
  const cases = buildCases();
  writeFileSync(manifestFile, `${JSON.stringify({ version: 1, cases }, null, 2)}\n`);
  return validateManifest(manifestFile, canvas);
}

async function captureApp(browser, appUrl, entry, file) {
  const context = await browser.newContext({ viewport: entry.viewport, deviceScaleFactor: 1, locale: "es-AR" });
  try {
    await installApiMocks(context, entry.app.responses, entry.app.userFixture);
    const app = await context.newPage();
    await app.goto(new URL(entry.app.path, appUrl).href, { waitUntil: "domcontentloaded" });
    await runAppActions(app, entry.app.actions);
    await app.locator(entry.app.readySelector ?? "main").first().waitFor();
    if (entry.app.readyText) await app.getByText(entry.app.readyText).first().waitFor();
    await app.waitForTimeout(300);
    await waitForAppFont(app);
    await app.addStyleTag({ content: otpMaskStyle });
    await app.screenshot({ path: file });
  } finally {
    await context.close();
  }
}

// Una sola imagen para mirar: el tablero a la izquierda y la app a la derecha, con su rótulo.
async function composeSideBySide(browser, entry, files) {
  const image = (file) => `data:image/png;base64,${readFileSync(file).toString("base64")}`;
  const figure = (label, file) => `<figure><figcaption>${label}</figcaption><img src="${image(file)}"></figure>`;
  const page = await browser.newPage({ viewport: { width: entry.viewport.width * 2 + 72, height: entry.viewport.height + 80 }, deviceScaleFactor: 1 });
  try {
    await page.setContent(`<!doctype html><html><body style="margin:0;background:#ece6dc">
      <style>main{display:flex;gap:24px;padding:16px 24px 24px}figure{margin:0}figcaption{font:600 14px/1.6 system-ui,sans-serif;color:#3b352d;margin-bottom:6px}
      img{display:block;box-shadow:0 0 0 1px #d8d0c4}</style>
      <main>${figure(`Tablero · ${entry.board}`, files.board)}${figure("App", files.app)}</main></body></html>`);
    await page.waitForFunction(() => [...document.images].every((img) => img.complete));
    const file = files.app.replace(/-app\.png$/, "-lado-a-lado.png");
    await page.screenshot({ path: file, fullPage: true });
    return file;
  } finally {
    await page.close();
  }
}

function option(args, name) {
  const index = args.indexOf(name);
  return index < 0 ? null : args[index + 1] ?? null;
}

const relative = (file) => path.relative(root, file).replaceAll("\\", "/");

async function main(args) {
  const cases = writeManifest();
  if (args.includes("--verify")) {
    assertCapturedPairs(cases, output);
    console.log(`${cases.length} capturas de tablero y app de F7 verificadas.`);
    return;
  }
  const appUrl = option(args, "--app-url");
  const boardsOnly = args.includes("--tableros");
  if (!boardsOnly && !appUrl) throw new Error("Indicá --tableros (solo el lienzo) o --app-url del servidor Vite (lado a lado).");
  const id = option(args, "--id");
  const pairId = option(args, "--pair");
  const executablePath = option(args, "--browser-path") ?? process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  // Sin una ruta, el Chrome del sistema: el Chromium de Playwright no siempre está descargado.
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : { channel: "chrome" }) });
  const server = await startCanvasServer(canvas);
  try {
    if (boardsOnly) {
      const selected = boardCases.filter((entry) => !id || entry.id === id);
      if (selected.length === 0) throw new Error("No hay tableros para ese filtro.");
      for (const entry of selected) console.log(`${relative(await captureBoard(browser, server.url, entry))}: ${entry.state}`);
      return;
    }
    const selected = cases.filter((entry) => (!pairId || entry.pair === pairId) && (!id || entry.id === id));
    if (selected.length === 0) throw new Error("No hay pares para ese filtro.");
    for (const entry of selected) {
      const files = capturePaths(output, entry);
      await captureBoard(browser, server.url, entry, files.board);
      await captureApp(browser, appUrl, entry, files.app);
      console.log(`${relative(await composeSideBySide(browser, entry, files))}: ${entry.state}`);
    }
    assertCapturedPairs(selected, output);
  } finally {
    await server.close();
    await browser.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
