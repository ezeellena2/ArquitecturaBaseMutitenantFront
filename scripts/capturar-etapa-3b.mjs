import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { assertCapturedPairs, capturePaths, installApiMocks, otpMaskStyle, startCanvasServer, validateManifest } from "./capturar-etapa-3a.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "docs/design/capturas/etapa-3b");
const manifestFile = path.join(output, "manifest.json");
const company = { id: "1", type: "Email", value: "lucia.fernandez@delta.ejemplo.com", isPrimary: false, isVerified: true, managedByTenantId: "grupo-delta", managedByOrganizationName: "Grupo Delta", canRemove: true, canMakePrimary: true };
const personal = { id: "2", type: "Email", value: "lucia.fer@gmail.com", isPrimary: true, isVerified: true, canRemove: false, canMakePrimary: false };
const pending = { id: "4", type: "Email", value: "nuevo@ejemplo.com", isPrimary: false, isVerified: false, canRemove: true, canMakePrimary: false };
const google = { id: "5", type: "Google", value: "lucia.fer@gmail.com", isPrimary: false, isVerified: true, canRemove: true, canMakePrimary: false };
const boardEmail = { id: 4, tipo: "correo", valor: pending.value, principal: false, admin: null, verificado: false };
const boardGoogle = { id: 5, tipo: "google", valor: google.value, principal: false, admin: null, verificado: true };
const boardMethods = [{ id: 1, tipo: "correo", valor: company.value, principal: false, admin: "Grupo Delta", verificado: true }, { id: 2, tipo: "correo", valor: personal.value, principal: true, admin: null, verificado: true }];
const click = (role, name, nth) => ({ type: "click", role, name, ...(nth === undefined ? {} : { nth }) });
const fill = (name, value) => ({ type: "fill", role: "textbox", name, value });
const otp = { type: "otp", value: "123456" };
const add = click("button", "Agregar correo o teléfono");
const send = click("button", "Enviar código");
const methodMenu = (value) => click("button", `Acciones de ${value}`);
const response = (method, apiPath, body, status = 200) => ({ method, path: apiPath, body, status });
const proof = response("POST", "/api/me/reauth", { sourceMethodId: "2", destination: "lu•••@gmail.com", resendAfterSeconds: 60 });
const requestEmail = response("POST", "/api/me/login-methods", { methodId: "4", resendAfterSeconds: 60 });
const codeError = response("POST", "/api/me/login-methods/4/verify", { code: "Auth.LoginCode.Invalid", detail: "El código no es correcto." }, 400);
const scenarios = [];
function account(id, extra = {}) { scenarios.push({ id, group: "cuenta", board: "Cuenta", props: { metodos: "Con correo personal", baja: "Puede darse de baja" }, ...extra }); }
account("cuenta-personal");
account("cuenta-guardada", { actions: [fill("Nombre y apellido", "Lucía Fernández Pérez"), click("button", "$save")], responses: [response("PUT", "/api/me", {})], afterName: "Lucía Fernández Pérez", boardState: { nombre: "Lucía Fernández Pérez", guardado: { nombre: "Lucía Fernández Pérez", idioma: "es-AR", zona: "America/Argentina/Buenos_Aires" }, aviso: "Guardamos tus datos." }, readyText: "Guardamos tus datos." });
account("cuenta-navegacion-movil", { mobileOnly: true, actions: [click("button", "Abrir o contraer navegación")], boardState: { abierto: "drawer" } });
account("cuenta-solo-empresa", { props: { metodos: "Solo el correo de la empresa", baja: "Puede darse de baja" }, methods: [{ ...company, isPrimary: true, canRemove: false, canMakePrimary: false }], needsOwn: true });
account("cuenta-sucia", { actions: [fill("Nombre y apellido", "Lucía Fernández Pérez")], boardState: { nombre: "Lucía Fernández Pérez" } });
account("cuenta-descartada", { actions: [fill("Nombre y apellido", "Lucía Fernández Pérez"), click("button", "$discard")], boardState: {} });
account("cuenta-idiomas", { actions: [click("combobox", "Idioma y región")], boardState: { abierto: "Idioma" } });
account("cuenta-zonas", { actions: [click("combobox", "Zona horaria")], boardState: { abierto: "Zona" } });
account("cuenta-menu-usuario", { actions: [click("button", "$user")], boardState: { abierto: "usuario" } });
account("cuenta-menu-ultimo-propio", { actions: [methodMenu(personal.value)], boardState: { abierto: "fila:2" } });
account("cuenta-menu-empresa", { actions: [methodMenu(company.value)], boardState: { abierto: "fila:1" } });
account("cuenta-google-vinculado", { methods: [company, { ...personal, canRemove: true }, google], boardState: { metodos: [...boardMethods, boardGoogle] } });
account("cuenta-pendiente", { methods: [company, personal, pending], boardState: { metodos: [...boardMethods, boardEmail] } });
account("agregar-correo", { actions: [add], boardState: { dialogo: "agregar", paso: "valor" } });
account("agregar-invalido", { actions: [add, fill("Correo", "correo"), send], boardState: { dialogo: "agregar", paso: "valor", nuevo: "correo", errNuevo: "Ingresá un correo electrónico válido." } });
account("agregar-duplicado", { actions: [add, fill("Correo", "ana.gomez@gmail.com"), send], responses: [response("POST", "/api/me/login-methods", { code: "Identity.LoginMethod.AlreadyUsed", errors: { email: ["Ese correo ya lo usa otra cuenta."] } }, 400)], boardState: { dialogo: "agregar", paso: "valor", nuevo: "ana.gomez@gmail.com", errNuevo: "Ese correo ya lo usa otra cuenta." }, readyText: "Ese correo ya lo usa otra cuenta." });
account("agregar-codigo", { actions: [add, fill("Correo", pending.value), send], responses: [requestEmail], boardState: { dialogo: "agregar", paso: "codigo", nuevo: pending.value }, readySelector: 'input[inputmode="numeric"]' });
account("agregar-codigo-incorrecto", { actions: [add, fill("Correo", pending.value), send, otp, click("button", "Verificar")], responses: [requestEmail, codeError], boardState: { dialogo: "agregar", paso: "codigo", nuevo: pending.value, cod: ["1", "2", "3", "4", "5", "6"], errNuevo: "El código no es correcto." }, readyText: "El código no es correcto." });
account("agregar-verificado", { actions: [add, fill("Correo", pending.value), send, otp, click("button", "Verificar")], responses: [requestEmail, response("POST", "/api/me/login-methods/4/verify", {})], afterMethods: [company, { ...personal, canRemove: true }, { ...pending, isVerified: true }], boardState: { metodos: [...boardMethods, { ...boardEmail, verificado: true }], aviso: `Agregamos ${pending.value}. Ya podés entrar con ese correo.` }, readyText: `Agregamos ${pending.value}.` });
account("verificar-pendiente", { methods: [company, personal, pending], actions: [methodMenu(pending.value), click("menuitem", "Verificar")], responses: [response("POST", "/api/me/login-methods/4/code", { methodId: "4", resendAfterSeconds: 60 })], boardState: { metodos: [...boardMethods, boardEmail], dialogo: "verificar", verificarId: 4, paso: "codigo", nuevo: pending.value }, readySelector: 'input[inputmode="numeric"]' });
for (const [id, action, menu] of [["hacer-principal", "principal", "Hacer principal"], ["quitar-correo", "quitar", "Quitar"]]) account(id, { actions: [methodMenu(company.value), click("menuitem", menu)], responses: [proof], boardState: { dialogo: action, objetivoId: 1, paso: "codigo" }, readySelector: 'input[inputmode="numeric"]' });
account("desvincular-google", { methods: [company, { ...personal, canRemove: true }, google], actions: [click("button", `Acciones de ${google.value}`, 1), click("menuitem", "Desvincular")], responses: [proof], boardState: { metodos: [...boardMethods, boardGoogle], dialogo: "quitar", objetivoId: 5, paso: "codigo" }, readySelector: 'input[inputmode="numeric"]' });
for (const [id, menu, pathSuffix, text] of [["principal-cambiado", "Hacer principal", "/primary", `Desde ahora te avisamos a ${company.value}.`], ["correo-quitado", "Quitar", "", `Quitamos ${company.value}.`]]) account(id, { actions: [methodMenu(company.value), click("menuitem", menu), otp, click("button", menu)], responses: [proof, response("POST", "/api/me/reauth/verify", { reauthTicket: "visual-proof" }), response(pathSuffix ? "PUT" : "DELETE", `/api/me/login-methods/1${pathSuffix}`, {})], afterMethods: pathSuffix ? [{ ...company, isPrimary: true }, { ...personal, isPrimary: false }] : [personal], boardState: { metodos: pathSuffix ? boardMethods.map((method) => ({ ...method, principal: method.id === 1 })) : [boardMethods[1]], aviso: text }, readyText: text });
account("google-vinculado-aviso", { route: "/cuenta?google=linked", methods: [company, { ...personal, canRemove: true }, google], boardState: { metodos: [...boardMethods, boardGoogle], aviso: "Vinculamos tu cuenta de Google." }, readyText: "Vinculamos tu cuenta de Google." });
account("google-desvinculado-aviso", { methods: [company, { ...personal, canRemove: true }, google], actions: [click("button", `Acciones de ${google.value}`, 1), click("menuitem", "Desvincular"), otp, click("button", "Desvincular")], responses: [proof, response("POST", "/api/me/reauth/verify", { reauthTicket: "visual-proof" }), response("DELETE", "/api/me/login-methods/5", {})], afterMethods: [company, personal], boardState: { metodos: boardMethods, aviso: "Desvinculamos tu cuenta de Google." }, readyText: "Desvinculamos tu cuenta de Google." });
account("baja-dialogo", { actions: [click("button", "Dar de baja")], responses: [proof], boardState: { dlgBaja: true }, readySelector: 'input[inputmode="numeric"]' });
account("baja-codigo-incompleto", { actions: [click("button", "Dar de baja"), fill("Motivo", "Prueba visual"), { ...otp, value: "123" }], responses: [proof], boardState: { dlgBaja: true, motivoBaja: "Prueba visual", codBaja: ["1", "2", "3", "", "", ""] }, readySelector: 'input[inputmode="numeric"]' });
account("baja-motivo-requerido", { actions: [click("button", "Dar de baja"), otp, click("button", "Dar de baja mi cuenta")], responses: [proof], boardState: { dlgBaja: true, codBaja: ["1", "2", "3", "4", "5", "6"], errMotivoBaja: "Escribí el motivo." }, readyText: "Escribí el motivo." });
account("baja-codigo-incorrecto", { actions: [click("button", "Dar de baja"), fill("Motivo", "Prueba visual"), otp, click("button", "Dar de baja mi cuenta")], responses: [proof, response("POST", "/api/me/reauth/verify", { code: "Auth.LoginCode.Invalid", detail: "El código no es correcto." }, 400)], boardState: { dlgBaja: true, motivoBaja: "Prueba visual", codBaja: ["1", "2", "3", "4", "5", "6"], errCodBaja: "El código no es correcto." }, readyText: "El código no es correcto." });
account("baja-operador", { actions: [click("button", "Dar de baja")], responses: [response("POST", "/api/me/reauth", { code: "Identity.Account.PlatformOwnerCannotDelete", detail: "El operador de la plataforma no puede dar de baja su cuenta." }, 400)], boardState: { dlgBaja: true, errBaja: "El operador de la plataforma no puede dar de baja su cuenta." }, readyText: "El operador de la plataforma no puede dar de baja su cuenta.", note: "Estado de política del backend; el tablero no trae variante de operador, se fija solo el texto del error." });
account("baja-sesion-cerrada", { route: "/", session: "deletion", boardState: { dadaDeBaja: true }, readyText: "Cerramos tu sesión" });
for (const [key, label, docs] of [["ambos", "Cambiaron los dos", [{ id: "terms", kind: "Terms", version: 3 }, { id: "privacy", kind: "Privacy", version: 2 }]], ["terminos", "Cambiaron los términos", [{ id: "terms", kind: "Terms", version: 3 }]], ["privacidad", "Cambió la privacidad", [{ id: "privacy", kind: "Privacy", version: 2 }]]]) {
  for (const accepted of [false, true]) scenarios.push({ id: `aceptar-${key}-${accepted ? "marcado" : "sin-marcar"}`, group: "legales", board: "Aceptar-Terminos", props: { caso: label }, route: "/aceptar-terminos", legal: docs, actions: accepted ? [click("checkbox", "Leí y acepto los Términos y la Política de privacidad")] : [], boardState: { acepta: accepted }, readyText: "Actualizamos los términos" });
}
for (const access of ["Persona", "Empresa"]) for (const cancelling of [false, true]) scenarios.push({ id: `ingreso-baja-${access.toLowerCase()}${cancelling ? "-cancelando" : ""}`, group: "ingreso", board: "Ingreso", props: { estado: "Cuenta con la baja pedida", puerta: access }, route: `${access === "Empresa" ? "/login/empresa" : "/login"}?error=Identity.Account.PendingDeletion`, responses: [response("POST", "/api/auth/deletion/pending", { scheduledForUtc: "2026-10-27T17:35:00Z", cancelTicket: "capture-proof", timeZoneId: "America/Argentina/Buenos_Aires", returnUrl: "/connect/authorize", cancelTicketExpiresAtUtc: "2026-09-27T17:40:00Z" }), ...(cancelling ? [response("POST", "/api/auth/deletion/cancel", {}, 200)] : [])], actions: cancelling ? [click("button", "Cancelar la baja y entrar")] : [], boardState: cancelling ? { cancelandoBaja: true } : {}, readyText: "Tu cuenta tiene la baja pedida" });
scenarios.push({ id: "inicio-aviso-personal", group: "inicios", board: "Inicio-Personal", props: { aviso: "Solo tiene el correo de la empresa" }, route: "/", needsOwn: true, readyText: "Agregá un correo personal o tu WhatsApp" });
scenarios.push({ id: "ingreso-baja-cancelada", group: "ingreso", board: "Ingreso", props: { estado: "Cuenta con la baja pedida", puerta: "Persona" }, route: "/login?error=Identity.Account.PendingDeletion", session: "cancelled", responses: [response("POST", "/api/auth/deletion/pending", { scheduledForUtc: "2026-10-27T17:35:00Z", cancelTicket: "capture-proof", timeZoneId: "America/Argentina/Buenos_Aires", returnUrl: "/connect/authorize", cancelTicketExpiresAtUtc: "2026-09-27T17:40:00Z" }), response("POST", "/api/auth/deletion/cancel", { returnUrl: "/connect/authorize" })], actions: [click("button", "Cancelar la baja y entrar")], boardState: { aviso: "Cancelamos la baja." }, readyText: "Cancelamos la baja.", note: "Instante previo a seguir la redirección: el arnés mantiene la vista para fotografiar el toast; el E2E real sí completa el ingreso." });

async function actions(page, entries = [], mobile = false) {
  for (const action of entries) {
    if (action.type === "otp") {
      await page.getByRole("textbox", { name: "Código 1" }).fill(action.value);
      continue;
    }
    const name = action.name === "$discard" ? mobile ? "Descartar" : "Descartar cambios" : action.name === "$save" ? mobile ? "Guardar" : "Guardar cambios" : action.name === "$user" ? mobile ? "Tu cuenta y tus perfiles" : "Lucía Fernández, Personal" : action.name;
    let locator = page.getByRole(action.role, { name, exact: true });
    if (action.nth !== undefined) locator = locator.nth(action.nth);
    if (action.type === "fill") await locator.fill(action.value); else await locator.click();
  }
}

async function capture(browser, canvasUrl, appUrl, entry) {
  const files = capturePaths(output, entry);
  mkdirSync(path.dirname(files.app), { recursive: true });
  const context = await browser.newContext({ viewport: entry.viewport, locale: "es-AR", ignoreHTTPSErrors: true });
  try {
    const board = await context.newPage();
    await board.goto(`${canvasUrl}/${entry.board}.dc.html`);
    await board.waitForFunction(() => typeof window.__dcSetProps === "function");
    await board.evaluate(({ props, state }) => {
      const name = window.__dcRootName();
      window.__dcSetProps(name, props);
      if (state && Object.keys(state).length) {
        const source = document.querySelector("script[data-dc-script]").textContent;
        const injected = source.replace("renderVals() {", `renderVals() { if (!this.__captureStateApplied && Object.entries(${JSON.stringify(props)}).every(([key, value]) => this.props[key] === value)) { if (typeof this.inicial === 'function' && this.state.clave !== undefined) Object.assign(this.state, this.inicial(this.props), { clave: (this.props.estado || '') + '|' + (this.props.cuenta || '') + '|' + (this.props.puerta || '') }); Object.assign(this.state, ${JSON.stringify(state)}); this.__captureStateApplied = true; }`);
        window.__dcUpdate(name, "js", injected, false);
        window.__dcSetProps(name, props);
      }
    }, { props: entry.props, state: entry.boardState });
    await board.waitForTimeout(100);
    await board.addStyleTag({ content: '@font-face { font-family: Inter; src: url("/_fonts/inter-latin-wght-normal.woff2") format("woff2"); font-weight: 100 900; }' + otpMaskStyle });
    await board.evaluate(() => document.fonts.ready);
    if (entry.email) {
      await board.locator(".plantilla").screenshot({ path: files.board });
      await context.route("https://ejemplo.com/favicon.svg", (route) => route.fulfill({ contentType: "image/svg+xml", body: readFileSync(path.join(root, "public/favicon.svg")) }));
      const app = await context.newPage();
      await app.goto(new URL(entry.app.path, appUrl).href);
      await app.locator('table[style*="max-width:560px"]').screenshot({ path: files.app });
      return;
    }
    await board.screenshot({ path: files.board });
    await installApiMocks(context, entry.app.responses, "visual-personal");
    if (entry.app.afterMethods || entry.app.afterName) {
      let changed = false;
      await context.route("**/api/me**", async (route) => {
        const request = route.request();
        const pathname = new URL(request.url()).pathname;
        if (request.method() !== "GET") { changed = true; await route.fallback(); return; }
        if (changed && pathname === "/api/me/login-methods" && entry.app.afterMethods) {
          await route.fulfill({ json: { methods: entry.app.afterMethods, canLinkGoogle: true, needsPersonalLoginMethod: false, accountDeletionGraceDays: 30 } }); return;
        }
        if (changed && pathname === "/api/me" && entry.app.afterName) {
          await route.fulfill({ json: { ...visualPersonal, displayName: entry.app.afterName } }); return;
        }
        await route.fallback();
      });
    }
    if (entry.pair.endsWith("-cancelando")) await context.route("**/api/auth/deletion/cancel", () => new Promise(() => {}));
    const app = await context.newPage();
    await app.goto(new URL(entry.app.path, appUrl).href);
    await app.getByRole(entry.group === "inicios" ? "main" : "heading").first().waitFor();
    await actions(app, entry.app.actions, entry.viewport.width === 390);
    if (entry.app.readySelector) await app.locator(entry.app.readySelector).first().waitFor();
    if (entry.app.readyText) await app.getByText(entry.app.readyText, { exact: false }).first().waitFor();
    await app.waitForTimeout(entry.app.readyText && /^(Guardamos|Agregamos|Quitamos|Desde ahora|Vinculamos|Desvinculamos|Cancelamos)/.test(entry.app.readyText) ? 800 : 200);
    await app.evaluate(() => document.fonts.ready);
    await app.addStyleTag({ content: otpMaskStyle });
    await app.screenshot({ path: files.app });
  } finally { await context.close(); }
}

const { visualPersonal } = await import("../src/test/mocks/currentUsers.ts");
const cases = scenarios.flatMap((scenario) => [1440, 390].map((width) => {
  const params = new URLSearchParams({ as: "visual-personal", route: scenario.route ?? "/cuenta", ...(scenario.session ? { session: scenario.session } : {}) });
  return { id: `${scenario.id}-${width === 390 ? "movil" : "escritorio"}`, pair: scenario.id, group: scenario.group, board: `${width === 390 ? "M-" : ""}${scenario.board}`, props: scenario.props, viewport: { width, height: width === 390 ? 844 : 900 }, boardState: scenario.mobileOnly && width !== 390 ? {} : scenario.boardState, note: scenario.note,
    app: { path: `/src/test/visualApp.html?${params}`, captureMode: "harness", actions: scenario.mobileOnly && width !== 390 ? [] : scenario.actions, readyText: scenario.readyText, readySelector: scenario.readySelector, afterMethods: scenario.afterMethods, afterName: scenario.afterName, responses: [
      response("GET", "/api/me", { ...visualPersonal, needsPersonalLoginMethod: scenario.needsOwn ?? false, pendingLegalDocuments: scenario.legal ?? [] }),
      response("GET", "/api/me/login-methods", { methods: scenario.methods ?? [company, personal], canLinkGoogle: !scenario.methods?.some((method) => method.type === "Google"), needsPersonalLoginMethod: scenario.needsOwn ?? false, accountDeletionGraceDays: 30 }), ...(scenario.responses ?? []),
    ] } };
}));
for (const [key, label] of [["verificar-metodo", "Código para verificar un método"], ["metodo-agregado", "Método de ingreso agregado"], ["metodo-quitado", "Método de ingreso quitado"], ["principal-cambiado", "Método principal cambiado"], ["baja-pedida", "Baja pedida"], ["baja-cancelada", "Baja cancelada"], ["cuenta-eliminada", "Cuenta eliminada"]]) {
  for (const culture of ["es-AR", "en-US"]) for (const width of [1440, 390]) cases.push({
    id: `correo-${key}-${culture.toLowerCase()}-${width === 390 ? "movil" : "escritorio"}`, pair: `correo-${key}-${culture.toLowerCase()}`, group: "correos", board: "Mensajes", props: { mensaje: label, canal: "Correo" }, viewport: { width, height: width === 390 ? 844 : 900 }, email: true,
    note: "Se compara la plantilla, sin la interfaz del cliente de correo. Mensajes tiene un tablero en español; el caso agregado ilustra WhatsApp (E8) y aquí se ejerce la variante correo. Inglés y ancho móvil se verifican sobre HTML real.",
    app: { path: `/docs/design/capturas/etapa-3b/correos/html/${key}-${culture}.html` },
  });
}
mkdirSync(output, { recursive: true });
writeFileSync(manifestFile, JSON.stringify({ version: 1, cases }, null, 2) + "\n");
validateManifest(manifestFile, path.join(root, "docs/design/lienzo"));
if (process.argv.includes("--verify")) { assertCapturedPairs(cases, output); console.log(`${cases.length} pares visuales 3b completos.`); }
else {
  const appUrl = process.argv[process.argv.indexOf("--app-url") + 1];
  if (!process.argv.includes("--app-url")) throw new Error("Indicá --app-url del servidor Vite visual.");
  const id = process.argv.includes("--id") ? process.argv[process.argv.indexOf("--id") + 1] : null;
  const browser = await chromium.launch({ headless: true });
  const canvas = await startCanvasServer();
  try {
    for (const entry of cases.filter((item) => !id || item.pair === id)) {
      await capture(browser, canvas.url, appUrl, entry);
      console.log(`${entry.id}: lienzo + app`);
    }
  } finally { await canvas.close(); await browser.close(); }
}
