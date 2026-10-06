import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { access, mkdtemp, readdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

// Esta prueba arranca su propio AppHost y un PostgreSQL efímero, fuera del volumen Development.
// No intercepta peticiones, no usa fixtures de sesión y nunca imprime correos ni códigos.
const baseUrl = new URL("https://localhost:5174");
const appHostDirectory = fileURLToPath(new URL("../../ArquitecturaBaseMutitenant/src/ArquitecturaBaseMultitenant.AppHost/", import.meta.url));
const appHostProject = path.join(appHostDirectory, "ArquitecturaBaseMultitenant.AppHost.csproj");
const execFileAsync = promisify(execFile);
let pickupDirectory;

async function aspire(args, env = process.env) {
  const command = process.platform === "win32" ? "cmd.exe" : "aspire";
  const commandArgs = process.platform === "win32" ? ["/d", "/s", "/c", "aspire", ...args] : args;
  try {
    return await execFileAsync(command, commandArgs, {
      cwd: appHostDirectory,
      env,
      timeout: 300_000,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error) {
    // La salida de Aspire puede contener configuración; no propagarla al informe del test.
    throw new Error(`Falló Aspire (${args[0]}, código ${error?.code ?? "desconocido"}).`);
  }
}

async function waitForSetup(readyFile) {
  const deadline = Date.now() + 240_000;
  let nextStatusCheck = 0;
  while (Date.now() < deadline) {
    try {
      await access(readyFile);
      return;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    if (Date.now() >= nextStatusCheck) {
      nextStatusCheck = Date.now() + 3_000;
      try {
        const { stdout, stderr } = await aspire(["logs", "e2e-setup", "--tail", "5", "--non-interactive"]);
        const failure = `${stdout}${stderr}`.match(/E2E setup failed \(([A-Za-z]+Exception)(?: ([0-9A-Z]{5}), constraint ([A-Za-z0-9_]+|none))?\)/);
        if (failure) {
          const detail = failure[2] ? `, SQLSTATE ${failure[2]}, constraint ${failure[3]}` : "";
          throw new Error(`El preparador E2E terminó con ${failure[1]}${detail} en la base aislada.`);
        }
      } catch (error) {
        if (!error?.message?.startsWith("Falló Aspire (logs")) throw error;
      }
    }
    await delay(500);
  }
  throw new Error("El preparador E2E no terminó correctamente en la base aislada.");
}

async function waitForAlive(request) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await request.get(new URL("/alive", baseUrl).href);
      if (response.status() === 200) return;
    } catch {
      // El proxy Vite aún puede estar arrancando.
    }
    await delay(500);
  }
  throw new Error("El front o la Api del AppHost E2E no quedaron listos.");
}

async function pickupFiles() {
  try {
    return (await readdir(pickupDirectory)).filter((name) => name.endsWith(".eml"));
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function plainTextBody(eml) {
  const start = eml.search(/^Content-Type: text\/plain\b/im);
  if (start < 0) return null;
  const headersEnd = eml.indexOf("\r\n\r\n", start);
  if (headersEnd < 0) return null;
  const body = eml.slice(headersEnd + 4);
  const boundary = body.search(/\r?\n--/);
  return boundary < 0 ? body : body.slice(0, boundary);
}

async function codeFromPickup(email, before) {
  const deadline = Date.now() + 95_000;
  const newFiles = new Set();
  const recipientFiles = new Set();
  const codeFiles = new Set();
  while (Date.now() < deadline) {
    for (const name of await pickupFiles()) {
      if (before.has(name)) continue;
      newFiles.add(name);
      const file = path.join(pickupDirectory, name);
      let eml;
      try { eml = await readFile(file, "utf8"); }
      catch (error) { if (error?.code === "ENOENT" || error?.code === "EBUSY") continue; throw error; }
      if (!eml.toLowerCase().includes(email.toLowerCase())) continue;
      recipientFiles.add(name);
      const code = plainTextBody(eml)?.match(/(?<!\d)\d{6}(?!\d)/)?.[0];
      if (!code) continue; // Los avisos de cuenta comparten pickup con los códigos.
      codeFiles.add(name);
      await unlink(file);
      return code;
    }
    await delay(250);
  }
  throw new Error(`No llegó el .eml de este paso al pickup de la Api (archivos nuevos ${newFiles.size}, destinatario ${recipientFiles.size}, código legible ${codeFiles.size}).`);
}

async function enterCode(page, code) {
  try {
    const boxes = page.getByRole("group", { name: "Código" }).locator("input");
    assert.equal(await boxes.count(), 6);
    for (let index = 0; index < 6; index++) await boxes.nth(index).fill(code[index]);
  } catch {
    throw new Error("No se pudieron completar las seis casillas del código.");
  }
}

async function invitationCommand(readyFile, data) {
  const commandFile = readyFile.replace(/\.ready$/, ".invitations.json");
  await rm(commandFile, { force: true });
  await rm(`${commandFile}.done`, { force: true });
  await writeFile(commandFile, JSON.stringify(data), { flag: "wx" });
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try { return JSON.parse(await readFile(`${commandFile}.done`, "utf8")); }
    catch (error) { if (error?.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error; }
    await delay(250);
  }
  try {
    const { stdout, stderr } = await aspire(["logs", "e2e-setup", "--tail", "10", "--non-interactive"]);
    const failure = `${stdout}${stderr}`.match(/E2E setup failed \(([A-Za-z]+Exception)(?: ([0-9A-Z]{5}), constraint ([A-Za-z0-9_]+|none))?\)/);
    if (failure) throw new Error(`El preparador E2E falló (${failure[1]}).`);
  } catch (error) {
    if (error?.message?.startsWith("El preparador E2E falló")) throw error;
    if (!error?.message?.startsWith("Falló Aspire (logs")) throw error;
  }
  throw new Error("El preparador no completó la orden de invitación en la base E2E.");
}

async function invitationFromPickup(email, before) {
  const deadline = Date.now() + 95_000;
  while (Date.now() < deadline) {
    for (const name of await pickupFiles()) {
      if (before.has(name)) continue;
      let eml;
      try { eml = await readFile(path.join(pickupDirectory, name), "utf8"); }
      catch (error) { if (error?.code === "ENOENT" || error?.code === "EBUSY") continue; throw error; }
      if (!eml.toLowerCase().includes(email.toLowerCase())) continue;
      const link = plainTextBody(eml)?.match(/https:\/\/[^\s]+\/invitacion#[A-Za-z0-9_-]+/)?.[0];
      if (!link) continue;
      const url = new URL(link);
      assert.equal(url.origin, baseUrl.origin, "La invitación debe apuntar al origen público configurado.");
      assert.equal(url.search, "", "El token no puede viajar en la query HTTP.");
      await unlink(path.join(pickupDirectory, name));
      return url.href;
    }
    await delay(250);
  }
  throw new Error("No llegó el .eml con el enlace real de invitación al pickup aislado.");
}

// Sin `organizationRole` (null), la persona entra solo con su rol en la empresa: un Administrador de empresa (B4).
async function inviteFromUsersPage(page, email, companyName, { organizationRole = "Dueño" } = {}) {
  await page.goto(new URL("/org/usuarios", baseUrl).href);
  await page.getByRole("button", { name: "Invitar usuario", exact: true }).click();
  const before = new Set(await pickupFiles());
  await page.getByRole("textbox", { name: "Correo", exact: true }).fill(email);
  if (organizationRole) {
    await page.getByRole("button", { name: "Roles de la organización", exact: true }).click();
    await page.getByRole("menuitemcheckbox", { name: organizationRole, exact: true }).click();
    await page.keyboard.press("Escape");
  }
  if (companyName) {
    // Tablero Usuarios (Invitar): una sola Empresa con sus roles.
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("combobox", { name: "Empresa", exact: true }).click();
    await page.getByRole("option", { name: companyName, exact: true }).click();
    await dialog.getByRole("button", { name: "Roles en la empresa", exact: true }).click();
    await page.getByRole("menuitemcheckbox", { name: "Administrador", exact: true }).click();
    await page.keyboard.press("Escape");
  }
  const responsePromise = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/users/invitations"
    && response.request().method() === "POST");
  await page.getByRole("dialog").getByRole("button", { name: "Invitar", exact: true }).click();
  const response = await responsePromise;
  assert.equal(response.status(), 201, "Invitar desde Usuarios debe crear la invitación real.");
  const { invitationId, expiresAtUtc } = await response.json();
  assert.match(invitationId, /^[0-9a-f-]{36}$/i);
  assert.ok(Date.parse(expiresAtUtc) > Date.now(), "Invitar debe devolver cuándo vence la invitación.");
  await page.getByText(`Invitamos a ${email}. La invitación vence el `).waitFor();
  const link = await invitationFromPickup(email, before);
  return { invitationId, link };
}

async function expectPath(page, expected, step) {
  try {
    await page.waitForURL((url) => url.pathname === expected, { timeout: 20_000 });
  } catch {
    // No incluir query strings: pueden contener state, code u otros datos efímeros.
    throw new Error(`${step}: se esperaba ${expected}; ruta actual ${new URL(page.url()).pathname}.`);
  }
}

async function expectProfile(page, name, step) {
  try {
    await page.getByRole("button", { name: new RegExp(`, ${name}$`) }).waitFor({ timeout: 15_000 });
  } catch {
    throw new Error(`${step}: no apareció el perfil ${name}; ruta actual ${new URL(page.url()).pathname}.`);
  }
}

async function signOut(page, currentProfile) {
  await page.getByRole("button", { name: new RegExp(`, ${currentProfile}$`) }).click();
  await page.getByRole("menuitem", { name: "Salir" }).click();
  try {
    await page.getByRole("link", { name: "Ingresá", exact: true }).first().waitFor({ timeout: 20_000 });
  } catch {
    throw new Error("El cierre de sesión no volvió a la portada pública.");
  }
}

async function registerPerson(page, email = `e2e-account-${randomUUID()}@example.test`, onStage = () => {}) {
  onStage("abre registro");
  await page.goto(new URL("/registro", baseUrl).href);
  const terms = page.getByRole("checkbox", { name: /Acepto los Términos/ });
  await terms.check();
  const createAccount = page.locator("form").filter({ has: terms })
    .locator('button[type="submit"]:not([form])');
  await page.getByRole("textbox", { name: "Correo electrónico" }).fill(email);
  const before = new Set(await pickupFiles());
  let sentCode = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    onStage("envía registro");
    const sent = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/auth/signup"
      && response.request().method() === "POST");
    await createAccount.click({ timeout: 120_000 });
    const response = await sent;
    if (response.ok()) { sentCode = true; break; }
    const problem = await response.json();
    assert.equal(response.status(), 429);
    assert.equal(typeof problem.retryAfter, "number");
    onStage(`espera cooldown (${problem.retryAfter}s)`);
    await delay((problem.retryAfter + 1) * 1000);
  }
  assert.equal(sentCode, true, "El registro debe respetar el cooldown hasta que la API acepte el envío.");
  onStage("espera pantalla de código");
  await page.getByRole("heading", { name: "Revisá tu correo" }).waitFor();
  onStage("lee código de registro");
  await enterCode(page, await codeFromPickup(email, before));
  onStage("verifica código de registro");
  const verificationResponsePromise = page.waitForResponse((response) =>
    new URL(response.url()).pathname === "/api/auth/signup/verify" && response.request().method() === "POST");
  await page.getByRole("button", { name: "Verificar y crear la cuenta" }).click();
  const verificationResponse = await verificationResponsePromise;
  let verificationCode = "";
  if (!verificationResponse.ok()) {
    try { verificationCode = (await verificationResponse.json()).code ?? ""; }
    catch { /* El status basta para el diagnóstico del E2E. */ }
  }
  assert.equal(verificationResponse.status(), 204,
    `El código de registro respondió HTTP ${verificationResponse.status()}${verificationCode ? ` (${verificationCode})` : ""}.`);
  await expectPath(page, "/", "registro de cuenta 3b");
  await expectProfile(page, "Personal", "registro de cuenta 3b");
  return email;
}

async function registerBusinessByEmail(page, readyFile, onStage = () => {}) {
  const email = `e2e-business-signup-${randomUUID()}@example.test`;
  const organizationName = `Organización E2E ${randomUUID().slice(0, 8)}`;
  const slug = `e2e-${randomUUID().slice(0, 8)}`;
  onStage("abre registro empresarial");
  await page.goto(new URL("/registro/empresa", baseUrl).href);
  await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
  await page.getByRole("textbox", { name: "Tu correo electrónico" }).fill(email);
  const before = new Set(await pickupFiles());
  let sentCode = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    onStage("solicita código para registro empresarial");
    const sent = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/auth/business-signup/code"
      && response.request().method() === "POST");
    await page.getByRole("button", { name: "Continuar", exact: true }).click({ timeout: 120_000 });
    const response = await sent;
    if (response.ok()) { sentCode = true; break; }
    const problem = await response.json();
    assert.equal(response.status(), 429);
    assert.equal(typeof problem.retryAfter, "number");
    onStage(`espera cooldown del registro empresarial (${problem.retryAfter}s)`);
    await delay((problem.retryAfter + 1) * 1000);
  }
  assert.equal(sentCode, true, "El registro empresarial debe respetar el cooldown hasta que la API acepte el envío.");
  await page.getByRole("heading", { name: "Revisá tu correo" }).waitFor();
  onStage("lee el código empresarial del .eml");
  await enterCode(page, await codeFromPickup(email, before));
  onStage("verifica el correo empresarial");
  const verified = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/auth/business-signup/verify"
    && response.request().method() === "POST");
  await page.getByRole("button", { name: "Verificar", exact: true }).click();
  assert.equal((await verified).status(), 204, "La verificación de identidad empresarial debe crear o vincular la cuenta.");

  await page.getByRole("heading", { name: "Tu organización" }).waitFor();
  await page.getByRole("textbox", { name: "Nombre de la organización" }).fill(organizationName);
  await page.getByRole("textbox", { name: /Dirección de tu página/ }).fill(slug);
  await page.getByRole("textbox", { name: "Primera empresa" }).fill(`${organizationName} Centro`);
  await page.getByText("Disponible", { exact: true }).waitFor({ timeout: 10_000 });
  onStage("crea organización y primera empresa");
  const created = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/auth/business-signup"
    && response.request().method() === "POST");
  await page.getByRole("button", { name: "Crear organización", exact: true }).click();
  const response = await created;
  assert.equal(response.status(), 200, "El registro debe crear la organización en la base aislada.");
  const result = await response.json();
  assert.equal(result.requiresApproval, false, "La base E2E debe permitir probar la organización activa.");
  await page.getByRole("heading", { name: `${organizationName} está lista`, exact: true }).waitFor();

  onStage("comprueba que el alta no creó Personal");
  const accesses = await invitationCommand(readyFile, { kind: "inspect-accesses", email });
  assert.equal(accesses.personalSpaces, 0, "El alta empresarial no debe crear un espacio Personal.");
  assert.equal(accesses.activeBusinessAccesses, 1, "La persona debe recibir acceso a la organización creada.");

  onStage("entra a la organización creada");
  await page.getByRole("button", { name: `Entrar a ${organizationName}`, exact: true }).click();
  await expectPath(page, "/org", "registro empresarial por correo");
  await expectProfile(page, organizationName, "registro empresarial por correo");
  await page.reload();
  await expectProfile(page, organizationName, "F5 luego del registro empresarial");
}

async function openAccount(page, currentProfile = "Personal") {
  await page.getByRole("button", { name: new RegExp(`, ${currentProfile}$`) }).click();
  await page.getByRole("menuitem", { name: /^(Mi cuenta|My account)$/ }).click();
  try {
    await page.getByRole("heading", { name: /^(Mi cuenta|My account)$/ }).waitFor({ timeout: 10_000 });
    // Sin el módulo de WhatsApp (el back de hoy), «Agregar correo»; con él, «Agregar correo o teléfono».
    await page.getByRole("button", { name: /^(Agregar correo o teléfono|Agregar correo|Add email or phone|Add email)$/ }).waitFor({ timeout: 10_000 });
  } catch {
    throw new Error(`La cuenta 3b: /cuenta no terminó de cargar (ruta ${new URL(page.url()).pathname}).`);
  }
}

async function addPersonalEmail(page, originalEmail, { verify = true, onStage = () => {} } = {}) {
  const email = `e2e-personal-${randomUUID()}@example.test`;
  onStage("abre reautenticación");
  const beforeReauthentication = new Set(await pickupFiles());
  await openReauthDialog(page,
    () => page.getByRole("button", { name: /^(Agregar correo o teléfono|Agregar correo)$/ }).click(), "Verificar");
  onStage("espera código de reautenticación");
  await enterCode(page, await codeFromPickup(originalEmail, beforeReauthentication));
  onStage("verifica reautenticación");
  const verifiedReauthentication = page.waitForResponse((response) =>
    new URL(response.url()).pathname === "/api/me/reauth/verify" && response.request().method() === "POST");
  await page.getByRole("dialog").getByRole("button", { name: "Verificar", exact: true }).click();
  assert.equal((await verifiedReauthentication).status(), 200, "La reautenticación debe habilitar la suma del método.");
  const dialog = page.getByRole("dialog");
  onStage("completa el correo nuevo");
  await dialog.getByRole("textbox", { name: "Correo", exact: true }).waitFor();
  await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill(email);
  const before = new Set(await pickupFiles());
  const sent = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/me/login-methods"
    && response.request().method() === "POST");
  await dialog.getByRole("button", { name: "Enviar código", exact: true }).click();
  onStage("espera respuesta al envío del correo nuevo");
  assert.equal((await sent).status(), 202, "La cuenta debe enviar el código al correo nuevo.");
  if (!verify) {
    onStage("recibe el código del método pendiente");
    await codeFromPickup(email, before);
    await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    return email;
  }
  onStage("espera código del correo nuevo");
  await enterCode(page, await codeFromPickup(email, before));
  const verifiedMethod = page.waitForResponse((response) => /\/api\/me\/login-methods\/[^/]+\/verify$/.test(new URL(response.url()).pathname)
    && response.request().method() === "POST");
  await dialog.getByRole("button", { name: "Verificar", exact: true }).click();
  assert.equal((await verifiedMethod).status(), 204, "El correo debe quedar verificado con su propio código.");
  await dialog.waitFor({ state: "hidden" });
  await page.getByText(email, { exact: true }).waitFor();
  return email;
}

async function publishNewTerms(readyFile) {
  const commandFile = readyFile.replace(/\.ready$/, ".legal.json");
  await writeFile(commandFile, JSON.stringify({ kind: "Terms", version: 2 }), { flag: "wx" });
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try { await access(`${commandFile}.done`); return; }
    catch (error) { if (error?.code !== "ENOENT") throw error; }
    await delay(250);
  }
  throw new Error("La versión nueva no quedó publicada en la base propia del E2E.");
}

async function preparePlatform(readyFile) {
  const commandFile = readyFile.replace(/\.ready$/, ".platform.json");
  await writeFile(commandFile, JSON.stringify({ kind: "prepare" }), { flag: "wx" });
  for (let attempt = 0; attempt < 120; attempt++) {
    try { await access(`${commandFile}.done`); return; }
    catch (error) { if (error?.code !== "ENOENT") throw error; }
    await delay(250);
  }
  throw new Error("El preparador de Plataforma no terminó en la base aislada.");
}

async function acceptCurrentTerms(page) {
  const terms = page.getByRole("heading", { name: "Actualizamos los términos" });
  const chrome = page.getByRole("button", { name: /, (Plataforma|Personal|Empresa E2E)$/ });
  await terms.or(chrome).first().waitFor({ timeout: 20_000 });
  if (await terms.isVisible()) {
    await page.getByRole("checkbox", { name: /Leí y acepto/ }).check();
    await page.getByRole("button", { name: "Aceptar y seguir", exact: true }).click();
    await terms.waitFor({ state: "hidden" });
  }
}

async function loginThroughUi(page, email, access = "platform") {
  page.setDefaultTimeout(30_000);
  await page.goto(new URL(access === "platform" ? "/plataforma" : access === "business" ? "/login/empresa" : "/login", baseUrl).href);
  await page.getByRole("textbox", { name: "Correo electrónico" }).fill(email);
  const before = new Set(await pickupFiles());
  await sendLoginCode(page);
  await page.getByRole("heading", { name: "Revisá tu correo" }).waitFor();
  await enterCode(page, await codeFromPickup(email, before));
  await page.getByRole("button", { name: "Verificar", exact: true }).click();
  await expectPath(page, access === "platform" ? "/plataforma" : access === "business" ? "/org" : "/", "ingreso real desde pantalla");
  await acceptCurrentTerms(page);
}

async function platformNavigate(page, panel, link) {
  const button = page.getByRole("button", { name: panel, exact: true });
  await button.waitFor();
  if (await button.getAttribute("aria-expanded") !== "true") await button.click();
  await page.getByRole("navigation", { name: panel, exact: true }).getByRole("link", { name: link, exact: true }).click();
  await page.getByRole("heading", { name: link, exact: true }).waitFor();
}

async function openPlatformOrganization(page, name) {
  await platformNavigate(page, "Gestión", "Organizaciones");
  await page.getByRole("link", { name, exact: true }).click();
  await page.getByRole("heading", { name, exact: true }).waitFor();
}

async function confirmPlatformReason(page, action, confirm = action) {
  const direct = page.getByRole("button", { name: action, exact: true });
  if (await direct.count()) await direct.click();
  else {
    try { await page.getByRole("button", { name: /^Acciones de/ }).click(); }
    catch {
      const published = await page.getByText("Publicada", { exact: true }).filter({ visible: true }).count();
      const draft = await page.getByText("Borrador", { exact: true }).filter({ visible: true }).count();
      const blocked = await page.getByText("Bloqueada", { exact: true }).filter({ visible: true }).count();
      throw new Error(`${action}: no se pudo abrir Acciones (Publicada ${published}, Borrador ${draft}, Bloqueada ${blocked}).`);
    }
    try { await page.getByRole("menuitem", { name: action, exact: true }).click(); }
    catch { throw new Error(`${action}: no se pudo elegir la opción del menú de Acciones.`); }
  }
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: /^Motivo/ }).fill("Verificación del recorrido real T25");
  await dialog.getByRole("button", { name: confirm, exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
}

async function openPlatformAccount(page, name) {
  await platformNavigate(page, "Gestión", "Cuentas");
  await page.getByRole("searchbox", { name: "Buscar por nombre, correo o teléfono", exact: true }).fill(name);
  await page.getByRole("link", { name, exact: true }).click();
  await page.getByRole("heading", { name, exact: true }).waitFor();
}

async function sendLoginCode(page, onStage = () => {}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const responsePromise = page.waitForResponse((response) =>
      new URL(response.url()).pathname === "/api/auth/login-code" && response.request().method() === "POST");
    await page.locator("form button[type=submit]").first().click({ timeout: 120_000 });
    const response = await responsePromise;
    if (response.ok()) return;
    const problem = await response.json();
    if (response.status() !== 429 || typeof problem.retryAfter !== "number")
      throw new Error(`El envío de ingreso falló (HTTP ${response.status()}).`);
    const code = typeof problem.code === "string" && /^[A-Za-z0-9.]+$/.test(problem.code) ? problem.code : "sin código";
    onStage(`respeta el límite de ingreso HTTP429 ${code} (${problem.retryAfter}s)`);
    // El límite es por destino, también después del código de baja; el recorrido lo respeta.
    await delay((problem.retryAfter + 1) * 1000);
  }
  throw new Error("El envío de ingreso no terminó después de respetar cinco cooldowns de la API.");
}

async function openReauthDialog(page, open, confirmLabel) {
  let proofResponse = page.waitForResponse((response) =>
    new URL(response.url()).pathname === "/api/me/reauth" && response.request().method() === "POST");
  let requestObserved = false;
  const observeRequest = (request) => {
    if (new URL(request.url()).pathname === "/api/me/reauth" && request.method() === "POST") requestObserved = true;
  };
  page.on("request", observeRequest);
  await open();
  let response;
  try { response = await proofResponse; }
  catch {
    const titles = await page.getByRole("dialog").getByRole("heading").allTextContents().catch(() => []);
    throw new Error(`La reautenticación no respondió (solicitud ${requestObserved ? "enviada" : "ausente"}; diálogo ${titles.join("/") || "cerrado"}).`);
  } finally { page.off("request", observeRequest); }
  for (let attempt = 0; response.status() === 429 && attempt < 5; attempt++) {
    const problem = await response.json();
    assert.equal(typeof problem.retryAfter, "number");
    await delay((problem.retryAfter + 1) * 1000);
    proofResponse = page.waitForResponse((reply) =>
      new URL(reply.url()).pathname === "/api/me/reauth" && reply.request().method() === "POST");
    await page.getByRole("dialog").getByRole("button", { name: confirmLabel, exact: true }).click();
    response = await proofResponse;
  }
  assert.equal(response.ok(), true, `El pedido de reautenticación debe completarse tras respetar el cooldown (HTTP ${response.status()}).`);
}

async function requestGoogleLinkWithoutTicket(page) {
  const googleRequest = page.waitForRequest((request) =>
    new URL(request.url()).pathname === "/api/me/external/google" && request.method() === "POST");
  const outcome = await page.evaluate(async (authorization) => {
    const tokenResponse = await fetch("/api/auth/external/google/antiforgery", {
      headers: { Authorization: authorization },
    });
    if (!tokenResponse.ok) return { status: tokenResponse.status, location: false, code: "Antiforgery.TokenUnavailable" };
    const { requestToken } = await tokenResponse.json();
    const response = await fetch("/api/me/external/google", {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
        RequestVerificationToken: requestToken,
      },
      body: JSON.stringify({ reauthTicket: "" }),
      redirect: "manual",
    });
    let code = "";
    let fields = [];
    if (!response.ok) {
      try {
        const problem = await response.json();
        code = problem.code ?? "";
        fields = Object.keys(problem.errors ?? {});
      }
      catch { /* El status basta para esta comprobación. */ }
    }
    return { status: response.status, location: response.headers.has("location"), code, fields,
      tokenLength: typeof requestToken === "string" ? requestToken.length : 0 };
  }, accountTokens.get(page));
  const request = await googleRequest;
  const requestHeaders = await request.allHeaders();
  return { ...outcome, antiforgeryHeaderSent: Boolean(requestHeaders.requestverificationtoken) };
}

const accountTokens = new WeakMap();
async function accountPost(page, route, data, extraHeaders = {}) {
  const authorization = accountTokens.get(page);
  assert.equal(typeof authorization, "string", "El navegador debe haber obtenido su token real.");
  return page.request.post(new URL(route, baseUrl).href, {
    headers: { Authorization: authorization, "Idempotency-Key": randomUUID(), ...extraHeaders },
    ...(data === undefined ? {} : { data }),
  });
}

test("registro real y puerta empresa usan un PostgreSQL aislado, front, Api y pickup sin mocks", { timeout: 2_700_000 }, async (t) => {
  const { stdout } = await aspire(["ps", "--format", "Json", "--non-interactive"]);
  assert.equal(JSON.parse(stdout).length, 0, "Detené el AppHost en ejecución antes de iniciar el E2E aislado.");

  pickupDirectory = await mkdtemp(path.join(os.tmpdir(), "arquitecturabase-e2e-"));
  const readyFile = path.join(pickupDirectory, `mt-e2e-${randomUUID()}.ready`);
  const businessEmail = `e2e-business-${randomUUID()}@example.test`;
  // El mismo Dueño conserva este método vinculado después de quitar el dominio en E5.
  const managedBusinessEmail = "e2e-managed@corp.example.test";
  let started = false;
  try {
    const e2eEnvironment = {
      ...process.env,
      MT_E2E_ISOLATED: "1",
      MT_E2E_BUSINESS_EMAIL: businessEmail,
      MT_E2E_PICKUP_DIR: pickupDirectory,
      MT_E2E_READY_FILE: readyFile,
    };
    started = true;
    await aspire(["run", "--detach", "--no-build", "--non-interactive", "--nologo", "--format", "Json", "--apphost", appHostProject], e2eEnvironment);
    await waitForSetup(readyFile);

    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR" });
      const page = await context.newPage();
      await waitForAlive(context.request);

      const signupEmail = `e2e-${randomUUID()}@example.test`;
      await page.goto(new URL("/registro", baseUrl).href);
      await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
      await page.getByRole("textbox", { name: "Correo electrónico" }).fill(signupEmail);
      const signupBefore = new Set(await pickupFiles());
      await page.getByRole("button", { name: "Crear cuenta" }).click();
      await page.getByRole("heading", { name: "Revisá tu correo" }).waitFor();
      await enterCode(page, await codeFromPickup(signupEmail, signupBefore));
      await page.getByRole("button", { name: "Verificar y crear la cuenta" }).click();
      await expectPath(page, "/", "registro por código");
      await expectProfile(page, "Personal", "registro por código");
      await signOut(page, "Personal");

      await page.goto(new URL("/login/empresa", baseUrl).href);
      await page.getByRole("textbox", { name: "Correo electrónico" }).fill(businessEmail);
      const businessBefore = new Set(await pickupFiles());
      await page.getByRole("button", { name: "Enviar código" }).click();
      await page.getByRole("heading", { name: "Revisá tu correo" }).waitFor();
      await enterCode(page, await codeFromPickup(businessEmail, businessBefore));
      await page.getByRole("button", { name: "Verificar" }).click();
      await expectPath(page, "/org", "ingreso de empresa");
      await expectProfile(page, "Empresa E2E", "ingreso de empresa");

      await page.reload();
      await expectPath(page, "/org", "F5 en empresa");
      await expectProfile(page, "Empresa E2E", "F5 en empresa");
      await openAccount(page, "Empresa E2E");
      await page.reload();
      await expectProfile(page, "Empresa E2E", "F5 en Mi cuenta desde empresa");
      await page.getByRole("button", { name: /, Empresa E2E$/ }).click();
      await page.getByRole("menuitemradio", { name: /Personal/ }).click();
      await expectPath(page, "/", "cambio desde Perfiles");
      await expectProfile(page, "Personal", "cambio desde Perfiles");
      await signOut(page, "Personal");


      // Cada recorrido usa una identidad/contexto propios; un fallo no saltea los otros.
      const e2eCompanyName = "Sucursal E2E";
      let e2eOrganizationName = "Empresa E2E";
      let e2eCompanyId;
      await preparePlatform(readyFile);
      const accountCases = [
        ["5a: ingresar como operador y consultar Plataforma con permisos reducidos", async (platformPage, setStage) => {
          setStage("abre Plataforma sin sesión");
          await platformPage.goto(new URL("/plataforma", baseUrl).href);
          await platformPage.getByRole("textbox", { name: "Correo electrónico" }).fill("e2e-operator@example.test");
          const loginBefore = new Set(await pickupFiles());
          await sendLoginCode(platformPage);
          await platformPage.getByRole("heading", { name: "Revisá tu correo" }).waitFor();
          await enterCode(platformPage, await codeFromPickup("e2e-operator@example.test", loginBefore));
          setStage("verifica el código real del operador");
          await platformPage.getByRole("button", { name: "Verificar", exact: true }).click();
          // El preparador acepta las versiones reales vigentes para este operador aislado.
          await expectPath(platformPage, "/plataforma", "ingreso del operador");
          setStage("muestra el listado real de Organizaciones");
          await platformPage.getByRole("heading", { name: "Organizaciones", exact: true }).waitFor();

          setStage("F5 conserva el acceso exclusivo de Plataforma");
          await platformPage.reload();
          await expectProfile(platformPage, "Plataforma", "F5 conserva Plataforma");
          setStage("consulta la lista real de Cuentas");
          await platformNavigate(platformPage, "Gestión", "Cuentas");
          await platformPage.getByRole("row", { name: /Cuenta E2E/ }).waitFor();
          setStage("consulta Auditoría por pantalla");
          await platformNavigate(platformPage, "Administración", "Auditoría");
          setStage("consulta Configuración por pantalla");
          await platformNavigate(platformPage, "Administración", "Configuración");
          setStage("ingresa el operador con permisos reducidos");
          const reducedContext = await browser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR" });
          try {
            const reduced = await reducedContext.newPage();
            await loginThroughUi(reduced, "e2e-reduced@example.test");
            await reduced.getByRole("heading", { name: "Organizaciones", exact: true }).waitFor();
            assert.equal(await reduced.getByRole("button", { name: "Crear organización", exact: true }).count(), 0);
            assert.equal(await reduced.getByRole("button", { name: "Administración", exact: true }).count(), 0);
            assert.equal(await reduced.getByRole("link", { name: "Cuentas", exact: true }).count(), 0);
            await reduced.getByRole("link", { name: "Empresa E2E", exact: true }).click();
            await reduced.getByRole("heading", { name: "Empresa E2E", exact: true }).waitFor();
            assert.equal(await reduced.getByRole("button", { name: "Suspender", exact: true }).count(), 0);
            assert.equal(await reduced.getByRole("tab", { name: "Dominio verificado", exact: true }).count(), 0);
            await reduced.goto(new URL("/plataforma/configuracion", baseUrl).href);
            await reduced.getByRole("heading", { name: "No tenés permiso para ver esta página", exact: true }).waitFor();
          } finally { await reducedContext.close(); }
        }],
        ["A3: Plataforma y persona conviven en el mismo navegador", async (platformPage, setStage) => {
          setStage("ingresa como operador por Plataforma");
          await loginThroughUi(platformPage, "e2e-operator@example.test");
          await expectProfile(platformPage, "Plataforma", "sesión independiente del operador");
          const publicPage = await platformPage.context().newPage();
          publicPage.setDefaultTimeout(30_000);
          try {
            setStage("abre otra pestaña pública con sólo la cookie de Plataforma");
            await publicPage.goto(baseUrl.href);
            await publicPage.getByRole("link", { name: "Ingresá", exact: true }).first().click();
            await publicPage.getByRole("textbox", { name: "Correo electrónico" }).fill(signupEmail);
            const before = new Set(await pickupFiles());
            await sendLoginCode(publicPage, setStage);
            await publicPage.getByRole("heading", { name: "Revisá tu correo" }).waitFor();
            await enterCode(publicPage, await codeFromPickup(signupEmail, before));
            await publicPage.getByRole("button", { name: "Verificar", exact: true }).click();
            await expectProfile(publicPage, "Personal", "persona con otra cuenta en la segunda pestaña");
            setStage("refresca y reabre Plataforma sin pedir otro código");
            await platformPage.reload();
            await expectProfile(platformPage, "Plataforma", "la pestaña del operador conserva Plataforma");
            await platformPage.goto(new URL("/plataforma", baseUrl).href);
            await expectProfile(platformPage, "Plataforma", "la sesión del operador sigue abierta");
            await platformPage.getByRole("heading", { name: "Organizaciones", exact: true }).waitFor();
            setStage("refresca la persona y sale sólo del lado público");
            await publicPage.reload();
            await expectProfile(publicPage, "Personal", "la sesión pública sigue abierta");
            await signOut(publicPage, "Personal");
            await platformPage.reload();
            await expectProfile(platformPage, "Plataforma", "salir como persona conserva Plataforma");
            setStage("sale de Plataforma");
            await signOut(platformPage, "Plataforma");
          } finally { await publicPage.close(); }
        }],
        ["A4: los registros de persona y empresa navegan a Google", async (signupPage, setStage) => {
          for (const [route, buttonLabel] of [["/registro", "Registrarte con Google"], ["/registro/empresa", "Seguir con Google"]]) {
            setStage(`abre ${route} y acepta los términos sin escribir un correo`);
            await signupPage.goto(new URL(route, baseUrl).href);
            await signupPage.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
            const challenge = signupPage.waitForResponse((response) => new URL(response.url()).pathname === "/api/auth/external/google"
              && response.request().method() === "POST");
            setStage(`toca ${buttonLabel} y espera la navegación al proveedor`);
            await signupPage.getByRole("button", { name: buttonLabel, exact: true }).click();
            assert.equal((await challenge).status(), 302, "El formulario Google debe iniciar el desafío OAuth real.");
            // Sólo comprobamos el host: la URL completa lleva state y otros datos efímeros. No ingresamos a Google.
            await signupPage.waitForURL((url) => url.hostname === "accounts.google.com", { waitUntil: "commit", timeout: 30_000 });
            assert.equal(new URL(signupPage.url()).hostname, "accounts.google.com");
          }
        }],
        ["5b: crear, aprobar, reintentar y moderar organizaciones reales", async (platformPage, setStage) => {
          setStage("ingresa el operador para administrar organizaciones");
          await loginThroughUi(platformPage, "e2e-operator@example.test");
          const ownerEmail = `e2e-owner-${randomUUID()}@example.test`;
          const name = "Creada T25";
          setStage("crea una organización con un Dueño sin cuenta");
          await platformPage.getByRole("button", { name: "Crear organización", exact: true }).click();
          const creation = platformPage.getByRole("dialog");
          await creation.getByRole("textbox", { name: "Nombre de la organización" }).fill(name);
          await creation.getByRole("textbox", { name: "Primera empresa" }).fill("Empresa creada T25");
          await creation.getByRole("textbox", { name: "Correo del Dueño" }).fill(ownerEmail);
          const invitationBefore = new Set(await pickupFiles());
          await creation.getByRole("button", { name: "Crear organización", exact: true }).click();
          await creation.waitFor({ state: "hidden" });
          await openPlatformOrganization(platformPage, name);
          await platformPage.getByRole("tab", { name: /^Dueños/ }).click();
          await platformPage.getByText("Invitación pendiente", { exact: true }).waitFor();
          const ownerContext = await browser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR" });
          try {
            setStage("el Dueño acepta la invitación sin crear Personal");
            const owner = await ownerContext.newPage();
            owner.setDefaultTimeout(30_000);
            await owner.goto(await invitationFromPickup(ownerEmail, invitationBefore));
            await owner.getByRole("heading", { name: `Te sumás a ${name}`, exact: true }).waitFor();
            await owner.getByRole("button", { name: "Aceptar invitación", exact: true }).click();
            await owner.getByRole("heading", { name: `Te sumaste a ${name}`, exact: true }).waitFor();
            await owner.getByRole("button", { name: "Más tarde", exact: true }).click();
            await expectPath(owner, "/org", "Dueño acepta el alta de Plataforma");
            await expectProfile(owner, name, "el Dueño entra a la organización creada");
            await owner.goto(new URL("/org/empresas", baseUrl).href);
            await owner.getByRole("link", { name: "Empresa creada T25", exact: true }).waitFor();
          } finally { await ownerContext.close(); }
          setStage("la lista real de Cuentas confirma organización sin Personal para el Dueño invitado");
          await platformNavigate(platformPage, "Gestión", "Cuentas");
          await platformPage.getByRole("searchbox", { name: "Buscar por nombre, correo o teléfono", exact: true }).fill(ownerEmail);
          const invitedOwner = platformPage.getByRole("row").filter({ has: platformPage.getByRole("link", { name: ownerEmail, exact: true }) });
          await invitedOwner.getByRole("cell", { name: "1 organización", exact: true }).waitFor();
          assert.equal(await invitedOwner.getByRole("cell", { name: /Personal/ }).count(), 0,
            "Aceptar la invitación de Plataforma concede empresa sin crear un espacio Personal.");
          for (const [organization, action] of [["Pendiente T25", "Aprobar"], ["Alta interrumpida T25", "Reintentar el alta"]]) {
            setStage(`${action} preserva la empresa y el miembro existentes`);
            await openPlatformOrganization(platformPage, organization);
            await platformPage.getByText(/1 empresa · 1 miembro$/).filter({ visible: true }).first().waitFor();
            if (action === "Aprobar") await confirmPlatformReason(platformPage, action);
            else await platformPage.getByRole("button", { name: action, exact: true }).click();
            await platformPage.getByText("Activa", { exact: true }).first().waitFor();
            await platformPage.reload();
            await platformPage.getByRole("heading", { name: organization, exact: true }).waitFor();
            await platformPage.getByText(/1 empresa · 1 miembro$/).filter({ visible: true }).first().waitFor();
          }
          await openPlatformOrganization(platformPage, "Empresa E2E");
          setStage("suspende Business y conserva el ingreso Personal del Dueño");
          await confirmPlatformReason(platformPage, "Suspender");
          await platformPage.getByText("Suspendida", { exact: true }).first().waitFor();
          const personContext = await browser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR" });
          try {
            const person = await personContext.newPage();
            await loginThroughUi(person, businessEmail, "consumer");
            await expectProfile(person, "Personal", "el Dueño conserva Personal durante la suspensión");
          } finally {
            await personContext.close();
            await confirmPlatformReason(platformPage, "Reactivar");
          }
          assert.equal(await platformPage.getByRole("tab", { name: /^Módulos/ }).count(), 0,
            "El preparador y el catálogo real no contienen módulos; T25 permite registrar esta ausencia.");
          setStage("despublica la página y bloquea la publicación desde Business");
          await platformPage.getByRole("tab", { name: "Página pública", exact: true }).click();
          await confirmPlatformReason(platformPage, "Despublicar");
          const businessContext = await browser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR" });
          try {
            const business = await businessContext.newPage();
            await loginThroughUi(business, businessEmail, "business");
            await business.goto(new URL("/org/pagina", baseUrl).href);
            await business.getByRole("heading", { name: "Página pública", exact: true }).waitFor();
            const publish = business.getByRole("switch");
            assert.equal(await publish.getAttribute("aria-disabled"), "true");
            setStage("Business intenta publicar y ve el aviso de moderación");
            // El switch usa aria-disabled y permite tocarlo para abrir el aviso; Space ejercita esa UI real.
            await publish.focus();
            await publish.press("Space");
            await business.getByRole("dialog").getByRole("heading", { name: "Página despublicada" }).waitFor();
            await business.getByRole("dialog").getByRole("button", { name: "Cerrar", exact: true }).click();
            assert.equal(await publish.isChecked(), false, "El control moderado no puede publicar la página.");
            setStage("permite publicar y Business vuelve a publicar por pantalla");
            await confirmPlatformReason(platformPage, "Permitir publicar");
            await business.reload();
            await business.getByRole("heading", { name: "Página pública", exact: true }).waitFor();
            await business.getByRole("switch").click();
            await business.getByText("Publicada", { exact: true }).first().waitFor();
            // E6 conserva su recorrido de edición de borrador y publicación desde cero.
            await business.getByRole("switch").click();
            await business.getByRole("dialog").getByRole("button", { name: "Despublicar", exact: true }).click();
            await business.getByText("Borrador", { exact: true }).first().waitFor();
          } finally { await businessContext.close(); }
          setStage("quita el dominio y conserva el método vinculado de la cuenta");
          await openPlatformAccount(platformPage, "Cuenta E2E");
          const methods = platformPage.getByRole("list", { name: "Métodos de ingreso", exact: true });
          await methods.getByRole("listitem").filter({ hasText: "Administrado por Empresa E2E" }).waitFor();
          const beforeMethods = await methods.getByRole("listitem").allTextContents();
          assert.equal(beforeMethods.length, 2, "El preparador incluye un método propio y uno administrado.");
          await openPlatformOrganization(platformPage, "Empresa E2E");
          await platformPage.getByRole("tab", { name: "Dominio verificado", exact: true }).click();
          await platformPage.getByRole("row", { name: /corp.example.test/ }).waitFor();
          await confirmPlatformReason(platformPage, "Quitar");
          await platformPage.getByText("Sin dominio de correo", { exact: true }).waitFor();
          await openPlatformAccount(platformPage, "Cuenta E2E");
          await platformPage.reload();
          await platformPage.getByRole("heading", { name: "Cuenta E2E", exact: true }).waitFor();
          await methods.getByRole("listitem").filter({ hasText: "Administrado por Empresa E2E" }).waitFor();
          assert.deepEqual(await methods.getByRole("listitem").allTextContents(), beforeMethods,
            "Quitar el dominio no retira ni altera los métodos vinculados de la cuenta.");
        }],
        ["5c: suspender, reactivar, cerrar sesiones, dar de baja y recuperar cuentas", async (platformPage, setStage) => {
          setStage("ingresa el operador para administrar cuentas");
          await loginThroughUi(platformPage, "e2e-operator@example.test");
          await openPlatformAccount(platformPage, "Cuenta E2E");
          setStage("suspende y reactiva una cuenta por Plataforma");
          await confirmPlatformReason(platformPage, "Suspender");
          await platformPage.getByText("Suspendida", { exact: true }).first().waitFor();
          await platformPage.reload();
          await platformPage.getByRole("heading", { name: "Cuenta E2E", exact: true }).waitFor();
          await confirmPlatformReason(platformPage, "Reactivar");
          await platformPage.getByText("Activa", { exact: true }).first().waitFor();
          const memberContext = await browser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR" });
          try {
            const member = await memberContext.newPage();
            await loginThroughUi(member, businessEmail, "consumer");
            setStage("cierra sesiones y comprueba el reingreso después de F5");
            await confirmPlatformReason(platformPage, "Cerrar sesiones");
            await member.reload();
            await member.getByRole("button", { name: /, Personal$/ }).waitFor({ state: "hidden" });
            const login = member.getByRole("textbox", { name: "Correo electrónico", exact: true });
            const returnToLogin = member.getByRole("link", { name: "Volver a ingresar", exact: true });
            const publicLogin = member.getByRole("link", { name: "Ingresá", exact: true });
            try { await login.or(returnToLogin).or(publicLogin).first().waitFor(); }
            catch { throw new Error(`F5 después de cerrar sesiones no ofrece ingreso; ruta ${new URL(member.url()).pathname}.`); }
            if (await returnToLogin.isVisible()) await returnToLogin.click();
            else if (await publicLogin.isVisible()) await publicLogin.click();
            await login.waitFor();
          } finally { await memberContext.close(); }
          const deletionContext = await browser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR" });
          try {
            setStage("registra otra cuenta y solicita su baja desde Plataforma");
            const person = await deletionContext.newPage();
            person.setDefaultTimeout(30_000);
            const email = await registerPerson(person);
            await openPlatformAccount(platformPage, email);
            await platformPage.getByRole("button", { name: /^Acciones de/ }).click();
            await platformPage.getByRole("menuitem", { name: "Dar de baja", exact: true }).click();
            const dialog = platformPage.getByRole("dialog");
            await dialog.getByRole("textbox", { name: /^Motivo/ }).fill("Verificación de baja T25");
            await dialog.getByRole("button", { name: "Dar de baja", exact: true }).click();
            await dialog.waitFor({ state: "hidden" });
            await platformPage.getByText("Baja pedida", { exact: true }).first().waitFor();
            await person.reload();
            await person.getByRole("button", { name: /, Personal$/ }).waitFor({ state: "hidden" });
          } finally { await deletionContext.close(); }
          const recoveryContext = await browser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR" });
          try {
            setStage("pide Recuperar mi cuenta con un correo nuevo verificado");
            const person = await recoveryContext.newPage();
            person.setDefaultTimeout(30_000);
            const previous = await registerPerson(person);
            await signOut(person, "Personal");
            const next = `e2e-recovery-${randomUUID()}@example.test`;
            await person.goto(new URL("/recuperar", baseUrl).href);
            await person.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(previous);
            await person.getByRole("button", { name: "Seguir", exact: true }).click();
            await person.getByRole("textbox", { name: "Correo electrónico nuevo", exact: true }).fill(next);
            const before = new Set(await pickupFiles());
            await person.getByRole("button", { name: "Enviar código", exact: true }).click();
            await person.getByRole("heading", { name: "Revisá tu correo" }).waitFor();
            await enterCode(person, await codeFromPickup(next, before));
            await person.getByRole("button", { name: "Verificar", exact: true }).click();
            await person.getByRole("heading", { name: "Recibimos tu pedido", exact: true }).waitFor();
            setStage("el operador aprueba la recuperación y la persona ingresa con el correo nuevo");
            await platformNavigate(platformPage, "Gestión", "Recuperaciones");
            await platformPage.getByRole("searchbox", { name: "Buscar por cuenta, correo o teléfono", exact: true }).fill(next);
            // Recuperaciones muestra métodos enmascarados; la búsqueda real por el correo selecciona el pedido.
            await platformPage.getByRole("button", { name: /^Acciones de/ }).click();
            await platformPage.getByRole("menuitem", { name: "Revisar", exact: true }).click();
            const review = platformPage.getByRole("dialog");
            await review.getByRole("textbox", { name: /^Motivo/ }).fill("Identidad comprobada en recorrido T25");
            await review.getByRole("button", { name: "Aprobar", exact: true }).click();
            await review.waitFor({ state: "hidden" });
            await platformPage.getByText("Aprobado", { exact: true }).waitFor();
            setStage("ingresa con el correo recuperado y comprueba que es Principal en Mi cuenta");
            await loginThroughUi(person, next, "consumer");
            await openAccount(person);
            const recoveredMethod = person.getByRole("list", { name: "Cómo entrás", exact: true })
              .getByRole("listitem").filter({ hasText: next });
            await recoveredMethod.getByText(next, { exact: true }).waitFor();
            await recoveredMethod.getByText("Principal", { exact: true }).waitFor();
          } finally { await recoveryContext.close(); }
        }],
        ["5d: publicar y aceptar legales, consultar auditoría y guardar configuración", async (platformPage, setStage) => {
          setStage("ingresa el operador para legales y configuración");
          await loginThroughUi(platformPage, "e2e-operator@example.test");
          setStage("publica por pantalla una versión de Privacidad vigente hoy");
          await platformNavigate(platformPage, "Administración", "Documentos legales");
          await platformPage.getByRole("link", { name: "Publicar versión nueva", exact: true }).click();
          await platformPage.getByRole("combobox", { name: "Documento" }).click();
          await platformPage.getByRole("option", { name: "Política de privacidad", exact: true }).click();
          const civil = new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());
          await platformPage.getByRole("textbox", { name: "Vigente desde" }).fill(civil);
          await platformPage.getByRole("textbox", { name: "En español" }).fill("Política de privacidad publicada por el operador en el recorrido real T25.");
          await platformPage.getByRole("textbox", { name: "En inglés" }).fill("Privacy policy published by the operator during the real T25 journey.");
          await platformPage.getByRole("button", { name: "Publicar", exact: true }).click();
          await platformPage.getByRole("alertdialog").getByRole("button", { name: "Publicar", exact: true }).click();
          await platformPage.getByRole("heading", { name: "Actualizamos los términos" }).waitFor();
          await acceptCurrentTerms(platformPage);
          await platformPage.reload();
          await platformPage.getByRole("heading", { name: "Documentos legales", exact: true }).waitFor();
          await platformPage.getByText(/Versión 2 · vigente desde/).waitFor();
          setStage("consulta un movimiento y su detalle en Auditoría");
          await platformNavigate(platformPage, "Administración", "Auditoría");
          await platformPage.getByRole("button", { name: /^Ver el detalle:/ }).first().click();
          await platformPage.getByRole("dialog").getByText("Fecha y hora", { exact: true }).waitFor();
          await platformPage.getByRole("dialog").getByRole("button", { name: "Cerrar", exact: true }).last().click();
          setStage("guarda configuración con motivo y verifica después de F5");
          await platformNavigate(platformPage, "Administración", "Configuración");
          const limit = platformPage.getByRole("textbox", { name: "Organizaciones propias por persona" });
          const original = await limit.inputValue();
          const next = original === "4" ? "5" : "4";
          await limit.fill(next);
          // El seed deja los contactos vacíos hasta el primer guardado: la UI requiere completar ambos.
          await platformPage.getByRole("textbox", { name: "Correo de ventas", exact: true }).fill("e2e-sales@example.test");
          await platformPage.getByRole("textbox", { name: "Correo de soporte", exact: true }).fill("e2e-support@example.test");
          await platformPage.getByRole("button", { name: "Guardar cambios", exact: true }).click();
          setStage("confirma el motivo del guardado de Configuración");
          const dialog = platformPage.getByRole("dialog", { name: "¿Guardar la configuración?", exact: true });
          await dialog.getByRole("textbox", { name: /^Motivo/ }).fill("Verificación de configuración T25");
          await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
          await dialog.waitFor({ state: "hidden" });
          await platformPage.reload();
          await platformPage.getByRole("heading", { name: "Configuración", exact: true }).waitFor();
          assert.equal(await limit.inputValue(), next);
          assert.equal(await platformPage.getByRole("textbox", { name: "Correo de ventas", exact: true }).inputValue(), "e2e-sales@example.test");
          assert.equal(await platformPage.getByRole("textbox", { name: "Correo de soporte", exact: true }).inputValue(), "e2e-support@example.test");
        }],
        ["4: administrar roles y bloquear la baja del único Dueño", async (rolesPage, setStage) => {
          setStage("ingresa como Dueño por la puerta de empresa");
          await rolesPage.goto(new URL("/login/empresa", baseUrl).href);
          await rolesPage.getByRole("textbox", { name: "Correo electrónico" }).fill(businessEmail);
          const loginBefore = new Set(await pickupFiles());
          await sendLoginCode(rolesPage);
          await rolesPage.getByRole("heading", { name: "Revisá tu correo" }).waitFor();
          await enterCode(rolesPage, await codeFromPickup(businessEmail, loginBefore));
          await rolesPage.getByRole("button", { name: "Verificar", exact: true }).click();
          await expectPath(rolesPage, "/org", "ingreso del Dueño para E4");
          await acceptCurrentTerms(rolesPage);
          await expectProfile(rolesPage, "Empresa E2E", "ingreso del Dueño para E4");

          const authorization = accountTokens.get(rolesPage);
          assert.equal(typeof authorization, "string", "El navegador debe haber obtenido su token real de empresa.");
          const headers = { Authorization: authorization };

          setStage("consulta el catálogo de permisos de la organización");
          const permissionResponse = await rolesPage.request.get(new URL("/api/permissions", baseUrl).href, { headers });
          assert.equal(permissionResponse.status(), 200,
            `El catálogo de permisos debe estar disponible para el Dueño (HTTP ${permissionResponse.status()}).`);
          const permissionGroups = await permissionResponse.json();
          assert.ok(permissionGroups.flatMap((group) => group.permissions ?? [])
            .some((permission) => permission.code === "roles.manage"));

          setStage("lista roles y confirma que están los roles de sistema");
          const listResponse = await rolesPage.request.get(new URL("/api/roles/paged?page=1&pageSize=100", baseUrl).href, { headers });
          assert.equal(listResponse.status(), 200,
            `El Dueño debe poder consultar los roles de su organización (HTTP ${listResponse.status()}).`);
          const rolePage = await listResponse.json();
          const systemRole = rolePage.items?.find((role) => role.isSystemRole === true);
          assert.ok(systemRole, "La organización debe tener roles de sistema protegidos.");

          setStage("crea un rol organizacional con un permiso del catálogo");
          const roleName = `Rol E2E ${randomUUID().slice(0, 8)}`;
          const createResponse = await rolesPage.request.post(new URL("/api/roles", baseUrl).href, {
            headers: { ...headers, "Idempotency-Key": randomUUID() },
            data: { name: roleName, description: "Rol de prueba aislado", scope: "Organization", permissions: ["roles.read"] },
          });
          assert.equal(createResponse.status(), 201, "Crear un rol válido debe responder 201.");
          const roleLocation = createResponse.headers().location;
          assert.ok(roleLocation, "El alta debe devolver la ubicación del rol creado.");
          const roleUrl = new URL(roleLocation, baseUrl);
          const roleId = roleUrl.pathname.split("/").at(-1);
          assert.match(roleId ?? "", /^[0-9a-f-]{36}$/i);

          setStage("recupera la versión, edita y rechaza la edición obsoleta");
          const detailResponse = await rolesPage.request.get(roleUrl.href, { headers });
          assert.equal(detailResponse.status(), 200);
          const role = await detailResponse.json();
          assert.equal(role.name, roleName);
          assert.equal(typeof role.version, "number");
          const updatedName = `${roleName} editado`;
          const updateData = { name: updatedName, description: role.description, scope: role.scope,
            companyId: role.companyId ?? null, permissions: role.permissions, version: role.version };
          const updateResponse = await rolesPage.request.put(roleUrl.href, { headers, data: updateData });
          assert.equal(updateResponse.status(), 200, "La versión vigente debe permitir guardar.");
          const saved = await updateResponse.json();
          assert.equal(typeof saved.version, "number", "El guardado debe responder la versión nueva.");
          const staleResponse = await rolesPage.request.put(roleUrl.href, { headers, data: updateData });
          assert.equal(staleResponse.status(), 409, "Una versión obsoleta debe responder 409.");
          assert.equal((await staleResponse.json()).code, "General.ConcurrencyConflict");
          const afterStaleResponse = await rolesPage.request.get(roleUrl.href, { headers });
          const afterStale = await afterStaleResponse.json();
          assert.equal(afterStale.name, updatedName, "El conflicto no debe pisar el primer cambio.");
          assert.equal(afterStale.version, saved.version, "La versión que respondió el guardado es la que lee la ficha.");

          setStage("abre el listado real y actualiza un rol desde la pantalla de edición");
          await rolesPage.goto(new URL("/org/roles", baseUrl).href);
          await rolesPage.getByRole("heading", { name: "Roles y permisos" }).waitFor();
          await rolesPage.getByRole("link", { name: updatedName }).click();
          await rolesPage.getByRole("heading", { name: updatedName }).waitFor();
          const roleNameField = rolesPage.getByRole("textbox", { name: "Nombre" });
          await roleNameField.fill(`${updatedName} desde pantalla`);
          const uiUpdate = rolesPage.waitForResponse((response) =>
            new URL(response.url()).pathname === `/api/roles/${roleId}` && response.request().method() === "PUT");
          await rolesPage.getByRole("button", { name: "Guardar cambios", exact: true }).click();
          const uiUpdateResponse = await uiUpdate;
          const uiUpdateProblem = uiUpdateResponse.status() === 200 ? null : await uiUpdateResponse.json().catch(() => null);
          assert.equal(uiUpdateResponse.status(), 200,
            `La pantalla debe guardar el rol con su versión vigente (${uiUpdateProblem?.code ?? "sin código"}; campos: ${Object.keys(uiUpdateProblem?.errors ?? {}).join(", ") || "ninguno"}).`);
          await rolesPage.getByRole("heading", { name: `${updatedName} desde pantalla` }).waitFor();

          setStage("crea un segundo rol desde la pantalla real y envía la versión idempotente");
          const uiRoleName = `Rol UI E2E ${randomUUID()}`;
          await rolesPage.goto(new URL("/org/roles/nuevo", baseUrl).href);
          await rolesPage.getByRole("textbox", { name: "Nombre" }).fill(uiRoleName);
          await rolesPage.getByRole("textbox", { name: "Descripción" }).fill("Creado por el recorrido real del front.");
          setStage("elige que el rol aplica a toda la organización");
          await rolesPage.getByRole("combobox", { name: "Vale en" }).click();
          await rolesPage.getByRole("option", { name: "Toda la organización" }).click();
          setStage("expande el grupo de permisos Roles");
          await rolesPage.getByRole("button", { name: "Abrir o cerrar Roles", exact: true }).click();
          setStage("selecciona el permiso Ver roles");
          const readRolesPermission = rolesPage.getByRole("checkbox", { name: "Ver roles", exact: true });
          await readRolesPermission.focus();
          await readRolesPermission.press("Space");
          assert.equal(await readRolesPermission.getAttribute("aria-checked"), "true",
            "La casilla Ver roles debe responder a la barra espaciadora.");
          setStage("envía el alta del segundo rol desde la pantalla");
          const uiCreate = rolesPage.waitForResponse((response) =>
            new URL(response.url()).pathname === "/api/roles" && response.request().method() === "POST");
          await rolesPage.getByRole("button", { name: "Crear rol", exact: true }).click();
          const uiCreateResponse = await uiCreate;
          assert.equal(uiCreateResponse.status(), 201, "El formulario real debe crear el rol organizacional.");
          const createdUiRoleId = await uiCreateResponse.json();
          assert.match(createdUiRoleId, /^[0-9a-f-]{36}$/i);
          await rolesPage.getByRole("heading", { name: uiRoleName }).waitFor();

          // B2 (tablero Rol): el nombre repetido se dice debajo del nombre, con el texto del back; corregido, el mismo
          // formulario crea el rol con otra Idempotency-Key (con la misma, el back respondería 422 hasta recargar).
          setStage("intenta crear otro rol con el mismo nombre");
          const repeatedRolePath = "/api/roles";
          await rolesPage.goto(new URL("/org/roles/nuevo", baseUrl).href);
          const repeatedNameField = rolesPage.getByRole("textbox", { name: "Nombre" });
          await repeatedNameField.fill(uiRoleName);
          await rolesPage.getByRole("combobox", { name: "Vale en" }).click();
          await rolesPage.getByRole("option", { name: "Toda la organización" }).click();
          await rolesPage.getByRole("button", { name: "Abrir o cerrar Roles", exact: true }).click();
          const repeatedPermission = rolesPage.getByRole("checkbox", { name: "Ver roles", exact: true });
          await repeatedPermission.focus();
          await repeatedPermission.press("Space");
          const repeatedCreate = rolesPage.waitForResponse((response) =>
            new URL(response.url()).pathname === repeatedRolePath && response.request().method() === "POST");
          await rolesPage.getByRole("button", { name: "Crear rol", exact: true }).click();
          const repeatedResponse = await repeatedCreate;
          assert.equal(repeatedResponse.status(), 409, "Un nombre repetido en la organización debe responder 409.");
          const repeatedProblem = await repeatedResponse.json();
          assert.equal(repeatedProblem.code, "Roles.Role.AlreadyExists");
          const repeatedKey = repeatedResponse.request().headers()["idempotency-key"];
          assert.match(repeatedKey ?? "", /^[0-9a-f-]{36}$/i, "El alta debe mandar su Idempotency-Key.");
          setStage("ve el nombre repetido debajo de su campo");
          await rolesPage.getByText(repeatedProblem.detail, { exact: true }).waitFor();
          assert.equal(await repeatedNameField.getAttribute("aria-invalid"), "true", "El error del nombre va en su campo.");
          assert.equal(new URL(rolesPage.url()).pathname, "/org/roles/nuevo", "Con el error, sigue en el alta.");

          setStage("corrige el nombre y crea el rol con otra clave");
          const correctedRoleName = `${uiRoleName} corregido`;
          await repeatedNameField.fill(correctedRoleName);
          const correctedCreate = rolesPage.waitForResponse((response) =>
            new URL(response.url()).pathname === repeatedRolePath && response.request().method() === "POST");
          await rolesPage.getByRole("button", { name: "Crear rol", exact: true }).click();
          const correctedResponse = await correctedCreate;
          assert.equal(correctedResponse.status(), 201, "Con el nombre corregido, el mismo formulario crea el rol.");
          const correctedKey = correctedResponse.request().headers()["idempotency-key"];
          assert.match(correctedKey ?? "", /^[0-9a-f-]{36}$/i);
          assert.notEqual(correctedKey, repeatedKey, "El segundo «Crear rol» sale con otra Idempotency-Key.");
          await rolesPage.getByRole("heading", { name: correctedRoleName }).waitFor();

          setStage("intenta borrar un rol de sistema con su versión vigente");
          const systemRoleUrl = new URL(`/api/roles/${systemRole.id}`, baseUrl);
          const systemDelete = await rolesPage.request.delete(systemRoleUrl.href, { headers, data: { version: systemRole.version } });
          assert.equal(systemDelete.status(), 403, "Un rol de sistema no se puede borrar.");

          setStage("abre Mi cuenta como único Dueño y comprueba que la baja está bloqueada");
          await openAccount(rolesPage, "Empresa E2E");
          // Tablero Cuenta: «Dar de baja» apagado; el aviso enumera las organizaciones donde es única Dueña.
          const blockedInfo = rolesPage.getByRole("button", { name: "Por qué no podés darte de baja", exact: true });
          setStage("comprueba el acceso al motivo de baja bloqueada del único Dueño");
          await blockedInfo.waitFor();
          setStage("comprueba Dar de baja apagado para el único Dueño");
          assert.equal(await rolesPage.getByRole("button", { name: "Dar de baja", exact: true }).getAttribute("aria-disabled"), "true",
            "La baja del único Dueño queda apagada.");
          setStage("abre el aviso No podés dar de baja tu cuenta");
          await blockedInfo.click();
          const blockedDialog = rolesPage.getByRole("dialog");
          await blockedDialog.getByRole("heading", { name: "No podés dar de baja tu cuenta" }).waitFor();
          setStage("comprueba las tres organizaciones donde la cuenta es única Dueña");
          const reasonPrefix = "Sos la única persona con el rol Dueño en ";
          const blockedReason = blockedDialog.getByText(/^Sos la única persona con el rol Dueño en /);
          await blockedReason.waitFor();
          const soleOwnedOrganizations = (await blockedReason.textContent()).slice(reasonPrefix.length).split(", ").sort();
          assert.deepEqual(soleOwnedOrganizations, ["Alta interrumpida T25", "Empresa E2E", "Pendiente T25"],
            "El aviso identifica las tres organizaciones reales donde la cuenta es única Dueña.");
          setStage("cierra el aviso de baja bloqueada sin solicitar la baja");
          await blockedDialog.getByRole("button", { name: "Entendido", exact: true }).click();
        }],
        ["6: registrar empresa por correo sin crear Personal", async (businessSignupPage, setStage) => {
          await registerBusinessByEmail(businessSignupPage, readyFile, setStage);
        }],
        ["6: invitar desde Usuarios y aceptar con/sin cuenta previa", async (adminPage, setStage) => {
          setStage("ingresa como el mismo Dueño con su método administrado conservado");
          await adminPage.goto(new URL("/login/empresa", baseUrl).href);
          await adminPage.getByRole("textbox", { name: "Correo electrónico" }).fill(managedBusinessEmail);
          const ownerLoginBefore = new Set(await pickupFiles());
          await sendLoginCode(adminPage, setStage);
          await adminPage.getByRole("heading", { name: "Revisá tu correo" }).waitFor();
          await enterCode(adminPage, await codeFromPickup(managedBusinessEmail, ownerLoginBefore));
          await adminPage.getByRole("button", { name: "Verificar", exact: true }).click();
          await expectPath(adminPage, "/org", "ingreso del Dueño para invitar desde Usuarios");
          await acceptCurrentTerms(adminPage);
          await adminPage.getByRole("button", { name: "Cuenta E2E, Empresa E2E", exact: true }).waitFor();

          setStage("ve el inicio real: las áreas y la página en borrador para resolver");
          const areas = adminPage.getByRole("navigation", { name: "Áreas de la organización" });
          await areas.getByRole("link", { name: /^Usuarios/ }).waitFor();
          await areas.getByRole("link", { name: /^Auditoría/ }).waitFor();
          const toResolve = adminPage.getByRole("region", { name: "Para resolver" });
          await toResolve.getByText("Borrador", { exact: true }).waitFor();
          assert.equal(await toResolve.getByRole("link", { name: "Ver", exact: true }).getAttribute("href"), "/org/pagina");

          setStage("crea una empresa desde el flujo real de Empresas");
          await adminPage.goto(new URL("/org/empresas", baseUrl).href);
          await adminPage.getByRole("heading", { name: "Empresas", exact: true }).waitFor();
          await adminPage.getByRole("button", { name: "Crear empresa", exact: true }).click();
          const companyDialog = adminPage.getByRole("dialog");
          await companyDialog.getByRole("textbox", { name: "Nombre", exact: true }).fill(e2eCompanyName);
          await companyDialog.getByRole("combobox", { name: "Zona de negocio", exact: true }).click();
          await adminPage.getByRole("option", { name: "Buenos Aires (GMT−3)", exact: true }).click();
          const companyCreated = adminPage.waitForResponse((response) => new URL(response.url()).pathname === "/api/companies"
            && response.request().method() === "POST");
          await companyDialog.getByRole("button", { name: "Crear empresa", exact: true }).click();
          const companyResponse = await companyCreated;
          assert.equal(companyResponse.status(), 201, "La pantalla real debe crear la empresa.");
          e2eCompanyId = await companyResponse.json();
          assert.match(e2eCompanyId, /^[0-9a-f-]{36}$/i);
          await adminPage.getByRole("link", { name: e2eCompanyName, exact: true }).waitFor();

          for (const existingAccount of [false, true]) {
            const email = `e2e-ui-invitation-${randomUUID()}@example.test`;
            if (existingAccount) {
              setStage("prepara una cuenta existente sin espacio Personal");
              await invitationCommand(readyFile, { kind: "prepare-recipient", email });
            }
            setStage(`emite desde Usuarios para persona ${existingAccount ? "con cuenta" : "sin cuenta"}`);
            const { invitationId, link } = await inviteFromUsersPage(adminPage, email, e2eCompanyName);
            const browser = adminPage.context().browser();
            assert.ok(browser, "El recorrido requiere el navegador real de Playwright.");
            const recipientContext = await browser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR" });
            const recipientPage = await recipientContext.newPage();
            try {
              setStage("abre la vista previa del enlace recibido por correo");
              await recipientPage.goto(link);
              await recipientPage.getByRole("heading", { name: "Te sumás a Empresa E2E", exact: true }).waitFor({ timeout: 15_000 });
              await recipientPage.getByText(`La invitación es para ${email}.`, { exact: true }).waitFor();
              assert.equal(new URL(recipientPage.url()).hash, "", "El fragmento secreto debe retirarse de la URL.");
              // Tablero Invitacion: la empresa y los roles elegidos al invitar, y quién invita con su rol.
              const offered = recipientPage.locator("dl");
              await offered.getByText(e2eCompanyName, { exact: true }).waitFor();
              await offered.getByText("Dueño, Administrador", { exact: true }).waitFor();
              await recipientPage.getByText(/^Dueño · /).waitFor();

              if (existingAccount) {
                setStage("ingresa la cuenta existente sin crear Personal");
                await recipientPage.getByRole("button", { name: "Ingresá para aceptar", exact: true }).click();
                await recipientPage.getByRole("textbox", { name: "Correo electrónico" }).fill(email);
                const loginBefore = new Set(await pickupFiles());
                await sendLoginCode(recipientPage, setStage);
                await recipientPage.getByRole("heading", { name: "Revisá tu correo" }).waitFor();
                await enterCode(recipientPage, await codeFromPickup(email, loginBefore));
                await recipientPage.getByRole("button", { name: "Verificar", exact: true }).click();
                await expectPath(recipientPage, "/invitacion", "retorno de la cuenta existente a la invitación");
                const beforeAcceptance = await invitationCommand(readyFile, { kind: "inspect", email, invitationId });
                assert.equal(beforeAcceptance.personalSpaces, 0, "El ingreso para aceptar no puede crear Personal.");
                assert.equal(beforeAcceptance.accepted, false, "El ingreso no consume la invitación.");
              } else {
                await recipientPage.getByText(/^Al aceptar creamos tu cuenta con este correo/).waitFor();
              }

              setStage("acepta la invitación emitida por la pantalla de Usuarios");
              const acceptedResponsePromise = recipientPage.waitForResponse((response) =>
                new URL(response.url()).pathname === "/api/invitations/accept" && response.request().method() === "POST");
              await recipientPage.getByRole("button", { name: "Aceptar invitación", exact: true }).click();
              assert.equal((await acceptedResponsePromise).status(), 200);
              const inspection = await invitationCommand(readyFile, { kind: "inspect", email, invitationId,
                companyId: e2eCompanyId });
              assert.equal(inspection.personalSpaces, 0);
              assert.equal(inspection.activeBusinessAccesses, 1);
              assert.equal(inspection.accepted, true);
              assert.equal(inspection.boundToIdentity, true);
              assert.equal(inspection.companyMembershipActive, true,
                "La invitación debe vincular la membresía a la empresa elegida.");
              assert.equal(inspection.companyAdminAssigned, true,
                "La invitación debe conservar el rol de empresa elegido.");
              if (!existingAccount) {
                // Solo con el correo de la empresa: el aviso de respaldo; si no, entra directo sin pantalla intermedia.
                await recipientPage.getByRole("heading", { name: "Te sumaste a Empresa E2E", exact: true }).waitFor();
                await recipientPage.getByRole("button", { name: "Más tarde", exact: true }).click();
              }
              await expectPath(recipientPage, "/org", "entrada luego de aceptar invitación desde Usuarios");
            } finally {
              await recipientContext.close();
            }
          }
          // B4 (decisiones 86 y 87): quien administra una empresa sin roles de la organización ve en su Inicio la
          // invitación vencida de esa empresa, y «Reenviar» lo lleva a la ficha de la empresa, donde busca y filtra.
          setStage("invita a un Administrador de empresa sin roles de la organización");
          const companyAdminEmail = `e2e-company-admin-${randomUUID()}@example.test`;
          const { link: companyAdminLink } = await inviteFromUsersPage(adminPage, companyAdminEmail, e2eCompanyName, { organizationRole: null });
          setStage("deja vencida otra invitación de la misma empresa");
          const expiredEmail = `e2e-company-expired-${randomUUID()}@example.test`;
          const { invitationId: expiredInvitationId } = await inviteFromUsersPage(adminPage, expiredEmail, e2eCompanyName, { organizationRole: null });
          await invitationCommand(readyFile, { kind: "expire", email: expiredEmail, invitationId: expiredInvitationId });
          const companyAdminBrowser = adminPage.context().browser();
          assert.ok(companyAdminBrowser, "El recorrido requiere el navegador real de Playwright.");
          const companyAdminContext = await companyAdminBrowser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR" });
          const companyAdminPage = await companyAdminContext.newPage();
          try {
            setStage("el Administrador de empresa acepta su invitación");
            await companyAdminPage.goto(companyAdminLink);
            await companyAdminPage.getByRole("heading", { name: "Te sumás a Empresa E2E", exact: true }).waitFor({ timeout: 15_000 });
            await companyAdminPage.locator("dl").getByText(e2eCompanyName, { exact: true }).waitFor();
            const companyAdminAccepted = companyAdminPage.waitForResponse((response) =>
              new URL(response.url()).pathname === "/api/invitations/accept" && response.request().method() === "POST");
            await companyAdminPage.getByRole("button", { name: "Aceptar invitación", exact: true }).click();
            assert.equal((await companyAdminAccepted).status(), 200);
            await companyAdminPage.getByRole("heading", { name: "Te sumaste a Empresa E2E", exact: true }).waitFor();
            await companyAdminPage.getByRole("button", { name: "Más tarde", exact: true }).click();
            await expectPath(companyAdminPage, "/org", "entrada del Administrador de empresa");

            setStage("el Administrador de empresa ve su «Para resolver», con la empresa de la fila");
            await companyAdminPage.getByRole("heading", { level: 2, name: "Tus empresas" }).waitFor();
            const companyToResolve = companyAdminPage.getByRole("region", { name: "Para resolver" });
            const expiredRow = companyToResolve.getByRole("row").filter({ hasText: expiredEmail });
            await expiredRow.getByText(e2eCompanyName, { exact: true }).waitFor();
            await expiredRow.getByText("Vencida", { exact: true }).waitFor();
            const resend = expiredRow.getByRole("link", { name: "Reenviar", exact: true });
            assert.equal(await resend.getAttribute("href"), `/org/empresas/${e2eCompanyId}`);

            setStage("«Reenviar» abre la ficha de su empresa, con sus miembros");
            await resend.click();
            await expectPath(companyAdminPage, `/org/empresas/${e2eCompanyId}`, "ficha de la empresa del Administrador de empresa");
            await companyAdminPage.getByRole("heading", { level: 1, name: e2eCompanyName, exact: true }).waitFor();
            setStage("ve Miembros sin pestañas y conserva el rol Administrador de empresa");
            // B4: sin roles.read solo ve Miembros; Page presenta ese grupo sin barra ni tabpanel.
            assert.equal(await companyAdminPage.getByRole("tablist").count(), 0);
            const companyMembers = companyAdminPage.getByRole("table");
            await companyMembers.waitFor();
            await companyMembers.getByRole("row").filter({ hasText: companyAdminEmail }).getByText("Administrador", { exact: true }).waitFor();
            assert.equal(await companyAdminPage.getByRole("heading", { name: "No tenés permiso para ver esta página" }).count(), 0);

            setStage("busca un miembro y filtra los miembros por estado");
            const membersRead = (check) => companyAdminPage.waitForResponse((response) => {
              const url = new URL(response.url());
              return url.pathname === `/api/companies/${e2eCompanyId}/members/paged` && check(url.searchParams) && response.status() === 200;
            });
            const searched = membersRead((params) => params.get("search") === companyAdminEmail);
            await companyAdminPage.getByRole("searchbox", { name: "Buscar por nombre o correo", exact: true }).fill(companyAdminEmail);
            await searched;
            await companyMembers.getByRole("row").filter({ hasText: companyAdminEmail }).waitFor();
            const filtered = membersRead((params) => params.get("state") === "Active");
            await companyAdminPage.getByRole("button", { name: "Estado: todos", exact: true }).click();
            await companyAdminPage.getByRole("menuitemradio", { name: /^Activos/ }).click();
            await filtered;
            assert.equal(new URL(companyAdminPage.url()).searchParams.get("state"), "Active");
            await companyMembers.getByRole("row").filter({ hasText: companyAdminEmail }).getByText("Activo", { exact: true }).waitFor();
          } finally {
            await companyAdminContext.close();
          }

          const updatedCompanyName = `${e2eCompanyName} actualizada`;
          setStage("edita la empresa desde su ficha");
          await adminPage.goto(new URL(`/org/empresas/${e2eCompanyId}`, baseUrl).href);
          await adminPage.getByRole("heading", { name: e2eCompanyName, exact: true }).waitFor();
          await adminPage.getByRole("button", { name: "Editar empresa", exact: true }).click();
          const companyEdit = adminPage.getByRole("dialog");
          await companyEdit.getByRole("textbox", { name: "Nombre", exact: true }).fill(updatedCompanyName);
          const companyUpdated = adminPage.waitForResponse((response) =>
            new URL(response.url()).pathname === `/api/companies/${e2eCompanyId}` && response.request().method() === "PUT");
          await companyEdit.getByRole("button", { name: "Guardar cambios", exact: true }).click();
          assert.equal((await companyUpdated).status(), 200, "La ficha debe guardar la empresa con su versión.");
          await adminPage.getByRole("heading", { name: updatedCompanyName, exact: true }).waitFor();
          await adminPage.getByText("Administrador", { exact: true }).first().waitFor();

          setStage("guarda el nombre de la organización desde Configuración");
          await adminPage.goto(new URL("/org/configuracion", baseUrl).href);
          const organizationName = adminPage.getByRole("textbox", { name: "Nombre de la organización", exact: true });
          await organizationName.waitFor();
          await organizationName.fill("Empresa E2E configurada");
          const settingsUpdated = adminPage.waitForResponse((response) =>
            new URL(response.url()).pathname === "/api/organization/settings" && response.request().method() === "PUT");
          await adminPage.getByRole("button", { name: "Guardar cambios", exact: true }).click();
          assert.equal((await settingsUpdated).status(), 200, "Configuración debe guardar con su versión.");
          e2eOrganizationName = "Empresa E2E configurada";
          assert.equal(
            await adminPage.getByRole("textbox", { name: "Nombre de la organización", exact: true }).inputValue(),
            "Empresa E2E configurada",
            "Configuración debe mostrar el nombre que acaba de guardar.",
          );

          // B11 (tablero Avisos › «Salir sin guardar»): con cambios, un enlace del menú pregunta antes de salir;
          // «Seguir editando» conserva lo escrito y «Salir sin guardar» se va sin mandar nada.
          setStage("cambia el nombre en Configuración y toca Inicio en el menú");
          let settingsWritesWhileLeaving = 0;
          const countSettingsWrites = (request) => {
            if (new URL(request.url()).pathname === "/api/organization/settings" && request.method() !== "GET") settingsWritesWhileLeaving++;
          };
          adminPage.on("request", countSettingsWrites);
          try {
            await organizationName.fill("Empresa E2E sin guardar");
            await adminPage.getByText("Cambios sin guardar", { exact: true }).first().waitFor();
            const homeLink = adminPage.getByRole("navigation", { name: "General", exact: true }).getByRole("link", { name: "Inicio", exact: true });
            await homeLink.click();
            const leaveDialog = adminPage.getByRole("dialog", { name: "¿Salir sin guardar?" });
            await leaveDialog.waitFor();
            await leaveDialog.getByText("Se pierde lo que cambiaste acá.", { exact: true }).waitFor();
            assert.equal(new URL(adminPage.url()).pathname, "/org/configuracion", "Antes de confirmar, sigue en Configuración.");
            setStage("«Seguir editando» conserva lo escrito");
            await leaveDialog.getByRole("button", { name: "Seguir editando", exact: true }).click();
            await leaveDialog.waitFor({ state: "detached" });
            assert.equal(await organizationName.inputValue(), "Empresa E2E sin guardar", "«Seguir editando» conserva lo escrito.");
            setStage("sale sin guardar");
            await homeLink.click();
            await leaveDialog.getByRole("button", { name: "Salir sin guardar", exact: true }).click();
            await expectPath(adminPage, "/org", "salir de Configuración sin guardar");
          } finally {
            adminPage.off("request", countSettingsWrites);
          }
          assert.equal(settingsWritesWhileLeaving, 0, "Salir sin guardar no manda el cambio.");
          setStage("vuelve a Configuración y encuentra lo último guardado");
          await adminPage.goto(new URL("/org/configuracion", baseUrl).href);
          await organizationName.waitFor();
          let nameAfterLeaving = "";
          for (const deadline = Date.now() + 10_000; Date.now() < deadline; await delay(200)) {
            nameAfterLeaving = await organizationName.inputValue();
            if (nameAfterLeaving !== "") break;
          }
          assert.equal(nameAfterLeaving, "Empresa E2E configurada", "Salir sin guardar deja el nombre guardado.");

          setStage("abre la Página pública para editarla");
          await adminPage.goto(new URL("/org/pagina", baseUrl).href);
          const publicSlug = adminPage.getByRole("textbox", { name: "Dirección de la página", exact: true });
          const publicName = adminPage.getByRole("textbox", { name: "Nombre de la página", exact: true });
          await publicSlug.waitFor({ timeout: 10_000 });
          setStage("comprueba la disponibilidad del slug elegido");
          const slugAvailability = adminPage.waitForResponse((response) => {
            const url = new URL(response.url());
            return url.pathname === "/api/public-site/slug-availability"
              && url.searchParams.get("slug") === "empresa-e2e-etapa6";
          });
          await publicSlug.fill("empresa-e2e-etapa6");
          await publicName.fill("Página pública E2E");
          const slugResponse = await slugAvailability;
          assert.equal(slugResponse.status(), 200, "El chequeo público debe responder la disponibilidad del slug.");
          assert.equal((await slugResponse.json()).availability, "Available");
          await adminPage.getByText("La dirección está disponible.", { exact: true }).waitFor({ timeout: 10_000 });
          setStage("guarda el borrador de la Página pública");
          const publicPageRefreshed = adminPage.waitForResponse((response) =>
            new URL(response.url()).pathname === "/api/organization/public-page" && response.request().method() === "GET");
          const pageUpdated = adminPage.waitForResponse((response) =>
            new URL(response.url()).pathname === "/api/organization/public-page" && response.request().method() === "PUT");
          await adminPage.getByRole("button", { name: "Guardar cambios", exact: true }).click();
          assert.equal((await pageUpdated).status(), 200, "La Página pública debe guardar los datos del borrador.");
          const refreshedPageResponse = await publicPageRefreshed;
          assert.equal(refreshedPageResponse.status(), 200);
          const refreshedPage = await refreshedPageResponse.json();
          assert.equal(refreshedPage.slug, "empresa-e2e-etapa6");
          assert.ok(refreshedPage.version > 0, "El borrador guardado debe tener una versión nueva antes de publicarlo.");
          assert.equal(refreshedPage.isPublished, false, "El borrador debe seguir sin publicar después de guardarlo.");
          assert.equal(refreshedPage.publishBlockedAtUtc, null, "La página nueva no debe estar bloqueada por moderación.");
          setStage("publica la página con la versión actualizada");
          const pagePublished = adminPage.waitForResponse((response) =>
            new URL(response.url()).pathname === "/api/organization/public-page/publish" && response.request().method() === "POST");
          const pageAfterPublication = adminPage.waitForResponse((response) =>
            new URL(response.url()).pathname === "/api/organization/public-page" && response.request().method() === "GET");
          // Tablero Pagina-Org: se publica con el interruptor de «Publicación», que se aplica al momento.
          const publishSwitch = adminPage.getByRole("switch", { name: "Visible en empresa-e2e-etapa6.plataforma.com", exact: true });
          await publishSwitch.waitFor({ timeout: 10_000 });
          assert.ok(await publishSwitch.isEnabled(),
            `El borrador debe habilitar el interruptor de Publicación tras refrescar: versión=${refreshedPage.version}.`);
          assert.equal(await publishSwitch.isChecked(), false, "El borrador empieza con la publicación apagada.");
          await publishSwitch.click({ timeout: 5_000 });
          const publicationResponse = await pagePublished;
          const publicationError = publicationResponse.status() === 200 ? "" : ` (${(await publicationResponse.json()).code ?? "sin código"})`;
          assert.equal(publicationResponse.status(), 200, `La Página pública debe publicarse con su versión actual${publicationError}.`);
          const publishedPageResponse = await pageAfterPublication;
          assert.equal(publishedPageResponse.status(), 200, "La Página pública debe refrescarse después de publicar.");
          const publishedPage = await publishedPageResponse.json();
          assert.equal(publishedPage.isPublished, true, "La lectura posterior debe confirmar la publicación persistida.");
          await adminPage.getByRole("link", { name: "Ver página", exact: true }).waitFor();

          setStage("comprueba Auditoría y el nombre/empresa de la membresía invitada");
          const authorization = accountTokens.get(adminPage);
          assert.equal(typeof authorization, "string", "El Dueño debe tener un token Business real.");
          const auditResponse = await adminPage.request.get(new URL("/api/organization/audit?period=all&limit=25", baseUrl).href,
            { headers: { Authorization: authorization } });
          assert.equal(auditResponse.status(), 200, "La organización debe consultar su auditoría real.");
          const audit = await auditResponse.json();
          const invitedEntry = audit.items.find((entry) => entry.affectedDisplayName === "Persona invitada E2E"
            && entry.whereText === updatedCompanyName);
          assert.ok(invitedEntry, "La auditoría debe indicar el nombre afectado y la empresa donde se asignó el rol.");
          // Tablero Auditoria-Org (tandas 4f y 4g del back): invitar a alguien a una empresa con sus roles es una sola
          // entrada, «Invitó a …» con el correo de la invitación tapado; la persona afectada sale con su nombre de hoy.
          assert.match(invitedEntry.actionText, /^Invitó a /, `La entrada de la invitación dice «${invitedEntry.actionText}».`);
          await adminPage.goto(new URL("/org/auditoria", baseUrl).href);
          await adminPage.getByRole("heading", { name: "Auditoría", exact: true }).waitFor();
          await adminPage.getByText(invitedEntry.actionText, { exact: true }).filter({ visible: true }).first().waitFor();
          await adminPage.getByText(updatedCompanyName, { exact: true }).filter({ visible: true }).first().waitFor();
        }],
        ...[false, true].map((existingAccount) => [
          `3c: aceptar invitación ${existingAccount ? "con cuenta previa sin Personal" : "sin cuenta y sin Personal"} desde el .eml`,
          async (invitationPage, setStage) => {
            const email = `e2e-invitation-${randomUUID()}@example.test`;
            const before = new Set(await pickupFiles());
            setStage("emite por InvitationIssuer en la base aislada");
            const issued = await invitationCommand(readyFile, { kind: "emit", email, existingAccount });
            setStage("lee el enlace del .eml real");
            const link = await invitationFromPickup(email, before);
            setStage("abre /invitacion y ve la vista previa");
            await invitationPage.goto(link);
            await invitationPage.getByRole("heading", { name: `Te sumás a ${e2eOrganizationName}`, exact: true }).waitFor({ timeout: 15_000 });
            await invitationPage.getByText(`La invitación es para ${email}.`, { exact: true }).waitFor();
            assert.equal(new URL(invitationPage.url()).hash, "", "El fragmento secreto debe retirarse antes de seguir.");
            if (existingAccount) {
              setStage("ingresa como la cuenta destinataria sin seleccionar acceso");
              await invitationPage.getByRole("button", { name: "Ingresá para aceptar", exact: true }).click();
              await invitationPage.getByRole("textbox", { name: "Correo electrónico" }).fill(email);
              const loginBefore = new Set(await pickupFiles());
              await sendLoginCode(invitationPage);
              await invitationPage.getByRole("heading", { name: "Revisá tu correo" }).waitFor();
              await enterCode(invitationPage, await codeFromPickup(email, loginBefore));
              await invitationPage.getByRole("button", { name: "Verificar", exact: true }).click();
              await expectPath(invitationPage, "/invitacion", "retorno a la invitación");
              const beforeAcceptance = await invitationCommand(readyFile, { kind: "inspect", email, invitationId: issued.invitationId });
              assert.equal(beforeAcceptance.personalSpaces, 0, "Ingresar para aceptar no puede crear Personal para una cuenta previa.");
              assert.equal(beforeAcceptance.accepted, false, "El ingreso no debe consumir la invitación.");
            }
            setStage("acepta la invitación real");
            const acceptedResponse = invitationPage.waitForResponse((response) =>
              new URL(response.url()).pathname === "/api/invitations/accept" && response.request().method() === "POST");
            await invitationPage.getByRole("button", { name: "Aceptar invitación", exact: true }).click();
            assert.equal((await acceptedResponse).ok(), true, "La aceptación real debe completar su transacción.");
            const inspection = await invitationCommand(readyFile, { kind: "inspect", email, invitationId: issued.invitationId });
            assert.equal(inspection.personalSpaces, 0, "Aceptar no puede crear Personal, tampoco para una cuenta previa.");
            assert.equal(inspection.activeBusinessAccesses, 1);
            assert.equal(inspection.accepted, true);
            assert.equal(inspection.boundToIdentity, true);
            if (!existingAccount) {
              await invitationPage.getByRole("heading", { name: `Te sumaste a ${e2eOrganizationName}`, exact: true }).waitFor();
              setStage("comprueba identidad vinculada sin espacio Personal antes de cambiar acceso");
              await invitationPage.getByRole("button", { name: "Más tarde", exact: true }).click();
            }
            setStage("entra a la organización con la membresía activa");
            await expectPath(invitationPage, "/org", "entrada luego de aceptar");
            await expectProfile(invitationPage, e2eOrganizationName, "entrada luego de aceptar");
            await invitationPage.reload();
            await expectProfile(invitationPage, e2eOrganizationName, "F5 luego de aceptar");
          },
        ]),
        ["3b seguridad: sesión abierta no suma correo ni Google y método nuevo no autoriza el anterior", async (accountPage, setStage) => {
          setStage("registra la persona");
          const original = await registerPerson(accountPage);
          setStage("abre Mi cuenta");
          await openAccount(accountPage);
          setStage("rechaza el alta de correo sin reautenticación");
          const deniedEmail = await accountPost(accountPage, "/api/me/login-methods", {
            email: `e2e-unproved-${randomUUID()}@example.test`,
          });
          assert.equal(deniedEmail.status(), 403, "Agregar correo debe exigir reautenticación.");
          setStage("rechaza el vínculo de Google sin reautenticación");
          const deniedGoogle = await requestGoogleLinkWithoutTicket(accountPage);
          if (deniedGoogle.status !== 403)
            throw new Error(`Google sin ticket respondió HTTP ${deniedGoogle.status} (${deniedGoogle.code || "sin código"}; ${deniedGoogle.fields.join(",")}); antiforgery header ${deniedGoogle.antiforgeryHeaderSent}.`);
          assert.equal(deniedGoogle.location, false, "La ruta no debe iniciar el desafío OAuth sin ticket.");
          setStage("confirma que no se creó un método");
          const stillOriginal = await accountPage.request.get(new URL("/api/me/login-methods", baseUrl).href,
            { headers: { Authorization: accountTokens.get(accountPage) } });
          assert.equal((await stillOriginal.json()).methods.length, 1,
            "Los rechazos sin reautenticación no deben crear un método de ingreso.");
          setStage("suma correo con reautenticación previa");
          await addPersonalEmail(accountPage, original, { onStage: setStage });
          setStage("intenta reautenticar con el método recién sumado");
          const listed = await accountPage.request.get(new URL("/api/me/login-methods", baseUrl).href,
            { headers: { Authorization: accountTokens.get(accountPage) } });
          const rows = (await listed.json()).methods;
          const originalMethod = rows.find((row) => row.value === original);
          assert.ok(originalMethod);
          const deniedProof = await accountPost(accountPage, "/api/me/reauth",
            { action: "RemoveMethod", targetMethodId: originalMethod.id });
          assert.equal(deniedProof.status(), 409, "El método nuevo no sirve como origen en esta sesión.");
          assert.equal((await deniedProof.json()).code, "Identity.Reauth.OtherMethodRequired");
        }],
        ["3b seguridad: registro con posesión recupera un correo pendiente de otra cuenta", async (accountPage, setStage) => {
          setStage("registra la cuenta anterior");
          const originalEmail = await registerPerson(accountPage, undefined, setStage);
          setStage("crea un correo pendiente en la cuenta anterior");
          await openAccount(accountPage);
          const reserved = await addPersonalEmail(accountPage, originalEmail, { verify: false, onStage: setStage });
          setStage("registra la cuenta nueva con el correo pendiente");
          await signOut(accountPage, "Personal");
          await registerPerson(accountPage, reserved, setStage);
          setStage("comprueba el método en la cuenta nueva");
          await openAccount(accountPage);
          await accountPage.getByText(reserved, { exact: true }).first().waitFor();
          await signOut(accountPage, "Personal");
          await accountPage.goto(new URL("/login", baseUrl).href);
          await accountPage.getByRole("textbox", { name: "Correo electrónico" }).fill(originalEmail);
          const previousOwnerLogin = new Set(await pickupFiles());
          await sendLoginCode(accountPage);
          await accountPage.getByRole("heading", { name: "Revisá tu correo" }).waitFor();
          await enterCode(accountPage, await codeFromPickup(originalEmail, previousOwnerLogin));
          await accountPage.getByRole("button", { name: "Verificar", exact: true }).click();
          await openAccount(accountPage);
          assert.equal(await accountPage.getByText(reserved, { exact: true }).count(), 0,
            "El método pendiente debe salir de la cuenta anterior al probar la posesión.");
        }],
        ["3b: sumar correo personal con código leído del .eml", async (accountPage) => {
          const originalEmail = await registerPerson(accountPage);
          await openAccount(accountPage);
          await addPersonalEmail(accountPage, originalEmail);
        }],
        ["3b: quitar un método con código enviado a otro", async (accountPage, setStage) => {
          setStage("registra la identidad para retirar un método");
          const originalEmail = await registerPerson(accountPage, undefined, setStage);
          setStage("abre Mi cuenta");
          await openAccount(accountPage);
          setStage("agrega y verifica el método que va a retirar");
          const addedEmail = await addPersonalEmail(accountPage, originalEmail);
          const before = new Set(await pickupFiles());
          setStage("abre las acciones del método agregado");
          await accountPage.getByRole("button", { name: `Acciones de ${addedEmail}`, exact: true }).click();
          setStage("solicita reautenticación para quitar el método");
          await openReauthDialog(accountPage, () => accountPage.getByRole("menuitem", { name: "Quitar", exact: true }).click(), "Quitar");
          setStage("lee y verifica el código del método original");
          await enterCode(accountPage, await codeFromPickup(originalEmail, before));
          setStage("confirma la baja del método agregado");
          const refreshedMethods = accountPage.waitForResponse((response) =>
            new URL(response.url()).pathname === "/api/me/login-methods" && response.request().method() === "GET");
          await accountPage.getByRole("dialog").getByRole("button", { name: "Quitar", exact: true }).click();
          await accountPage.getByRole("dialog").waitFor({ state: "hidden" });
          setStage("comprueba que el método ya no aparezca en la cuenta");
          const methodsResponse = await refreshedMethods;
          assert.equal(methodsResponse.status(), 200, "La cuenta debe actualizar la lista después de retirar el método.");
          assert.equal(await accountPage.getByText(addedEmail, { exact: true }).count(), 0);
        }],
        ["3b: pedir baja y cancelarla ingresando durante la gracia", async (accountPage) => {
          const email = await registerPerson(accountPage);
          await openAccount(accountPage);
          const before = new Set(await pickupFiles());
          await openReauthDialog(accountPage, () => accountPage.getByRole("button", { name: "Dar de baja", exact: true }).click(), "Dar de baja");
          const dialog = accountPage.getByRole("dialog");
          await dialog.getByRole("textbox", { name: /Motivo/ }).fill("Recorrido propio del E2E");
          // El rótulo del código de baja incluye el destino enmascarado del lienzo.
          const code = await codeFromPickup(email, before);
          const boxes = dialog.locator('input[inputmode="numeric"]');
          assert.equal(await boxes.count(), 6);
          for (let index = 0; index < 6; index++) await boxes.nth(index).fill(code[index]);
          await dialog.getByRole("button", { name: "Dar de baja", exact: true }).click();
          await accountPage.getByRole("heading", { name: "Cerramos tu sesión" }).waitFor();
          await accountPage.goto(new URL("/login", baseUrl).href);
          await accountPage.getByRole("textbox", { name: "Correo electrónico" }).fill(email);
          const loginBefore = new Set(await pickupFiles());
          await sendLoginCode(accountPage);
          await accountPage.getByRole("heading", { name: "Revisá tu correo" }).waitFor();
          await enterCode(accountPage, await codeFromPickup(email, loginBefore));
          await accountPage.getByRole("button", { name: "Verificar", exact: true }).click();
          await accountPage.getByRole("heading", { name: "Tu cuenta tiene la baja pedida" }).waitFor();
          await accountPage.getByRole("button", { name: "Cancelar la baja y entrar" }).click();
          await expectPath(accountPage, "/", "cancelar baja");
          await expectProfile(accountPage, "Personal", "cancelar baja");
        }],
        ["3b: cambiar el idioma a en-US desde /cuenta", async (accountPage) => {
          await registerPerson(accountPage);
          await openAccount(accountPage);
          const culture = accountPage.getByRole("combobox", { name: "Idioma y región" });
          await culture.waitFor({ state: "visible" });
          for (let attempt = 0; attempt < 120 && !(await culture.isEnabled()); attempt++) await delay(250);
          assert.equal(await culture.isEnabled(), true, "La lista de culturas debe terminar de cargar.");
          await culture.click();
          await accountPage.getByRole("option", { name: /^(English|Inglés) \(United States|Estados Unidos/ }).click();
          await accountPage.getByRole("button", { name: "Guardar cambios", exact: true }).click();
          await accountPage.getByRole("heading", { name: "My account", exact: true }).waitFor();
          await accountPage.reload();
          await accountPage.getByRole("heading", { name: "My account", exact: true }).waitFor();
          assert.equal(await accountPage.locator("html").getAttribute("lang"), "en");
          assert.equal(await accountPage.evaluate(() => localStorage.getItem("arquitecturabasemt.culture")), "en-US");
        }],
        ["3b: aceptar versión nueva de términos que bloquea el ingreso", async (accountPage) => {
          await registerPerson(accountPage);
          await openAccount(accountPage);
          await publishNewTerms(readyFile);
          await accountPage.reload();
          await accountPage.getByRole("heading", { name: "Actualizamos los términos" }).waitFor();
          // Como el tablero Aceptar-Terminos: el botón no se apaga; sin la casilla pide la aceptación.
          assert.equal(await accountPage.getByRole("button", { name: "Aceptar y seguir" }).isDisabled(), false);
          await accountPage.getByRole("button", { name: "Aceptar y seguir" }).click();
          await accountPage.getByRole("alert").filter({ hasText: "Aceptá los Términos y la Política de privacidad." }).waitFor();
          assert.equal(await accountPage.getByRole("heading", { name: "Actualizamos los términos" }).isVisible(), true);
          await accountPage.getByRole("checkbox", { name: /Leí y acepto/ }).check();
          await accountPage.getByRole("button", { name: "Aceptar y seguir" }).click();
          await accountPage.getByRole("heading", { name: "Mi cuenta", exact: true }).waitFor();
        }],
      ];
      const onlyCase = process.env.MT_E2E_ONLY_CASE;
      const selectedAccountCases = onlyCase
        ? accountCases.filter(([name]) => onlyCase.split(",").some((term) => name.includes(term.trim())))
        : accountCases;
      assert.ok(selectedAccountCases.length > 0 || onlyCase.includes("390"), "MT_E2E_ONLY_CASE debe coincidir con un recorrido de cuenta existente.");
      for (const [name, journey] of selectedAccountCases) {
        await t.test(name, { timeout: name.startsWith("5") ? 600_000 : 240_000 }, async (caseTest) => {
          const accountContext = await browser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR" });
          let lastFailure = "";
          let lastApiActivity = "";
          let lastInvitationState = "";
          let lastPublicSiteState = "";
          let lastOidcActivity = "";
          let pageErrorName = "";
          let stage = "inicia el recorrido";
          const accountPage = await accountContext.newPage();
          accountPage.setDefaultTimeout(30_000);
          accountPage.on("pageerror", (error) => { pageErrorName = error?.name ?? "Error"; });
          accountPage.on("request", (request) => {
            const authorization = request.headers().authorization;
            const requestUrl = new URL(request.url());
            if (!requestUrl.pathname.startsWith("/api/")) return;
            lastApiActivity = `${request.method()} ${requestUrl.pathname}`;
            if (authorization?.startsWith("Bearer ")) accountTokens.set(accountPage, authorization);
          });
          accountPage.on("response", async (response) => {
            const responseUrl = new URL(response.url());
            if (responseUrl.pathname.startsWith("/connect/")) {
              lastOidcActivity = `${response.request().method()} ${responseUrl.pathname} → ${response.status()}`;
              if (response.status() >= 400) {
                try {
                  const problem = await response.json();
                  const code = problem.error;
                  if (typeof code === "string" && /^[a-z_]+$/.test(code)) lastOidcActivity += ` ${code}`;
                } catch { /* No se imprime la respuesta OIDC ni sus credenciales. */ }
              }
            }
            if (!responseUrl.pathname.startsWith("/api/")) return;
            lastApiActivity = `${response.request().method()} ${responseUrl.pathname} → ${response.status()}`;
            if (responseUrl.pathname === "/api/invitations/preview" && response.status() === 200) {
              try {
                const payload = await response.json();
                lastInvitationState = typeof payload?.state === "string" && /^[A-Za-z]+$/.test(payload.state)
                  ? `preview ${payload.state}` : "preview recibido";
              } catch { lastInvitationState = "preview recibido"; }
            }
            if (/^\/api\/platform\/tenants\/[0-9a-f-]+\/public-site$/.test(responseUrl.pathname) && response.status() === 200) {
              try {
                const payload = await response.json();
                lastPublicSiteState = `página publicada ${payload.isPublished === true}, bloqueada ${payload.publishBlockedAtUtc != null}, dirección ${payload.slug != null}`;
              } catch { lastPublicSiteState = "estado de página no legible"; }
            }
            if (response.status() < 400) return;
            let code;
            let fields = [];
            try {
              const problem = await response.json();
              code = problem.code;
              fields = Object.keys(problem.errors ?? {}).filter((field) => /^[A-Za-z.]+$/.test(field));
            } catch { /* El estado basta si no hay ProblemDetails. */ }
            const sort = responseUrl.searchParams.get("sort");
            const knownSort = ["name", "displayName", "lastSignInAtUtc", "createdAt", "createdAtUtc"];
            const sortDiagnostic = sort && knownSort.includes(sort.replace(/^-/, "")) ? `; sort ${sort}` : "";
            lastFailure = `${response.request().method()} ${responseUrl.pathname} HTTP ${response.status()}${typeof code === "string" && /^[A-Za-z0-9.]+$/.test(code) ? ` ${code}` : ""}${fields.length ? `; campos ${fields.join(", ")}` : ""}${sortDiagnostic}`;
          });
          const reportAbort = () => {
            const diagnostics = [lastFailure, lastApiActivity && `última Api: ${lastApiActivity}`,
              lastOidcActivity && `último OIDC: ${lastOidcActivity}`].filter(Boolean).join("; ");
            console.error(`${name}: cancelado en “${stage}”${diagnostics ? ` (${diagnostics})` : ""}.`);
          };
          caseTest.signal.addEventListener("abort", reportAbort, { once: true });
          try {
            await journey(accountPage, (value) => {
              stage = value;
              lastFailure = "";
              console.info(`E2E ${name}: ${stage}.`);
            });
          }
          catch (error) {
            // Playwright puede incluir valores de controles/URLs; solo publicar el paso.
            const safeDetail = typeof error?.message === "string"
              ? error.message.split(/\r?\n/, 1)[0]
                .replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[correo]")
                .replace(/\b\d{6}\b/g, "[código]")
                .replace(/https?:\/\/\S+/g, "[url]")
                .slice(0, 180)
              : "";
            const known = error?.message?.startsWith("La versión nueva")
              || error?.message?.startsWith("Google sin ticket")
              || error?.message?.startsWith("No llegó el .eml")
              || error?.message?.startsWith("El código de registro respondió")
              || error?.message?.startsWith("registro de cuenta 3b:");
            const callback = new URL(accountPage.url());
            const oidcError = callback.pathname === "/auth/callback" ? callback.searchParams.get("error") : null;
            const callbackFailure = oidcError && /^[a-z_]+$/.test(oidcError) ? `callback ${oidcError}` : "";
            const diagnostics = [lastFailure, lastApiActivity && `última Api: ${lastApiActivity}`, lastInvitationState, lastPublicSiteState,
              lastOidcActivity && `último OIDC: ${lastOidcActivity}`,
              callbackFailure,
              pageErrorName && `error de página: ${pageErrorName}`].filter(Boolean).join("; ");
            const failure = known ? error.message
              : `${name}: falló en “${stage}”${diagnostics ? ` (${diagnostics})` : ""} [${error?.name ?? "Error"}]${safeDetail ? ` ${safeDetail}` : ""}.`;
            console.error(failure);
            throw new Error(failure);
          } finally {
            caseTest.signal.removeEventListener("abort", reportAbort);
            await accountContext.close();
          }
        });
      }
      // Va al final: la puerta de empresa ya pidió un código para el mismo correo y hay que esperar para pedir otro.
      if (!process.env.MT_E2E_ONLY_CASE || process.env.MT_E2E_ONLY_CASE.includes("390")) {
        await t.test("390: el teléfono es una app (ingreso de empresa, «Más», Usuarios, Mi cuenta y Salir)", { timeout: 240_000 }, async () => {
          // Tableros M-* («Criterio · Marco»): a 390 la app es la de un teléfono, con el mismo front, Api y correo reales.
          // Se entra por la puerta de empresa, «Más» lleva a Usuarios (lista con «+») y a Mi cuenta (botones fijos abajo),
          // ‹ vuelve a «Más» y «Salir» cierra la sesión.
          const phoneContext = await browser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR", viewport: { width: 390, height: 844 } });
          const setPhoneStage = (value) => { console.info(`E2E 390: ${value}.`); };
          try {
            const phone = await phoneContext.newPage();
            setPhoneStage("ingresa con el método administrado conservado del mismo Dueño");
            await phone.goto(new URL("/login/empresa", baseUrl).href);
            await phone.getByRole("textbox", { name: "Correo electrónico" }).fill(managedBusinessEmail);
            const phoneBefore = new Set(await pickupFiles());
            await phone.getByRole("button", { name: "Enviar código" }).click();
            // Si la puerta de empresa pidió un código hace poco, hay que esperar para pedir otro.
            const sent = phone.getByRole("heading", { name: "Revisá tu correo" });
            const retry = phone.getByRole("button", { name: /^Reintentá en/ });
            await sent.or(retry).first().waitFor({ timeout: 30_000 });
            if (await retry.isVisible()) {
              await phone.getByRole("button", { name: "Enviar código" }).waitFor({ timeout: 90_000 });
              await phone.getByRole("button", { name: "Enviar código" }).click();
              await sent.waitFor();
            }
            await enterCode(phone, await codeFromPickup(managedBusinessEmail, phoneBefore));
            await phone.getByRole("button", { name: "Verificar" }).click();
            await expectPath(phone, "/org", "ingreso de empresa en el teléfono");
            // El recorrido anterior publica términos nuevos: si aparecen, se aceptan antes de seguir.
            const terms = phone.getByRole("heading", { name: "Actualizamos los términos" });
            const sections = phone.getByRole("navigation", { name: "Secciones" });
            setPhoneStage("acepta los legales vigentes si aparecen antes de continuar");
            await terms.or(sections).first().waitFor({ timeout: 30_000 });
            if (await terms.isVisible()) {
              await phone.getByRole("checkbox", { name: /Leí y acepto/ }).check();
              await phone.getByRole("button", { name: "Aceptar y seguir" }).click();
            }
            setPhoneStage("abre Más y confirma la misma cuenta y organización activa");
            await sections.getByRole("link", { name: "Más" }).click();
            await expectPath(phone, "/mas", "«Más» en el teléfono");
            await phone.getByText("Cuenta E2E", { exact: true }).filter({ visible: true }).waitFor();
            await phone.getByRole("list", { name: "Perfiles", exact: true }).getByRole("button")
              .filter({ has: phone.getByText(e2eOrganizationName, { exact: true }) }).getByLabel("Perfil actual", { exact: true }).waitFor();
            setPhoneStage("abre Usuarios como lista y conserva Invitar usuario");
            await phone.getByRole("link", { name: /^Usuarios/ }).click();
            await expectPath(phone, "/org/usuarios", "Usuarios desde «Más»");
            await phone.getByRole("button", { name: "Invitar usuario" }).waitFor();
            assert.equal(await phone.getByRole("table").count(), 0, "a 390 Usuarios es una lista, no una tabla");
            setPhoneStage("vuelve a Más y abre Mi cuenta con acciones fijas");
            await phone.getByRole("link", { name: "Volver a Más" }).click();
            await expectPath(phone, "/mas", "‹ vuelve a «Más»");
            await phone.getByRole("link", { name: /^Mi cuenta/ }).click();
            await phone.locator("[data-slot='fixed-actions']").getByRole("button", { name: "Guardar cambios" }).waitFor();
            await phone.getByRole("link", { name: "Volver a Más" }).click();
            await expectPath(phone, "/mas", "‹ vuelve a «Más» desde Mi cuenta");
            setPhoneStage("sale y comprueba que el teléfono abandona la app");
            await phone.getByRole("button", { name: /^Salir/ }).click();
            try {
              await phone.waitForURL((url) => !["/mas", "/org", "/cuenta"].includes(url.pathname), { timeout: 20_000 });
              await phone.getByRole("navigation", { name: "Secciones" }).waitFor({ state: "detached", timeout: 20_000 });
            } catch {
              throw new Error(`El cierre de sesión en el teléfono no salió de la app; ruta actual ${new URL(phone.url()).pathname}.`);
            }
          } finally {
            await phoneContext.close();
          }
        });
      }
    } finally {
      await browser.close();
    }
  } finally {
    try {
      if (started) await aspire(["stop", "--non-interactive", "--apphost", appHostProject]);
    } finally {
      if (pickupDirectory && path.dirname(pickupDirectory) === os.tmpdir()) {
        await rm(pickupDirectory, { recursive: true, force: true });
      }
    }
  }
});
