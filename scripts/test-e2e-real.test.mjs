import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdir, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

// Ejecutar con el AppHost Development real y Email__Delivery=PickupDirectory.
// E2E_PICKUP_DIR debe coincidir con Email__PickupDirectory de la Api y estar fuera del repo.
// E2E_ANA_EMAIL debe coincidir con Seed:Development:AnaEmail del seed ya creado.
// Esta prueba no intercepta peticiones, no usa fixtures de sesión y nunca imprime códigos.
const baseUrl = new URL(process.env.E2E_BASE_URL ?? "https://localhost:5174");
const pickupDirectory = process.env.E2E_PICKUP_DIR;
const anaEmail = process.env.E2E_ANA_EMAIL;

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
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    for (const name of await pickupFiles()) {
      if (before.has(name)) continue;
      const file = path.join(pickupDirectory, name);
      let eml;
      try { eml = await readFile(file, "utf8"); }
      catch (error) { if (error?.code === "ENOENT") continue; throw error; }
      if (!eml.toLowerCase().includes(email.toLowerCase())) continue;
      const code = plainTextBody(eml)?.match(/(?<!\d)\d{6}(?!\d)/)?.[0];
      if (!code) throw new Error("Llegó un .eml sin código legible en el cuerpo de texto.");
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

test("registro real, Ana en Empresa A, F5, Perfiles y logout usan front, Api y pickup sin mocks", { timeout: 180_000 }, async () => {
  assert.ok(pickupDirectory && path.isAbsolute(pickupDirectory), "Falta E2E_PICKUP_DIR absoluto.");
  assert.ok(anaEmail, "Falta E2E_ANA_EMAIL del seed Development.");
  assert.equal(baseUrl.hostname, "localhost", "El recorrido real se ejecuta contra el AppHost local.");

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR" });
    const page = await context.newPage();
    const alive = await context.request.get(new URL("/alive", baseUrl).href);
    assert.equal(alive.status(), 200, "El AppHost debe estar listo antes del recorrido.");

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
    await page.getByRole("textbox", { name: "Correo electrónico" }).fill(anaEmail);
    const anaBefore = new Set(await pickupFiles());
    await page.getByRole("button", { name: "Enviar código" }).click();
    await page.getByRole("heading", { name: "Revisá tu correo" }).waitFor();
    await enterCode(page, await codeFromPickup(anaEmail, anaBefore));
    await page.getByRole("button", { name: "Verificar" }).click();
    await expectPath(page, "/org", "ingreso de Ana");
    await expectProfile(page, "Empresa A", "ingreso de Ana");

    await page.reload();
    await expectPath(page, "/org", "F5 en Empresa A");
    await expectProfile(page, "Empresa A", "F5 en Empresa A");
    await page.getByRole("button", { name: /, Empresa A$/ }).click();
    await page.getByRole("menuitemradio", { name: /Personal/ }).click();
    await expectPath(page, "/", "cambio desde Perfiles");
    await expectProfile(page, "Personal", "cambio desde Perfiles");
    await signOut(page, "Personal");
  } finally {
    await browser.close();
  }
});
