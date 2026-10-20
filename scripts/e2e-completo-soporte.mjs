import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { completeOperatorFactor } from "./platform-factor-real.mjs";
import { sendWithCooldown } from "./recorrido-usuario-whatsapp.mjs";

export const viewports = [1440, 390];
export const viewportOf = (width) => ({ width, height: width === 390 ? 844 : 900 });
export const syntheticEmail = (prefix = "persona") => `e2e-completo-${prefix}-${randomUUID()}@example.test`;

export function localApiUrl(route, base) {
  const target = new URL(route, base);
  assert.equal(target.origin, base.origin, "Las comprobaciones HTTP sólo usan el origen aislado.");
  assert.ok(target.pathname.startsWith("/api/"), "Sólo se consulta la API aislada.");
  return target.href;
}

export function requireSyntheticEmail(email) {
  assert.match(email, /^[a-z0-9._+-]+@(?:[a-z0-9-]+\.)*example\.test$/i, "Sólo se permiten correos sintéticos.");
}

// Se observa el token que obtuvo la SPA por OIDC real. Nunca sale de esta memoria.
export function createBrowserSupport({ context, env, base, width }) {
  const tokens = new WeakMap();
  const observe = (page) => {
    page.setDefaultTimeout(15_000);
    page.setDefaultNavigationTimeout(45_000);
    page.on("request", (request) => {
      const url = new URL(request.url());
      const authorization = request.headers().authorization;
      if (url.origin === base.origin && url.pathname.startsWith("/api/") && authorization?.startsWith("Bearer ")) tokens.set(page, authorization);
    });
  };
  context.on("page", observe);
  for (const page of context.pages()) observe(page);
  const newPage = async () => {
    const page = await context.newPage();
    await page.setViewportSize(viewportOf(width));
    return page;
  };
  const api = async (page, route, options = {}) => {
    const authorization = tokens.get(page);
    assert.ok(authorization, "La SPA debe haber emitido una petición con su token OIDC real.");
    return page.request.fetch(localApiUrl(route, base), {
      ...options, headers: { ...options.headers, Authorization: authorization },
    });
  };
  const me = async (page) => {
    // El marco sólo se presenta después de que /api/me resuelve la sesión.
    const terms = page.getByRole("heading", { name: "Actualizamos los términos", exact: true });
    await terms.or(page.locator('nav[aria-label="Secciones"], button[aria-haspopup="menu"]')).filter({ visible: true }).first().waitFor();
    if (await terms.isVisible()) {
      await page.getByRole("checkbox", { name: /Leí y acepto/ }).check();
      await page.getByRole("button", { name: "Aceptar y seguir", exact: true }).click();
      await terms.waitFor({ state: "hidden" });
    }
    await page.waitForFunction(() => !!document.querySelector('nav[aria-label="Secciones"], button[aria-haspopup="menu"]'));
    const result = await api(page, "/api/me");
    assert.equal(result.status(), 200, "La cuenta debe tener una sesión real.");
    return result.json();
  };
  const code = async (page, email, buttonName, endpoint) => {
    requireSyntheticEmail(email);
    const before = new Set(await env.files());
    const response = await sendWithCooldown(async () => {
      const sent = page.waitForResponse((reply) => new URL(reply.url()).pathname === endpoint && reply.request().method() === "POST", { timeout: 90_000 });
      void sent.catch(() => {});
      await page.getByRole("button", { name: buttonName, exact: true }).click({ timeout: 90_000 });
      return sent;
    });
    assert.ok(response.ok(), `El envío del código debe responder 2xx; respondió ${response.status()}.`);
    await page.getByRole("heading", { name: "Revisá tu correo", exact: true }).waitFor();
    await fillOtp(page, await env.code(email, before));
  };
  const login = async (page, email, access = "consumer") => {
    requireSyntheticEmail(email);
    const route = { consumer: "/login", business: "/login/empresa", platform: "/plataforma" }[access];
    assert.ok(route, "Acceso admitido.");
    await page.goto(new URL(route, base).href);
    await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(email);
    await code(page, email, "Enviar código", "/api/auth/login-code");
    await page.getByRole("button", { name: "Verificar", exact: true }).click();
    if (access === "platform") await completeOperatorFactor(page, email);
    await page.waitForURL((url) => !["/login", "/login/empresa", "/auth/callback"].includes(url.pathname));
    return me(page);
  };
  const signOut = async (page) => {
    // El menú de escritorio también existe en la app de teléfono al ampliar la ventana.
    const original = page.viewportSize();
    await page.setViewportSize(viewportOf(1440));
    try {
      const notice = page.getByRole("dialog", { name: "Antes de tu primera consulta", exact: true });
      if (await notice.isVisible()) {
        await notice.getByRole("button", { name: "Entendido", exact: true }).click();
        await notice.waitFor({ state: "hidden" });
      }
      const menu = page.getByRole("button", { name: /, (Personal|Plataforma|.+)$/ }).filter({ visible: true }).last();
      await menu.click();
      await page.getByRole("menuitem", { name: "Salir", exact: true }).click();
      await page.getByRole("link", { name: "Ingresá", exact: true }).filter({ visible: true }).first().waitFor();
      tokens.delete(page);
    } finally { await page.setViewportSize(original); }
  };
  const registerPerson = async (page) => {
    const email = syntheticEmail();
    await page.goto(new URL("/registro", base).href);
    await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
    await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(email);
    await code(page, email, "Crear cuenta", "/api/auth/signup");
    await page.getByRole("button", { name: "Verificar y crear la cuenta", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/");
    return { email, me: await me(page) };
  };
  const registerBusiness = async (page) => {
    const email = syntheticEmail("empresa");
    const organization = `Prueba integral ${width} ${randomUUID().slice(0, 8)}`;
    const companyName = `${organization} Centro`;
    const slug = `integral-${width}-${randomUUID().slice(0, 8)}`;
    await page.goto(new URL("/registro/empresa", base).href);
    await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
    await page.getByRole("textbox", { name: "Tu correo electrónico", exact: true }).fill(email);
    await code(page, email, "Continuar", "/api/auth/business-signup/code");
    await page.getByRole("button", { name: "Verificar", exact: true }).click();
    await page.getByRole("heading", { name: "Tu organización", exact: true }).waitFor();
    await page.getByRole("textbox", { name: "Nombre de la organización", exact: true }).fill(organization);
    await page.getByRole("textbox", { name: /Dirección de tu página/ }).fill(slug);
    await page.getByRole("textbox", { name: "Primera empresa", exact: true }).fill(companyName);
    await page.getByText("Disponible", { exact: true }).waitFor();
    const created = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/auth/business-signup" && response.request().method() === "POST");
    await page.getByRole("button", { name: "Crear organización", exact: true }).click();
    assert.equal((await created).status(), 200, "El alta de la organización debe responder 200.");
    await page.getByRole("button", { name: `Entrar a ${organization}`, exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/org");
    return { email, organization, organizationName: organization, slug, companyName, me: await me(page) };
  };
  return { newPage, api, login, signOut, registerPerson, registerBusiness, me };
}
