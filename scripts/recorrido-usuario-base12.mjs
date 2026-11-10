import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { acceptAssistantNoticeFromHome } from "./assistant-real-ui.mjs";
import { sideScroll, viewports } from "./capturar-etapa.mjs";
import { checkByLabel } from "./platform-factor-real.mjs";
import { nationalPhone } from "./recorrido-usuario-e11.mjs";
import { sendWithCooldown } from "./recorrido-usuario-whatsapp.mjs";
import { fillOtp, openPlatformAccountSearch } from "./test-e2e-real-ui.mjs";
import { plainTextBody } from "./test-e2e-real-mail.mjs";
import { responsesForAction } from "./test-e2e-real-whatsapp-action.mjs";

// Base de la 12 en el recorrido de usuario (I4 del plan 2026-11-08-etapa-base-de-la-12): la campana de los tres accesos,
// una tabla, una fecha y un botón por área, un link del otro acceso, dar de baja y reactivar, borrar la cuenta propia,
// «Cargar teléfonos» con su casilla y una pantalla de cada área a 320. Va al final, después de la E9, en las mismas
// pestañas: arranca y termina con la persona afuera y el operador del recorrido en Plataforma.
// El aviso de la persona y el de la organización (`personalLoginMethod`) los recibe una cuenta que nace de una invitación,
// porque su correo no es un método propio. Lo leído es de la cuenta y no del acceso: cada acceso usa su propia invitada.
// Los de Plataforma: «Pendiente T25» del preparador (`organizationPending`) y un pedido de recuperación que este recorrido
// hace por la UI con la persona del paso 14 (`recoveryRequested`).

const definition = (id, title, expected) => ({ id: `B12-${id}`, title: `B12 · ${title}`, expected });
export const base12Definitions = [
  definition("01", "Organización: una tabla, una fecha y un botón", "Auditoría carga con la fecha y la hora completas (dd/mm/aaaa hh:mm). Usuarios carga e «Invitar» espera apagado, con el aro, «Invitando…» y su mismo texto debajo, sin atenuarse ni achicarse; suma dos invitaciones por correo."),
  definition("02", "Organización a 320", "Usuarios, con sus invitaciones, entra entera a 320 de ancho, sin desplazamiento lateral."),
  definition("03", "La campana de la organización", "Quien acepta una invitación entra como empresa y su campana le avisa que agregue un correo personal o su WhatsApp, con fecha y hora. Abrir el aviso lleva a Mi cuenta y el número baja. En el teléfono, por «Avisos»."),
  definition("04", "La campana de la persona", "Otra persona invitada entra como persona: su campana trae el mismo aviso, abrirlo lleva a Mi cuenta y el número baja. En el teléfono, por «Avisos»."),
  definition("05", "Persona: una tabla, una fecha y un botón", "En Mi cuenta carga «Cómo entrás», «Guardar cambios» espera apagado con «Guardando…» y guarda, y el aviso de la campana dice la fecha y la hora completas."),
  definition("06", "Persona a 320", "Mi cuenta entra entera a 320 de ancho, sin desplazamiento lateral."),
  definition("07", "Borrar mi cuenta y cancelar el borrado", "«Borrar mi cuenta» pide el motivo y cierra la sesión; Plataforma ve la cuenta «Por borrar». Al volver a entrar, «Cancelar el borrado y entrar» la deja activa."),
  definition("08", "Un link del otro acceso", "Como persona, un link de Usuarios dice de qué organización es y ofrece «Entrar como empresa»; al entrar, abre ese mismo link y no el inicio."),
  definition("09", "Dar de baja y reactivar", "En Usuarios, «Dar de baja» confirma nombrando a la persona y la deja «De baja»; «Reactivar» la vuelve a «Activo»."),
  definition("10", "Cargar teléfonos sin la casilla", "Revisado el teléfono, «Vincular y mandar» sin tildar «La persona aceptó recibir mensajes por WhatsApp» no manda nada, o el servidor responde 400 WhatsApp.PhoneImport.ConsentRequired, y la pantalla lo marca en la casilla."),
  definition("11", "Cargar teléfonos con la casilla", "Con la casilla tildada, «Vincular y mandar» manda la invitación con el consentimiento y vuelve a Usuarios con la invitación pendiente."),
  definition("12", "La campana de Plataforma", "Con un pedido de recuperación hecho por la UI, la campana de Plataforma trae «Pendiente T25 espera aprobación» y «… pidió recuperar su cuenta». Abrir el pedido lleva a Recuperaciones y el número baja. En el teléfono, por «Avisos»."),
  definition("13", "Plataforma: una tabla, una fecha y un botón", "Recuperaciones carga los pendientes con la fecha y la hora completas; «Rechazar» espera apagado con «Rechazando…» y resuelve el pedido."),
  definition("14", "Plataforma a 320", "Organizaciones entra entera a 320 de ancho, sin desplazamiento lateral."),
];

export const base12ManualChecks = [
  "Meta real (I2): escribirle desde un celular al número de Plataforma, recibir el botón «Entrar a mi cuenta» y ver que abre el ingreso (/login) en el celular, sin enlace secreto; con las plantillas de la cuenta y sus textos nuevos, si ya están aprobadas en Meta.",
  "WhatsApp real: recibir en el celular la invitación que manda «Cargar teléfonos» con la casilla tildada; el recorrido solo ve que salió.",
  "La versión nueva: con una pestaña abierta, publicar otro front; la campana la anuncia primera, sin franja, y abrirla recarga la página.",
];

/** El aviso de las cuentas sin un método propio (notifications.json, `kinds.personalLoginMethod`). */
export const personalLoginMethodNotice = "Agregá un correo personal o tu WhatsApp para no perder tu cuenta si dejás la empresa";
/** La organización que el preparador deja esperando aprobación (PlatformCommand de RealE2ESetup). */
export const pendingOrganization = "Pendiente T25";
/** El celular que se carga en «Cargar teléfonos»: sintético de la fixture y de ningún otro paso (el resto va del 80 al 92 y el 99 es del operador). */
export const importedPhoneOf = (width) => width === 1440 ? "+5491134567893" : "+5491134567894";

/** El nombre de la campana: «Avisos: 2» con lo que lista sin leer, o «Avisos» (notifications.json, `bell` y `title`). */
export function bellLabel(unread) {
  assert.ok(Number.isSafeInteger(unread) && unread >= 0, "Lo que la campana tiene sin leer es un entero desde 0.");
  return unread > 0 ? `Avisos: ${unread}` : "Avisos";
}

/** La fecha completa, con su año, y la hora: «dd/mm/aaaa hh:mm», el patrón de es-AR (cultures.json, formatos.md). */
export function isFullDateTime(text) {
  return /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/u.test(String(text).trim());
}

/** El enlace de una invitación en su .eml: en el origen del front y con el token en el fragmento, nunca en la consulta. */
export function invitationLinkFrom(eml, base) {
  const link = plainTextBody(eml)?.match(/https:\/\/[^\s]+\/invitacion#[A-Za-z0-9_-]+/u)?.[0];
  if (!link) return null;
  const url = new URL(link);
  assert.equal(url.origin, new URL(base).origin, "La invitación apunta al origen del front.");
  assert.equal(url.search, "", "El token no viaja en la consulta.");
  return url.href;
}

/** Lo que se ve de un botón mientras trabaja: si se puede tocar, si avisa, el aro, sus textos, su opacidad y su ancho. */
export function workingButtonState(button) {
  return button.evaluate((element) => ({
    disabled: element.disabled === true,
    busy: element.getAttribute("aria-busy"),
    ring: element.querySelector('[data-slot="button-ring"]') !== null,
    text: element.textContent ?? "",
    opacity: getComputedStyle(element).opacity,
    width: element.getBoundingClientRect().width,
  }));
}

/**
 * «Criterio · Botones» (base de la 12): mientras trabaja, el botón queda apagado, con el aro y su gerundio en su lugar, su
 * mismo texto debajo (le guarda el ancho) y su color, sin atenuarse. Devuelve lo que falta, o nada.
 */
export function workingButtonProblems(state, { label, pendingLabel, width }) {
  const problems = [];
  if (state.disabled !== true) problems.push("acepta otro clic");
  if (state.busy !== "true") problems.push("no avisa que trabaja");
  if (!state.ring) problems.push("no tiene el aro");
  if (!state.text.includes(pendingLabel)) problems.push(`no dice «${pendingLabel}»`);
  if (!state.text.includes(label)) problems.push(`perdió su texto «${label}»`);
  if (Number(state.opacity) !== 1) problems.push("se atenúa");
  if (state.width + 0.5 < width) problems.push("se achica");
  return problems;
}

/**
 * Retiene el primer pedido real que manda el botón para mirar cómo espera (`inspect`) y después lo deja seguir tal cual:
 * no cambia la respuesta ni la inventa. Si el clic no manda el pedido, falla en `timeout`.
 */
export async function whileHeld(target, { method, path }, press, inspect, { timeout = 30_000 } = {}) {
  let release; let arrived; let held = false; let timer;
  const released = new Promise((resolve) => { release = resolve; });
  const reached = new Promise((resolve) => { arrived = resolve; });
  const expired = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("El botón no mandó su pedido.")), timeout); });
  const arrival = Promise.race([reached, expired]);
  arrival.catch(() => {});
  const matches = (url) => url.pathname === path;
  const handler = async (route) => {
    if (held || route.request().method() !== method) return route.fallback();
    held = true; arrived();
    await released;
    try { await route.fallback(); } catch { /* La página ya no espera ese pedido. */ }
  };
  await target.route(matches, handler);
  try {
    await press();
    await arrival;
    await inspect();
  } finally {
    clearTimeout(timer); release();
    await target.unroute(matches, handler);
  }
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Sigue a la E9 en las mismas pestañas: arranca y termina con la persona afuera y el operador del recorrido en Plataforma. */
export async function runBase12Journey({ page, platformPage, width, env, base, record, signOut, awaitApp, login, requestCode, verify,
  owner, organization, person, signal }) {
  assert.ok(["files", "messages", "code"].every((name) => typeof env?.[name] === "function"),
    "La base de la 12 necesita el correo aislado del mismo entorno: las invitaciones y los códigos llegan ahí.");
  assert.ok([record, signOut, awaitApp, login, requestCode, verify].every((value) => typeof value === "function")
    && [owner, organization, person?.email, person?.name].every((value) => typeof value === "string" && value.length > 0),
    "La base de la 12 sigue al recorrido: necesita sus sesiones, la Dueña, su organización y la persona del paso 14.");
  const size = { width, height: width === 390 ? 844 : 900 };
  const tag = `${width}-${randomUUID().slice(0, 8)}`;
  // Las dos invitadas: una para la campana de la organización y la baja, otra para la de la persona y el borrado.
  const member = `e2e-b12-empresa-${tag}@example.test`;
  const personal = `e2e-b12-persona-${tag}@example.test`;
  const recovered = `e2e-b12-recupero-${tag}@example.test`;
  const importedPhone = importedPhoneOf(width);
  const importApi = "/api/organization/whatsapp/phone-imports";
  const consentLabel = "La persona aceptó recibir mensajes por WhatsApp";
  const url = (route) => new URL(route, base).href;
  const isPhone = (target) => target.viewportSize().width < 768;
  const responseFor = (path, method = "GET") => (reply) => new URL(reply.url()).pathname === path && reply.request().method() === method;
  const heading = (target, name) => target.getByRole("heading", { name, exact: true }).filter({ visible: true }).first().waitFor();
  const rowOf = (target, actions) => target.getByRole(isPhone(target) ? "listitem" : "row")
    .filter({ has: target.getByRole("button", { name: actions, exact: true }) });
  // Una invitación se nombra con su correo; se la busca por ese texto, sin suponer el nombre de su ⋮.
  const rowWith = (target, text) => target.getByRole(isPhone(target) ? "listitem" : "row").filter({ hasText: text });
  let phase = "inicio"; let lastHttp = "";
  const failures = async (response) => {
    const { pathname } = new URL(response.url());
    if (!pathname.startsWith("/api/") || response.ok()) return;
    let code = "";
    try { const problem = await response.json(); if (/^[A-Za-z0-9.]+$/u.test(problem.code)) code = ` ${problem.code}`; } catch { /* Sin cuerpo JSON. */ }
    lastHttp = `${response.request().method()} ${pathname} HTTP ${response.status()}${code}`;
  };
  const step = (id, action, target = page) => {
    phase = "inicio"; lastHttp = "";
    return record(`B12-${id}`, width, () => target, action,
      (error) => `Ruta ${new URL(target.url()).pathname}; fase ${phase}; ${lastHttp || "sin errores HTTP"}; ${error.name}. Los correos y los códigos se omiten.`);
  };
  // Como la E11: se sale desde el inicio del acceso, que tiene la salida también en el teléfono.
  const leave = async (profile, route) => { await page.goto(url(route)); await awaitApp(page, profile, route); await signOut(page, profile); };

  /** La tabla ya cargó (DataTable, «Criterio · Tablas»): sin el aro de la primera carga y sin volver a leer. */
  const expectLoaded = async (target) => {
    const main = target.getByRole("main");
    await main.locator('[data-slot="first-load"]').first().waitFor({ state: "detached" });
    await main.locator(isPhone(target) ? 'ul[data-line="top"]:not([aria-busy="true"])' : 'table[data-slot="table"]:not([aria-busy="true"])').first().waitFor();
  };
  /** La primera fecha de una tabla, de una lista o de una fila (`DateText`, un `<time>`), entera. */
  const fullDateOf = async (times) => {
    const time = times.first();
    await time.waitFor();
    const text = (await time.innerText()).trim();
    assert.ok(isFullDateTime(text), "La fecha se ve completa, con su año y su hora.");
    return text;
  };
  /** A 320 (galería de la base de la 12): la pantalla entra entera en su ancho, sin desplazarse de costado. */
  const narrow = async (target, route, ready) => {
    await target.setViewportSize(viewports.narrow);
    await target.goto(url(route));
    await ready();
    const sideways = await sideScroll(target);
    assert.equal(sideways, null, `A 320, ${sideways}.`);
  };
  /** «Criterio · Botones»: retiene el pedido real del botón, mira cómo espera y después lo deja seguir. */
  const watchWorking = async (target, request, button, { scope = target, label, pendingLabel }) => {
    await button.waitFor();
    const width = (await button.boundingBox())?.width ?? 0;
    assert.ok(width > 0, "El botón se ve antes de tocarlo.");
    await whileHeld(target, request, () => button.click(), async () => {
      const working = scope.locator('[data-slot="button"][data-pending="true"]');
      await working.waitFor();
      const problems = workingButtonProblems(await workingButtonState(working), { label, pendingLabel, width });
      assert.deepEqual(problems, [], `Mientras espera, el botón ${problems.join(", ")}.`);
    });
  };

  // La campana: en la compu, el botón de la barra de arriba, que abre su lista; en el teléfono, el de la barra o la
  // cabecera de una pantalla de primer nivel, que lleva a «Avisos» (tableros Campana, Campana-Plat y M-Campana*).
  const bellOf = (target, name = /^Avisos(?:: \d+)?$/u) => target.getByRole(isPhone(target) ? "link" : "button", typeof name === "string" ? { name, exact: true } : { name })
    .filter({ visible: true }).first();
  const noticesPath = (target) => target === platformPage ? "/plataforma/avisos" : "/avisos";
  const noticeLink = (scope, text) => scope.getByRole("link", { name: new RegExp(`^${escapeRegExp(text)}`, "u") });
  const readNotifications = async (target, navigate) => {
    const [reply] = await responsesForAction(target, [responseFor("/api/notifications")], navigate);
    assert.equal(reply.status(), 200, "La campana lee sus avisos.");
    return reply.json();
  };
  const openBell = async (target) => {
    await bellOf(target).click();
    if (isPhone(target)) {
      await target.waitForURL((current) => current.pathname === noticesPath(target));
      await heading(target, "Avisos");
      return target.getByRole("main");
    }
    const list = target.getByRole("dialog", { name: "Avisos", exact: true });
    await list.waitFor();
    return list;
  };
  /** Lee la campana, la abre, ve sus avisos, abre el pedido y comprueba en la API y en la campana que el número bajó. */
  const bellRoundTrip = async (target, { home, waitHome, kind, name, text, also = [] }) => {
    phase = "campana: leer";
    const before = await readNotifications(target, () => target.goto(url(home)));
    await waitHome();
    const item = before.items.find((entry) => entry.kind === kind && !entry.read && (name === undefined || entry.params?.name === name));
    assert.ok(item, "La campana trae el aviso sin leer.");
    await bellOf(target, bellLabel(before.unread)).waitFor();
    phase = "campana: abrir";
    const scope = await openBell(target);
    for (const other of also) await noticeLink(scope, other).waitFor();
    const link = noticeLink(scope, text);
    await link.waitFor();
    assert.ok((await link.textContent()).includes(", sin leer"), "El aviso se presenta sin leer.");
    const when = (await link.locator("time").innerText()).trim();
    assert.ok(isFullDateTime(when), "El aviso dice la fecha y la hora completas.");
    phase = "campana: abrir el aviso";
    const [read] = await responsesForAction(target, [responseFor(`/api/notifications/${encodeURIComponent(item.id)}/read`, "POST")], () => link.click());
    assert.equal(read.status(), 204, "Abrir el aviso lo marca leído.");
    await target.waitForURL((current) => `${current.pathname}${current.search}` === item.link);
    phase = "campana: el número";
    const after = await readNotifications(target, () => target.goto(url(home)));
    await waitHome();
    assert.equal(after.unread, before.unread - 1, "El número de la campana baja.");
    assert.equal(after.items.find((entry) => entry.id === item.id)?.read, true, "El aviso queda leído.");
    await bellOf(target, bellLabel(after.unread)).waitFor();
    return { before: before.unread, after: after.unread, when, destination: item.link };
  };
  const noticeDate = async (target, text) => {
    let scope;
    if (isPhone(target)) { await target.goto(url(noticesPath(target))); await heading(target, "Avisos"); scope = target.getByRole("main"); }
    else scope = await openBell(target);
    const link = noticeLink(scope, text);
    await link.waitFor();
    const when = (await link.locator("time").innerText()).trim();
    assert.ok(isFullDateTime(when), "El aviso dice la fecha y la hora completas.");
    if (!isPhone(target)) { await target.keyboard.press("Escape"); await scope.waitFor({ state: "hidden" }); }
    return when;
  };

  const openUsers = async () => {
    const [reply] = await responsesForAction(page, [responseFor("/api/users/paged")], () => page.goto(url("/org/usuarios")));
    assert.equal(reply.status(), 200, "Usuarios lee su lista.");
    await heading(page, "Usuarios");
    await expectLoaded(page);
    return (await reply.json()).items;
  };
  /** «Invitar usuario» con solo el correo (todo lo demás es opcional). Devuelve los .eml que había antes de invitar. */
  const invite = async (email, watch) => {
    // Sonner pausa un aviso mientras el puntero queda encima (waitForTransientNotices): que el de la invitación anterior no tape.
    await page.mouse.move(0, 0);
    await page.getByRole("button", { name: "Invitar usuario", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Invitar usuario", exact: true });
    await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill(email);
    const before = new Set(await env.files());
    const submit = dialog.getByRole("button", { name: "Invitar", exact: true });
    const [created] = await responsesForAction(page, [responseFor("/api/users/invitations", "POST")], () => watch
      ? watchWorking(page, { method: "POST", path: "/api/users/invitations" }, submit, { scope: dialog, label: "Invitar", pendingLabel: "Invitando…" })
      : submit.click());
    assert.equal(created.status(), 201, "La invitación se crea.");
    await dialog.waitFor({ state: "hidden" });
    await rowWith(page, email).getByText("Invitación pendiente", { exact: true }).waitFor();
    return before;
  };
  const invitationLink = async (email, before) => {
    for (const deadline = Date.now() + 95_000; Date.now() < deadline;) {
      for (const { body } of await env.messages(email, before)) {
        const link = invitationLinkFrom(body, base);
        if (link) return link;
      }
      await delay(250, undefined, { signal });
    }
    throw new Error("No llegó la invitación al correo aislado.");
  };
  /** Una cuenta nueva acepta su invitación y, con «Más tarde», entra como empresa (tablero Invitacion). */
  const acceptInvitation = async (email, before) => {
    await page.goto(await invitationLink(email, before));
    await heading(page, `Te sumás a ${organization}`);
    await page.getByText(`La invitación es para ${email}.`, { exact: true }).waitFor();
    const [accepted] = await responsesForAction(page, [responseFor("/api/invitations/accept", "POST")],
      () => page.getByRole("button", { name: "Aceptar invitación", exact: true }).click());
    assert.ok(accepted.ok(), "La invitación se acepta.");
    await heading(page, `Te sumaste a ${organization}`);
    await page.getByText(`${personalLoginMethodNotice}.`, { exact: true }).waitFor();
    await page.getByRole("button", { name: "Más tarde", exact: true }).click();
    await awaitApp(page, organization, "/org");
  };
  const openAccount = async () => {
    const [methods] = await responsesForAction(page, [responseFor("/api/me/login-methods")], () => page.goto(url("/cuenta")));
    assert.equal(methods.status(), 200, "Mi cuenta lee cómo entrás.");
    await heading(page, "Mi cuenta");
    await page.getByRole("list", { name: "Cómo entrás", exact: true }).getByText(personal, { exact: true }).waitFor();
  };
  const platformAccount = async (email) => {
    await platformPage.goto(url("/plataforma/cuentas"));
    await heading(platformPage, "Cuentas");
    const search = await openPlatformAccountSearch(platformPage);
    const [reply] = await responsesForAction(platformPage, [(response) => responseFor("/api/platform/accounts/paged")(response)
      && new URL(response.url()).searchParams.get("search") === email], () => search.fill(email));
    assert.equal(reply.status(), 200, "Plataforma busca la cuenta.");
    const items = (await reply.json()).items;
    assert.equal(items.length, 1, "La búsqueda encuentra la cuenta del recorrido, y solo esa.");
    const link = platformPage.locator(`a[href='/plataforma/cuentas/${items[0].id}']`);
    return { account: items[0], row: platformPage.getByRole(isPhone(platformPage) ? "listitem" : "row").filter({ has: link }) };
  };
  const platformHome = async () => {
    await platformPage.waitForURL((current) => current.pathname === "/plataforma/organizaciones");
    await heading(platformPage, "Organizaciones");
  };
  /** «Recuperar mi cuenta» con el correo de antes y uno nuevo, verificado con su código (como el paso 20 y la E8). */
  const requestRecovery = async () => {
    await page.goto(url("/recuperar"));
    await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(person.email);
    const [preview] = await responsesForAction(page, [responseFor("/api/account-recovery/preview", "POST")],
      () => page.getByRole("button", { name: "Seguir", exact: true }).click());
    assert.equal(preview.status(), 204, "La recuperación encuentra la cuenta.");
    await heading(page, "¿Dónde te escribimos?");
    await page.getByRole("textbox", { name: "Correo electrónico nuevo", exact: true }).fill(recovered);
    const before = new Set(await env.files());
    await sendWithCooldown(async () => (await responsesForAction(page, [responseFor("/api/account-recovery/code", "POST")],
      () => page.getByRole("button", { name: "Enviar código", exact: true }).click()))[0], { signal });
    await heading(page, "Revisá tu correo");
    await fillOtp(page, await env.code(recovered, before));
    const [verified, created] = await responsesForAction(page, [responseFor("/api/account-recovery/verify", "POST"), responseFor("/api/account-recovery", "POST")],
      () => page.getByRole("button", { name: "Verificar", exact: true }).click());
    assert.equal(verified.status(), 204, "El código prueba el correo nuevo.");
    assert.equal(created.status(), 202, "El pedido queda para Plataforma.");
    await heading(page, "Recibimos tu pedido");
  };

  page.on("response", failures); platformPage.on("response", failures);
  let memberMail; let personalMail;
  try {
    await step("01", async () => {
      phase = "ingreso de la Dueña"; await login(owner, "business");
      phase = "auditoría";
      const [audit] = await responsesForAction(page, [responseFor("/api/organization/audit")], () => page.goto(url("/org/auditoria")));
      assert.equal(audit.status(), 200, "Auditoría lee sus movimientos.");
      assert.ok((await audit.json()).items.length > 0, "La organización del recorrido ya tiene movimientos.");
      await heading(page, "Auditoría"); await expectLoaded(page);
      const when = await fullDateOf(page.getByRole("main").locator("table time, ul time"));
      phase = "usuarios";
      const self = (await openUsers()).find((item) => item.email === owner);
      assert.ok(self, "La Dueña está en Usuarios.");
      await rowOf(page, `Acciones de ${self.displayName || owner}`).waitFor();
      phase = "invitar"; memberMail = await invite(member, true);
      phase = "segunda invitación"; personalMail = await invite(personal, false);
      return `Auditoría cargó con la fecha ${when}; Usuarios cargó e «Invitar» esperó apagado, con el aro, «Invitando…» y su texto, sin atenuarse ni achicarse; quedaron dos invitaciones pendientes.`;
    });
    await step("02", async () => {
      phase = "a 320";
      await narrow(page, "/org/usuarios", async () => {
        await heading(page, "Usuarios"); await expectLoaded(page);
        for (const email of [member, personal]) await rowWith(page, email).waitFor();
      });
      return "A 320 de ancho, Usuarios y sus dos invitaciones entraron enteras, sin desplazamiento lateral.";
    });
    await page.setViewportSize(size);
    await leave(organization, "/org");
    await step("03", async () => {
      phase = "aceptar la invitación"; await acceptInvitation(member, memberMail);
      const bell = await bellRoundTrip(page, { home: "/org", waitHome: () => awaitApp(page, organization, "/org"), kind: "personalLoginMethod", text: personalLoginMethodNotice });
      return `La invitada aceptó y entró como empresa; su campana trajo el aviso del ${bell.when}, abrirlo llevó a ${bell.destination} y el número bajó de ${bell.before} a ${bell.after}.`;
    });
    await signOut(page, organization);
    await step("04", async () => {
      phase = "aceptar la invitación"; await acceptInvitation(personal, personalMail);
      phase = "salir de la empresa"; await signOut(page, organization);
      phase = "ingreso como persona"; await login(personal);
      const bell = await bellRoundTrip(page, { home: "/", waitHome: () => awaitApp(page), kind: "personalLoginMethod", text: personalLoginMethodNotice });
      return `La otra invitada entró como persona; su campana trajo el aviso del ${bell.when}, abrirlo llevó a ${bell.destination} y el número bajó de ${bell.before} a ${bell.after}.`;
    });
    await step("05", async () => {
      phase = "mi cuenta"; await openAccount();
      phase = "guardar";
      await page.getByRole("textbox", { name: "Nombre", exact: true }).fill("Persona");
      await page.getByRole("textbox", { name: "Apellido", exact: true }).fill(`Base ${width}`);
      const [saved] = await responsesForAction(page, [responseFor("/api/me", "PUT")], () => watchWorking(page, { method: "PUT", path: "/api/me" },
        page.getByRole("button", { name: "Guardar cambios", exact: true }), { label: "Guardar cambios", pendingLabel: "Guardando…" }));
      assert.equal(saved.status(), 200, "Mi cuenta guarda.");
      await page.getByText("Guardamos tus datos.", { exact: true }).waitFor();
      phase = "fecha del aviso";
      const when = await noticeDate(page, personalLoginMethodNotice);
      return `«Cómo entrás» cargó; «Guardar cambios» esperó apagado con «Guardando…» y guardó; el aviso de la campana dice ${when}.`;
    });
    await step("06", async () => {
      phase = "a 320";
      await narrow(page, "/cuenta", async () => {
        await heading(page, "Mi cuenta");
        await page.getByRole("list", { name: "Cómo entrás", exact: true }).getByText(personal, { exact: true }).waitFor();
      });
      return "A 320 de ancho, Mi cuenta entró entera, sin desplazamiento lateral.";
    });
    await page.setViewportSize(size);
    await step("07", async () => {
      phase = "mi cuenta"; await openAccount();
      phase = "pedir el borrado";
      // La fila se llama «Borrar mi cuenta»; su botón y el del diálogo dicen «Borrar» (v168).
      await page.getByRole("main").getByRole("button", { name: "Borrar", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "¿Borrar tu cuenta?", exact: true });
      await dialog.getByRole("textbox", { name: /^Motivo/u }).fill("Recorrido de la base de la 12: lo pide y lo cancela.");
      const [requested] = await responsesForAction(page, [responseFor("/api/me/deletion", "POST")],
        () => dialog.getByRole("button", { name: "Borrar", exact: true }).click());
      assert.equal(requested.status(), 200, "El borrado se pide.");
      await heading(page, "Cerramos tu sesión");
      await page.getByText(/^Tu cuenta se borra el \d{2}\/\d{2}\/\d{4}\.$/u).waitFor();
      phase = "Por borrar en Plataforma";
      const pending = await platformAccount(personal);
      assert.equal(pending.account.state, "PendingDeletion", "Plataforma ve la cuenta por borrar.");
      await pending.row.getByText("Por borrar", { exact: true }).waitFor();
      phase = "volver a entrar";
      await page.getByRole("button", { name: "Ir al inicio", exact: true }).click();
      await page.goto(url("/login"));
      const refused = await verify(page, await requestCode(page, personal));
      assert.equal(refused.status(), 403, "La cuenta por borrar no entra sin cancelar.");
      assert.equal((await refused.json()).code, "Identity.Account.PendingDeletion");
      await heading(page, "Tu cuenta está por borrarse");
      phase = "cancelar el borrado";
      const [cancelled] = await responsesForAction(page, [responseFor("/api/auth/deletion/cancel", "POST")],
        () => page.getByRole("button", { name: "Cancelar el borrado y entrar", exact: true }).click());
      assert.equal(cancelled.status(), 200, "El borrado se cancela.");
      await page.getByText("Cancelamos el borrado.", { exact: true }).waitFor();
      await awaitApp(page);
      phase = "activa en Plataforma";
      const active = await platformAccount(personal);
      assert.equal(active.account.state, "Active", "La cuenta vuelve a estar activa.");
      await active.row.getByText("Activa", { exact: true }).waitFor();
      // En la compu, Inicio es el asistente: en su primera vez ahí abre «Antes de tu primera consulta», que tapa el menú
      // del perfil. Se acepta al final, cuando ya abrió; en el teléfono el asistente vive en /asistente.
      if (!isPhone(page)) { phase = "aviso del asistente"; await acceptAssistantNoticeFromHome(page); }
      return "Pidió el borrado con su motivo y se cerró la sesión; Plataforma la vio «Por borrar». Al volver a entrar, «Cancelar el borrado y entrar» la dejó activa.";
    });
    await signOut(page);
    await step("08", async () => {
      phase = "ingreso como persona"; await login(owner);
      phase = "link de la empresa";
      // Un link del otro acceso adentro de la app. Con F5 o una pestaña nueva la sesión se recupera con el acceso de la
      // ruta (SessionRecovery) y entra directo como empresa; «Otro acceso» (F7) es la navegación dentro de la app.
      await page.evaluate((path) => { history.pushState(null, "", path); dispatchEvent(new PopStateEvent("popstate")); }, "/org/usuarios");
      await heading(page, `Este link es de ${organization}`);
      phase = "entrar como empresa";
      await page.getByRole("button", { name: "Entrar como empresa", exact: true }).click();
      await heading(page, "Usuarios");
      assert.equal(new URL(page.url()).pathname, "/org/usuarios", "Al entrar, abre el link y no el inicio.");
      if (!isPhone(page)) await page.getByRole("button", { name: new RegExp(`, ${escapeRegExp(organization)}$`, "u") }).waitFor();
      return `Como persona, /org/usuarios dijo «Este link es de ${organization}»; «Entrar como empresa» abrió ese mismo link.`;
    });
    await step("09", async () => {
      phase = "usuarios";
      const [reply] = await responsesForAction(page, [responseFor("/api/users/paged")], () => page.reload());
      assert.equal(reply.status(), 200, "Usuarios lee su lista.");
      const joined = (await reply.json()).items.find((item) => item.email === member);
      assert.equal(joined?.state, "Active", "La persona que aceptó la invitación ya es miembro.");
      const name = joined.displayName || member;
      const actions = `Acciones de ${name}`;
      const row = rowOf(page, actions);
      const status = `/api/users/${encodeURIComponent(joined.memberId)}/status`;
      phase = "dar de baja";
      await row.getByRole("button", { name: actions, exact: true }).click();
      await page.getByRole("menuitem", { name: "Dar de baja", exact: true }).click();
      const confirm = page.getByRole("dialog", { name: `¿Dar de baja a ${name}?`, exact: true });
      const [disabled] = await responsesForAction(page, [responseFor(status, "PUT")], () => confirm.getByRole("button", { name: "Dar de baja", exact: true }).click());
      assert.equal(disabled.status(), 200, "La baja se guarda.");
      assert.equal(disabled.request().postDataJSON().isActive, false);
      await confirm.waitFor({ state: "hidden" });
      await page.getByText(`Dimos de baja a ${name}.`, { exact: true }).waitFor();
      await row.getByText("De baja", { exact: true }).waitFor();
      phase = "reactivar";
      await page.mouse.move(0, 0);
      await row.getByRole("button", { name: actions, exact: true }).click();
      const [enabled] = await responsesForAction(page, [responseFor(status, "PUT")], () => page.getByRole("menuitem", { name: "Reactivar", exact: true }).click());
      assert.equal(enabled.status(), 200, "La reactivación se guarda.");
      assert.equal(enabled.request().postDataJSON().isActive, true);
      await page.getByText(`Reactivamos a ${name}.`, { exact: true }).waitFor();
      await row.getByText("Activo", { exact: true }).waitFor();
      return "«Dar de baja» pidió confirmar nombrando a la persona y la dejó «De baja»; «Reactivar» la volvió a «Activo».";
    });
    const confirmImport = () => page.getByRole("button", { name: "Vincular y mandar 1 invitación", exact: true }).first();
    await step("10", async () => {
      const sent = [];
      const watch = (request) => { if (new URL(request.url()).pathname === importApi && request.method() === "POST") sent.push(request); };
      page.on("request", watch);
      try {
        phase = "revisar";
        await page.goto(url("/org/usuarios/cargar-telefonos"));
        await page.getByRole("textbox", { name: "Uno por renglón, hasta 200", exact: true }).fill(nationalPhone(importedPhone));
        const [preview] = await responsesForAction(page, [responseFor(`${importApi}/preview`, "POST")],
          () => page.getByRole("button", { name: /^Revisar \d+ teléfonos?$/u }).first().click());
        assert.equal(preview.status(), 200, "La revisión responde.");
        assert.equal((await preview.json()).invites, 1, "El teléfono nuevo se invita.");
        phase = "sin la casilla";
        assert.equal(await page.getByRole("checkbox", { name: consentLabel, exact: true }).isChecked(), false);
        await confirmImport().click();
        await page.getByText("Confirmá que la persona aceptó recibir mensajes por WhatsApp.", { exact: true }).waitFor();
        for (const request of sent) {
          const reply = await request.response();
          assert.equal(reply?.status(), 400, "Sin la casilla, el servidor no invita.");
          assert.equal((await reply.json()).code, "WhatsApp.PhoneImport.ConsentRequired");
        }
      } finally { page.off("request", watch); }
      return sent.length === 0
        ? "Sin la casilla, «Vincular y mandar» no mandó nada y la casilla pidió confirmar el consentimiento."
        : "Sin la casilla, el servidor respondió 400 WhatsApp.PhoneImport.ConsentRequired y la casilla lo mostró.";
    });
    await step("11", async () => {
      phase = "tildar"; await checkByLabel(page, consentLabel);
      phase = "mandar";
      const [imported] = await responsesForAction(page, [responseFor(importApi, "POST")], () => confirmImport().click());
      assert.ok(imported.ok(), "Con la casilla, la invitación sale.");
      assert.equal(imported.request().postDataJSON().consentConfirmed, true, "El pedido lleva el consentimiento.");
      assert.equal((await imported.json()).invited, 1);
      await page.waitForURL((current) => current.pathname === "/org/usuarios");
      await page.getByText(/^Vinculamos \d+ teléfonos y mandamos 1 invitación\.$/u).waitFor();
      phase = "la invitación en Usuarios";
      const [users] = await responsesForAction(page, [responseFor("/api/users/paged")], () => page.reload());
      assert.equal(users.status(), 200, "Usuarios lee su lista.");
      const invitation = (await users.json()).items.find((item) => item.phone === importedPhone);
      assert.equal(invitation?.state, "Invited", "Usuarios tiene la invitación por WhatsApp pendiente.");
      await heading(page, "Usuarios");
      return "Con la casilla tildada, «Vincular y mandar» mandó la invitación con el consentimiento y Usuarios la tiene pendiente.";
    });
    await leave(organization, "/org");
    await step("12", async () => {
      phase = "pedido de recuperación"; await requestRecovery();
      const bell = await bellRoundTrip(platformPage, { home: "/plataforma/organizaciones", waitHome: platformHome, kind: "recoveryRequested", name: person.name,
        text: `${person.name} pidió recuperar su cuenta`, also: [`${pendingOrganization} espera aprobación`] });
      return `La campana de Plataforma trajo «${pendingOrganization} espera aprobación» y el pedido del ${bell.when}; abrirlo llevó a ${bell.destination} y el número bajó de ${bell.before} a ${bell.after}.`;
    }, platformPage);
    await step("13", async () => {
      phase = "recuperaciones";
      const [reply] = await responsesForAction(platformPage, [responseFor("/api/platform/recoveries/paged")],
        () => platformPage.goto(url("/plataforma/recuperaciones?status=Pending")));
      assert.equal(reply.status(), 200, "Recuperaciones lee los pedidos.");
      const mine = (await reply.json()).items.filter((item) => item.status === "Pending" && item.accountName === person.name);
      assert.equal(mine.length, 1, "El pedido del recorrido está pendiente, una sola vez.");
      await heading(platformPage, "Recuperaciones"); await expectLoaded(platformPage);
      const actions = `Acciones de ${person.name}`;
      const row = rowOf(platformPage, actions);
      const when = await fullDateOf(row.locator("time"));
      phase = "revisar";
      await row.getByRole("button", { name: actions, exact: true }).click();
      await platformPage.getByRole("menuitem", { name: "Revisar", exact: true }).click();
      const dialog = platformPage.getByRole("dialog", { name: `Revisar el pedido de ${person.name}`, exact: true });
      await dialog.getByText(`Pedido del ${when}`, { exact: true }).waitFor();
      await dialog.getByRole("textbox", { name: /^Motivo/u }).fill("Recorrido de la base de la 12: no se aprueba.");
      phase = "rechazar";
      const reject = `/api/platform/recoveries/${encodeURIComponent(mine[0].id)}/reject`;
      const [decided] = await responsesForAction(platformPage, [(response) => responseFor(reject, "POST")(response) && response.ok()], async () => {
        await watchWorking(platformPage, { method: "POST", path: reject }, dialog.getByRole("button", { name: "Rechazar", exact: true }),
          { scope: dialog, label: "Rechazar", pendingLabel: "Rechazando…" });
        // Si venció la prueba reciente, esta pestaña confirma sola «Confirmá que sos vos» (completeOperatorFactor) mientras espera.
        await platformPage.getByText(/^Rechazamos el pedido y le avisamos a /u).waitFor();
      });
      const decision = decided.request().postDataJSON();
      assert.ok(Number.isSafeInteger(decision.version) && decision.reason?.length > 0, "Rechazar manda la versión del pedido y su motivo.");
      return `Recuperaciones cargó el pedido del ${when}; «Rechazar» esperó apagado con «Rechazando…» y lo resolvió.`;
    }, platformPage);
    await step("14", async () => {
      phase = "a 320";
      await narrow(platformPage, "/plataforma/organizaciones", async () => {
        await heading(platformPage, "Organizaciones"); await expectLoaded(platformPage);
        await platformPage.getByRole("main").getByText(organization, { exact: true }).first().waitFor();
      });
      return "A 320 de ancho, Organizaciones entró entera, sin desplazamiento lateral.";
    }, platformPage);
    await platformPage.setViewportSize(size);
  } finally { page.off("response", failures); platformPage.off("response", failures); }
}
