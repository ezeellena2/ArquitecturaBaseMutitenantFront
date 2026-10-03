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

async function inviteFromUsersPage(page, email, companyName) {
  await page.goto(new URL("/org/usuarios", baseUrl).href);
  await page.getByRole("button", { name: "Invitar usuario", exact: true }).click();
  const before = new Set(await pickupFiles());
  await page.getByRole("textbox", { name: "Correo", exact: true }).fill(email);
  await page.getByRole("button", { name: "Roles de la organización", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Dueño", exact: true }).click();
  await page.keyboard.press("Escape");
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
  const invitationId = await response.json();
  assert.equal(typeof invitationId, "string");
  assert.match(invitationId, /^[0-9a-f-]{36}$/i);
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
    await page.getByRole("button", { name: /^(Agregar correo o teléfono|Add email or phone)$/ }).waitFor({ timeout: 10_000 });
  } catch {
    throw new Error(`La cuenta 3b: /cuenta no terminó de cargar (ruta ${new URL(page.url()).pathname}).`);
  }
}

async function addPersonalEmail(page, originalEmail, { verify = true, onStage = () => {} } = {}) {
  const email = `e2e-personal-${randomUUID()}@example.test`;
  onStage("abre reautenticación");
  const beforeReauthentication = new Set(await pickupFiles());
  await openReauthDialog(page,
    () => page.getByRole("button", { name: "Agregar correo o teléfono", exact: true }).click(), "Verificar");
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

async function sendLoginCode(page) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const responsePromise = page.waitForResponse((response) =>
      new URL(response.url()).pathname === "/api/auth/login-code" && response.request().method() === "POST");
    await page.locator("form button[type=submit]").first().click({ timeout: 120_000 });
    const response = await responsePromise;
    if (response.ok()) return;
    const problem = await response.json();
    if (response.status() !== 429 || typeof problem.retryAfter !== "number")
      throw new Error(`El envío de ingreso falló (HTTP ${response.status()}).`);
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

test("registro real y puerta empresa usan un PostgreSQL aislado, front, Api y pickup sin mocks", { timeout: 1_800_000 }, async (t) => {
  const { stdout } = await aspire(["ps", "--format", "Json", "--non-interactive"]);
  assert.equal(JSON.parse(stdout).length, 0, "Detené el AppHost en ejecución antes de iniciar el E2E aislado.");

  pickupDirectory = await mkdtemp(path.join(os.tmpdir(), "arquitecturabase-e2e-"));
  const readyFile = path.join(pickupDirectory, `mt-e2e-${randomUUID()}.ready`);
  const businessEmail = `e2e-business-${randomUUID()}@example.test`;
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
      const accountCases = [
        ["5: ingresar como operador y consultar Plataforma", async (platformPage, setStage) => {
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

          const navigate = async (panelName, linkName) => {
            const button = platformPage.getByRole("button", { name: panelName, exact: true });
            await button.waitFor();
            if (await button.getAttribute("aria-expanded") !== "true") await button.click();
            await platformPage.getByRole("navigation", { name: panelName, exact: true })
              .getByRole("link", { name: linkName, exact: true }).click();
          };
          const changeState = async (action, state) => {
            await platformPage.getByRole("button", { name: action, exact: true }).click();
            const dialog = platformPage.getByRole("dialog");
            await dialog.getByRole("textbox", { name: /^Motivo/ }).fill("Verificación del recorrido real");
            await dialog.getByRole("button", { name: action, exact: true }).click();
            await platformPage.getByText(state, { exact: true }).waitFor();
          };

          setStage("abre una organización real desde Gestión");
          await navigate("Gestión", "Organizaciones");
          await platformPage.getByRole("row", { name: /Empresa E2E/ })
            .getByRole("link", { name: "Empresa E2E", exact: true }).click();
          await platformPage.getByRole("heading", { name: "Empresa E2E", exact: true }).waitFor();
          let suspended = false;
          try {
            setStage("suspende con motivo y verifica el estado después de F5");
            await changeState("Suspender", "Suspendida");
            suspended = true;
            await platformPage.reload();
            await platformPage.getByRole("heading", { name: "Empresa E2E", exact: true }).waitFor();
            await platformPage.getByText("Suspendida", { exact: true }).waitFor();
          } finally {
            if (suspended) {
              setStage("reactiva la organización para preservar los recorridos de empresa");
              await changeState("Reactivar", "Activa");
            }
          }

          setStage("consulta Cuentas y Administración desde sus pantallas");
          await navigate("Gestión", "Cuentas");
          await platformPage.getByRole("heading", { name: "Cuentas", exact: true }).waitFor();
          await platformPage.getByRole("row", { name: /Cuenta E2E/ }).waitFor();
          await navigate("Administración", "Auditoría");
          await platformPage.getByRole("heading", { name: "Auditoría", exact: true }).waitFor();
          await navigate("Administración", "Configuración");
          await platformPage.getByRole("heading", { name: "Configuración", exact: true }).waitFor();
          await platformPage.reload();
          await platformPage.getByRole("heading", { name: "Configuración", exact: true }).waitFor();
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
          assert.equal(updateResponse.status(), 204, "La versión vigente debe permitir guardar.");
          const staleResponse = await rolesPage.request.put(roleUrl.href, { headers, data: updateData });
          assert.equal(staleResponse.status(), 409, "Una versión obsoleta debe responder 409.");
          assert.equal((await staleResponse.json()).code, "General.ConcurrencyConflict");
          const afterStaleResponse = await rolesPage.request.get(roleUrl.href, { headers });
          assert.equal((await afterStaleResponse.json()).name, updatedName, "El conflicto no debe pisar el primer cambio.");

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
          const uiUpdateProblem = uiUpdateResponse.status() === 204 ? null : await uiUpdateResponse.json().catch(() => null);
          assert.equal(uiUpdateResponse.status(), 204,
            `La pantalla debe guardar el rol con su versión vigente (${uiUpdateProblem?.code ?? "sin código"}; campos: ${Object.keys(uiUpdateProblem?.errors ?? {}).join(", ") || "ninguno"}).`);
          await rolesPage.getByRole("heading", { name: `${updatedName} desde pantalla` }).waitFor();

          setStage("crea un segundo rol desde la pantalla real y envía la versión idempotente");
          const uiRoleName = `Rol UI E2E ${randomUUID()}`;
          await rolesPage.goto(new URL("/org/roles/new", baseUrl).href);
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

          setStage("intenta borrar un rol de sistema con su versión vigente");
          const systemRoleUrl = new URL(`/api/roles/${systemRole.id}`, baseUrl);
          const systemDelete = await rolesPage.request.delete(systemRoleUrl.href, { headers, data: { version: systemRole.version } });
          assert.equal(systemDelete.status(), 403, "Un rol de sistema no se puede borrar.");

          setStage("inicia baja de cuenta como único Dueño y comprueba el bloqueo");
          await openAccount(rolesPage, "Empresa E2E");
          const deletionCodeBefore = new Set(await pickupFiles());
          let deletionReauth = rolesPage.waitForResponse((response) =>
            new URL(response.url()).pathname === "/api/me/reauth" && response.request().method() === "POST");
          await rolesPage.getByRole("button", { name: "Dar de baja", exact: true }).click();
          const deletionDialog = rolesPage.getByRole("dialog");
          await deletionDialog.getByRole("heading", { name: "¿Dar de baja tu cuenta?" }).waitFor();
          let reauthResponse = await deletionReauth;
          for (let attempt = 0; reauthResponse.status() === 429 && attempt < 5; attempt++) {
            const problem = await reauthResponse.json();
            assert.equal(typeof problem.retryAfter, "number");
            await delay((problem.retryAfter + 1) * 1000);
            deletionReauth = rolesPage.waitForResponse((response) =>
              new URL(response.url()).pathname === "/api/me/reauth" && response.request().method() === "POST");
            await deletionDialog.locator('button[type="submit"]').click();
            reauthResponse = await deletionReauth;
          }
          assert.equal(reauthResponse.status(), 202,
            `La reautenticación debe aceptar el código después del cooldown (HTTP ${reauthResponse.status()}).`);
          await enterCode(rolesPage, await codeFromPickup(businessEmail, deletionCodeBefore));
          await deletionDialog.getByRole("textbox", { name: "Motivo" }).fill("Comprobación E4 del único Dueño");
          const deletionResponsePromise = rolesPage.waitForResponse((response) =>
            new URL(response.url()).pathname === "/api/me/deletion" && response.request().method() === "POST");
          await deletionDialog.getByRole("button", { name: "Dar de baja", exact: true }).click();
          const deletionResponse = await deletionResponsePromise;
          assert.equal(deletionResponse.status(), 409, "No se puede iniciar la baja del único Dueño.");
          assert.equal((await deletionResponse.json()).code, "Legal.AccountDeletion.LastAdmin");
          await deletionDialog.getByText("Antes de pedir la baja, cada Organización activa debe tener otra persona con el rol Dueño.",
            { exact: true }).waitFor();
        }],
        ["6: registrar empresa por correo sin crear Personal", async (businessSignupPage, setStage) => {
          await registerBusinessByEmail(businessSignupPage, readyFile, setStage);
        }],
        ["6: invitar desde Usuarios y aceptar con/sin cuenta previa", async (adminPage, setStage) => {
          setStage("ingresa como Dueño para administrar Usuarios");
          await adminPage.goto(new URL("/login/empresa", baseUrl).href);
          await adminPage.getByRole("textbox", { name: "Correo electrónico" }).fill(businessEmail);
          const ownerLoginBefore = new Set(await pickupFiles());
          await sendLoginCode(adminPage);
          await adminPage.getByRole("heading", { name: "Revisá tu correo" }).waitFor();
          await enterCode(adminPage, await codeFromPickup(businessEmail, ownerLoginBefore));
          await adminPage.getByRole("button", { name: "Verificar", exact: true }).click();
          await expectPath(adminPage, "/org", "ingreso del Dueño para invitar desde Usuarios");

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
                await sendLoginCode(recipientPage);
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
          assert.equal((await companyUpdated).status(), 204, "La ficha debe guardar la empresa con su versión.");
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
          assert.equal((await settingsUpdated).status(), 204, "Configuración debe guardar con su versión.");
          e2eOrganizationName = "Empresa E2E configurada";
          assert.equal(
            await adminPage.getByRole("textbox", { name: "Nombre de la organización", exact: true }).inputValue(),
            "Empresa E2E configurada",
            "Configuración debe mostrar el nombre que acaba de guardar.",
          );

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
          assert.equal((await pageUpdated).status(), 204, "La Página pública debe guardar los datos del borrador.");
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
          const publicationError = publicationResponse.status() === 204 ? "" : ` (${(await publicationResponse.json()).code ?? "sin código"})`;
          assert.equal(publicationResponse.status(), 204, `La Página pública debe publicarse con su versión actual${publicationError}.`);
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
          assert.ok(audit.items.some((entry) => entry.affectedDisplayName === "Persona invitada E2E"
            && entry.whereText === updatedCompanyName),
          "La auditoría debe indicar el nombre afectado y la empresa donde se asignó el rol.");
          await adminPage.goto(new URL("/org/auditoria", baseUrl).href);
          await adminPage.getByRole("heading", { name: "Auditoría", exact: true }).waitFor();
          await adminPage.getByText("Cambió los roles de Persona invitada E2E", { exact: true }).first().waitFor();
          await adminPage.getByText(updatedCompanyName, { exact: true }).first().waitFor();
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
      assert.ok(selectedAccountCases.length > 0, "MT_E2E_ONLY_CASE debe coincidir con un recorrido de cuenta existente.");
      for (const [name, journey] of selectedAccountCases) {
        await t.test(name, { timeout: 240_000 }, async () => {
          const accountContext = await browser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR" });
          let lastFailure = "";
          let lastApiActivity = "";
          let lastInvitationState = "";
          let pageErrorName = "";
          let stage = "inicia el recorrido";
          const accountPage = await accountContext.newPage();
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
            if (!responseUrl.pathname.startsWith("/api/")) return;
            lastApiActivity = `${response.request().method()} ${responseUrl.pathname} → ${response.status()}`;
            if (responseUrl.pathname === "/api/invitations/preview" && response.status() === 200) {
              try {
                const payload = await response.json();
                lastInvitationState = typeof payload?.state === "string" && /^[A-Za-z]+$/.test(payload.state)
                  ? `preview ${payload.state}` : "preview recibido";
              } catch { lastInvitationState = "preview recibido"; }
            }
            if (response.status() < 400) return;
            let code;
            try { code = (await response.json()).code; } catch { /* El estado basta si no hay ProblemDetails. */ }
            lastFailure = `HTTP ${response.status()}${typeof code === "string" && /^[A-Za-z0-9.]+$/.test(code) ? ` ${code}` : ""}`;
          });
          try { await journey(accountPage, (value) => { stage = value; }); }
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
            const diagnostics = [lastFailure, lastApiActivity && `última Api: ${lastApiActivity}`, lastInvitationState,
              pageErrorName && `error de página: ${pageErrorName}`].filter(Boolean).join("; ");
            throw new Error(known ? error.message
              : `${name}: falló en “${stage}”${diagnostics ? ` (${diagnostics})` : ""} [${error?.name ?? "Error"}]${safeDetail ? ` ${safeDetail}` : ""}.`);
          } finally { await accountContext.close(); }
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
