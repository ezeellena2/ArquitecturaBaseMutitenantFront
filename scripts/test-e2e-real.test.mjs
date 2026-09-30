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
  while (Date.now() < deadline) {
    for (const name of await pickupFiles()) {
      if (before.has(name)) continue;
      const file = path.join(pickupDirectory, name);
      let eml;
      try { eml = await readFile(file, "utf8"); }
      catch (error) { if (error?.code === "ENOENT") continue; throw error; }
      if (!eml.toLowerCase().includes(email.toLowerCase())) continue;
      const code = plainTextBody(eml)?.match(/(?<!\d)\d{6}(?!\d)/)?.[0];
      if (!code) continue; // Los avisos de cuenta comparten pickup con los códigos.
      await unlink(file);
      return code;
    }
    await delay(250);
  }
  throw new Error("No llegó el .eml de este paso al pickup de la Api.");
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

async function registerPerson(page) {
  const email = `e2e-account-${randomUUID()}@example.test`;
  await page.goto(new URL("/registro", baseUrl).href);
  await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
  await page.getByRole("textbox", { name: "Correo electrónico" }).fill(email);
  const before = new Set(await pickupFiles());
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await page.getByRole("heading", { name: "Revisá tu correo" }).waitFor();
  await enterCode(page, await codeFromPickup(email, before));
  await page.getByRole("button", { name: "Verificar y crear la cuenta" }).click();
  await expectPath(page, "/", "registro de cuenta 3b");
  await expectProfile(page, "Personal", "registro de cuenta 3b");
  return email;
}

async function openAccount(page) {
  await page.goto(new URL("/cuenta", baseUrl).href);
  try {
    await page.getByRole("heading", { name: "Mi cuenta", exact: true }).waitFor({ timeout: 10_000 });
  } catch {
    throw new Error("La cuenta 3b: /cuenta no muestra la pantalla Mi cuenta.");
  }
}

async function addPersonalEmail(page) {
  const email = `e2e-personal-${randomUUID()}@example.test`;
  await page.getByRole("button", { name: "Agregar correo o teléfono", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill(email);
  const before = new Set(await pickupFiles());
  await dialog.getByRole("button", { name: "Enviar código", exact: true }).click();
  await enterCode(page, await codeFromPickup(email, before));
  await dialog.getByRole("button", { name: "Verificar", exact: true }).click();
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
  for (let attempt = 0; attempt < 2; attempt++) {
    const responsePromise = page.waitForResponse((response) =>
      new URL(response.url()).pathname === "/api/auth/login-code" && response.request().method() === "POST");
    await page.getByRole("button", { name: "Enviar código", exact: true }).click();
    const response = await responsePromise;
    if (response.ok()) return;
    const problem = await response.json();
    if (response.status() !== 429 || typeof problem.retryAfter !== "number")
      throw new Error(`El envío de ingreso falló (HTTP ${response.status()}).`);
    // El límite es por destino, también después del código de baja; el recorrido lo respeta.
    await delay((problem.retryAfter + 1) * 1000);
  }
  throw new Error("El envío de ingreso no terminó después de respetar el cooldown.");
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
      await openAccount(page);
      await page.reload();
      await expectProfile(page, "Empresa E2E", "F5 en Mi cuenta desde empresa");
      await page.getByRole("button", { name: /, Empresa E2E$/ }).click();
      await page.getByRole("menuitemradio", { name: /Personal/ }).click();
      await expectPath(page, "/", "cambio desde Perfiles");
      await expectProfile(page, "Personal", "cambio desde Perfiles");
      await signOut(page, "Personal");

      // Cada recorrido usa una identidad/contexto propios; un fallo no saltea los otros.
      const accountCases = [
        ["3b: sumar correo personal con código leído del .eml", async (accountPage) => {
          await registerPerson(accountPage);
          await openAccount(accountPage);
          await addPersonalEmail(accountPage);
        }],
        ["3b: quitar un método con código enviado a otro", async (accountPage) => {
          const originalEmail = await registerPerson(accountPage);
          await openAccount(accountPage);
          const addedEmail = await addPersonalEmail(accountPage);
          const before = new Set(await pickupFiles());
          await accountPage.getByRole("button", { name: `Acciones de ${addedEmail}`, exact: true }).click();
          await accountPage.getByRole("menuitem", { name: "Quitar", exact: true }).click();
          await enterCode(accountPage, await codeFromPickup(originalEmail, before));
          await accountPage.getByRole("dialog").getByRole("button", { name: "Quitar", exact: true }).click();
          await accountPage.getByRole("dialog").waitFor({ state: "hidden" });
          assert.equal(await accountPage.getByText(addedEmail, { exact: true }).count(), 0);
        }],
        ["3b: pedir baja y cancelarla ingresando durante la gracia", async (accountPage) => {
          const email = await registerPerson(accountPage);
          await openAccount(accountPage);
          const before = new Set(await pickupFiles());
          await accountPage.getByRole("button", { name: "Dar de baja", exact: true }).click();
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
          await accountPage.getByRole("combobox", { name: "Idioma y región" }).click();
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
      for (const [name, journey] of accountCases) {
        await t.test(name, { timeout: 240_000 }, async () => {
          const accountContext = await browser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR" });
          let lastFailure = "";
          const accountPage = await accountContext.newPage();
          accountPage.on("response", async (response) => {
            if (response.status() < 400 || !new URL(response.url()).pathname.startsWith("/api/")) return;
            let code;
            try { code = (await response.json()).code; } catch { /* El estado basta si no hay ProblemDetails. */ }
            lastFailure = `HTTP ${response.status()}${typeof code === "string" && /^[A-Za-z0-9.]+$/.test(code) ? ` ${code}` : ""}`;
          });
          try { await journey(accountPage); }
          catch (error) {
            // Playwright puede incluir valores de controles/URLs; solo publicar el paso.
            const known = error?.message?.startsWith("La cuenta 3b:") || error?.message?.startsWith("La versión nueva");
            throw new Error(known ? error.message : `${name}: falló un paso del navegador real${lastFailure ? ` (${lastFailure})` : ""}.`);
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
