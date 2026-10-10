import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { reloadResponse, responsesForAction, safeActionErrorKind } from "./test-e2e-real-whatsapp-action.mjs";
import { decideAfterRecoveryNotice, recoveryRow, selectRecovery } from "./test-e2e-real-whatsapp-recovery.mjs";

export const e8SourceRevision = "a306c35fd27294eacf2c967e41121e91d2ffdce0";
export const e8ManualChecks = [
  "Google: completar el ingreso con una cuenta del proveedor; el recorrido sólo verifica el destino OAuth.",
  "WhatsApp real: recibir y copiar el OTP de ingreso y de Agregar WhatsApp en el teléfono.",
  "WhatsApp real: escribir Hola y tocar Entrar en la respuesta del bot; el webhook y el outbox de prueba no certifican Meta.",
  "WhatsApp real: recibir el aviso de recuperación aprobada en el método nuevo y verificar delivered en Meta.",
];

const definition = (id, title, expected, extra = {}) => ({ id: `E8-${id}`, title: `E8 · ${title}`, expected, ...extra });
const source = (guion, paso, route, controlled = false) => ({ guion, paso, route, controlled });
export const e8Definitions = [
  definition("01", "Preparar una cuenta Phone por UI", "Registro por WhatsApp y OTP controlado crean una persona sin nombre, sin correo y con Phone principal.", { controlled: true }),
  definition("02", "Ingresar por WhatsApp · enviar", "Elige WhatsApp y envía un código a su número; el país viene de la API.", source("ingresar-por-whatsapp", 1, "/login")),
  definition("03", "Ingresar por WhatsApp · código", "La pantalla pide el OTP; se lee del outbox real por control privado, sin certificar entrega al celular.", source("ingresar-por-whatsapp", 2, "—", true)),
  definition("04", "Ingresar por WhatsApp · verificar", "El OTP verifica posesión antes de iniciar la autorización OIDC.", source("ingresar-por-whatsapp", 3, "/login")),
  definition("05", "Ingresar por WhatsApp · sesión", "OIDC usa state y PKCE actuales, acceso consumer y retorno propio.", source("ingresar-por-whatsapp", 4, "/auth/callback")),
  definition("06", "Ingresar por WhatsApp · Personal", "Personal y F5 conservan el acceso, en el mismo contexto que Plataforma.", source("ingresar-por-whatsapp", 5, "/")),
  definition("07", "Agregar WhatsApp · abrir", "Mi cuenta ofrece Agregar correo o teléfono.", source("agregar-un-whatsapp", 1, "/cuenta")),
  definition("08", "Agregar WhatsApp · enviar", "WhatsApp y el número nuevo envían el código sólo al nuevo método.", source("agregar-un-whatsapp", 2, "/cuenta")),
  definition("09", "Agregar WhatsApp · código", "OTP controlado del nuevo Phone; la captura oculta las casillas y no representa WhatsApp real.", source("agregar-un-whatsapp", 3, "—", true)),
  definition("10", "Agregar WhatsApp · verificar", "Verificar agrega el Phone real; F5 lo conserva en Cómo entrás.", source("agregar-un-whatsapp", 4, "/cuenta")),
  definition("11", "Principal y quitar sin otro OTP", "Hacer principal y Quitar confirman sin pedir ni enviar código adicional, según ADR0045."),
  definition("12", "Phone con correo de respaldo", "Email verificado de respaldo no desplaza Phone principal: Me, menú/lateral o Más/barra usan la máscara literal y avatar con raya.", { milestones: ["N3"], controlled: true }),
  definition("13", "Registro existente → ingreso Persona", "Registro ocupado conserva Phone en memoria al ir a Ingresar; OTP fijo abre consumer en / sin teléfono en URL/storage.", { milestones: ["A1"], controlled: true }),
  definition("14", "Bot · respuesta controlada", "Webhook firmado y deduplicado procesa Hola y devuelve el enlace del outbox real; Meta queda manual.", source("el-bot-y-su-enlace", 1, "—", true)),
  definition("15", "Bot · vista previa", "La vista previa limpia el fragmento y ofrece Continuar sin iniciar OIDC ni canjear el ticket.", source("el-bot-y-su-enlace", 2, "/login/enlace")),
  definition("16", "Bot · sesión", "Sólo Continuar canjea el ticket e inicia OIDC con state/PKCE actuales.", source("el-bot-y-su-enlace", 3, "/login/enlace")),
  definition("17", "Bot · Personal", "Personal y F5 conservan la sesión; el enlace usado se rechaza al volver a abrirlo.", source("el-bot-y-su-enlace", 4, "/")),
  definition("18", "Menú público con Phone principal", "La publicación E7 conserva la sesión Personal tras F5 y muestra la máscara recibida sin usar el correo de respaldo.", { milestones: ["N3"] }),
  definition("19", "Cuentas y ficha con Phone principal", "Plataforma ya abierta identifica lista, acciones y ficha por la máscara principal; F5 conserva Phone y Email de respaldo verificado.", { milestones: ["N2"] }),
  definition("20", "Pedir recuperación Phone", "Recuperar verifica el método nuevo por OTP controlado y registra un pedido Pending por UI.", { controlled: true }),
  definition("21", "Recuperación · abrir pedido", "Se correlaciona el pedido por métodos tapados y se abre el formulario Pending con su versión original.", source("atender-una-recuperacion", 1, "/plataforma/recuperaciones")),
  definition("22", "Recuperación · aviso y aprobación", "El aviso real y su repetición no cambian la versión leída; una aprobación UI usa esa versión y F5 conserva Approved.", { ...source("atender-una-recuperacion", 2, "/plataforma/recuperaciones"), milestones: ["N1"] }),
  definition("23", "Recuperación · volver a ingresar", "El nuevo Phone ingresa a la cuenta recuperada; recibir el aviso en WhatsApp real queda manual.", source("atender-una-recuperacion", 3, "—", true)),
  definition("24", "Alta empresarial Phone por UI", "OTP controlado y creación de organización por UI llevan a /org sin certificar bienvenida E8b.", { controlled: true }),
  definition("25", "Registro existente → ingreso Empresa", "Ingresá como empresa conserva Phone en memoria; OTP fija business y /org, conserva máscara en Me/marco/F5 y no expone Phone en URL/storage.", { milestones: ["A1", "N3"], controlled: true }),
];

/** El transporte se adapta sólo cuando Back publique control para la misma BD y sesión E7. */
export function requireE8Control(env) {
  assert.equal(typeof env.whatsapp?.begin, "function", "Falta soporte privado WhatsApp publicado para el mismo entorno del recorrido.");
  return env.whatsapp.begin;
}

/** Espera sólo el cooldown declarado; otros límites y errores siguen siendo fallos. */
export async function sendWithCooldown(send, { signal, wait = (milliseconds) => delay(milliseconds, undefined, { signal }) } = {}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const reply = await send();
    if (reply.status() === 202) return reply;
    assert.equal(reply.status(), 429);
    const problem = await reply.json();
    assert.equal(problem.code, "Auth.LoginCode.ResendTooSoon");
    assert.ok(Number.isInteger(problem.retryAfter) && problem.retryAfter > 0, "El cooldown debe informar RetryAfter positivo.");
    if (attempt === 4) throw new Error("El envío sigue en cooldown después de cinco intentos.");
    await wait(problem.retryAfter * 1000);
  }
}

/** No crea navegador/contexto ni limpia cookies: continúa las pestañas reales de E7. */
export async function runE8Journey({ page, platformPage, width, env, base, site, record, signOut, awaitApp, signal }) {
  const begin = requireE8Control(env);
  const phone = width === 1440 ? "+5491134567880" : "+5491134567881";
  const next = width === 1440 ? "+5491134567882" : "+5491134567883";
  const recovered = width === 1440 ? "+5491134567886" : "+5491134567887";
  const businessPhone = width === 1440 ? "+5491134567891" : "+5491134567892";
  const backupEmail = `e8-backup-${width}@example.test`;
  const org = `Recorrido WhatsApp ${width} ${randomUUID().slice(0, 8)}`;
  const calls = []; const authorizations = [];
  const onRequest = (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/")) calls.push({ path: url.pathname, method: request.method() });
    if (url.pathname === "/connect/authorize") authorizations.push({ state: !!url.searchParams.get("state"),
      pkce: !!url.searchParams.get("code_challenge"), method: url.searchParams.get("code_challenge_method"), access: url.searchParams.get("access") });
  };
  page.on("request", onRequest);
  const step = (id, action, target = page) => record(`E8-${id}`, width, () => target, action,
    (error) => `Ruta ${new URL(target.url()).pathname}; tipo ${safeActionErrorKind(error)}. Las pruebas privadas se omiten.`);
  const url = (route) => new URL(route, base).href;
  const heading = (text, target = page) => target.getByRole("heading", { name: text, exact: true }).waitFor();
  const responseFor = (endpoint, method = "GET") => (reply) => new URL(reply.url()).pathname === endpoint && reply.request().method() === method;
  const click = async (target, button, endpoint, status, method = "POST") => {
    const action = async () => (await responsesForAction(target, [responseFor(endpoint, method)], () => button.click()))[0];
    const reply = status === 202 ? await sendWithCooldown(action, { signal }) : await action();
    assert.equal(reply.status(), status); return reply;
  };
  const channel = async (target, destination, label = /^(Tu )?número de WhatsApp$/i) => {
    await target.getByRole("button", { name: "WhatsApp", exact: true }).click();
    await target.getByRole("textbox", { name: label }).fill(destination);
  };
  const assertOidc = (since, access = "consumer") => {
    assert.ok(authorizations.length > since);
    const current = authorizations.at(-1);
    assert.equal(current.state, true); assert.equal(current.pkce, true); assert.equal(current.method, "S256"); assert.equal(current.access, access);
  };
  const login = async (destination, scenario) => {
    const fixture = await begin(scenario, destination);
    await page.goto(url("/login")); await channel(page, destination);
    await click(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code", 202);
    await heading("Revisá tu WhatsApp"); await fillOtp(page, (await fixture("code")).proof);
    await click(page, page.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/login-code/verify", 200);
    await awaitApp(page);
  };
  const muted = async (scope) => {
    const avatar = scope.locator("[data-slot='avatar']").first(); await avatar.waitFor();
    assert.equal(await avatar.textContent(), "—");
    assert.ok((await avatar.getAttribute("class")).split(/\s+/).includes("bg-[var(--s3)]"));
  };
  const identity = async (destination, access = "consumer", organization = "Personal") => {
    await page.goto(url("/"));
    const reply = await reloadResponse(page, responseFor("/api/me")); assert.equal(reply.status(), 200);
    const me = await reply.json(); assert.equal(me.displayName, null); assert.equal(me.access, access);
    assert.ok(typeof me.maskedPrimaryPhone === "string" && me.maskedPrimaryPhone.endsWith(destination.slice(-4)));
    const mask = me.maskedPrimaryPhone;
    if (width === 390) {
      await page.getByRole("navigation", { name: "Secciones" }).getByRole("link", { name: "Más", exact: true }).click();
      await page.getByRole("main").getByText(mask, { exact: true }).waitFor();
      await muted(page.getByRole("main")); await muted(page.getByRole("link", { name: "Más", exact: true }));
      assert.equal(await page.getByRole("main").getByText(backupEmail, { exact: true }).count(), 0);
    } else {
      const trigger = page.getByRole("button", { name: `${mask}, ${organization}`, exact: true }); await trigger.waitFor(); await muted(trigger);
      const sidebar = page.getByRole("complementary", { name: "Navegación principal" }); await sidebar.getByText(mask, { exact: true }).waitFor(); await muted(sidebar);
      assert.equal(await sidebar.getByText(backupEmail, { exact: true }).count(), 0);
      await trigger.click(); const menu = page.getByRole("menu"); await menu.getByText(mask, { exact: true }).waitFor(); await muted(menu);
      assert.equal(await menu.getByText(backupEmail, { exact: true }).count(), 0);
      await page.keyboard.press("Escape"); await menu.waitFor({ state: "hidden" });
    }
    return { id: me.id, mask };
  };
  const registrationLogin = async (destination, access, organization = "Personal") => {
    const fixture = await begin(`walkthrough-a1-${access}-${width}`, destination);
    const digits = destination.replace(/\D/g, ""); let leaked = false;
    const inspect = (request) => {
      const current = new URL(request.url());
      leaked ||= [current.pathname, current.hash, ...current.searchParams.values()].some((value) => value.replace(/\D/g, "").includes(digits));
    };
    page.on("request", inspect);
    try {
      const since = authorizations.length;
      await page.goto(url(access === "consumer" ? "/registro" : "/registro/empresa")); await channel(page, destination);
      if (access === "consumer") {
        await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
        const occupied = await click(page, page.getByRole("button", { name: "Crear cuenta", exact: true }), "/api/auth/signup", 400);
        assert.equal((await occupied.json()).code, "Auth.Signup.PhoneTaken");
      }
      await page.getByRole("link", { name: access === "consumer" ? "Ingresar" : "Ingresá como empresa", exact: true }).click();
      const door = access === "consumer" ? "/login" : "/login/empresa";
      await page.waitForURL((current) => current.pathname === door && current.search === "" && current.hash === "");
      assert.ok((await page.getByRole("textbox", { name: /número de WhatsApp$/i }).inputValue()).replace(/\D/g, "").endsWith(destination.slice(-4)));
      assert.equal(authorizations.length, since);
      await click(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code", 202);
      await fillOtp(page, (await fixture("code")).proof);
      const verified = await click(page, page.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/login-code/verify", 200);
      const request = verified.request().postDataJSON(); const route = access === "consumer" ? "/" : "/org";
      assert.equal(request.returnUrl, route); assert.equal(request.access, access); assert.equal(request.channel, "whatsapp"); assert.equal(request.email, undefined);
      await awaitApp(page, organization, route); assertOidc(since, access); await page.reload(); await awaitApp(page, organization, route);
      const stored = await page.evaluate((number) => [localStorage, sessionStorage].some((storage) => Object.keys(storage)
        .some((key) => `${key}${storage.getItem(key) ?? ""}`.replace(/\D/g, "").includes(number))), digits);
      assert.equal(stored, false); assert.equal(leaked, false);
    } finally { page.off("request", inspect); }
  };
  let fixture; let proof; let since; let methodId; let me; let link; let pending;
  try {
    await step("01", async () => {
      fixture = await begin(`walkthrough-signup-${width}`, phone);
      await page.goto(url("/registro")); await channel(page, phone);
      await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
      await click(page, page.getByRole("button", { name: "Crear cuenta", exact: true }), "/api/auth/signup", 202);
      await fillOtp(page, (await fixture("code")).proof);
      await click(page, page.getByRole("button", { name: "Verificar y crear la cuenta", exact: true }), "/api/auth/signup/verify", 204);
      await awaitApp(page); await signOut(); return "Cuenta Phone creada por UI/OTP controlado; sin envío Meta.";
    });
    await step("02", async () => {
      fixture = await begin(`walkthrough-login-${width}`, phone); since = authorizations.length;
      const [methods] = await responsesForAction(page, [responseFor("/api/auth/methods")], () => page.goto(url("/login")));
      assert.equal(methods.status(), 200);
      const countries = (await methods.json()).channels.find((item) => item.key === "whatsapp")?.countries;
      assert.ok(countries?.length); await channel(page, phone);
      const sent = await click(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code", 202);
      assert.ok(countries.includes(sent.request().postDataJSON().phone.country));
      await heading("Revisá tu WhatsApp"); assert.equal(authorizations.length, since); return "Eligió WhatsApp con país permitido por la API y pidió el código antes de OIDC.";
    });
    await step("03", async () => { proof = (await fixture("code")).proof; assert.match(proof, /^\d{6}$/); return "OTP controlado: leído del outbox real por canal privado. Celular/Meta pendiente."; });
    await step("04", async () => {
      await fillOtp(page, proof); proof = undefined;
      await click(page, page.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/login-code/verify", 200);
      await awaitApp(page);
      return "Verificó el OTP por UI; ninguna prueba privada se publica.";
    });
    await step("05", async () => { await awaitApp(page); assertOidc(since); return "Terminó OIDC consumer con state/PKCE actuales y retorno propio."; });
    await step("06", async () => { await page.reload(); await awaitApp(page); await platformPage.reload(); await heading("Organizaciones", platformPage); return "F5 conservó Personal y la pestaña independiente de Plataforma."; });
    await step("07", async () => { await page.goto(url("/cuenta")); await heading("Mi cuenta"); await page.getByRole("button", { name: "Agregar correo o teléfono", exact: true }).click(); return "Abrió Agregar correo o teléfono en Mi cuenta."; });
    await step("08", async () => {
      fixture = await begin(`walkthrough-add-${width}`, next); const dialog = page.getByRole("dialog");
      await channel(dialog, next, "Número");
      methodId = (await (await click(page, dialog.getByRole("button", { name: "Enviar código", exact: true }), "/api/me/login-methods", 202)).json()).methodId;
      return "El envío creó un método pendiente para el nuevo Phone.";
    });
    await step("09", async () => { proof = (await fixture("code")).proof; assert.match(proof, /^\d{6}$/); return "OTP controlado del método nuevo. La recepción en WhatsApp real queda manual."; });
    await step("10", async () => {
      const dialog = page.getByRole("dialog"); await fillOtp(dialog, proof); proof = undefined;
      await click(page, dialog.getByRole("button", { name: "Verificar", exact: true }), `/api/me/login-methods/${methodId}/verify`, 204);
      await dialog.waitFor({ state: "hidden" }); await page.reload();
      await page.getByRole("button", { name: new RegExp(`^Acciones de.*${next.slice(-4)}`) }).waitFor(); return "Verificó el nuevo método y F5 lo conservó.";
    });
    await step("11", async () => {
      const start = calls.length;
      for (const [action, endpoint, method] of [["Hacer principal", `/api/me/login-methods/${methodId}/primary`, "PUT"], ["Quitar", `/api/me/login-methods/${methodId}`, "DELETE"]]) {
        await page.getByRole("button", { name: new RegExp(`^Acciones de.*${next.slice(-4)}`) }).click();
        await page.getByRole("menuitem", { name: action, exact: true }).click(); const dialog = page.getByRole("dialog");
        assert.equal(await dialog.getByRole("group", { name: "Código" }).count(), 0);
        await click(page, dialog.getByRole("button", { name: action, exact: true }), endpoint, 204, method);
        await dialog.waitFor({ state: "hidden" });
      }
      assert.equal(calls.slice(start).filter((call) => call.method === "POST" && /login-code|\/code$/.test(call.path)).length, 0);
      return "Principal y Quitar confirmaron sin solicitar OTP adicional.";
    });
    await step("12", async () => {
      const before = new Set(await env.files());
      await page.getByRole("button", { name: "Agregar correo o teléfono", exact: true }).click(); const dialog = page.getByRole("dialog");
      await dialog.getByRole("button", { name: "Correo", exact: true }).click(); await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill(backupEmail);
      const method = (await (await click(page, dialog.getByRole("button", { name: "Enviar código", exact: true }), "/api/me/login-methods", 202)).json()).methodId;
      await fillOtp(dialog, await env.code(backupEmail, before));
      await click(page, dialog.getByRole("button", { name: "Verificar", exact: true }), `/api/me/login-methods/${method}/verify`, 204);
      await dialog.waitFor({ state: "hidden" });
      const reply = await reloadResponse(page, responseFor("/api/me/login-methods")); assert.equal(reply.status(), 200); const { methods } = await reply.json();
      assert.ok(methods.some((item) => item.id === method && item.type === "Email" && item.value === backupEmail && item.isVerified && !item.isPrimary));
      assert.ok(methods.some((item) => item.type === "Phone" && item.value === phone && item.isVerified && item.isPrimary));
      me = await identity(phone); return "Email de respaldo verificado por pickup; Phone principal identifica Me y menú/marco/Más tras F5.";
    });
    await signOut();
    await step("13", async () => { await registrationLogin(phone, "consumer"); return "Registro ocupado → Ingresar conservó Phone en memoria; OTP/OIDC consumer y F5, sin Phone en URL/storage."; });
    await signOut();
    await step("14", async () => {
      fixture = await begin(`walkthrough-bot-${width}`, phone);
      for (let repeat = 0; repeat < 2; repeat++) assert.equal((await fixture("inbound")).status, 200);
      assert.equal((await fixture("events")).events.filter((item) => item.direction === "Inbound").length, 1);
      link = (await fixture("bot")).proof;
      assert.deepEqual((await fixture("events")).events.filter((item) => item.direction === "Inbound"), [{ kind: "Text", direction: "Inbound", status: "Processed", processed: true }]);
      return "Hola firmado/deduplicado y bot reales; enlace leído en privado. Respuesta en WhatsApp real pendiente.";
    });
    await step("15", async () => {
      since = authorizations.length; const start = calls.length; await page.goto(link);
      await page.getByRole("button", { name: "Continuar", exact: true }).waitFor();
      assert.equal(new URL(page.url()).hash, ""); assert.equal(authorizations.length, since);
      assert.equal(calls.slice(start).filter((call) => call.path === "/api/auth/login-link/redeem").length, 0);
      return "Vista previa limpió fragmento y esperó Continuar sin canje ni OIDC.";
    });
    await step("16", async () => {
      await click(page, page.getByRole("button", { name: "Continuar", exact: true }), "/api/auth/login-link/redeem", 200);
      await awaitApp(page); assertOidc(since); return "Continuar canjeó el ticket e inició OIDC consumer actual.";
    });
    await step("17", async () => {
      await page.reload(); await awaitApp(page); await signOut(); const start = authorizations.length;
      await page.goto(link); await heading("Este enlace ya no sirve"); assert.equal(authorizations.length, start);
      await login(phone, `walkthrough-site-login-${width}`); return "F5 conservó Personal; reutilizar el enlace falló sin OIDC; volvió a entrar por UI.";
    });
    await step("18", async () => {
      await page.goto(site.href); await page.reload();
      const trigger = page.getByRole("button", width === 390 ? { name: "Tu cuenta", exact: true } : { name: `${me.mask}, Personal`, exact: true });
      await trigger.waitFor(); if (width !== 390) await muted(trigger); await trigger.click();
      const scope = page.getByRole(width === 390 ? "dialog" : "menu"); await scope.getByText(me.mask, { exact: true }).waitFor(); await muted(scope);
      assert.equal(await scope.getByText(backupEmail, { exact: true }).count(), 0); await page.keyboard.press("Escape");
      return "Publicación y F5 conservaron Personal, máscara literal y raya; el respaldo no reemplazó la identidad.";
    });
    await step("19", async () => {
      await platformPage.goto(url("/plataforma/cuentas")); await heading("Cuentas", platformPage);
      const [reply] = await responsesForAction(platformPage, [(response) => responseFor("/api/platform/accounts/paged")(response) && new URL(response.url()).searchParams.get("search") === phone],
        () => platformPage.getByRole("searchbox", { name: "Buscar por nombre, correo o teléfono", exact: true }).fill(phone));
      assert.equal(reply.status(), 200); const item = (await reply.json()).items.find((account) => account.id === me.id);
      assert.equal(item?.displayName, null); assert.equal(item.maskedPrimaryPhone, me.mask);
      const link = platformPage.getByRole("link").and(platformPage.locator(`a[href='/plataforma/cuentas/${me.id}']`));
      const row = platformPage.getByRole(width === 390 ? "listitem" : "row").filter({ has: link }); await row.getByText(me.mask, { exact: true }).waitFor();
      await row.getByRole("button", { name: `Acciones de ${me.mask}`, exact: true }).waitFor(); assert.equal(await row.getByText(backupEmail, { exact: true }).count(), 0);
      const endpoint = `/api/platform/accounts/${me.id}`;
      const [detail] = await responsesForAction(platformPage, [responseFor(endpoint)], () => link.click()); assert.equal(detail.status(), 200);
      const account = await detail.json(); assert.equal(account.maskedPrimaryPhone, me.mask);
      assert.ok(account.loginMethods.some((method) => method.type === "Phone" && method.isPrimary && method.maskedValue === me.mask));
      const backup = account.loginMethods.find((method) => method.type === "Email" && !method.isPrimary);
      assert.ok(backup?.verifiedAtUtc && backup.canSignIn);
      await platformPage.getByRole("list", { name: "Métodos de ingreso", exact: true }).getByText(backup.maskedValue, { exact: true }).waitFor();
      const persisted = await reloadResponse(platformPage, responseFor(endpoint)); assert.equal(persisted.status(), 200);
      assert.equal((await persisted.json()).maskedPrimaryPhone, me.mask); await heading(me.mask, platformPage);
      return "Lista, acciones y ficha reales usan la máscara principal; F5 conserva Phone y respaldo Email verificado.";
    }, platformPage);
    await page.goto(url("/")); await awaitApp(page); await signOut();
    await step("20", async () => {
      fixture = await begin(`walkthrough-recovery-${width}`, recovered);
      await page.goto(url("/recuperar")); await channel(page, phone, /Número de WhatsApp$/);
      await click(page, page.getByRole("button", { name: "Seguir", exact: true }), "/api/account-recovery/preview", 204);
      await heading("¿Dónde te escribimos?"); await channel(page, recovered, /Número de WhatsApp nuevo$/);
      await click(page, page.getByRole("button", { name: "Enviar código", exact: true }), "/api/account-recovery/code", 202);
      await heading("Revisá tu WhatsApp"); await fillOtp(page, (await fixture("code")).proof);
      const replies = await responsesForAction(page, [responseFor("/api/account-recovery/verify", "POST"), responseFor("/api/account-recovery", "POST")], () => page.getByRole("button", { name: "Verificar", exact: true }).click());
      assert.equal(replies[0].status(), 204); assert.equal(replies[1].status(), 202); await heading("Recibimos tu pedido");
      return "Pedido de recuperación Phone registrado por UI y OTP controlado del método nuevo.";
    });
    await step("21", async () => {
      let [reply] = await responsesForAction(platformPage, [responseFor("/api/platform/recoveries/paged")], () => platformPage.goto(url("/plataforma/recuperaciones")));
      await heading("Recuperaciones", platformPage);
      if (width !== 390) [reply] = await responsesForAction(platformPage, [(response) => responseFor("/api/platform/recoveries/paged")(response) && new URL(response.url()).searchParams.get("search") === recovered],
        () => platformPage.getByRole("searchbox", { name: "Buscar por cuenta, correo o teléfono" }).fill(recovered));
      assert.equal(reply.status(), 200); pending = selectRecovery((await reply.json()).items, phone, recovered); assert.equal(pending.status, "Pending");
      await recoveryRow(platformPage, pending).getByRole("button", { name: /^Acciones de/ }).click();
      await platformPage.getByRole("menuitem", { name: "Revisar", exact: true }).click();
      await platformPage.getByRole("dialog", { name: "Revisar el pedido", exact: true }).getByRole("textbox", { name: /Motivo/ }).fill("Verificación humana del recorrido aislado.");
      return "Abrió Pending y completó el motivo con la versión del GET original.";
    }, platformPage);
    await step("22", async () => {
      const endpoint = `/api/platform/recoveries/${pending.id}/approve`; let decisions = 0;
      const count = (request) => { if (new URL(request.url()).pathname === endpoint && request.method() === "POST") decisions++; };
      platformPage.on("request", count);
      try {
        await decideAfterRecoveryNotice(fixture, pending, async (version) => {
          const reply = await click(platformPage, platformPage.getByRole("dialog").getByRole("button", { name: "Aprobar", exact: true }), endpoint, 200);
          assert.equal(reply.request().postDataJSON().version, version); assert.equal(decisions, 1);
        });
      } finally { platformPage.off("request", count); }
      await platformPage.getByRole("dialog").waitFor({ state: "hidden" });
      const persisted = await reloadResponse(platformPage, responseFor("/api/platform/recoveries/paged")); assert.equal(persisted.status(), 200);
      const resolved = (await persisted.json()).items.find((item) => item.id === pending.id); assert.equal(resolved?.status, "Approved");
      await recoveryRow(platformPage, resolved).getByText("Aprobado", { exact: true }).waitFor();
      return "Aviso real/repetición sin duplicado ni rebase; un POST usó la versión original y F5 conservó Approved.";
    }, platformPage);
    await step("23", async () => { await login(recovered, `walkthrough-recovered-login-${width}`); await page.reload(); await awaitApp(page); await signOut(); return "El método nuevo ingresó por OTP controlado y F5; la entrega del aviso real no se certifica."; });
    await step("24", async () => {
      fixture = await begin(`walkthrough-business-signup-${width}`, businessPhone);
      await page.goto(url("/registro/empresa")); await channel(page, businessPhone);
      await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
      await click(page, page.getByRole("button", { name: "Continuar", exact: true }), "/api/auth/business-signup/code", 202);
      await fillOtp(page, (await fixture("code")).proof);
      await click(page, page.getByRole("button", { name: "Verificar", exact: true }), "/api/auth/business-signup/verify", 204);
      await heading("Tu organización"); await page.getByRole("textbox", { name: "Nombre de la organización" }).fill(org);
      await page.getByRole("textbox", { name: /Dirección de tu página/ }).fill(`recorrido-wa-${width}-${randomUUID().slice(0, 8)}`);
      await page.getByRole("textbox", { name: "Primera empresa" }).fill(`${org} Centro`);
      await page.getByText("Disponible", { exact: true }).waitFor();
      await click(page, page.getByRole("button", { name: "Crear organización", exact: true }), "/api/auth/business-signup", 200);
      await page.getByRole("button", { name: `Entrar a ${org}`, exact: true }).click(); await awaitApp(page, org, "/org"); await signOut(page, org);
      return "Alta empresarial Phone y organización por UI/OTP controlado; bienvenida E8b fuera del alcance.";
    });
    await step("25", async () => { await registrationLogin(businessPhone, "business", org); await identity(businessPhone, "business", org); await signOut(page, org); return "Empresa existente ingresó por Phone: business /org, OIDC actual, máscara en marco/F5 y sin Phone en URL/storage."; });
    await platformPage.goto(url("/plataforma")); await heading("Organizaciones", platformPage);
  } finally { proof = undefined; link = undefined; page.off("request", onRequest); }
}
