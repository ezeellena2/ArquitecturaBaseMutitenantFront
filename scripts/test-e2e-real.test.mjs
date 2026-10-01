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
      const accountCases = [
        ...[false, true].map((existingAccount) => [
          `3c: aceptar invitación ${existingAccount ? "con cuenta previa" : "sin cuenta y sin Personal"} desde el .eml`,
          async (invitationPage, setStage) => {
            const email = `e2e-invitation-${randomUUID()}@example.test`;
            const before = new Set(await pickupFiles());
            setStage("emite por InvitationIssuer en la base aislada");
            const issued = await invitationCommand(readyFile, { kind: "emit", email, existingAccount });
            setStage("lee el enlace del .eml real");
            const link = await invitationFromPickup(email, before);
            setStage("abre /invitacion y ve la vista previa");
            await invitationPage.goto(link);
            await invitationPage.getByRole("heading", { name: "Te sumás a Empresa E2E", exact: true }).waitFor({ timeout: 15_000 });
            await invitationPage.getByText(email, { exact: true }).first().waitFor();
            assert.equal(new URL(invitationPage.url()).hash, "", "El fragmento secreto debe retirarse antes de seguir.");
            if (existingAccount) {
              setStage("ingresa como la cuenta destinataria sin seleccionar acceso");
              await invitationPage.getByRole("link", { name: "Ingresá para aceptar", exact: true }).click();
              await invitationPage.getByRole("textbox", { name: "Correo electrónico" }).fill(email);
              const loginBefore = new Set(await pickupFiles());
              await sendLoginCode(invitationPage);
              await invitationPage.getByRole("heading", { name: "Revisá tu correo" }).waitFor();
              await enterCode(invitationPage, await codeFromPickup(email, loginBefore));
              await invitationPage.getByRole("button", { name: "Verificar", exact: true }).click();
              await expectPath(invitationPage, "/invitacion", "retorno a la invitación");
            }
            setStage("acepta la invitación real");
            const acceptedResponse = invitationPage.waitForResponse((response) =>
              new URL(response.url()).pathname === "/api/invitations/accept" && response.request().method() === "POST");
            await invitationPage.getByRole("button", { name: "Aceptar invitación", exact: true }).click();
            assert.equal((await acceptedResponse).ok(), true, "La aceptación real debe completar su transacción.");
            if (!existingAccount) {
              await invitationPage.getByRole("heading", { name: "Te sumaste a Empresa E2E", exact: true }).waitFor();
              setStage("comprueba identidad vinculada sin espacio Personal antes de cambiar acceso");
              const inspection = await invitationCommand(readyFile, { kind: "inspect", email, invitationId: issued.invitationId });
              assert.equal(inspection.personalSpaces, 0, "Aceptar sin cuenta no puede crear un espacio Personal.");
              assert.equal(inspection.activeBusinessAccesses, 1);
              assert.equal(inspection.accepted, true);
              assert.equal(inspection.boundToIdentity, true);
              await invitationPage.getByRole("button", { name: "Más tarde", exact: true }).click();
            }
            setStage("entra a la organización con la membresía activa");
            await expectPath(invitationPage, "/org", "entrada luego de aceptar");
            await expectProfile(invitationPage, "Empresa E2E", "entrada luego de aceptar");
            await invitationPage.reload();
            await expectProfile(invitationPage, "Empresa E2E", "F5 luego de aceptar");
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
        ["3b: quitar un método con código enviado a otro", async (accountPage) => {
          const originalEmail = await registerPerson(accountPage);
          await openAccount(accountPage);
          const addedEmail = await addPersonalEmail(accountPage, originalEmail);
          const before = new Set(await pickupFiles());
          await accountPage.getByRole("button", { name: `Acciones de ${addedEmail}`, exact: true }).click();
          await openReauthDialog(accountPage, () => accountPage.getByRole("menuitem", { name: "Quitar", exact: true }).click(), "Quitar");
          await enterCode(accountPage, await codeFromPickup(originalEmail, before));
          await accountPage.getByRole("dialog").getByRole("button", { name: "Quitar", exact: true }).click();
          await accountPage.getByRole("dialog").waitFor({ state: "hidden" });
          assert.equal(await accountPage.getByText(addedEmail, { exact: true }).count(), 0);
        }],
        ["3b: pedir baja y cancelarla ingresando durante la gracia", async (accountPage) => {
          const email = await registerPerson(accountPage);
          await openAccount(accountPage);
          const before = new Set(await pickupFiles());
          await openReauthDialog(accountPage, () => accountPage.getByRole("button", { name: "Dar de baja", exact: true }).click(), "Dar de baja mi cuenta");
          const dialog = accountPage.getByRole("dialog");
          await dialog.getByRole("textbox", { name: /Motivo/ }).fill("Recorrido propio del E2E");
          // El rótulo del código de baja incluye el destino enmascarado del lienzo.
          const code = await codeFromPickup(email, before);
          const boxes = dialog.locator('input[inputmode="numeric"]');
          assert.equal(await boxes.count(), 6);
          for (let index = 0; index < 6; index++) await boxes.nth(index).fill(code[index]);
          await dialog.getByRole("button", { name: "Dar de baja mi cuenta", exact: true }).click();
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
          assert.equal(await accountPage.getByRole("button", { name: "Aceptar y seguir" }).isDisabled(), true);
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
          let stage = "inicia el recorrido";
          const accountPage = await accountContext.newPage();
          accountPage.on("request", (request) => {
            const authorization = request.headers().authorization;
            if (new URL(request.url()).pathname.startsWith("/api/") && authorization?.startsWith("Bearer "))
              accountTokens.set(accountPage, authorization);
          });
          accountPage.on("response", async (response) => {
            if (response.status() < 400 || !new URL(response.url()).pathname.startsWith("/api/")) return;
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
            throw new Error(known ? error.message
              : `${name}: falló en “${stage}”${lastFailure ? ` (${lastFailure})` : ""} [${error?.name ?? "Error"}]${safeDetail ? ` ${safeDetail}` : ""}.`);
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
