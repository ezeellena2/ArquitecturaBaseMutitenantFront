// Etapa 3b: Mi cuenta, aceptar términos, el ingreso con la baja pedida, el aviso del inicio y los correos, contra el
// lienzo vigente (docs/design/lienzo). Cada estado se compara con el tablero que lo dibuja, puesto en ese estado con sus
// props y sus pasos, como el relevamiento: sin inyectarle nada al tablero. Lo que el lienzo vigente no dibuja se compara
// con el estado más cercano y lo dice su nota.
//
// - capturar:  node scripts/capturar-etapa-3b.mjs --app-url http://127.0.0.1:5191 [--id <par>] [--out <carpeta>] [--lienzo <copia>]
// - comprobar: node scripts/capturar-etapa-3b.mjs --verify [--out <carpeta>]
// Sin --out, el manifest y las imágenes lado a lado van a docs/design/capturas/etapa-3b; las imágenes sueltas (tablero y
// app) quedan en una carpeta temporal (--tmp). Con --lienzo se fotografía una copia limpia del lienzo vigente (la de un
// commit), para que todos los casos de una corrida vean los mismos tableros.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { installApiMocks, otpMaskStyle, startCanvasServer, validateManifest, waitForAppFont } from "./capturar-etapa-3a.mjs";
import { assertSideBySide, canvas, composeSideBySide, openBoard, sideBySideFile } from "./capturar-relevamiento.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stageOutput = path.join(root, "docs/design/capturas/etapa-3b");
const company = { id: "1", type: "Email", value: "lucia.fernandez@delta.ejemplo.com", isPrimary: false, isVerified: true, managedByTenantId: "grupo-delta", managedByOrganizationName: "Grupo Delta", canRemove: true, canMakePrimary: true };
const personal = { id: "2", type: "Email", value: "lucia.fer@gmail.com", isPrimary: true, isVerified: true, canRemove: false, canMakePrimary: false };
const pending = { id: "4", type: "Email", value: "nuevo@ejemplo.com", isPrimary: false, isVerified: false, canRemove: true, canMakePrimary: false };
const google = { id: "5", type: "Google", value: "lucia.fer@gmail.com", isPrimary: false, isVerified: true, canRemove: true, canMakePrimary: false };
const click = (role, name, nth) => ({ type: "click", role, name, ...(nth === undefined ? {} : { nth }) });
const fill = (name, value) => ({ type: "fill", role: "textbox", name, value });
const otp = { type: "otp", value: "123456" };
const add = click("button", "Agregar correo o teléfono");
const verify = click("button", "Verificar");
const send = click("button", "Enviar código");
const methodMenu = (value) => click("button", `Acciones de ${value}`);
const response = (method, apiPath, body, status = 200) => ({ method, path: apiPath, body, status });
const proof = response("POST", "/api/me/reauth", { sourceMethodId: "2", destination: "lu•••@gmail.com", resendAfterSeconds: 60 });
const requestEmail = response("POST", "/api/me/login-methods", { methodId: "4", resendAfterSeconds: 60 });
const codeError = response("POST", "/api/me/login-methods/4/verify", { code: "Auth.LoginCode.Invalid", detail: "El código no es correcto." }, 400);
const reauthVerified = response("POST", "/api/me/reauth/verify", { reauthTicket: "visual-proof" });
// Desde la etapa 4, agregar un correo pide antes el código de la sesión (la prueba): después aparece el campo «Correo».
const addAfterProof = [add, otp, verify];
const proven = [proof, reauthVerified];
// Como el back (AccountLoginMethodsService): el principal primero y después el resto, en su orden.
const byPrimary = (methods) => methods && [...methods].sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary));

// El tablero de cada estado, en la compu y en el teléfono. La app todavía no tiene el módulo de WhatsApp: Mi cuenta se
// compara con su estado «Sin el módulo de WhatsApp» (en el teléfono, los avisos lo traen dibujado igual).
const noWhatsApp = "Sin el módulo de WhatsApp";
const accountBase = (note) => ({ desktop: { board: "Cuenta", props: { whatsapp: noWhatsApp } }, phone: { board: "M-Cuenta", props: { estado: noWhatsApp } }, note });
const accountNotice = (aviso, note) => ({ desktop: { board: "Cuenta", props: { whatsapp: noWhatsApp, aviso } }, phone: { board: "M-Cuenta", props: { estado: aviso } }, note });
const accountDialog = (board, estado, note) => ({ desktop: { board, props: { estado } }, phone: { board: `M-${board}`, props: { estado } }, note });
const boardAction = (selector) => ({ type: "click", selector });

const scenarios = [];
function account(id, look, extra = {}) { scenarios.push({ id, group: "cuenta", look, ...extra }); }
account("cuenta-personal", accountBase());
account("cuenta-guardada", accountBase("El lienzo vigente no dibuja el aviso «Guardamos tus datos.»: se compara con Mi cuenta."), { actions: [fill("Nombre y apellido", "Lucía Fernández Pérez"), click("button", "$save")], responses: [response("PUT", "/api/me", {})], afterName: "Lucía Fernández Pérez", readyText: "Guardamos tus datos." });
account("cuenta-solo-empresa", accountBase("El lienzo vigente no dibuja la cuenta con solo el correo de la empresa: se compara con Mi cuenta."), { methods: [{ ...company, isPrimary: true, canRemove: false, canMakePrimary: false }], needsOwn: true });
account("cuenta-sucia", { desktop: { board: "Cuenta", props: { whatsapp: noWhatsApp }, boardActions: [{ type: "fill", name: "Nombre y apellido", value: "Lucía Fernández Pérez" }] }, phone: { board: "M-Cuenta", props: { estado: "Cambios sin guardar" } } }, { actions: [fill("Nombre y apellido", "Lucía Fernández Pérez")] });
account("cuenta-descartada", accountBase(), { actions: [fill("Nombre y apellido", "Lucía Fernández Pérez"), click("button", "$discard")] });
account("cuenta-idiomas", accountBase("El tablero no abre «Idioma y región»: se compara con Mi cuenta."), { actions: [click("combobox", "Idioma y región")] });
account("cuenta-zonas", accountBase("El tablero no abre «Zona horaria»: se compara con Mi cuenta."), { actions: [click("combobox", "Zona horaria")] });
// En el teléfono, la cuenta y los perfiles están en «Más» (M-Mas-Personal) y Mi cuenta vuelve a él con el «‹».
account("cuenta-menu-usuario", { desktop: { board: "Cuenta", props: { whatsapp: noWhatsApp }, boardActions: [boardAction('summary[aria-label="Abrir tu menú"]')] }, phone: { board: "M-Mas-Personal", props: {} } }, { actions: [click("button", "$user")] });
// Sin «cuenta-menu-ultimo-propio»: el back no le da acciones al principal (canRemove y canMakePrimary en falso), así
// que su fila no lleva ⋮ («Criterio · Menús»: solo las acciones que valen).
account("cuenta-menu-empresa", { desktop: { board: "Cuenta", props: { whatsapp: noWhatsApp }, boardActions: [boardAction(`button[aria-label="Acciones de ${company.value}"]`)] }, phone: { board: "M-Cuenta-Metodo", props: { estado: "Menú del WhatsApp" } }, note: "En el teléfono, el tablero dibuja el menú del WhatsApp; el del correo de la empresa es la misma hoja." }, { actions: [methodMenu(company.value)] });
account("cuenta-google-vinculado", accountNotice("Vinculamos Google", "El lienzo vigente dibuja Google vinculado con su aviso; la app lo muestra sin aviso."), { methods: [company, { ...personal, canRemove: true }, google] });
account("cuenta-pendiente", accountBase("El lienzo vigente no dibuja un correo sin verificar en la lista: se compara con Mi cuenta."), { methods: [company, personal, pending] });
account("agregar-correo", accountDialog("Cuenta-Agregar", "Correo"), { actions: [add] });
account("agregar-correo-reauth", accountDialog("Cuenta-Verificar", "Correo", "El lienzo no tiene un estado de reautenticación previo a agregar; se compara con el diálogo del código. La pantalla real reutiliza el mismo diálogo para pedir la prueba anterior a la sesión."), { actions: [add], responses: [proof], readySelector: 'input[inputmode="numeric"]' });
account("vincular-google-reauth", accountDialog("Cuenta-Metodo", "Vincular Google"), { actions: [click("button", "Vincular Google")], responses: [proof], readySelector: 'input[inputmode="numeric"]' });
account("agregar-invalido", accountDialog("Cuenta-Agregar", "Correo: correo inválido"), { actions: [...addAfterProof, fill("Correo", "correo"), send], responses: proven });
account("agregar-duplicado", accountDialog("Cuenta-Agregar", "Correo: correo inválido", "El tablero dibuja el correo inválido; el repetido va en el mismo lugar, con el texto del back."), { actions: [...addAfterProof, fill("Correo", "ana.gomez@gmail.com"), send], responses: [...proven, response("POST", "/api/me/login-methods", { code: "Identity.LoginMethod.AlreadyUsed", errors: { email: ["Ese correo ya lo usa otra cuenta."] } }, 400)], readyText: "Ese correo ya lo usa otra cuenta." });
account("agregar-codigo", accountDialog("Cuenta-Verificar", "Correo"), { actions: [...addAfterProof, fill("Correo", pending.value), send], responses: [...proven, requestEmail], readySelector: 'input[inputmode="numeric"]' });
account("agregar-codigo-incorrecto", accountDialog("Cuenta-Verificar", "Correo: código incorrecto"), { actions: [...addAfterProof, fill("Correo", pending.value), send, otp, verify], responses: [...proven, requestEmail, codeError], readyText: "El código no es correcto." });
account("agregar-verificado", accountNotice("Agregamos un correo"), { actions: [...addAfterProof, fill("Correo", pending.value), send, otp, verify], responses: [...proven, requestEmail, response("POST", "/api/me/login-methods/4/verify", {})], afterMethods: [company, { ...personal, canRemove: true }, { ...pending, isVerified: true }], readyText: `Agregamos ${pending.value}.` });
account("verificar-pendiente", accountDialog("Cuenta-Verificar", "Correo"), { methods: [company, personal, pending], actions: [verify], responses: [response("POST", "/api/me/login-methods/4/code", { methodId: "4", resendAfterSeconds: 60 })], readySelector: 'input[inputmode="numeric"]' });
account("hacer-principal", accountDialog("Cuenta-Metodo", "Hacer principal el WhatsApp", "El tablero dibuja hacer principal el WhatsApp; con un correo es el mismo diálogo."), { actions: [methodMenu(company.value), click("menuitem", "Hacer principal")], responses: [proof], readySelector: 'input[inputmode="numeric"]' });
account("quitar-correo", accountDialog("Cuenta-Metodo", "Quitar un correo: el código llega por WhatsApp", "El tablero dibuja el código por WhatsApp; sin el módulo, llega al correo principal."), { actions: [methodMenu(company.value), click("menuitem", "Quitar")], responses: [proof], readySelector: 'input[inputmode="numeric"]' });
account("desvincular-google", accountDialog("Cuenta-Metodo", "Desvincular Google"), { methods: [company, { ...personal, canRemove: true }, google], actions: [click("button", `Acciones de ${google.value}`, 1), click("menuitem", "Desvincular")], responses: [proof], readySelector: 'input[inputmode="numeric"]' });
for (const [id, menu, pathSuffix, text, aviso] of [["principal-cambiado", "Hacer principal", "/primary", `Desde ahora te avisamos a ${company.value}.`, "Cambió el principal"], ["correo-quitado", "Quitar", "", `Quitamos ${company.value}.`, "Quitamos un correo"]]) {
  account(id, accountNotice(aviso), { actions: [methodMenu(company.value), click("menuitem", menu), otp, click("button", menu)], responses: [proof, response("POST", "/api/me/reauth/verify", { reauthTicket: "visual-proof" }), response(pathSuffix ? "PUT" : "DELETE", `/api/me/login-methods/1${pathSuffix}`, {})], afterMethods: pathSuffix ? [{ ...company, isPrimary: true }, { ...personal, isPrimary: false }] : [personal], readyText: text });
}
account("google-vinculado-aviso", accountNotice("Vinculamos Google"), { route: "/cuenta?google=linked", methods: [company, { ...personal, canRemove: true }, google], readyText: "Vinculamos tu cuenta de Google." });
account("google-desvinculado-aviso", accountNotice("Desvinculamos Google"), { methods: [company, { ...personal, canRemove: true }, google], actions: [click("button", `Acciones de ${google.value}`, 1), click("menuitem", "Desvincular"), otp, click("button", "Desvincular")], responses: [proof, response("POST", "/api/me/reauth/verify", { reauthTicket: "visual-proof" }), response("DELETE", "/api/me/login-methods/5", {})], afterMethods: [company, personal], readyText: "Desvinculamos tu cuenta de Google." });
account("baja-dialogo", accountDialog("Cuenta-Baja", "Dar de baja"), { actions: [click("button", "Dar de baja")], responses: [proof], readySelector: 'input[inputmode="numeric"]' });
account("baja-codigo-incompleto", accountDialog("Cuenta-Baja", "Dar de baja", "El tablero no dibuja el código a medio escribir: se compara con «Dar de baja»."), { actions: [click("button", "Dar de baja"), fill("Motivo", "Prueba visual"), { ...otp, value: "123" }], responses: [proof], readySelector: 'input[inputmode="numeric"]' });
account("baja-motivo-requerido", accountDialog("Cuenta-Baja", "Falta el motivo"), { actions: [click("button", "Dar de baja"), otp, click("button", "Dar de baja")], responses: [proof], readyText: "Escribí el motivo." });
account("baja-codigo-incorrecto", accountDialog("Cuenta-Baja", "Código incorrecto"), { actions: [click("button", "Dar de baja"), fill("Motivo", "Prueba visual"), otp, click("button", "Dar de baja")], responses: [proof, response("POST", "/api/me/reauth/verify", { code: "Auth.LoginCode.Invalid", detail: "El código no es correcto." }, 400)], readyText: "El código no es correcto." });
account("baja-operador", accountDialog("Cuenta-Baja", "Dar de baja", "Estado de política del backend; el tablero no trae variante de operador, se fija solo el texto del error."), { actions: [click("button", "Dar de baja")], responses: [response("POST", "/api/me/reauth", { code: "Identity.Account.PlatformOwnerCannotDelete", detail: "El operador de la plataforma no puede dar de baja su cuenta." }, 400)], readyText: "El operador de la plataforma no puede dar de baja su cuenta." });
account("baja-sesion-cerrada", { desktop: { board: "Sesion", props: { estado: "Cerramos tu sesión por la baja" } }, phone: { board: "M-Sesion", props: { estado: "Cerramos tu sesión por la baja" } } }, { route: "/", session: "deletion", readyText: "Cerramos tu sesión" });
for (const [key, label, docs] of [["ambos", "Cambiaron los dos", [{ id: "terms", kind: "Terms", version: 3 }, { id: "privacy", kind: "Privacy", version: 2 }]], ["terminos", "Cambiaron los términos", [{ id: "terms", kind: "Terms", version: 3 }]], ["privacidad", "Cambió la privacidad", [{ id: "privacy", kind: "Privacy", version: 2 }]]]) {
  for (const accepted of [false, true]) {
    const look = { board: "Aceptar-Terminos", props: { caso: label }, boardActions: accepted ? [boardAction("label.chk input")] : [] };
    scenarios.push({ id: `aceptar-${key}-${accepted ? "marcado" : "sin-marcar"}`, group: "legales", look: { desktop: look, phone: { ...look, board: "M-Aceptar-Terminos" } }, route: "/aceptar-terminos", legal: docs, actions: accepted ? [click("checkbox", "Leí y acepto los Términos y la Política de privacidad")] : [], readyText: "Actualizamos los términos" });
  }
}
const pendingDeletion = response("POST", "/api/auth/deletion/pending", { scheduledForUtc: "2026-10-27T17:35:00Z", cancelTicket: "capture-proof", timeZoneId: "America/Argentina/Buenos_Aires", returnUrl: "/connect/authorize", cancelTicketExpiresAtUtc: "2026-09-27T17:40:00Z" });
const deletionLogin = (puerta, note) => ({ desktop: { board: "Ingreso", props: { estado: "Cuenta con la baja pedida", puerta } }, phone: { board: "M-Ingreso", props: { estado: "Cuenta con la baja pedida", puerta } }, note });
for (const access of ["Persona", "Empresa"]) {
  for (const cancelling of [false, true]) {
    scenarios.push({ id: `ingreso-baja-${access.toLowerCase()}${cancelling ? "-cancelando" : ""}`, group: "ingreso", look: deletionLogin(access, cancelling ? "El tablero no dibuja el botón mientras cancela la baja." : undefined), route: `${access === "Empresa" ? "/login/empresa" : "/login"}?error=Identity.Account.PendingDeletion`, responses: [pendingDeletion, ...(cancelling ? [response("POST", "/api/auth/deletion/cancel", {}, 200)] : [])], actions: cancelling ? [click("button", "Cancelar la baja y entrar")] : [], readyText: "Tu cuenta tiene la baja pedida" });
  }
}
scenarios.push({ id: "inicio-aviso-personal", group: "inicios", look: { desktop: { board: "Inicio-Personal", props: { estado: "Con el aviso" } }, phone: { board: "M-Inicio-Personal", props: { estado: "Con el aviso" } } }, route: "/", needsOwn: true, readyText: "Agregá un correo personal o tu WhatsApp" });
scenarios.push({ id: "ingreso-baja-cancelada", group: "ingreso", look: deletionLogin("Persona", "Instante previo a seguir la redirección: el arnés mantiene la vista para fotografiar el aviso; el E2E real sí completa el ingreso."), route: "/login?error=Identity.Account.PendingDeletion", session: "cancelled", responses: [pendingDeletion, response("POST", "/api/auth/deletion/cancel", { returnUrl: "/connect/authorize" })], actions: [click("button", "Cancelar la baja y entrar")], readyText: "Cancelamos la baja." });

async function actions(page, entries = [], mobile = false) {
  for (const action of entries) {
    if (action.type === "otp") {
      await page.getByRole("textbox", { name: "Código 1" }).fill(action.value);
      continue;
    }
    // En el teléfono la cuenta y los perfiles están en «Más» (tableros M-Mas-Personal, «Criterio · Marco»), y Mi cuenta
    // vuelve a él con el «‹».
    const name = action.name === "$discard" ? "Descartar cambios" : action.name === "$save" ? "Guardar cambios" : action.name === "$user" ? mobile ? "Volver a Más" : "Lucía Fernández, Personal" : action.name;
    let locator = page.getByRole(action.name === "$user" && mobile ? "link" : action.role, { name, exact: true });
    if (action.nth !== undefined) locator = locator.nth(action.nth);
    if (action.type === "fill") await locator.fill(action.value); else await locator.click();
  }
}

async function capture(browser, canvasUrl, appUrl, entry, { tmp, outputRoot }) {
  const stem = path.join(tmp, entry.group, `${entry.id}-${entry.viewport.width}x${entry.viewport.height}`);
  mkdirSync(path.dirname(stem), { recursive: true });
  const files = { board: `${stem}-lienzo.png`, app: `${stem}-app.png` };
  const context = await browser.newContext({ viewport: entry.viewport, deviceScaleFactor: 1, locale: "es-AR", ignoreHTTPSErrors: true });
  try {
    const board = await openBoard(context, canvasUrl, entry);
    if (entry.email) {
      await board.locator(".plantilla").screenshot({ path: files.board });
      await context.route("https://ejemplo.com/favicon.svg", (route) => route.fulfill({ contentType: "image/svg+xml", body: readFileSync(path.join(root, "public/favicon.svg")) }));
      const app = await context.newPage();
      await app.goto(new URL(entry.app.path, appUrl).href);
      await app.locator('table[style*="max-width:560px"]').screenshot({ path: files.app });
    } else {
      await board.screenshot({ path: files.board });
      await installApiMocks(context, entry.app.responses, "visual-personal");
      if (entry.app.afterMethods || entry.app.afterName) {
        let changed = false;
        await context.route("**/api/me**", async (route) => {
          const request = route.request();
          const pathname = new URL(request.url()).pathname;
          if (request.method() !== "GET") { changed = true; await route.fallback(); return; }
          if (changed && pathname === "/api/me/login-methods" && entry.app.afterMethods) {
            await route.fulfill({ json: { methods: entry.app.afterMethods, canLinkGoogle: true, needsPersonalLoginMethod: false, accountDeletionGraceDays: 30, soleOwnerOrganizations: [] } }); return;
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
      await waitForAppFont(app);
      await app.addStyleTag({ content: otpMaskStyle });
      await app.screenshot({ path: files.app });
    }
  } finally { await context.close(); }
  return composeSideBySide(browser, entry, files, sideBySideFile(entry, outputRoot));
}

const { visualPersonal } = await import("../src/test/mocks/currentUsers.ts");
const cases = scenarios.flatMap((scenario) => [1440, 390].map((width) => {
  const params = new URLSearchParams({ as: "visual-personal", route: scenario.route ?? "/cuenta", ...(scenario.session ? { session: scenario.session } : {}) });
  const look = width === 390 ? scenario.look.phone : scenario.look.desktop;
  const note = scenario.look.note;
  return { id: `${scenario.id}-${width === 390 ? "movil" : "escritorio"}`, pair: scenario.id, group: scenario.group, state: scenario.id, board: look.board, props: look.props ?? {}, boardActions: look.boardActions ?? [], viewport: { width, height: width === 390 ? 844 : 900 }, ...(note ? { note } : {}),
    app: { path: `/src/test/visualApp.html?${params}`, captureMode: "harness", actions: scenario.actions, readyText: scenario.readyText, readySelector: scenario.readySelector, afterMethods: byPrimary(scenario.afterMethods), afterName: scenario.afterName, responses: [
      response("GET", "/api/me", { ...visualPersonal, needsPersonalLoginMethod: scenario.needsOwn ?? false, pendingLegalDocuments: scenario.legal ?? [] }),
      response("GET", "/api/me/login-methods", { methods: byPrimary(scenario.methods ?? [company, personal]), canLinkGoogle: !scenario.methods?.some((method) => method.type === "Google"), needsPersonalLoginMethod: scenario.needsOwn ?? false, accountDeletionGraceDays: 30, soleOwnerOrganizations: [] }), ...(scenario.responses ?? []),
    ] } };
}));
for (const [key, label] of [["verificar-metodo", "Código para verificar un método"], ["metodo-agregado", "Método de ingreso agregado"], ["metodo-quitado", "Método de ingreso quitado"], ["principal-cambiado", "Método principal cambiado"], ["baja-pedida", "Baja pedida"], ["baja-cancelada", "Baja cancelada"], ["cuenta-eliminada", "Cuenta eliminada"]]) {
  for (const culture of ["es-AR", "en-US"]) for (const width of [1440, 390]) cases.push({
    id: `correo-${key}-${culture.toLowerCase()}-${width === 390 ? "movil" : "escritorio"}`, pair: `correo-${key}-${culture.toLowerCase()}`, group: "correos", state: `Correo: ${label} (${culture})`, board: "Mensajes", props: { mensaje: label, canal: "Correo" }, boardActions: [], viewport: { width, height: width === 390 ? 844 : 900 }, email: true,
    note: "Se compara la plantilla, sin la interfaz del cliente de correo. Mensajes tiene un tablero en español; el caso agregado ilustra WhatsApp (E8) y aquí se ejerce la variante correo. Inglés y ancho móvil se verifican sobre HTML real.",
    app: { path: `/docs/design/capturas/etapa-3b/correos/html/${key}-${culture}.html` },
  });
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? null : process.argv[index + 1] ?? null;
}

const outputRoot = option("--out") ? path.resolve(root, option("--out")) : stageOutput;
const manifestFile = path.join(outputRoot, "manifest.json");
mkdirSync(outputRoot, { recursive: true });
writeFileSync(manifestFile, JSON.stringify({ version: 1, cases }, null, 2) + "\n");
validateManifest(manifestFile, canvas);
const id = option("--id");
const selected = cases.filter((item) => !id || item.pair === id);
if (process.argv.includes("--verify")) { assertSideBySide(selected, outputRoot); console.log(`${selected.length} imágenes lado a lado de la 3b verificadas.`); }
else {
  const appUrl = option("--app-url");
  if (!appUrl) throw new Error("Indicá --app-url del servidor Vite visual (o --verify).");
  const tmp = option("--tmp") ?? path.join(os.tmpdir(), "capturar-etapa-3b");
  const executablePath = option("--browser-path") ?? process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  // Sin una ruta, el Chrome del sistema: el Chromium de Playwright no siempre está descargado.
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : { channel: "chrome" }) });
  const server = await startCanvasServer(path.resolve(option("--lienzo") ?? canvas));
  const failed = [];
  try {
    for (const entry of selected) {
      try {
        const target = await capture(browser, server.url, appUrl, entry, { tmp, outputRoot });
        console.log(`${path.relative(root, target).replaceAll("\\", "/")}: ${entry.board}`);
      } catch (error) {
        failed.push(entry.id);
        console.error(`${entry.id}: ${error instanceof Error ? error.message.split("\n")[0] : error}`);
      }
    }
  } finally { await server.close(); await browser.close(); }
  if (failed.length > 0) { console.error(`No se pudieron capturar: ${failed.join(", ")}`); process.exitCode = 1; }
}
