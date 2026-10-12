// node scripts/recorrido-usuario.mjs [--no-build]
// Requiere Docker/Aspire y npm install. Base propia, correos pickup y un solo perfil Chromium temporal.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";
import { baseUrl, createEnvironment } from "./recorrido-usuario-entorno.mjs";
import { expectRecoveryEmailInUse, fillOtp } from "./test-e2e-real-ui.mjs";
import { pickupCode } from "./test-e2e-real-mail.mjs";
import { e8Definitions, e8ManualChecks, e8SourceRevision, runE8Journey } from "./recorrido-usuario-whatsapp.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const widths = [1440, 390];
const viewport = (width) => ({ width, height: width === 390 ? 844 : 900 });
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

export function journeyDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function safeDiagnostic(message) {
  // eslint-disable-next-line no-control-regex -- ESC es intencional para quitar el formato ANSI del diagnóstico.
  return String(message).replace(/\u001b\[[0-9;]*m/g, "").replace(/https?:\/\/[^\s"'<>]+/g, (url) => {
    try { const value = new URL(url); return `${value.origin}${value.pathname}`; } catch { return "[URL]"; }
  }).replace(/\b\d{6}\b/g, "[código]").replace(/[A-Za-z0-9_.-]{80,}/g, "[dato omitido]").slice(0, 800);
}

export function journeyFailure(activeStep, errors) {
  // Assert y Playwright pueden incluir un OTP, fragmento o cuerpo HTTP en su mensaje.
  const detail = activeStep.startsWith("E8-")
    ? errors.map((error) => /^[A-Za-z]+$/.test(error.name) ? error.name : "Error").join("; ")
    : safeDiagnostic(errors.map((error) => error.message).join("; "));
  return `Falló ${activeStep}; ${detail}. Los pasos pendientes no cuentan como aprobados.`;
}

export function renderIndex(report) {
  const passed = report.steps.reduce((count, step) => count + step.results.filter((item) => item.status === "passed").length, 0);
  const total = report.steps.length * widths.length;
  const accepted = report.finished && report.cleanup === "apagado" && passed === total;
  const manual = report.manual ?? [];
  const sections = report.steps.map((step) => `<section id="paso-${escape(step.id)}"><h2>${escape(step.id)} · ${escape(step.title)}</h2><p><strong>Esperado:</strong> ${escape(step.expected)}</p>${step.controlled ? "<p>OTP controlado o canal privado de Testing. La recepción en WhatsApp real sigue pendiente.</p>" : ""}${step.guion ? `<p>Guion ${escape(step.guion)} · paso ${escape(step.paso)} · fuente ${escape(e8SourceRevision)}.</p>` : ""}<div class="pair">${widths.map((width) => {
    const result = step.results.find((item) => item.width === width) ?? { status: "pending", actual: "Pendiente" };
    return `<article><h3>${width} px · ${escape({ passed: "Pasó", failed: "Falló", pending: "Pendiente" }[result.status])}</h3><p><strong>Resultado:</strong> ${escape(result.actual ?? "Pendiente")}</p>${result.image ? `<a href="${escape(result.image)}"><img loading="lazy" src="${escape(result.image)}" alt="${escape(step.title)} a ${width} px"></a>` : ""}${result.extraImage ? `<p>La pestaña de Plataforma siguió abierta:</p><a href="${escape(result.extraImage)}"><img loading="lazy" src="${escape(result.extraImage)}" alt="Plataforma conservada a ${width} px"></a>` : ""}</article>`;
  }).join("")}</div></section>`).join("\n");
  const status = accepted ? (manual.length ? "Comprobaciones automatizadas aprobadas; recorrido manual pendiente" : "Recorrido aprobado") : "Recorrido pendiente o fallido";
  return `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Recorrido de usuario · ${escape(report.date)}</title><style>body{font:16px/1.5 system-ui;margin:0;background:#f4f5f6;color:#182026}header,main{max-width:1500px;margin:auto;padding:24px}section{background:white;padding:24px;margin:24px 0;border-radius:12px;border:1px solid #ccd3d8}.pair{display:grid;grid-template-columns:2fr 1fr;gap:24px}img{display:block;width:100%;height:auto;border:1px solid #ccd3d8}h2{margin-top:0}article{min-width:0}nav a{margin-right:12px}a{color:#194b78}@media(max-width:800px){.pair{grid-template-columns:1fr}header,main{padding:12px}}</style><header><h1>Recorrido de usuario · ${escape(report.stage ?? "Etapa 7")}</h1><p>${escape(report.date)} · ${status} · ${passed}/${total} comprobaciones</p><p>Entorno: ${escape(report.cleanup)}. Un contexto Chromium persistente, sesión antigua firmada antes de navegar, sin limpiar cookies. PostgreSQL y correo .eml aislados. Google: solo destino accounts.google.com.</p><nav>${report.steps.map((step) => `<a href="#paso-${escape(step.id)}">${escape(step.id)}</a>`).join(" ")}</nav></header><main>${sections}${manual.length ? `<section><h2>Para probar a mano</h2><ul>${manual.map((item) => `<li>Pendiente · ${escape(item)}</li>`).join("")}</ul></section>` : ""}</main></html>`;
}

export async function recordedStep({ result, action, capture, persist, diagnostic = () => "" }) {
  let failure;
  try { result.actual = await action(); result.status = "passed"; }
  catch (error) { failure = error; result.status = "failed"; result.actual = `No se cumplió la comprobación (${error.name}). ${diagnostic(error)}`; }
  try { result.image = await capture(); }
  catch (error) { result.status = "failed"; result.actual += ` Captura no disponible (${error.name}).`; failure ??= error; }
  await persist();
  if (failure) throw failure;
}

export async function withCleanup(work, cleanups) {
  const failures = [];
  let result;
  try { result = await work(); } catch (error) { failures.push(error); }
  for (const cleanup of cleanups) {
    try { await cleanup(); } catch (error) { failures.push(error); }
  }
  if (failures.length) throw new AggregateError(failures, "El recorrido o su apagado falló.");
  return result;
}

export async function waitCodeMessage(page, text) {
  const alert = page.getByRole("alert").filter({ hasText: text });
  await alert.waitFor();
  assert.equal((await alert.innerText()).split("\n")[0].trim(), text);
}

export async function signOutMobile(page) {
  const more = page.getByRole("navigation", { name: "Secciones" }).getByRole("link", { name: "Más", exact: true });
  if (await more.isVisible()) await more.click();
  else await page.getByRole("link", { name: "Volver a Más", exact: true }).click();
  await page.getByRole("button", { name: "Salir", exact: true }).click();
}

export async function waitForTransientNotices(page) {
  // Sonner pausa su vencimiento mientras el puntero queda sobre la franja del último clic.
  await page.mouse.move(0, 0);
  await page.locator('[data-sonner-toast]:not([data-type="error"]):not([data-type="loading"])').first().waitFor({ state: "detached" });
}

export async function waitForPlatformHome(page) {
  const phone = page.viewportSize().width === 390;
  const route = phone ? "/plataforma/organizaciones" : "/plataforma";
  await page.waitForURL((url) => url.origin === baseUrl.origin && url.pathname === route);
  await page.getByRole("heading", { name: phone ? "Organizaciones" : "Inicio", exact: true }).waitFor();
  await (phone ? page.getByRole("navigation", { name: "Secciones", exact: true }) : page.getByRole("button", { name: /, Plataforma$/ })).waitFor();
}

export async function platformAssistantLimitation(response) {
  if (response.ok()) return "El asistente pertenece a E8b y no se acredita en este paso del núcleo.";
  assert.equal(response.status(), 501);
  assert.equal((await response.json()).code, "General.Contract.NotImplemented");
  return "Limitación separada: GET /api/platform/assistant HTTP 501 General.Contract.NotImplemented; asistente contractual E8b pendiente, no aprobado. El panel de error se conserva en la captura.";
}

const definitions = [
  ["01", "1 · Persona sin cuenta", "Desde la portada, Ingresá rechaza el correo desconocido y ofrece Crear mi cuenta sin enviar código."],
  ["02", "1 · Registro desde el ingreso", "El correo viene escrito; aceptar términos y verificar el .eml lleva al inicio Personal."],
  ["03", "2 · Cuenta existente en registro", "Crear mi cuenta con el mismo correo informa que ya existe y ofrece Ingresar con el correo conservado."],
  ["04", "2 · Ingreso por código", "El código del pickup lleva al inicio Personal."],
  ["05", "2 · Salir y volver a ingresar", "La salida por UI vuelve a la portada y otro código permite entrar en el mismo contexto."],
  ["06", "3 · Google en registro de persona", "Sin escribir correo, Registrarte con Google inicia OAuth real hacia accounts.google.com."],
  ["07", "3 · Google en registro de empresa", "Sin escribir correo, Seguir con Google inicia OAuth real hacia accounts.google.com."],
  ["08", "4 · Registrar una empresa", "Un correo nuevo verifica su .eml, crea organización y primera empresa, y entra a /org."],
  ["09", "4 · Persona sin empresa", "Ingresá como empresa con la cuenta personal muestra que no está en ninguna empresa y ofrece una salida."],
  ["10", "4 · Cuenta con empresa", "Ingresá como empresa lleva a la organización propia y conserva el acceso tras recargar."],
  ["11", "5 · Ingreso del operador", "El operador ingresa por código a Plataforma."],
  ["12", "5 · Operador y persona conviven", "Otra pestaña muestra el ingreso, permite entrar a otra persona y Plataforma sigue abierta tras F5."],
  ["13", "5 · Operador en puerta personal", "Antes del código no revela Plataforma; después muestra la pantalla privada y Salir conserva Plataforma."],
  ["14", "6 · Guardar nombre y apellido", "Mi cuenta guarda las dos partes y F5 conserva el nombre completo."],
  ["15", "6 · Agregar correo", "Solo se envía un código al correo nuevo; verificarlo lo agrega a Cómo entrás."],
  ["16", "6 · Cambiar principal", "Hacer principal confirma y guarda sin pedir ni enviar otro código."],
  ["17", "6 · Quitar correo", "Quitar confirma sin código y conserva el otro método como principal."],
  ["18", "6 · Correo de otra cuenta", "Agregar un correo verificado ajeno informa que ya está asociado, sin enviar código."],
  ["19", "7 · Recuperación sin cuenta", "Recuperar mi cuenta informa que el correo anterior no tiene cuenta."],
  ["20", "7 · Recuperación con correo ocupado", "Un correo nuevo que es de otra cuenta se rechaza con explicación concreta."],
  ["21", "8 · Correo mal escrito", "El ingreso pide un correo electrónico válido y conserva una acción para corregirlo."],
  ["22", "8 · Código equivocado", "El código incorrecto informa El código no es válido y permite verificar o pedir otro."],
  ["23", "8 · Otro código antes de tiempo", "Otra solicitud inmediata respeta el cooldown e informa Esperá un momento antes de pedir otro código."],
  ["24", "8 · Código vencido", "Un desafío real vencido informa El código venció. Pedí uno nuevo, con salida para reenviar."],
  ["25", "E7 · Empresa publica su página", "El Dueño guarda y publica por UI su página con el interruptor de publicación."],
  ["26", "E7 · Portada con la empresa", "La publicación aparece en Empresas en ArquitecturaBase."],
  ["27", "E7 · Directorio y búsqueda", "Ver todas las empresas abre /empresas y el buscador encuentra la publicación."],
  ["28", "E7 · Tarjeta y subdominio", "La tarjeta abre la publicación en su subdominio y muestra Ingresá para continuar."],
  ["29", "E7 · Persona vuelve con su menú", "Ingresar desde la publicación vuelve al mismo subdominio con el menú; F5 conserva la sesión."],
  ["30", "E7 · Página sin publicar", "Al despublicar por UI, ese mismo subdominio dice Esta página no está disponible."],
];

async function runWidth({ width, context, env, record, output, signal }) {
  const page = await context.newPage();
  await page.setViewportSize(viewport(width));
  page.setDefaultTimeout(30_000);
  page.setDefaultNavigationTimeout(60_000);
  const email = `e2e-recorrido-persona-${randomUUID()}@example.test`;
  const businessEmail = `e2e-recorrido-empresa-${randomUUID()}@example.test`;
  const operator = width === 1440 ? "e2e-a3-operator@example.test" : "e2e-a1-operator@example.test";
  const organization = `Recorrido ${width} ${randomUUID().slice(0, 8)}`;
  const slug = `recorrido-${width}-${randomUUID().slice(0, 8)}`;
  const siteName = `Empresa del recorrido ${width}`;
  const site = new URL(baseUrl); site.hostname = `${slug}.${baseUrl.hostname}`;
  let platformPage;
  let platformAssistantResponse;
  let added;
  let validCode;
  let lastHttp = "";
  let lastAction = "";
  const browserErrors = [];
  const connection = [];
  const observe = (target) => {
    target.on("websocket", (socket) => socket.on("framereceived", ({ payload }) => {
      try {
        const event = JSON.parse(String(payload));
        if (event.type === "full-reload") browserErrors.push(`Vite recargó: ${safeDiagnostic(event.triggeredBy ?? event.path ?? "sin ruta")}`);
      } catch { /* Solo interesa la recarga del servidor de desarrollo. */ }
    }));
    const error = (message) => { browserErrors.push(safeDiagnostic(message)); if (browserErrors.length > 5) browserErrors.shift(); };
    target.on("pageerror", (caught) => { error(caught.message); });
    target.on("console", (message) => { if (message.type() === "error") error(message.text()); });
    target.on("response", async (response) => {
    const url = new URL(response.url());
    if (target === platformPage && url.pathname === "/api/platform/assistant" && response.request().method() === "GET") platformAssistantResponse = response;
    if (url.pathname.startsWith("/connect/") || url.pathname === "/" || response.status() >= 400) {
      connection.push(`${response.request().method()} ${url.pathname} HTTP ${response.status()}`);
      if (connection.length > 10) connection.shift();
    }
    if (!url.pathname.startsWith("/api/")) return;
    let code = "";
    if (!response.ok()) {
      try { const problem = await response.json(); if (/^[A-Za-z0-9.]+$/.test(problem.code)) code = ` ${problem.code}`; } catch { /* Sin body JSON. */ }
    }
    lastHttp = `${response.request().method()} ${url.pathname} HTTP ${response.status()}${code}`;
    });
  };
  observe(page);
  const step = (id, action) => record(id, width, () => id === "11" && platformPage ? platformPage : page, action, (error) => `Ruta ${new URL(page.url()).pathname}; ${lastAction}; ${lastHttp}; ${browserErrors.join("; ")}; ${connection.join(", ")}; ${safeDiagnostic(error.message)}`);
  const visibleText = (text) => page.getByText(text, { exact: true }).filter({ visible: true }).first().waitFor();
  const heading = (text, target = page) => target.getByRole("heading", { name: text, exact: true }).waitFor();
  const responseFor = (target, route, method) => target.waitForResponse((response) => new URL(response.url()).pathname === route && response.request().method() === method);
  const clickResponse = async (target, locator, route, method = "POST") => {
    await locator.click({ trial: true, timeout: 120_000 });
    const response = responseFor(target, route, method);
    await locator.click({ timeout: 120_000 });
    return response;
  };
  const awaitApp = async (target, profile = "Personal", route = "/") => {
    await target.waitForURL((url) => url.origin === baseUrl.origin && url.pathname === route);
    if (width === 390) await target.getByRole("navigation", { name: "Secciones", exact: true }).waitFor();
    else await target.getByRole("button", { name: new RegExp(`, ${profile}$`) }).waitFor();
  };
  const signOut = async (target = page, profile = "Personal") => {
    lastAction = `abrir salida de ${profile}`;
    if (await target.getByRole("button", { name: "Salir", exact: true }).isVisible()) {
      await target.getByRole("button", { name: "Salir", exact: true }).click();
    } else if (await target.getByRole("button", { name: "Tu cuenta", exact: true }).isVisible()) {
      await target.getByRole("button", { name: "Tu cuenta", exact: true }).click();
      await target.getByRole("button", { name: /^Salir/ }).click();
    } else if ((await target.viewportSize()).width === 390) {
      await signOutMobile(target);
    } else {
      lastAction = `abrir menú ${profile}`;
      await target.getByRole("button", { name: new RegExp(`, ${profile}$`) }).press("Enter");
      lastAction = "elegir Salir";
      await target.getByRole("menuitem", { name: /^Salir/ }).press("Enter");
    }
    lastAction = "esperar portada tras Salir";
    await target.waitForURL((url) => url.pathname === "/");
    if (new URL(target.url()).origin === baseUrl.origin) await target.getByRole("link", { name: "Ingresá", exact: true }).filter({ visible: true }).first().waitFor();
    else await target.getByRole("button", { name: "Ingresá para continuar", exact: true }).waitFor();
  };
  const send = async (target, route = "/api/auth/login-code", button = "Enviar código") => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const response = await clickResponse(target, target.getByRole("button", { name: button, exact: true }), route);
      if (response.ok()) return;
      const problem = await response.json();
      assert.equal(response.status(), 429);
      assert.equal(typeof problem.retryAfter, "number");
      console.info(`  ${width}: espera cooldown real ${problem.retryAfter}s`);
      await delay((problem.retryAfter + 1) * 1000, undefined, { signal });
    }
    throw new Error("El envío sigue limitado después de cinco cooldowns.");
  };
  const requestCode = async (target, destination) => {
    await target.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(destination);
    const before = new Set(await env.files());
    await send(target);
    await heading("Revisá tu correo", target);
    return env.code(destination, before);
  };
  const verify = async (target, code, route = "/api/auth/login-code/verify", button = "Verificar") => {
    await fillOtp(target, code);
    return clickResponse(target, target.getByRole("button", { name: button, exact: true }), route);
  };
  const login = async (destination, access = "consumer", target = page) => {
    await target.goto(new URL(access === "business" ? "/login/empresa" : access === "platform" ? "/plataforma" : "/login", baseUrl).href);
    const response = await verify(target, await requestCode(target, destination));
    assert.equal(response.status(), 200);
    await awaitApp(target, access === "business" ? organization : access === "platform" ? "Plataforma" : "Personal", access === "business" ? "/org" : access === "platform" ? "/plataforma" : "/");
  };
  const openAccount = async () => {
    if (width === 390) {
      await page.getByRole("navigation", { name: "Secciones" }).getByRole("link", { name: "Más", exact: true }).click();
      await page.getByRole("link", { name: "Mi cuenta", exact: true }).click();
    } else {
      await page.getByRole("button", { name: /, Personal$/ }).click();
      await page.getByRole("menuitem", { name: "Mi cuenta", exact: true }).click();
    }
    await heading("Mi cuenta");
    await page.getByRole("button", { name: /^Agregar correo(?: o teléfono)?$/ }).waitFor();
  };
  const addEmail = async () => {
    await page.getByRole("button", { name: /^Agregar correo(?: o teléfono)?$/ }).click();
    const dialog = page.getByRole("dialog");
    const channel = dialog.getByRole("button", { name: "Correo", exact: true });
    if (await channel.isVisible()) await channel.click();
    return dialog;
  };
  const confirmMethod = async (destination, action) => {
    const before = new Set(await env.files());
    await page.getByRole("button", { name: `Acciones de ${destination}`, exact: true }).click();
    await page.getByRole("menuitem", { name: action, exact: true }).click();
    const dialog = page.getByRole("dialog");
    assert.equal(await dialog.getByRole("group", { name: "Código" }).count(), 0);
    const response = page.waitForResponse((item) => /\/api\/me\/login-methods\/[^/]+(?:\/primary)?$/.test(new URL(item.url()).pathname) && item.request().method() === (action === "Quitar" ? "DELETE" : "PUT"));
    await dialog.getByRole("button", { name: action, exact: true }).click();
    assert.equal((await response).status(), 204);
    await dialog.waitFor({ state: "hidden" });
    for (const destinationEmail of [email, added]) assert.equal((await env.messages(destinationEmail, before)).filter((item) => pickupCode(item.body)).length, 0);
  };

  await step("01", async () => {
    await page.goto(baseUrl.href);
    await page.getByRole("link", { name: "Ingresá", exact: true }).filter({ visible: true }).first().click();
    await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(email);
    const before = new Set(await env.files());
    assert.equal((await clickResponse(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code")).status(), 400);
    await visibleText("No hay una cuenta con ese correo.");
    await page.getByRole("link", { name: "Crear mi cuenta", exact: true }).waitFor();
    assert.equal((await env.messages(email, before)).length, 0);
    assert.equal((await context.cookies(baseUrl.href)).some((cookie) => cookie.name === ".AspNetCore.Identity.Application"), false);
    return "Informó que no hay cuenta, ofreció Crear mi cuenta y descartó el legado público sin enviar correo.";
  });
  await step("02", async () => {
    await page.getByRole("link", { name: "Crear mi cuenta", exact: true }).press("Enter");
    await heading("Creá tu cuenta");
    assert.equal(await page.getByRole("textbox", { name: "Correo electrónico" }).inputValue(), email);
    await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
    const before = new Set(await env.files());
    await send(page, "/api/auth/signup", "Crear cuenta");
    assert.equal((await verify(page, await env.code(email, before), "/api/auth/signup/verify", "Verificar y crear la cuenta")).status(), 204);
    await awaitApp(page);
    return "Conservó el correo, creó la cuenta con el código del pickup y llegó a Personal.";
  });
  await step("03", async () => {
    await signOut();
    await page.goto(new URL("/registro", baseUrl).href);
    await page.getByRole("textbox", { name: "Correo electrónico" }).fill(email);
    await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
    await clickResponse(page, page.getByRole("button", { name: "Crear cuenta", exact: true }), "/api/auth/signup");
    await visibleText("Ya tenés una cuenta con ese correo.");
    await page.getByRole("link", { name: "Ingresar", exact: true }).waitFor();
    return "Mostró cuenta existente y el enlace Ingresar.";
  });
  await step("04", async () => {
    await page.getByRole("link", { name: "Ingresar", exact: true }).click();
    await page.getByRole("textbox", { name: "Correo electrónico" }).waitFor();
    assert.equal(await page.getByRole("textbox", { name: "Correo electrónico" }).inputValue(), email);
    assert.equal((await verify(page, await requestCode(page, email))).status(), 200);
    await awaitApp(page);
    return "El enlace conservó el correo y el código llevó al inicio Personal.";
  });
  await step("05", async () => { await signOut(); await login(email); return "Salió por UI y volvió a Personal con otro código, conservando el contexto."; });
  await signOut();
  for (const [id, route, label] of [["06", "/registro", "Registrarte con Google"], ["07", "/registro/empresa", "Seguir con Google"]]) {
    await step(id, async () => {
      await page.goto(new URL(route, baseUrl).href);
      await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
      const challenge = responseFor(page, "/api/auth/external/google", "POST");
      const navigation = page.waitForURL((url) => url.hostname === "accounts.google.com", { waitUntil: "commit" });
      await page.getByRole("button", { name: label, exact: true }).click();
      assert.equal((await challenge).status(), 302);
      await navigation;
      assert.equal(new URL(page.url()).hostname, "accounts.google.com");
      return "Sin completar correo, el desafío OAuth real navegó a accounts.google.com. No se ingresó al proveedor.";
    });
  }
  await step("08", async () => {
    await page.goto(new URL("/registro/empresa", baseUrl).href);
    await page.getByRole("textbox", { name: "Tu correo electrónico" }).fill(businessEmail);
    await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
    const before = new Set(await env.files());
    await send(page, "/api/auth/business-signup/code", "Continuar");
    assert.equal((await verify(page, await env.code(businessEmail, before), "/api/auth/business-signup/verify")).status(), 204);
    await heading("Tu organización");
    await page.getByRole("textbox", { name: "Nombre de la organización" }).fill(organization);
    await page.getByRole("textbox", { name: /Dirección de tu página/ }).fill(slug);
    await page.getByRole("textbox", { name: "Primera empresa" }).fill(`${organization} Centro`);
    await visibleText("Disponible");
    assert.equal((await clickResponse(page, page.getByRole("button", { name: "Crear organización", exact: true }), "/api/auth/business-signup")).status(), 200);
    await heading(`${organization} está lista`);
    await page.getByRole("button", { name: `Entrar a ${organization}`, exact: true }).click();
    await awaitApp(page, organization, "/org");
    return "Creó organización y primera empresa desde la pantalla y entró como Dueño a /org.";
  });
  await step("09", async () => {
    await signOut(page, organization);
    await page.goto(new URL("/login/empresa", baseUrl).href);
    const result = await verify(page, await requestCode(page, email));
    assert.equal(result.status(), 403);
    await heading("Tu cuenta no está en ninguna empresa todavía");
    await page.getByRole("link", { name: "Ingresá como persona", exact: true }).waitFor();
    return "Mostró Sin empresa con explicación y enlace para entrar como persona.";
  });
  await step("10", async () => {
    await login(businessEmail, "business");
    await page.reload(); await awaitApp(page, organization, "/org");
    return "Entró a la organización propia y F5 conservó el acceso empresa.";
  });
  await signOut(page, organization);
  await step("11", async () => {
    platformPage = await context.newPage(); await platformPage.setViewportSize(viewport(width)); observe(platformPage);
    await login(operator, "platform", platformPage);
    await waitForPlatformHome(platformPage);
    if (width === 390) return "El operador ingresó a Organizaciones en /plataforma/organizaciones con su barra privada; el inicio móvil no abre el asistente de E8b.";
    const assistantState = platformAssistantResponse ?? await responseFor(platformPage, "/api/platform/assistant", "GET");
    const limitation = await platformAssistantLimitation(assistantState);
    if (assistantState.status() === 501) await platformPage.getByText("No pudimos abrir esta pantalla", { exact: true }).waitFor();
    return `El operador ingresó a Inicio en /plataforma con el código de su .eml; la captura muestra su pestaña. ${limitation}`;
  });
  await step("12", async () => {
    await page.goto(baseUrl.href);
    await page.getByRole("link", { name: "Ingresá", exact: true }).filter({ visible: true }).first().click();
    await page.getByRole("textbox", { name: "Correo electrónico" }).waitFor();
    assert.equal(await page.getByRole("heading", { name: /Esta cuenta es de un operador/ }).count(), 0);
    assert.equal((await verify(page, await requestCode(page, email))).status(), 200);
    await awaitApp(page);
    await platformPage.reload(); await waitForPlatformHome(platformPage);
    await platformPage.screenshot({ path: path.join(output, `12-plataforma-${width}.png`), fullPage: true, animations: "disabled" });
    return "La segunda pestaña ingresó a Personal; Plataforma siguió abierta tras F5, sin nuevo código.";
  });
  await step("13", async () => {
    await signOut();
    await page.goto(new URL("/login", baseUrl).href);
    const code = await requestCode(page, operator);
    assert.equal(await page.getByRole("heading", { name: /Esta cuenta es de un operador/ }).count(), 0);
    const response = await verify(page, code);
    assert.equal(response.status(), 403);
    assert.equal((await response.json()).code, "Tenancy.Access.PlatformOnly");
    await heading("Esta cuenta es de un operador: solo entra a Plataforma");
    await page.getByRole("link", { name: "Ir a Plataforma", exact: true }).waitFor();
    return "Pidió el código sin revelar Plataforma y después mostró el estado privado con Ir a Plataforma y Salir.";
  });
  await signOut(); await platformPage.reload(); await waitForPlatformHome(platformPage);
  await step("14", async () => {
    await login(email); await openAccount();
    await page.getByRole("textbox", { name: "Nombre", exact: true }).fill("Alex");
    await page.getByRole("textbox", { name: "Apellido", exact: true }).fill("Recorrido");
    assert.equal((await clickResponse(page, page.getByRole("button", { name: "Guardar cambios", exact: true }), "/api/me", "PUT")).status(), 200);
    await page.reload(); await heading("Mi cuenta");
    assert.equal(await page.getByRole("textbox", { name: "Nombre", exact: true }).inputValue(), "Alex");
    assert.equal(await page.getByRole("textbox", { name: "Apellido", exact: true }).inputValue(), "Recorrido");
    return "Guardó Alex Recorrido; F5 conservó nombre y apellido.";
  });
  await step("15", async () => {
    added = `e2e-recorrido-agregado-${randomUUID()}@example.test`;
    const dialog = await addEmail();
    await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill(added);
    const before = new Set(await env.files());
    assert.equal((await clickResponse(page, dialog.getByRole("button", { name: "Enviar código", exact: true }), "/api/me/login-methods")).status(), 202);
    const code = await env.code(added, before);
    assert.equal((await env.messages(email, before)).filter((item) => pickupCode(item.body)).length, 0);
    await fillOtp(page, code);
    const verified = page.waitForResponse((item) => /\/api\/me\/login-methods\/[^/]+\/verify$/.test(new URL(item.url()).pathname) && item.request().method() === "POST");
    await dialog.getByRole("button", { name: "Verificar", exact: true }).click();
    assert.equal((await verified).status(), 204);
    await dialog.waitFor({ state: "hidden" }); await visibleText(added);
    return "Agregó y verificó el correo con un solo código dirigido al método nuevo; el original no recibió OTP.";
  });
  await step("16", async () => {
    await confirmMethod(added, "Hacer principal");
    await page.getByRole("listitem").filter({ has: page.getByText(added, { exact: true }) }).getByText("Principal", { exact: true }).waitFor();
    return "El correo nuevo quedó principal sin pedir ni enviar código.";
  });
  await step("17", async () => {
    await confirmMethod(added, "Quitar");
    await page.getByText(added, { exact: true }).first().waitFor({ state: "detached" });
    await page.getByRole("listitem").filter({ has: page.getByText(email, { exact: true }) }).getByText("Principal", { exact: true }).waitFor();
    return "Quitó el correo sin código y el original volvió a quedar principal.";
  });
  await step("18", async () => {
    const dialog = await addEmail();
    await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill(businessEmail);
    const before = new Set(await env.files());
    await clickResponse(page, dialog.getByRole("button", { name: "Enviar código", exact: true }), "/api/me/login-methods");
    await dialog.getByText("Ese correo ya está asociado a otra cuenta.", { exact: true }).waitFor();
    assert.equal((await env.messages(businessEmail, before)).filter((item) => pickupCode(item.body)).length, 0);
    return "El diálogo explicó que el correo es de otra cuenta y no envió código.";
  });
  await step("19", async () => {
    await page.getByRole("dialog").getByRole("button", { name: "Cancelar", exact: true }).click(); await signOut();
    await page.goto(new URL("/recuperar", baseUrl).href);
    await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(`e2e-inexistente-${randomUUID()}@example.test`);
    await page.getByRole("button", { name: "Seguir", exact: true }).click();
    await visibleText("No hay una cuenta con ese correo.");
    return "La recuperación informó que no hay cuenta con ese correo.";
  });
  await step("20", async () => {
    await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(email);
    await page.getByRole("button", { name: "Seguir", exact: true }).click();
    await page.getByRole("textbox", { name: "Correo electrónico nuevo", exact: true }).fill(businessEmail);
    const response = await clickResponse(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/account-recovery/code");
    await expectRecoveryEmailInUse(page, response);
    return "La recuperación rechazó el correo nuevo ocupado con HTTP 400 Platform.AccountRecovery.MethodInUse, el mensaje del servicio asociado al campo y sin avanzar al código.";
  });
  await step("21", async () => {
    await page.goto(new URL("/login", baseUrl).href);
    await page.getByRole("textbox", { name: "Correo electrónico" }).fill("correo-mal-escrito");
    await page.getByRole("button", { name: "Enviar código", exact: true }).click();
    await visibleText("Ingresá un correo electrónico válido.");
    return "Mostró la validación de correo y conservó el formulario para corregirlo.";
  });
  await step("22", async () => {
    // La cuenta personal ya recorrió múltiples ingresos. La empresa propia permite comprobar
    // la espera entre códigos sin que la cuota de quince minutos tape ese error concreto.
    await page.goto(new URL("/login/empresa", baseUrl).href);
    validCode = await requestCode(page, businessEmail);
    const wrong = validCode === "000000" ? "111111" : "000000";
    const response = await verify(page, wrong);
    assert.equal(response.status(), 400);
    const problem = await response.json();
    assert.equal(problem.code, "Auth.LoginCode.Invalid");
    assert.equal(problem.attemptsLeft, 4);
    await waitCodeMessage(page, "El código no es válido.");
    await visibleText("Te quedan 4 intentos.");
    assert.equal(await page.getByRole("button", { name: "Verificar", exact: true }).isEnabled(), true);
    assert.equal(await page.getByRole("heading", { name: "No pudimos iniciar tu sesión", exact: true }).count(), 0);
    return "Explicó que el código no es válido y conservó la pantalla para corregir o reenviar.";
  });
  await step("23", async () => {
    await page.goto(new URL("/login/empresa", baseUrl).href);
    await page.getByRole("textbox", { name: "Correo electrónico" }).fill(businessEmail);
    const response = await clickResponse(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code");
    assert.equal(response.status(), 429);
    assert.equal((await response.json()).code, "Auth.LoginCode.ResendTooSoon");
    await waitCodeMessage(page, "Esperá un momento antes de pedir otro código.");
    return "La solicitud inmediata respondió 429 y mostró Esperá un momento antes de pedir otro código.";
  });
  await step("24", async () => {
    validCode = await requestCode(page, businessEmail);
    assert.equal((await env.command("login-code", { kind: "expire", email: businessEmail })).expired, true);
    const response = await verify(page, validCode);
    assert.equal(response.status(), 400);
    assert.equal((await response.json()).code, "Auth.LoginCode.Expired");
    await waitCodeMessage(page, "El código venció. Pedí uno nuevo.");
    await page.getByRole("button", { name: /Reenviar/ }).waitFor();
    return "La API rechazó el desafío real vencido y la pantalla ofreció pedir uno nuevo.";
  });
  const publication = async (publish) => {
    const response = page.waitForResponse((item) => new URL(item.url()).pathname === `/api/organization/public-page/${publish ? "publish" : "unpublish"}` && item.request().method() === "POST");
    await page.getByRole("switch", { name: `Visible en ${slug}.localtest.me:5174`, exact: true }).click();
    if (!publish) await page.getByRole("dialog").getByRole("button", { name: "Despublicar", exact: true }).click();
    assert.equal((await response).status(), 200);
    const control = page.getByRole("switch", { name: `Visible en ${slug}.localtest.me:5174`, exact: true });
    await page.waitForFunction((checked) => [...document.querySelectorAll('[role="switch"]')].some((item) => item.getAttribute("aria-checked") === String(checked)), publish);
    assert.equal(await control.isChecked(), publish);
  };
  await step("25", async () => {
    await login(businessEmail, "business");
    await page.goto(new URL("/org/pagina", baseUrl).href);
    await page.getByRole("textbox", { name: "Nombre de la página", exact: true }).fill(siteName);
    await page.getByRole("textbox", { name: "Descripción", exact: true }).fill("Página publicada durante el recorrido real de usuario.");
    assert.equal((await clickResponse(page, page.getByRole("button", { name: "Guardar cambios", exact: true }), "/api/organization/public-page", "PUT")).status(), 200);
    await page.getByRole("button", { name: "Guardar cambios", exact: true }).waitFor();
    await publication(true);
    await page.getByRole("link", { name: "Ver página", exact: true }).waitFor();
    return "El Dueño guardó su página y la publicó por UI con la versión actual.";
  });
  await signOut(page, organization);
  await step("26", async () => {
    await page.goto(baseUrl.href);
    await heading("Empresas en ArquitecturaBase");
    await page.getByRole("link", { name: new RegExp(`^${siteName}`) }).filter({ visible: true }).waitFor();
    return "La portada mostró la nueva publicación en Empresas en ArquitecturaBase.";
  });
  await step("27", async () => {
    await page.getByRole("link", { name: "Ver todas las empresas", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/empresas");
    const filtered = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname === "/api/directory" && url.searchParams.get("search") === siteName
        && response.request().method() === "GET";
    });
    await page.getByRole("searchbox", { name: "Buscar por nombre", exact: true }).fill(siteName);
    const response = await filtered;
    assert.equal(response.status(), 200);
    const directory = await response.json();
    assert.equal(directory.items.length, 1);
    assert.equal(directory.items[0].slug, slug);
    await page.waitForURL((url) => url.searchParams.get("search") === siteName);
    await page.getByRole("link", { name: new RegExp(`^${siteName}`) }).filter({ visible: true }).waitFor();
    return "Ver todas las empresas abrió el directorio y la búsqueda encontró la publicación.";
  });
  await step("28", async () => {
    const card = page.getByRole("link", { name: new RegExp(`^${siteName}`) }).filter({ visible: true });
    assert.equal(await card.getAttribute("href"), site.href);
    await card.click();
    await heading(siteName);
    assert.equal(new URL(page.url()).origin, site.origin);
    await page.getByRole("button", { name: "Ingresá para continuar", exact: true }).waitFor();
    return "La tarjeta abrió su subdominio publicado con Ingresá para continuar.";
  });
  await step("29", async () => {
    await page.getByRole("button", { name: "Ingresá para continuar", exact: true }).click();
    assert.equal(new URL(page.url()).origin, baseUrl.origin);
    assert.equal((await verify(page, await requestCode(page, email))).status(), 200);
    await page.waitForURL((url) => url.origin === site.origin && url.pathname === "/");
    await heading(siteName);
    await page.reload(); await heading(siteName);
    await page.getByRole("button", width === 390 ? { name: "Tu cuenta", exact: true } : { name: /, Personal$/ }).click();
    const accountLink = page.getByRole(width === 390 ? "link" : "menuitem", { name: "Mi cuenta", exact: true });
    await accountLink.waitFor();
    assert.equal(await accountLink.getAttribute("href"), new URL("/cuenta", baseUrl).href);
    return "El código volvió al subdominio; F5 conservó Personal y su menú con Mi cuenta en el dominio principal.";
  });
  await page.keyboard.press("Escape"); await signOut();
  // La publicación E7 aún está visible; E8 usa las mismas pestañas y sesiones.
  await runE8Journey({ page, platformPage, width, env, base: baseUrl, site, record, signOut, awaitApp, awaitPlatformHome: waitForPlatformHome, signal });
  await step("30", async () => {
    await login(businessEmail, "business");
    await page.goto(new URL("/org/pagina", baseUrl).href);
    await page.getByRole("switch", { name: `Visible en ${slug}.localtest.me:5174`, exact: true }).waitFor();
    await publication(false); await signOut(page, organization);
    await page.goto(site.href); await heading("Esta página no está disponible");
    assert.equal(await page.getByRole("link", { name: "Ir a ArquitecturaBase", exact: true }).getAttribute("href"), baseUrl.href);
    return "Tras despublicar por UI, el mismo subdominio mostró Esta página no está disponible y un regreso al inicio.";
  });
  // Salida real de la sesión de Plataforma, sin tocar cookies a mano entre recorridos.
  await platformPage.setViewportSize(viewport(1440)); await signOut(platformPage, "Plataforma");
  await platformPage.close(); await page.close();
}

export async function main({ build = true } = {}) {
  const started = Date.now();
  const date = journeyDate();
  const output = path.join(root, "docs/design/capturas/recorrido", date);
  await mkdir(output, { recursive: true });
  const steps = definitions.map(([id, title, expected]) => ({ id, title, expected }));
  steps.splice(29, 0, ...e8Definitions);
  const report = { date, stage: "Etapas 7 y 8", sourceRevision: e8SourceRevision, manual: e8ManualChecks, startedAtUtc: new Date(started).toISOString(), finished: false, cleanup: "pendiente", steps: steps.map((step) => ({ ...step, results: widths.map((width) => ({ width, status: "pending", actual: "Pendiente" })) })) };
  const persist = async () => {
    await writeFile(path.join(output, "resultados.json"), `${JSON.stringify(report, null, 2)}\n`);
    await writeFile(path.join(output, "index.html"), renderIndex(report));
  };
  await persist();
  let env;
  let context;
  let activeStep = "inicio del entorno";
  let interrupted = false;
  const cancellation = new AbortController();
  const interrupt = () => { interrupted = true; cancellation.abort(); };
  process.once("SIGINT", interrupt); process.once("SIGTERM", interrupt);
  try {
    await withCleanup(async () => {
      console.info("Inicia entorno E2E aislado.");
      env = await createEnvironment({ build });
      const savedCookies = await env.oldSession();
      context = await chromium.launchPersistentContext(path.join(env.directory, "perfil-browser"), {
        headless: true, ignoreHTTPSErrors: true, locale: "es-AR", viewport: viewport(1440),
      });
      await context.addCookies(savedCookies);
      assert.ok((await context.cookies(baseUrl.href)).some((cookie) => cookie.name === ".AspNetCore.Identity.Application"));
      console.info("Un contexto persistente listo con la sesión anterior guardada.");
      // La disponibilidad de /alive no visita una puerta ni altera la sesión guardada.
      for (let attempt = 0; ; attempt++) {
        try { if ((await context.request.get(new URL("/alive", baseUrl).href)).ok()) break; } catch { /* Vite puede arrancar después del setup. */ }
        if (attempt >= 120) throw new Error("El front real no respondió /alive.");
        await delay(500, undefined, { signal: cancellation.signal });
      }
      const record = async (id, width, getPage, action, diagnostic) => {
        if (interrupted) throw new Error("Recorrido interrumpido.");
        const entry = report.steps.find((step) => step.id === id);
        const result = entry.results.find((item) => item.width === width);
        activeStep = `${id} a ${width}`;
        console.info(`Paso ${activeStep}: ${entry.title}`);
        await recordedStep({ result, action, diagnostic, persist, capture: async () => {
          const page = getPage();
          await waitForTransientNotices(page);
          const image = `${id}-${width}.png`;
          await page.screenshot({ path: path.join(output, image), fullPage: true,
            animations: "disabled",
            maskColor: "#d9d4ca", mask: [page.locator('input[autocomplete="one-time-code"], [role="group"][aria-label="Código"] input')] });
          if (id === "12") result.extraImage = `${id}-plataforma-${width}.png`;
          return image;
        } });
        console.info(`PASÓ ${activeStep}`);
      };
      for (const width of widths) await runWidth({ width, context, env, record, output, signal: cancellation.signal });
      report.finished = true;
    }, [
      async () => { await context?.close(); },
      async () => { if (env) await env.stop(); report.cleanup = "apagado"; },
    ]);
  } catch (error) {
    const errors = error instanceof AggregateError ? error.errors : [error];
    report.failure = journeyFailure(activeStep, errors);
    console.error(report.failure);
    process.exitCode = 1;
  } finally {
    process.removeListener("SIGINT", interrupt); process.removeListener("SIGTERM", interrupt);
    report.finishedAtUtc = new Date().toISOString();
    report.durationMs = Date.now() - started;
    await persist();
    console.info(`Índice: ${path.join(output, "index.html")}`);
    const passed = report.steps.reduce((count, step) => count + step.results.filter((item) => item.status === "passed").length, 0);
    console.info(`Resultado: ${passed}/${report.steps.length * widths.length}; ${report.finished && report.cleanup === "apagado" ? "automatizado completo; manual pendiente" : "FALLÓ"}; entorno ${report.cleanup}.`);
  }
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.slice(2).every((argument) => argument === "--no-build"), "Uso: node scripts/recorrido-usuario.mjs [--no-build]");
  await main({ build: !process.argv.includes("--no-build") });
}
