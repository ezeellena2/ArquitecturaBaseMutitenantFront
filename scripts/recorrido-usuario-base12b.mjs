import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createAssistantControl } from "./assistant-real-control.mjs";
import { checkByLabel } from "./platform-factor-real.mjs";
import { acceptAssistantNoticeFromHome } from "./assistant-real-ui.mjs";
import { pickupCode, plainTextBody } from "./test-e2e-real-mail.mjs";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { readJourneyIdentity } from "./recorrido-usuario-whatsapp.mjs";

// Segunda parte de la base de la 12 en el recorrido de usuario (I3 del plan 2026-11-19-etapa-base-de-la-12-segunda-parte):
// lo que se probó a mano en la puerta queda acá como paso, para que la próxima puerta pase sola. Va después de la base de
// la 12, en las mismas pestañas: arranca y termina con la persona afuera y el operador del recorrido en Plataforma.
// Los estados que el entorno no deja solo los deja el preparador con sus órdenes privadas (B-2 y B-3 de la puerta):
// `delivery` (la cola de una invitación o de un mensaje del chat), `assistant` con `unreadableKey` e `invitation-quota`.

const definition = (id, title, expected) => ({ id: `B12B-${id}`, title: `B12B · ${title}`, expected });
export const base12bDefinitions = [
  definition("01", "Un rol en áreas plegables", "Crear un rol que vale en toda la organización muestra las áreas cerradas, cada una con su casilla. Al marcar «Administrar usuarios», «Ver usuarios» queda marcado y apagado, y su motivo dice «Lo incluye «Administrar usuarios».». En el teléfono, igual, con la casilla del área y la flecha que se tocan por separado."),
  definition("02", "Un permiso ajeno da 403 con su texto", "Quien administra roles abre un rol nuevo con un permiso que tiene; mientras lo edita, la Dueña le saca ese permiso. Al guardar, el servidor responde 403 y la pantalla dice por qué, sin guardar el rol."),
  definition("03", "El chat del Inicio sin cupo", "Sin consultas del día, el Inicio de la organización muestra el cartel de atención (blanco, con el filo y el triángulo) que dice cuándo vuelven, a las 00:00, en la hora de la organización y nombrándola, con la (i) del cupo de cada organización."),
  definition("04", "Dos subidas a la vez", "Elegir dos archivos a la vez en el chat del Inicio sube uno por vez: el segundo espera, y los dos quedan adjuntos."),
  definition("05", "Un modelo nuevo en dos pasos", "En la configuración del asistente de Plataforma, agregar un modelo pide primero el proveedor y el modelo, y después los datos técnicos; al guardar, el modelo nuevo está en la lista."),
  definition("06", "Una fecha, un porcentaje y un mes como rango", "Uso del asistente de la organización dice el mes como rango («01/11/2026 – 30/11/2026») y el porcentaje pegado («80%»); Auditoría dice cada fecha con la hora después de una coma."),
  definition("07", "Un aviso de cada tipo", "Guardar dice que salió bien (verde, con tilde); un plazo fuera de rango marca el error en su campo (rojo); el tope del día es un cartel de atención (ámbar, con triángulo), y la (i) abre la información (gris)."),
  definition("08", "Elegir con la pieza", "La pieza elige una opción y varias, la zona horaria se busca por su ciudad y dice la hora de su país, y el filtro de Estado de Usuarios, que era un segmentado, es un filtro sin cantidad."),
  definition("09", "Ordenar una tabla", "Usuarios se ordena desde el encabezado de una columna (↑ y ↓) y desde «Ordenar por», con la columna y el orden en palabras; lo vacío va al final en los dos sentidos, y el orden queda en la dirección."),
  definition("10", "El plazo de los chats y el nombre de los correos", "La Dueña cambia el plazo de los chats de su organización y lo guarda; el operador cambia el nombre de los correos en Plataforma, y el correo con un código llega con el nombre nuevo."),
  definition("11", "Salir con dos pestañas abiertas", "Con dos pestañas de la organización abiertas, salir en una cierra la sesión también en la otra, que vuelve al ingreso."),
  definition("12", "Una invitación en cada estado de entrega", "Cuatro invitaciones por correo: una en la cola («Pendiente»), una que salió («Enviada»), una que el servidor de correo no confirmó («Sin confirmar») y una que no salió («No se pudo enviar»), cada una salvo la enviada con su (i). «Reenviar invitación» de la «Sin confirmar» pide revisar con la persona antes y la reenvía, que queda «Enviada»."),
  definition("13", "Un mensaje «Sin confirmar» revisado", "El último mensaje que salió de un chat de la organización y el de una consulta de Plataforma quedan «Sin confirmar», con su (i) y «Marcar como revisado»; revisado, dicen quién y cuándo («Lo revisó …»), y queda al recargar."),
  definition("14", "La clave ilegible en las dos configuraciones", "Con la clave guardada ilegible, la configuración del asistente de la organización y la de Plataforma dicen «No pudimos leer la clave guardada: reemplazala.» con «Reemplazar clave»."),
  definition("15", "Invitar hasta el tope", "A la Dueña le queda una invitación por correo de su tope del día: esa sale; la siguiente responde 429 con la espera en horas, y el diálogo dice que no se pueden mandar más correos y que no se guardó nada, con «Reintentá en …» en horas y minutos en el botón, apagado; Usuarios no la tiene."),
];

// B-2 y B-3 de la puerta de la base 2 ya son pasos (12 a 15): no queda nada de esta parte para probar a mano.
export const base12bManualChecks = [];

/** La entrega de una invitación en pantalla (`enums:InvitationDeliveryStatus`). */
export const deliveryWords = Object.freeze({ Pending: "Pendiente", Sent: "Enviada", Uncertain: "Sin confirmar", Failed: "No se pudo enviar" });

/** El porqué de la entrega de una invitación por correo, en su (i) (`common:invitationDelivery.why`); la enviada no lleva. */
export const emailDeliveryReasons = Object.freeze({
  Pending: "Está en la cola: sale en unos minutos.",
  Uncertain: "No sabemos si llegó: el servidor de correo no confirmó el envío. Revisá con la persona antes de reenviarla.",
  Failed: "El servidor de correo no la aceptó. Revisá la dirección y reenviala.",
});

/** Lo que pide la confirmación de reenviar una invitación «Sin confirmar» por correo (`common:invitationDelivery.resend`). */
export const resendUncertainText = "No sabemos si le llegó la anterior: el servidor de correo no confirmó el envío. Revisá con la persona antes de reenviarla, así no le llegan dos.";

/** La (i) de un mensaje «Sin confirmar» del chat (`whatsapp:chats.thread.uncertainInfo`). */
export const uncertainChatReason = "No sabemos si salió: WhatsApp no confirmó el envío. Mirá el chat en el teléfono antes de mandarlo de nuevo: no se repite solo. Marcarlo como revisado no lo reenvía.";

/** La clave ilegible (`assistant:settings.issues.keyUnreadable`, 0064 §7). */
export const keyUnreadableText = "No pudimos leer la clave guardada: reemplazala.";

/** El aviso del tope del correo, el `detail` que traduce el back (`Messaging.Email.DailyLimit`). */
export const dailyEmailLimitText = "Por ahora no se pueden mandar más correos, y no se guardó nada. Probá de nuevo más tarde.";

const syntheticPhone = /^\+54911345678\d{2}$/u;
const testMailbox = /^[^@\s]+@example\.test$/u;
const organizationIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

/**
 * Los teléfonos de los chats del paso 13, propios de cada ancho: el del cliente de la E11 (su conversación tiene la respuesta
 * de la Dueña) y el de la consulta mínima de Plataforma que arma el preparador.
 */
export function chatPhones(width) {
  assert.ok(width === 1440 || width === 390, "Los chats son de los dos anchos del recorrido.");
  return width === 1440 ? { organization: "+5491134567884", platform: "+5491134567872" } : { organization: "+5491134567885", platform: "+5491134567873" };
}

/**
 * La orden `delivery` que deja la última invitación de un correo de prueba en un estado de la cola (B-2). Lleva la
 * organización del recorrido, que invita en la suya: sin ella, el preparador busca en la empresa fija de E7.
 */
export function invitationDeliveryOrder(email, outcome, tenantId) {
  assert.ok(["Pending", "Uncertain", "Failed"].includes(outcome), "La cola queda en espera, sin confirmar o sin salir.");
  assert.match(email, testMailbox, "La invitación es de un correo de prueba.");
  assert.match(String(tenantId ?? ""), organizationIdPattern, "La invitación es de la organización del recorrido.");
  return { kind: "invitation", email, outcome, tenantId };
}

/**
 * La orden `delivery` que deja «Sin confirmar» el último mensaje que salió de un chat, de la organización o de Plataforma (B-2).
 * El de la organización lleva la del recorrido, donde conversó el cliente de la E11; el de Plataforma, ninguna.
 */
export function chatDeliveryOrder(scope, phone, tenantId) {
  assert.ok(scope === "organization" || scope === "platform", "El chat es de la organización o de Plataforma.");
  assert.match(phone, syntheticPhone, "El teléfono es sintético de la fixture.");
  if (scope === "platform") {
    assert.equal(tenantId, undefined, "Una consulta de Plataforma no es de una organización.");
    return { kind: "chatMessage", scope, phone, outcome: "Uncertain" };
  }
  assert.match(String(tenantId ?? ""), organizationIdPattern, "El chat es de la organización del recorrido.");
  return { kind: "chatMessage", scope, phone, outcome: "Uncertain", tenantId };
}

/** Las órdenes `invitation-quota` (B-3): dejar a quien invita a `remaining` invitaciones de su tope del día, y soltarlo. */
export function invitationQuotaOrders(email, remaining = 1) {
  assert.ok(Number.isInteger(remaining) && remaining >= 0 && remaining <= 10, "Quedan de 0 a 10 invitaciones.");
  assert.match(email, testMailbox, "Quien invita tiene un correo de prueba.");
  return { fill: { kind: "fill", email, remaining }, release: { kind: "release", email } };
}

/** «Lo revisó Cuenta E2E · 25/11/2026, 22:22»: quién y cuándo, con la fecha y la hora después de una coma. Quien revisa sin
 * nombre (la Dueña del recorrido se registra solo con su correo) queda «Revisado · 25/11/2026, 22:22», sin el correo. */
export function isReviewedLine(text, named = true) {
  const who = named ? "Lo revisó \\S.*" : "Revisado";
  return new RegExp(`^${who} · \\d{2}/\\d{2}/\\d{4}, \\d{2}:\\d{2}$`, "u").test(String(text).replace(/\s+/gu, " ").trim());
}

/** Una espera de un 429 desde una hora, como la dice el front (`formatWait`): horas y minutos, redondeados para arriba. */
export function waitInHours(seconds) {
  assert.ok(Number.isFinite(seconds) && seconds >= 3600, "La espera es de una hora o más.");
  const minutes = Math.ceil(Math.ceil(seconds) / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${Math.floor(minutes / 60)} h` : `${Math.floor(minutes / 60)} h ${rest} min`;
}

/**
 * Lo que falta en la espera que dice la pantalla (ADR 0063 §7, como Mi cuenta): el botón dice «Reintentá en 22 h 53 min», en
 * horas y minutos, y no más que la espera del 429 ni más de dos minutos menos, porque la cuenta corre mientras se mira.
 * Devuelve lo que falta, o nada.
 */
export function screenWaitProblems(label, retryAfter) {
  const text = String(label ?? "").replace(/\s+/gu, " ").trim();
  const match = text.match(/^Reintentá en (\d+) h(?: (\d+) min)?$/u);
  if (!match) return [`el botón dice «${text}» y no la espera en horas`];
  const shown = Number(match[1]) * 60 + Number(match[2] ?? 0);
  const longest = Math.ceil(Math.ceil(retryAfter) / 60);
  return shown <= longest && shown >= longest - 2 ? [] : [`el botón dice ${shown} min y el 429 ${longest} min`];
}

/**
 * Lo que falta en el 429 del tope del correo (ADR 0063): el código, la espera de horas en `retryAfter` y en `Retry-After`,
 * y el aviso traducido. Devuelve lo que falta, o nada.
 */
export function dailyEmailLimitProblems(status, problem, retryAfterHeader) {
  const problems = [];
  if (status !== 429) problems.push(`respondió ${status} y no 429`);
  if (problem?.code !== "Messaging.Email.DailyLimit") problems.push(`el código es ${problem?.code ?? "ninguno"}`);
  if (!Number.isInteger(problem?.retryAfter) || problem.retryAfter < 3600) problems.push("la espera no es de horas");
  else if (String(problem.retryAfter) !== String(retryAfterHeader ?? "")) problems.push("Retry-After no dice la misma espera");
  if (problem?.detail !== dailyEmailLimitText) problems.push("el aviso no es el del tope del correo");
  return problems;
}

/** El mes como rango (formatos.md, `month`): «01/11/2026 – 30/11/2026», del primero al último día, con la raya y espacios. */
export function isMonthRange(text) {
  const match = String(text).trim().match(/^(\d{2})\/(\d{2})\/(\d{4}) – (\d{2})\/(\d{2})\/(\d{4})$/u);
  if (!match) return false;
  const [, fromDay, fromMonth, fromYear, toDay, toMonth, toYear] = match.map(Number);
  const last = new Date(Date.UTC(fromYear, fromMonth, 0)).getUTCDate();
  return fromDay === 1 && toDay === last && fromMonth === toMonth && fromYear === toYear;
}

/** El porcentaje pegado de es-AR (formatos.md, `percent`): «80%» o «12,5%», sin espacio antes del signo. */
export function isJoinedPercent(text) {
  return /^\d{1,3}(?:,\d+)?%$/u.test(String(text).trim());
}

/**
 * Lo vacío al final (264): en una columna ordenada, las filas sin dato («—» o nada) van después de todas las que tienen,
 * en los dos sentidos. Devuelve si se cumple para los valores en el orden en que se ven.
 */
export function emptiesLast(values) {
  const empty = (value) => value === null || value === undefined || ["", "—"].includes(String(value).trim());
  const firstEmpty = values.findIndex(empty);
  return firstEmpty < 0 || values.slice(firstEmpty).every(empty);
}

/**
 * El tope del día en una organización (271 y 283): dice cuándo vuelven las consultas, a las 00:00, en la hora de la
 * organización y nombrándola («hora de Empresa E2E»). Devuelve lo que falta, o nada.
 */
export function dailyLimitProblems(text, organization) {
  const problems = [];
  const sentence = String(text).replace(/\s+/gu, " ").trim();
  if (!sentence.includes(`de hoy en ${organization}`)) problems.push("no nombra la organización del cupo");
  if (!/Vuelven el \d{2}\/\d{2}\/\d{4}, a las 00:00/u.test(sentence)) problems.push("no dice que vuelven a las 00:00 con la fecha");
  if (!sentence.includes(`hora de ${organization}`)) problems.push("no nombra la hora de la organización");
  return problems;
}

/** El nombre con que firma un correo .eml: el de su «From:» (RFC 5322), sin la dirección ni las comillas. */
export function senderNameOf(eml) {
  const from = String(eml).match(/^From:\s*(.*)$/imu)?.[1]?.trim() ?? "";
  const name = from.replace(/\s*<[^>]*>\s*$/u, "").replace(/^"(.*)"$/u, "$1").trim();
  return decodeMimeWords(name);
}

/** Un encabezado con palabras codificadas (RFC 2047, `=?utf-8?B?…?=` o `=?utf-8?Q?…?=`), en texto. */
export function decodeMimeWords(text) {
  return String(text).replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/gu, (_, charset, encoding, data) => {
    assert.match(charset, /^utf-?8$/iu, "Los correos del recorrido van en UTF-8.");
    const bytes = encoding.toUpperCase() === "B" ? Buffer.from(data, "base64")
      : Buffer.from(data.replace(/_/gu, " ").replace(/=([0-9A-F]{2})/giu, (_match, hex) => String.fromCharCode(parseInt(hex, 16))), "latin1");
    return bytes.toString("utf8");
  });
}

/** El texto de un correo de código, para buscar el nombre de la aplicación en su cuerpo. */
export const codeEmailText = (eml) => plainTextBody(eml) ?? "";

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

/**
 * El título del Inicio de la organización ya cargado: en la compu, «Inicio»; en el teléfono (M-Inicio-Org, PhoneHome), el
 * nombre de la organización debajo de «Hola». En el teléfono, «Inicio» se ve solo mientras carga: no sirve para esperarlo.
 */
export const loadedHomeHeading = (phone, organization) => phone ? organization : "Inicio";

/**
 * Los pasos, cada uno una función que devuelve lo que pasó. El recorrido los corre en orden con su registro; en la puerta,
 * el conductor de la I3 los corre de a uno sobre el mismo entorno aislado para probarlos a mano.
 * `ctx`: las pestañas (`page` de la organización y `platformPage` del operador), el ancho, el entorno aislado (`env`, con
 * `command`), la base, y las sesiones del recorrido (`login(email, access, target)`, `signOut`, `awaitApp`), con la Dueña
 * (`owner`), su organización (`organization`) y el operador (`operator`).
 */
export function base12bSteps(ctx) {
  const { page, platformPage, width, env, base, owner, organization } = ctx;
  const phone = width < 768;
  // La invitación del paso 08, que el 09 ordena: propia de este ancho y de esta corrida.
  const invitee = ctx.invitee ?? `e2e-b12b-orden-${width}-${Date.now().toString(36)}@example.test`;
  // El plazo de los chats (07 y 10) y el nombre de los correos (10), distintos por ancho para ver que cambian.
  const chatRetention = width === 1440 ? 60 : 45;
  // La marca de esta corrida: los roles que se crean no chocan con los de otra corrida en la misma base.
  const tag = ctx.tag ?? Date.now().toString(36).slice(-4);
  const firstRole = `Recorrido ${width} ${tag}`;
  const adminRole = `Roles del recorrido ${width} ${tag}`;
  const appName = `Tienda Recorrido ${width}`;
  const senderName = `Avisos Recorrido ${width}`;
  // La pestaña del operador: como la de la Dueña, espera el ingreso o Plataforma, lo que aparezca.
  const ensureOperator = async () => {
    await platformPage.goto(url("/plataforma"));
    const loginBox = platformPage.getByRole("textbox", { name: "Correo electrónico", exact: true });
    const inside = platformPage.getByRole("button", { name: /, Plataforma$/u }).or(platformPage.getByRole("navigation", { name: "Secciones", exact: true }));
    await loginBox.or(inside).filter({ visible: true }).first().waitFor({ timeout: 30_000 });
    if (await loginBox.filter({ visible: true }).count()) await ctx.login(ctx.operator, "platform", platformPage);
  };
  const url = (route) => new URL(route, base).href;
  const heading = (target, name) => target.getByRole("heading", { name, exact: true }).filter({ visible: true }).first().waitFor();
  // La pestaña de la Dueña: si no tiene sesión, la redirección al ingreso llega después de cargar; se espera lo que aparezca.
  const asOwner = async (route) => {
    await page.goto(url(route));
    const loginBox = page.getByRole("textbox", { name: "Correo electrónico", exact: true }).or(page.getByRole("link", { name: "Ingresá", exact: true }));
    // Adentro: la barra de la organización, o el aviso del asistente del Inicio, que es modal y la tapa la primera vez. En el
    // teléfono, una pantalla de crear (M-Rol, con guardar fijo abajo) no muestra la barra ni las secciones: su barra de arriba
    // (`app-bar`, solo de las zonas privadas) dice que ya está adentro.
    const inside = page.getByRole("button", { name: new RegExp(`, ${escapeRegExp(organization)}$`, "u") }).or(page.getByRole("navigation", { name: "Secciones", exact: true }))
      .or(page.locator('header[data-slot="app-bar"]'))
      .or(page.getByRole("dialog", { name: "Antes de tu primera consulta", exact: true }));
    await loginBox.or(inside).filter({ visible: true }).first().waitFor({ timeout: 30_000 });
    if (await loginBox.filter({ visible: true }).count()) {
      await ctx.login(owner, "business", page);
      await page.goto(url(route));
      await inside.filter({ visible: true }).first().waitFor({ timeout: 30_000 });
    }
  };
  // La organización del recorrido (la de la Dueña), para las órdenes `delivery` de los pasos 12 y 13: se lee una vez.
  let tenantId;
  const organizationId = async () => {
    if (!tenantId) {
      await asOwner("/org");
      tenantId = (await readJourneyIdentity(page, { base, access: "business" })).activeTenantId;
      assert.match(String(tenantId ?? ""), organizationIdPattern, "La Dueña tiene una organización activa.");
    }
    return tenantId;
  };
  const tooltipOf = async (target, control) => {
    await control.click({ force: true });
    const tip = target.getByRole("tooltip").filter({ visible: true }).first();
    await tip.waitFor();
    return (await tip.innerText()).trim();
  };
  // Lo que una orden cambió vuelve como estaba aunque el paso falle; si falla el paso, manda su error y no el de volver.
  const withRestore = async (work, restore) => {
    let result;
    try { result = await work(); } catch (error) { await restore().catch(() => {}); throw error; }
    await restore();
    return result;
  };
  // «Invitar usuario» por correo, sin roles, desde Usuarios; devuelve la respuesta del POST y el diálogo.
  const inviteByEmail = async (email, { created = true } = {}) => {
    // El aviso de la invitación anterior puede tapar el botón en el teléfono: se espera a que se vaya.
    await page.locator("[data-sonner-toast]").first().waitFor({ state: "detached", timeout: 15_000 }).catch(() => {});
    await page.getByRole("button", { name: "Invitar usuario", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Invitar usuario", exact: true });
    await dialog.getByRole("textbox", { name: /^Correo/u }).fill(email);
    const [reply] = await Promise.all([
      page.waitForResponse((response) => new URL(response.url()).pathname === "/api/users/invitations" && response.request().method() === "POST"),
      dialog.getByRole("button", { name: /^Invitar$|^Enviar invitación$/u }).click(),
    ]);
    if (created) {
      assert.equal(reply.status(), 201, `Invitar respondió ${reply.status()}.`);
      await dialog.waitFor({ state: "hidden" });
    }
    return { reply, dialog };
  };
  // La ficha de una invitación, buscada en Usuarios por su correo: la caja «Invitación».
  const openInvitation = async (email) => {
    await page.goto(url(`/org/usuarios?search=${encodeURIComponent(email)}`));
    await heading(page, "Usuarios");
    await page.getByRole("link", { name: new RegExp(escapeRegExp(email), "u") }).filter({ visible: true }).first().click();
    await page.waitForURL((current) => /^\/org\/usuarios\/[^/]+$/u.test(current.pathname));
    const box = page.getByRole("region", { name: "Invitación", exact: true });
    await box.waitFor();
    return box;
  };
  // La entrega que dice la caja: la cola sale cada 250 ms en el entorno, así que se recarga hasta verla.
  const deliveryIn = async (state, timeout = 60_000) => {
    const word = deliveryWords[state];
    for (const deadline = Date.now() + timeout; ;) {
      const box = page.getByRole("region", { name: "Invitación", exact: true });
      if (await box.getByText(word, { exact: true }).waitFor({ timeout: 5_000 }).then(() => true, () => false)) return box;
      assert.ok(Date.now() < deadline, `La entrega no llegó a «${word}».`);
      await page.reload();
    }
  };

  return {
    // 260 y F5: las áreas cerradas con su casilla, lo incluido marcado y apagado con su motivo.
    "01": async () => {
      await asOwner("/org/roles/nuevo");
      await heading(page, "Crear un rol");
      await page.getByRole("textbox", { name: "Nombre", exact: true }).fill(firstRole);
      await page.getByRole("button", { name: /^Vale en( |$)/u }).click();
      await page.getByRole("option", { name: /^Toda la organización/u }).click();
      const users = page.getByRole("button", { name: "Abrir o cerrar Usuarios", exact: true });
      await users.waitFor();
      assert.equal(await users.getAttribute("aria-expanded"), "false", "Un rol nuevo tiene todas las áreas cerradas.");
      await page.getByRole("checkbox", { name: "Todos los permisos de Usuarios", exact: true }).waitFor();
      await users.click();
      assert.equal(await users.getAttribute("aria-expanded"), "true", "La flecha abre el área sin marcar su casilla.");
      await page.getByRole("checkbox", { name: "Administrar usuarios", exact: true }).click();
      const read = page.getByRole("checkbox", { name: "Ver usuarios", exact: true });
      assert.equal(await read.getAttribute("aria-checked"), "true", "Lo incluido queda marcado.");
      assert.ok(await read.isDisabled() || await read.getAttribute("aria-disabled") === "true", "Lo incluido queda apagado.");
      const reason = await tooltipOf(page, read);
      assert.equal(reason, "Lo incluye «Administrar usuarios».");
      // Se guarda: el paso 08 lo elige, con el del 02, en la pieza de varios.
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: /^(Crear rol|Guardar cambios|Guardar)$/u }).filter({ visible: true }).last().click();
      await page.getByText(`Creamos el rol ${firstRole}.`, { exact: true }).waitFor();
      return `Áreas cerradas con su casilla; «Ver usuarios» quedó marcado y apagado con «${reason}»${phone ? ", en el teléfono" : ""}, y el rol se guardó.`;
    },
    // 269 y ADR 0061: quien edita un rol no da lo que no tiene; si se lo sacan mientras edita, el servidor responde 403.
    "02": async () => {
      const roleName = adminRole;
      const editor = `e2e-b12b-roles-${width}-${Date.now().toString(36)}@example.test`;
      const checkIn = async (target, area, permission) => {
        const toggle = target.getByRole("button", { name: `Abrir o cerrar ${area}`, exact: true });
        if (await toggle.getAttribute("aria-expanded") !== "true") await toggle.click();
        await target.getByRole("checkbox", { name: permission, exact: true }).click();
      };
      const newRole = async (target, name, permissions) => {
        await target.goto(url("/org/roles/nuevo"));
        await heading(target, "Crear un rol");
        await target.getByRole("textbox", { name: "Nombre", exact: true }).fill(name);
        await target.getByRole("button", { name: /^Vale en( |$)/u }).click();
        await target.getByRole("option", { name: /^Toda la organización/u }).click();
        for (const [area, permission] of permissions) await checkIn(target, area, permission);
      };
      const save = (target) => target.getByRole("button", { name: /^(Crear rol|Guardar cambios|Guardar)$/u }).filter({ visible: true }).last();
      // La Dueña arma el rol que administra roles y ve la auditoría, e invita con él.
      await asOwner("/org/roles");
      await newRole(page, roleName, [["Roles", "Administrar roles"], ["Auditoría", "Ver la auditoría"]]);
      await save(page).click();
      await page.getByText(`Creamos el rol ${roleName}.`, { exact: true }).waitFor();
      await page.goto(url("/org/usuarios"));
      await heading(page, "Usuarios");
      await page.getByRole("button", { name: "Invitar usuario", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Invitar usuario", exact: true });
      await dialog.getByRole("textbox", { name: /^Correo/u }).fill(editor);
      await dialog.getByRole("button", { name: /^Roles de la organización/u }).click();
      await page.getByRole("option", { name: new RegExp(`^${escapeRegExp(roleName)}`, "u") }).click();
      if (phone) await page.getByRole("button", { name: /^Listo/u }).filter({ visible: true }).first().click(); else await page.keyboard.press("Escape");
      const before = new Set(await env.files());
      await dialog.getByRole("button", { name: "Invitar", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
      let link;
      for (const deadline = Date.now() + 60_000; !link && Date.now() < deadline;) {
        link = (await env.messages(editor, before)).map(({ body }) => plainTextBody(body)?.match(/https:\/\/[^\s]+\/invitacion#[A-Za-z0-9_-]+/u)?.[0]).find(Boolean);
        if (!link) await new Promise((resolve) => { setTimeout(resolve, 250); });
      }
      assert.ok(link, "Llegó la invitación al correo aislado.");
      // Quien la recibe entra en otro navegador, con su propia sesión, y abre un rol nuevo con «Ver la auditoría».
      const browser = await chromium.launch({ channel: "chrome", headless: true });
      try {
        const other = await (await browser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR", viewport: page.viewportSize() })).newPage();
        await other.goto(link);
        await heading(other, `Te sumás a ${organization}`);
        await other.getByRole("button", { name: "Aceptar invitación", exact: true }).click();
        await heading(other, `Te sumaste a ${organization}`);
        await other.getByRole("button", { name: "Más tarde", exact: true }).click().catch(() => {});
        await other.waitForURL((current) => current.pathname.startsWith("/org"));
        await newRole(other, `Con auditoría ${width} ${tag}`, [["Auditoría", "Ver la auditoría"]]);
        // Mientras edita, la Dueña le saca «Ver la auditoría» a su rol.
        await page.goto(url("/org/roles"));
        await heading(page, "Roles y permisos");
        // En la compu, el nombre del rol es su link; en el teléfono, la tarjeta entera, que suma sus datos al nombre.
        await page.getByRole("link", { name: new RegExp(`^${escapeRegExp(roleName)}( |$)`, "u") }).filter({ visible: true }).first().click();
        await checkIn(page, "Auditoría", "Ver la auditoría");
        await save(page).click();
        await page.locator('[data-sonner-toast][data-type="success"]').first().waitFor();
        // Al guardar, el servidor responde 403 y la pantalla dice por qué.
        const [reply] = await Promise.all([
          other.waitForResponse((response) => new URL(response.url()).pathname.startsWith("/api/roles") && response.request().method() === "POST"),
          save(other).click(),
        ]);
        assert.equal(reply.status(), 403, "El servidor no deja dar un permiso que ya no se tiene.");
        const problem = await reply.json();
        const shown = other.getByRole("alert").filter({ hasText: /\S/u }).filter({ visible: true }).first();
        await shown.waitFor();
        const text = (await shown.innerText()).trim();
        assert.ok(text.length > 0 && !/HTTP|403|Error/u.test(text), "La pantalla dice por qué, en palabras.");
        assert.equal(await other.getByText(`Creamos el rol Con auditoría ${width} ${tag}.`, { exact: true }).count(), 0, "El rol no se guardó.");
        return `La Dueña le sacó «Ver la auditoría» mientras editaba; al guardar, 403 ${problem.code} y la pantalla dijo «${text}».`;
      } finally { await browser.close(); }
    },
    // 271, 283 y 210: sin consultas del día, el cartel de atención dice cuándo vuelven en la hora de la organización.
    "03": async () => {
      const assistant = createAssistantControl(env.command);
      await assistant("prepare", { email: owner, access: "business" });
      await assistant("quotas", { email: owner, access: "business", remainingMessages: 0, monthlyFraction: 0 });
      // En la compu el chat está en el Inicio; en el teléfono, en su pantalla.
      await asOwner(phone ? "/org/asistente" : "/org");
      await acceptAssistantNoticeFromHome(page);
      const notice = page.getByRole("status").filter({ hasText: "consultas de hoy" }).first();
      await notice.waitFor();
      const text = (await notice.innerText()).trim();
      assert.deepEqual(dailyLimitProblems(text, organization), [], `El tope del día ${dailyLimitProblems(text, organization).join(", ")}.`);
      assert.ok((await notice.getAttribute("class")).includes("border-l-[var(--alerta)]"), "Es el cartel de atención, con el filo ámbar.");
      const help = await tooltipOf(page, notice.getByRole("button"));
      assert.equal(help, "Cada organización tiene su cupo: en otra podés seguir consultando.");
      return `${text.split("\n")[0]} La (i): «${help}».`;
    },
    // F8 («Una subida a la vez»): dos archivos elegidos juntos suben de a uno al mandar, y los dos quedan en la consulta.
    "04": async () => {
      const assistant = createAssistantControl(env.command);
      await assistant("quotas", { email: owner, access: "business", remainingMessages: 50, monthlyFraction: 0 });
      await asOwner(phone ? "/org/asistente" : "/org");
      await acceptAssistantNoticeFromHome(page);
      let active = 0; let most = 0; let done = 0;
      const isUpload = (request) => request.method() === "POST" && /\/assistant\/conversations\/[^/]+\/attachments$/u.test(new URL(request.url()).pathname);
      const started = (request) => { if (isUpload(request)) { active += 1; most = Math.max(most, active); } };
      const finished = (request) => { if (isUpload(request)) { active -= 1; done += 1; } };
      page.on("request", started); page.on("requestfinished", finished); page.on("requestfailed", finished);
      try {
        const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
        await page.locator('input[type="file"]').setInputFiles([
          { name: "recorrido-uno.png", mimeType: "image/png", buffer: png },
          { name: "recorrido-dos.png", mimeType: "image/png", buffer: png },
        ]);
        for (const name of ["recorrido-uno.png", "recorrido-dos.png"]) await page.getByRole("button", { name: `Quitar ${name}`, exact: true }).waitFor();
        await page.getByRole("textbox", { name: "Tu consulta", exact: true }).fill("¿Qué dicen estas dos imágenes?");
        await page.getByRole("button", { name: "Enviar", exact: true }).click();
        const deadline = Date.now() + 60_000;
        while (done < 2 && Date.now() < deadline) await new Promise((resolve) => { setTimeout(resolve, 200); });
        assert.equal(done, 2, "Subieron los dos archivos.");
        assert.equal(most, 1, "Subieron de a uno, nunca dos a la vez.");
        for (const name of ["recorrido-uno.png", "recorrido-dos.png"]) await page.getByText(name, { exact: true }).filter({ visible: true }).first().waitFor();
        return "Dos imágenes elegidas juntas subieron de a una al mandar la consulta, y las dos quedaron adjuntas.";
      } finally { page.off("request", started); page.off("requestfinished", finished); page.off("requestfailed", finished); }
    },
    // 254 (F8): agregar un modelo va en dos pasos (en el teléfono, uno por grupo de datos técnicos) y queda en el catálogo.
    "05": async () => {
      await ensureOperator();
      await createAssistantControl(env.command)("prepare", { email: ctx.operator, access: "platform" });
      await platformPage.goto(url("/plataforma/asistente/configuracion"));
      await heading(platformPage, "Configuración");
      // El título llega antes que las pestañas: se espera la pestaña o el botón antes de ver si hay que cambiar de pestaña.
      const catalog = platformPage.getByRole("tab", { name: /^Catálogo de modelos/u });
      const addModel = platformPage.getByRole("button", { name: /^Agregar modelo$/u }).filter({ visible: true }).first();
      await catalog.or(addModel).first().waitFor();
      if (await catalog.count()) await catalog.click();
      await addModel.click();
      const dialog = platformPage.getByRole("dialog", { name: "Agregar modelo", exact: true });
      await dialog.waitFor();
      const model = `Recorrido ${width} ${tag}`;
      await dialog.getByRole("textbox", { name: "Nombre", exact: true }).fill(model);
      await dialog.getByRole("textbox", { name: "ID", exact: true }).fill(`recorrido-${width}-${tag}`);
      await dialog.getByRole("textbox", { name: "Precio de entrada por millón", exact: true }).fill("3");
      await dialog.getByRole("textbox", { name: "Precio de salida por millón", exact: true }).fill("15");
      const steps = [];
      steps.push((await platformPage.getByText(/^Paso 1 de \d+$/u).filter({ visible: true }).first().innerText()).trim());
      // Los datos técnicos obligatorios, en la pantalla en que estén (en el teléfono, cada grupo en su paso).
      const technical = async () => {
        const current = platformPage.getByRole("dialog");
        // El contexto largo es opcional y sus tarifas se llaman como las de caché: en el teléfono, su paso queda vacío.
        if (await current.getByText("Desde (tokens)", { exact: true }).isVisible()
          && !await current.getByText(/^Contexto \(tokens\)/u).first().isVisible()) return;
        // La casilla se toca por su rótulo, que cubre la fila (CheckboxField).
        if (await current.getByRole("checkbox", { name: "Medio", exact: true }).isVisible()) await checkByLabel(platformPage, "Medio");
        for (const [name, value] of [["Contexto (tokens)", "200000"], ["Salida máxima (tokens)", "64000"], ["Lectura de caché", "0,3"],
          ["Escritura de 5 minutos", "3,75"], ["Escritura de 1 hora", "6"]]) {
          const input = current.getByRole("textbox", { name, exact: true }).first();
          if (await input.isVisible() && !await input.inputValue()) await input.fill(value);
        }
      };
      // Hasta el último paso: «Siguiente»; el último dice «Agregar modelo».
      for (let guard = 0; guard < 6; guard++) {
        const next = platformPage.getByRole("dialog").getByRole("button", { name: "Siguiente", exact: true });
        if (!await next.count()) break;
        await next.click();
        await platformPage.getByRole("dialog", { name: "Datos técnicos", exact: true }).waitFor();
        steps.push((await platformPage.getByText(/^Paso \d+ de \d+$/u).filter({ visible: true }).first().innerText()).trim());
        await technical();
      }
      assert.ok(steps.length >= 2, "Agregar un modelo va en dos pasos o más.");
      await platformPage.getByRole("dialog").getByRole("button", { name: "Agregar modelo", exact: true }).click();
      // Si venció la prueba reciente, la pestaña confirma «Confirmá que sos vos» sola y el código de la app puede esperar al
      // intervalo siguiente: hasta 90 s.
      await platformPage.getByText("Se guardó el modelo.", { exact: true }).first().waitFor({ timeout: 90_000 });
      await platformPage.getByText(model, { exact: true }).filter({ visible: true }).first().waitFor();
      return `Agregar modelo pasó por ${steps.join(", ")} y «${model}» quedó en el catálogo.`;
    },
    // 205, 207 y 208: el mes como rango, el porcentaje pegado y la fecha con la hora después de una coma.
    "06": async () => {
      const assistant = createAssistantControl(env.command);
      await assistant("quotas", { email: owner, access: "business", remainingMessages: 50, monthlyFraction: 0.8 });
      await asOwner("/org/asistente/uso");
      await heading(page, "Uso");
      const month = page.getByRole("combobox", { name: "Mes", exact: true }).filter({ visible: true }).first();
      const range = (await month.innerText()).replace(/\s+/gu, " ").trim();
      assert.ok(isMonthRange(range), `El mes se dice como rango, y dice «${range}».`);
      const progress = page.getByRole("progressbar", { name: "Uso del tope mensual", exact: true });
      const percent = (await progress.getAttribute("aria-valuetext")) ?? "";
      assert.ok(isJoinedPercent(percent), `El porcentaje va pegado, y dice «${percent}».`);
      await page.goto(url("/org/auditoria"));
      await heading(page, "Auditoría");
      const when = (await page.locator("main time").filter({ visible: true }).first().innerText()).trim();
      assert.ok(/^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}$/u.test(when), `La fecha va con la hora después de una coma, y dice «${when}».`);
      return `Uso: el mes «${range}» y el tope del mes al «${percent}»; Auditoría: «${when}».`;
    },
    // 210: cada aviso según su tipo, en la configuración de WhatsApp de la organización y en el Inicio.
    "07": async () => {
      await asOwner("/org/whatsapp/configuracion");
      await heading(page, "Configuración");
      const field = page.getByRole("spinbutton", { name: /^Guardar los mensajes de los chats/u }).or(page.getByRole("textbox", { name: /^Guardar los mensajes de los chats/u })).first();
      // Información: la (i) del plazo, en gris.
      const info = await tooltipOf(page, page.getByRole("button", { name: /Guardar los mensajes de los chats/u }).filter({ visible: true }).first());
      assert.match(info, /^De 1 a /u, "La (i) dice el rango del plazo.");
      // Error: fuera de rango, en su campo y en rojo.
      await field.fill("99999");
      await page.getByRole("button", { name: /^Guardar( cambios)?$/u }).filter({ visible: true }).first().click();
      const error = page.getByRole("alert").filter({ hasText: /^Tiene que ser de 1 a /u }).first();
      await error.waitFor();
      const errorText = (await error.innerText()).trim();
      assert.ok(await field.getAttribute("aria-invalid") === "true", "El error queda en su campo.");
      // Salió bien: el plazo válido se guarda y lo dice el aviso verde con su tilde.
      await field.fill(String(chatRetention));
      await page.getByRole("button", { name: /^Guardar( cambios)?$/u }).filter({ visible: true }).first().click();
      const toast = page.locator('[data-sonner-toast][data-type="success"]').first();
      await toast.waitFor();
      const saved = (await toast.innerText()).trim();
      // Atención: el cartel del tope del día en el Inicio (como en el paso 03), con el triángulo ámbar.
      await createAssistantControl(env.command)("quotas", { email: owner, access: "business", remainingMessages: 0, monthlyFraction: 0 });
      await page.goto(url(phone ? "/org/asistente" : "/org"));
      const warning = page.getByRole("status").filter({ hasText: "consultas de hoy" }).first();
      await warning.waitFor();
      assert.ok((await warning.getAttribute("class")).includes("border-l-[var(--alerta)]"), "El tope es el cartel de atención.");
      return `Información: «${info}». Error: «${errorText}» en su campo. Salió bien: «${saved}». Atención: el tope del día, en ámbar.`;
    },
    // 262 (F11): la pieza elige una y varias, la zona se busca por su ciudad, y el filtro que era segmentado no cuenta.
    "08": async () => {
      await asOwner("/org/usuarios");
      await heading(page, "Usuarios");
      // Varias: los roles de una invitación, con «y N más» o sus nombres; la invitación queda para ordenar en el paso 09.
      await page.getByRole("button", { name: "Invitar usuario", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Invitar usuario", exact: true });
      await dialog.getByRole("textbox", { name: /^Correo/u }).fill(invitee);
      const roles = dialog.getByRole("button", { name: /^Roles de la organización/u });
      await roles.click();
      // Los roles que guardaron los pasos 01 y 02.
      const picked = [firstRole, adminRole];
      for (const name of picked) await page.getByRole("option", { name: new RegExp(`^${escapeRegExp(name)}`, "u") }).click();
      if (phone) await page.getByRole("button", { name: /^Listo \(2\)$/u }).click(); else await page.keyboard.press("Escape");
      const chosen = (await roles.innerText()).replace(/\s+/gu, " ").trim();
      assert.ok(picked.every((name) => chosen.includes(name)) || /y 1 más/u.test(chosen), `La pieza dice las dos elegidas por su nombre o con «y N más», y dice «${chosen}».`);
      await dialog.getByRole("button", { name: /^Invitar$|^Enviar invitación$/u }).click();
      await dialog.waitFor({ state: "hidden" });
      // Una opción: el filtro «Estado», que era un segmentado, sin cantidades. En el teléfono va en «Filtros».
      if (phone) await page.getByRole("button", { name: "Filtrar usuarios", exact: true }).click();
      const state = page.getByRole("button", { name: /^Estado/u }).filter({ visible: true }).first();
      await state.click();
      const options = await page.getByRole("option").filter({ visible: true }).allInnerTexts();
      assert.ok(options.length > 1 && options.every((text) => !/\(\d+\)|\b\d+\s*$/u.test(text.trim())), "El filtro que era segmentado no muestra cantidades.");
      await page.getByRole("option", { name: /^Invitación pendiente/u }).click();
      if (phone) await page.getByRole("dialog", { name: "Filtros", exact: true }).getByRole("button", { name: "Listo", exact: true }).click();
      await page.waitForURL((current) => [...current.searchParams.values()].some((value) => /invit/iu.test(value)));
      await page.getByText(invitee, { exact: true }).filter({ visible: true }).first().waitFor();
      // La zona horaria: se busca por su ciudad y dice la hora de su país.
      await page.goto(url("/org/configuracion"));
      await heading(page, "Configuración");
      await page.getByRole("button", { name: /^Zona horaria predeterminada/u }).click();
      // Las zonas son las del país de la organización: se busca una ciudad y la opción dice la hora de su país.
      await page.getByRole("combobox", { name: "Buscar en Zona horaria predeterminada", exact: true }).fill("Córdoba");
      const zone = page.getByRole("option", { name: /^Córdoba/u });
      const described = (await zone.innerText()).replace(/\s+/gu, " ").trim();
      assert.match(described, /hora de Argentina/u, "La zona dice la hora de su país.");
      await zone.click();
      await page.getByRole("button", { name: /^Zona horaria predeterminada Córdoba/u }).waitFor();
      await page.getByRole("button", { name: "Descartar cambios", exact: true }).click();
      return `Varias: ${chosen}; una: el filtro Estado, sin cantidades, mostró la invitación; la zona: «${described}».`;
    },
    // 264 (F12): el encabezado y «Ordenar por» ordenan, con lo vacío al final y el orden en la dirección.
    "09": async () => {
      await asOwner("/org/usuarios");
      await heading(page, "Usuarios");
      const sortOf = () => new URL(page.url()).searchParams.get("orden") ?? new URL(page.url()).searchParams.get("sort");
      if (!phone) {
        const header = page.getByRole("columnheader", { name: /^Vence/u });
        const values = async () => {
          const headers = await page.getByRole("columnheader").allInnerTexts();
          const index = headers.findIndex((text) => text.trim().startsWith("Vence"));
          const rows = page.getByRole("row").filter({ has: page.getByRole("cell") });
          return Promise.all((await rows.all()).map(async (row) => (await row.getByRole("cell").nth(index).innerText()).trim()));
        };
        // Ordena el servidor: se lee la tabla cuando llega la respuesta con el orden pedido.
        const sortedBy = (direction) => page.waitForResponse((response) => {
          const current = new URL(response.url());
          return current.pathname.startsWith("/api/users") && response.ok()
            && (current.searchParams.get("sort") ?? "").replace(/^-/u, "") === "invitationExpiresAtUtc"
            && (current.searchParams.get("sort") ?? "").startsWith("-") === (direction === "descending");
        });
        const settle = async () => { await page.locator('table[data-slot="table"]:not([aria-busy="true"])').first().waitFor(); await page.waitForTimeout(300); };
        let reply = page.waitForResponse((response) => new URL(response.url()).pathname.startsWith("/api/users") && response.ok()
          && /invitationExpiresAtUtc/u.test(new URL(response.url()).search));
        await header.getByRole("button").click();
        await reply; await settle();
        const first = await header.getAttribute("aria-sort");
        assert.ok(["ascending", "descending"].includes(first), `El encabezado dice cómo ordena, y dice «${first}».`);
        const sorted = await values();
        assert.ok(sorted.some((value) => value === "—" || value === "") && sorted.some((value) => /\d/u.test(value)),
          "Hay personas sin vencimiento y una invitación con su fecha (la del paso 08).");
        assert.ok(emptiesLast(sorted), `Ordenado ${first}, lo vacío va al final.`);
        reply = sortedBy(first === "ascending" ? "descending" : "ascending");
        await header.getByRole("button").click();
        await reply; await settle();
        const second = await header.getAttribute("aria-sort");
        assert.notEqual(second, first, "El segundo toque invierte el orden.");
        assert.ok(emptiesLast(await values()), `Ordenado ${second}, lo vacío sigue al final.`);
      }
      const by = page.getByRole("button", { name: /^Ordenar por/u }).filter({ visible: true }).first();
      await by.click();
      await page.getByRole("button", { name: /^Columna/u }).filter({ visible: true }).first().click();
      await page.getByRole("option", { name: /^Usuario/u }).click();
      await page.getByRole("button", { name: /^Orden( |$)/u }).filter({ visible: true }).first().click();
      await page.getByRole("option", { name: /^De la Z a la A/u }).click();
      if (phone) await page.getByRole("button", { name: /^Listo/u }).filter({ visible: true }).first().click().catch(() => {});
      await page.keyboard.press("Escape").catch(() => {});
      await page.getByRole("button", { name: "Ordenar por: Usuario, de la Z a la A", exact: true }).filter({ visible: true }).first().waitFor();
      const sort = sortOf();
      assert.ok(sort, "El orden queda en la dirección.");
      return `${phone ? "" : "El encabezado «Vence» ordenó en los dos sentidos con lo vacío al final; "}«Ordenar por» quedó en «Usuario, de la Z a la A» y en la dirección (${sort}).`;
    },
    // 270 y 273: el plazo de la organización quedó guardado, y el correo de un código llega con el nombre nuevo.
    "10": async () => {
      await asOwner("/org/whatsapp/configuracion");
      await heading(page, "Configuración");
      const field = page.getByRole("spinbutton", { name: /^Guardar los mensajes de los chats/u }).or(page.getByRole("textbox", { name: /^Guardar los mensajes de los chats/u })).first();
      assert.equal(await field.inputValue(), String(chatRetention), "El plazo de los chats quedó guardado.");
      // El operador cambia el nombre de los correos en Plataforma.
      await ensureOperator();
      await platformPage.goto(url("/plataforma/configuracion"));
      await heading(platformPage, "Configuración");
      // El entorno aislado arranca sin los correos de contacto, que la configuración pide para guardar. El título llega antes
      // que el formulario: sin esperarlo, los correos se saltean y «Guardar cambios» no abre el motivo.
      await platformPage.getByRole("textbox", { name: /^Nombre de la aplicación/u }).waitFor();
      for (const [name, value] of [["Correo de ventas", "ventas@example.test"], ["Correo de soporte", "soporte@example.test"]]) {
        const contact = platformPage.getByRole("textbox", { name: new RegExp(`^${name}`, "u") }).first();
        if (await contact.count() && !await contact.inputValue()) await contact.fill(value);
      }
      await platformPage.getByRole("textbox", { name: /^Nombre de la aplicación/u }).fill(appName);
      await platformPage.getByRole("textbox", { name: /^Nombre del remitente/u }).fill(senderName);
      // «Así llega» lo muestra antes de guardar: el remitente y el asunto con el nombre nuevo.
      await platformPage.getByText(senderName, { exact: true }).first().waitFor();
      await platformPage.getByText(new RegExp(`es tu código de acceso a ${escapeRegExp(appName)}$`, "u")).first().waitFor();
      await platformPage.getByRole("button", { name: /^Guardar( cambios)?$/u }).filter({ visible: true }).first().click();
      // La configuración de Plataforma se guarda con un motivo.
      const confirm = platformPage.getByRole("dialog", { name: "¿Guardar la configuración?", exact: true });
      await confirm.getByRole("textbox", { name: /^Motivo/u }).fill("Recorrido: el nombre de los correos.");
      await confirm.getByRole("button", { name: "Guardar", exact: true }).click();
      await platformPage.locator('[data-sonner-toast][data-type="success"]').first().waitFor({ timeout: 90_000 });
      // La Dueña pide un código: el correo llega con el nombre nuevo.
      await ctx.signOut(page, organization);
      await page.goto(url("/login/empresa"));
      await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(owner);
      const before = new Set(await env.files());
      // Como el resto del recorrido: si la Dueña pidió otro código hace poco, el servidor pide esperar (429 con
      // `retryAfter`) y se vuelve a pedir después.
      for (let attempt = 0; attempt < 4; attempt++) {
        const [reply] = await Promise.all([
          page.waitForResponse((response) => new URL(response.url()).pathname === "/api/auth/login-code" && response.request().method() === "POST"),
          page.getByRole("button", { name: "Enviar código", exact: true }).click(),
        ]);
        if (reply.ok()) break;
        const problem = await reply.json().catch(() => ({}));
        assert.equal(reply.status(), 429, `El pedido del código respondió ${reply.status()} ${problem.code ?? ""}.`);
        await new Promise((resolve) => { setTimeout(resolve, ((problem.retryAfter ?? 30) + 1) * 1000); });
      }
      const deadline = Date.now() + 60_000;
      let mail;
      while (!mail && Date.now() < deadline) {
        mail = (await env.messages(owner, before)).find((item) => pickupCode(item.body));
        if (!mail) await new Promise((resolve) => { setTimeout(resolve, 250); });
      }
      assert.ok(mail, "Llegó el correo del código.");
      const sender = senderNameOf(mail.body);
      assert.equal(sender, senderName, "El correo del código llega con el nombre nuevo del remitente.");
      assert.ok(codeEmailText(mail.body).includes(appName), "El correo nombra la aplicación con su nombre nuevo.");
      await fillOtp(page, pickupCode(mail.body));
      await page.getByRole("button", { name: "Verificar", exact: true }).click();
      await page.waitForURL((current) => current.pathname.startsWith("/org"));
      return `El plazo de los chats quedó en ${chatRetention} días; el operador puso «${appName}» y «${senderName}», y el correo del código llegó de «${sender}» nombrando «${appName}».`;
    },
    // F7: salir en una pestaña cierra la sesión en las demás de ese lado (BroadcastChannel).
    "11": async () => {
      await asOwner("/org");
      await heading(page, loadedHomeHeading(phone, organization));
      const other = await page.context().newPage();
      await other.setViewportSize(page.viewportSize());
      try {
        await other.goto(url("/org/usuarios"));
        await heading(other, "Usuarios");
        await ctx.signOut(page, organization);
        await other.waitForURL((current) => !current.pathname.startsWith("/org"), { timeout: 15_000 });
        const where = new URL(other.url()).pathname;
        await other.getByRole("link", { name: "Ingresá", exact: true }).or(other.getByRole("textbox", { name: "Correo electrónico", exact: true }))
          .filter({ visible: true }).first().waitFor();
        return `Salió en una pestaña y la otra, que estaba en Usuarios, dejó la organización sola y quedó en ${where}, con el ingreso.`;
      } finally { await other.close(); }
    },
    // 0066 §4 (B6) y tablero Usuario-Base2: la entrega de una invitación por correo en cada estado, cada una con su (i) salvo
    // la enviada, y «Reenviar» de la «Sin confirmar» pide revisar con la persona. En el entorno el correo sale enseguida: la
    // orden `delivery` deja la cola en espera, sin confirmar o sin salir.
    "12": async () => {
      const organizationTenant = await organizationId();
      await asOwner("/org/usuarios");
      await heading(page, "Usuarios");
      const states = ["Pending", "Sent", "Uncertain", "Failed"];
      const emails = Object.fromEntries(states.map((state) => [state, `e2e-b12b-entrega-${state.toLowerCase()}-${width}-${tag}@example.test`]));
      const before = new Set(await env.files());
      for (const state of states) await inviteByEmail(emails[state]);
      for (const state of ["Pending", "Uncertain", "Failed"]) {
        await env.command("delivery", invitationDeliveryOrder(emails[state], state, organizationTenant));
      }
      // La enviada: su correo llegó al pickup aislado.
      for (const deadline = Date.now() + 60_000; !(await env.messages(emails.Sent, before)).length;) {
        assert.ok(Date.now() < deadline, "Llegó la invitación que salió.");
        await new Promise((resolve) => { setTimeout(resolve, 250); });
      }
      const seen = [];
      for (const state of states) {
        await openInvitation(emails[state]);
        const box = await deliveryIn(state);
        if (state !== "Sent") {
          const why = await tooltipOf(page, box.getByRole("button", { name: `Más información sobre ${deliveryWords[state]}`, exact: true }));
          assert.equal(why, emailDeliveryReasons[state], `La (i) de «${deliveryWords[state]}» dice por qué.`);
          await page.keyboard.press("Escape");
        }
        seen.push(deliveryWords[state]);
      }
      // «Reenviar invitación» de la «Sin confirmar»: pide revisar con la persona antes, y la nueva sale.
      const box = await openInvitation(emails.Uncertain);
      await box.getByRole("button", { name: "Reenviar invitación", exact: true }).click();
      const confirm = page.getByRole("dialog", { name: /^¿Reenviar la invitación a /u });
      await confirm.waitFor();
      assert.ok((await confirm.innerText()).replace(/\s+/gu, " ").includes(resendUncertainText), "La confirmación pide revisar con la persona antes de reenviar.");
      await confirm.getByRole("button", { name: "Reenviar", exact: true }).click();
      await page.getByText(`Reenviamos la invitación a ${emails.Uncertain}.`, { exact: true }).first().waitFor();
      await deliveryIn("Sent");
      return `Las cuatro invitaciones dijeron ${seen.map((word) => `«${word}»`).join(", ")}, con su (i) salvo la enviada; «Reenviar» de la «Sin confirmar» pidió revisar con la persona y la reenvió, que quedó «Enviada».`;
    },
    // 0066 §2 y tableros WA-Chats-Base2 y Plat-WA-Chats-Base2: lo que salió sin que WhatsApp lo confirmara queda «Sin
    // confirmar» con su (i) y «Marcar como revisado»; revisado, quién y cuándo. En el entorno WhatsApp no sale nunca: la orden
    // `delivery` deja el mensaje así, y en Plataforma arma una consulta mínima (su número atiende el ingreso de la E8).
    "13": async () => {
      const phones = chatPhones(width);
      // `named`: el operador tiene nombre; la Dueña no, y su revisión dice «Revisado · …» (`chats.thread.reviewed`).
      const review = async (target, route, named) => {
        await target.goto(url(route));
        const thread = () => target.getByRole("log", { name: /^Mensajes con /u }).filter({ visible: true }).first();
        await thread().getByText(deliveryWords.Uncertain, { exact: true }).first().waitFor();
        const why = await tooltipOf(target, thread().getByRole("button", { name: `Más información sobre ${deliveryWords.Uncertain}`, exact: true }).first());
        assert.equal(why, uncertainChatReason, "La (i) dice que no se sabe si salió y que revisar no lo reenvía.");
        await target.keyboard.press("Escape");
        await thread().getByRole("button", { name: "Marcar como revisado", exact: true }).click();
        const line = thread().getByText(named ? /^Lo revisó /u : /^Revisado · /u).first();
        await line.waitFor();
        const reviewed = (await line.innerText()).replace(/\s+/gu, " ").trim();
        assert.ok(isReviewedLine(reviewed, named), `Revisado dice ${named ? "quién y " : ""}cuándo, y dice «${reviewed}».`);
        await target.reload();
        await thread().getByText(reviewed, { exact: true }).waitFor();
        return reviewed;
      };
      const organizationChat = await env.command("delivery", chatDeliveryOrder("organization", phones.organization, await organizationId()));
      await asOwner(`/org/whatsapp/chats/${organizationChat.chatId}`);
      const inOrganization = await review(page, `/org/whatsapp/chats/${organizationChat.chatId}`, false);
      const consultation = await env.command("delivery", chatDeliveryOrder("platform", phones.platform));
      await ensureOperator();
      const inPlatform = await review(platformPage, `/plataforma/whatsapp/consultas/${consultation.chatId}`, true);
      return `La organización: «Sin confirmar» con su (i) y «${inOrganization}» al revisarlo, que quedó al recargar; Plataforma, en Consultas: «${inPlatform}».`;
    },
    // 0064 §7: la clave guardada que no se puede leer se dice en las dos configuraciones, con «Reemplazar clave». La orden
    // `unreadableKey` la deja cifrada con otro propósito; al final las dos vuelven a la clave del entorno.
    "14": async () => {
      const assistant = createAssistantControl(env.command);
      const unreadable = async (target, route) => {
        await target.goto(url(route));
        await heading(target, "Configuración");
        const notice = target.getByRole("dialog", { name: "Antes de tu primera consulta", exact: true });
        const issue = target.getByRole("alert").filter({ hasText: keyUnreadableText }).first();
        await issue.or(notice).first().waitFor();
        if (await notice.isVisible()) { await notice.getByRole("button", { name: "Entendido", exact: true }).click(); await notice.waitFor({ state: "hidden" }); }
        await issue.waitFor();
        await target.getByRole("button", { name: "Reemplazar clave", exact: true }).filter({ visible: true }).first().waitFor();
        return (await issue.innerText()).trim();
      };
      // Al final, las dos vuelven a la clave del entorno, para lo que sigue y para el otro ancho.
      return withRestore(async () => {
        await assistant("prepare", { email: owner, access: "business" });
        await assistant("unreadableKey", { email: owner, access: "business" });
        await asOwner("/org/asistente/configuracion");
        const inOrganization = await unreadable(page, "/org/asistente/configuracion");
        await ensureOperator();
        await assistant("prepare", { email: ctx.operator, access: "platform" });
        await assistant("unreadableKey", { email: ctx.operator, access: "platform" });
        const inPlatform = await unreadable(platformPage, "/plataforma/asistente/configuracion");
        return `La organización dijo «${inOrganization}» y Plataforma «${inPlatform}», cada una con «Reemplazar clave».`;
      }, async () => {
        await assistant("prepare", { email: owner, access: "business" });
        await assistant("prepare", { email: ctx.operator, access: "platform" });
      });
    },
    // ADR 0063 y 256: el tope de invitaciones por correo de quien invita. El entorno corre con los topes altos: la orden
    // `invitation-quota` deja a la Dueña a una invitación del suyo y después lo suelta, así lo que sigue invita como siempre.
    // Termina con la persona afuera, como la segunda parte.
    "15": async () => {
      const orders = invitationQuotaOrders(owner, 1);
      await env.command("invitation-quota", orders.fill);
      return withRestore(async () => {
        await asOwner("/org/usuarios");
        await heading(page, "Usuarios");
        const last = `e2e-b12b-tope-ultima-${width}-${tag}@example.test`;
        const over = `e2e-b12b-tope-pasada-${width}-${tag}@example.test`;
        await inviteByEmail(last);
        const { reply, dialog } = await inviteByEmail(over, { created: false });
        const problem = await reply.json().catch(() => ({}));
        const problems = dailyEmailLimitProblems(reply.status(), problem, reply.headers()["retry-after"]);
        assert.deepEqual(problems, [], `El tope ${problems.join(", ")}.`);
        // La pantalla, como Mi cuenta (0063 §7): el aviso en la franja del diálogo y la espera en horas en el botón, apagado
        // mientras cuenta; sin el aviso de abajo.
        await dialog.getByRole("alert").filter({ hasText: dailyEmailLimitText }).first().waitFor();
        const waiting = dialog.getByRole("button", { name: /^Reintentá en /u });
        await waiting.waitFor();
        const shown = (await waiting.innerText()).replace(/\s+/gu, " ").trim();
        const waitProblems = screenWaitProblems(shown, problem.retryAfter);
        assert.deepEqual(waitProblems, [], `La espera en pantalla: ${waitProblems.join(", ")}.`);
        assert.ok(await waiting.isDisabled(), "El botón se apaga mientras cuenta la espera.");
        assert.equal(await page.locator('[data-sonner-toast][data-type="error"]').filter({ hasText: dailyEmailLimitText }).count(), 0,
          "El tope se dice en el diálogo, no también abajo.");
        await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
        await dialog.waitFor({ state: "hidden" });
        // No se guardó: Usuarios no la encuentra.
        const [listed] = await Promise.all([
          page.waitForResponse((response) => new URL(response.url()).pathname === "/api/users/paged"
            && new URL(response.url()).searchParams.get("search") === over && response.ok()),
          page.goto(url(`/org/usuarios?search=${encodeURIComponent(over)}`)),
        ]);
        assert.equal((await listed.json()).items.length, 0, "La invitación pasada del tope no quedó en Usuarios.");
        await ctx.signOut(page, organization);
        return `La última del tope salió; la siguiente respondió 429 ${problem.code} con la espera de ${waitInHours(problem.retryAfter)}, el diálogo dijo «${dailyEmailLimitText}» y «${shown}» en el botón, apagado, y no quedó en Usuarios.`;
      }, () => env.command("invitation-quota", orders.release));
    },
  };
}

/** Los pasos que terminan en la pestaña del operador. */
export const base12bPlatformCaptures = new Set(["05", "13", "14"]);

/** Sigue a la base de la 12 en las mismas pestañas; arranca y termina con la persona afuera y el operador en Plataforma. */
export async function runBase12bJourney(ctx) {
  assert.ok(typeof ctx?.env?.command === "function" && typeof ctx.env.files === "function",
    "La segunda parte de la base necesita las órdenes y el correo aislados del mismo entorno.");
  assert.ok([ctx.record, ctx.login, ctx.signOut, ctx.awaitApp].every((value) => typeof value === "function")
    && [ctx.owner, ctx.organization, ctx.operator].every((value) => typeof value === "string" && value.length > 0),
    "La segunda parte de la base sigue al recorrido: necesita sus sesiones, la Dueña, su organización y el operador.");
  const steps = base12bSteps(ctx);
  for (const { id } of base12bDefinitions) {
    const key = id.slice("B12B-".length);
    // Los pasos que terminan en la pestaña del operador (el modelo nuevo, la consulta revisada y la clave ilegible de
    // Plataforma) se capturan en esa pestaña.
    const target = base12bPlatformCaptures.has(key) ? ctx.platformPage : ctx.page;
    await ctx.record(id, ctx.width, () => target, steps[key], (error) => `Ruta ${new URL(target.url()).pathname}; ${error.name}. Los correos y los códigos se omiten.`);
  }
}
