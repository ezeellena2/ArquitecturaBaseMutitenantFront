import assert from "node:assert/strict";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { reloadResponse, responsesForAction, safeActionErrorKind } from "./test-e2e-real-whatsapp-action.mjs";
import { readJourneyIdentity, requireE8Control, safeJourneyHttp, sendWithCooldown } from "./recorrido-usuario-whatsapp.mjs";

// E11: la atención por WhatsApp de una organización, con el canal privado de Testing de la E8 (WhatsAppBrowserControl) y
// sin Meta. El número lo conecta el control; lo que escribe la persona entra firmado al webhook real y el bot corre con el
// worker real. Lo demás es la app: Plataforma prende el módulo y la Dueña arma equipos, bot, chats, contacto y teléfonos.
export const e11ManualChecks = [
  "Meta real: conectar un número con el alta insertada de Facebook (la ventana de Meta) y su medio de pago.",
  "WhatsApp real: escribir al número de la organización desde un teléfono, recibir el menú, la respuesta de quien atiende y el botón «Vincular mi cuenta»; el webhook firmado y el outbox de prueba no certifican Meta.",
  "WhatsApp real: recibir en el teléfono la invitación de «Cargar teléfonos»; el recorrido solo revisa la lista.",
];

const definition = (id, title, expected, extra = {}) => ({ id: `E11-${id}`, title: `E11 · ${title}`, expected, ...extra });
export const e11Definitions = [
  definition("01", "Prender WhatsApp para la organización", "Plataforma › Organización › Módulos prende WhatsApp con motivo, por UI y con la versión leída."),
  definition("02", "Número conectado", "El control conecta un número sin Meta; la Dueña lo ve Conectado en Números y F5 lo conserva.", { controlled: true }),
  definition("03", "Equipos Ventas y Soporte", "La Dueña crea dos equipos de Clientes por UI, con una persona y sin aviso por correo."),
  definition("04", "Opción del bot", "El bot del número suma «Hacer un pedido», que pasa a Ventas; F5 la conserva."),
  definition("05", "Cliente con cuenta por WhatsApp", "El registro por WhatsApp y el OTP controlado crean la cuenta Phone de quien va a escribir.", { controlled: true }),
  definition("06", "El cliente escribe y recibe el menú", "«Hola» entra firmado al webhook real y el bot contesta la bienvenida con su menú, todavía sin ofrecer vincular.", { controlled: true }),
  definition("07", "Elige una opción y pasa al bot", "La fila «Hacer un pedido» pasa la conversación a Ventas y el bot ofrece «Vincular mi cuenta».", { controlled: true }),
  definition("08", "Vincula su cuenta", "El botón del bot vincula la conversación con la cuenta y el bot lo confirma.", { controlled: true }),
  definition("09", "Chats: contador y conversación sin tomar", "Chats cuenta una sin tomar; la conversación está en Ventas, vinculada a su cuenta."),
  definition("10", "Tomar y responder", "Tomar y responder dejan la respuesta en el hilo y en el outbox de prueba, sin «entregado» ni Meta.", { controlled: true }),
  definition("11", "Nota interna", "La nota queda en el hilo para el equipo y nunca sale: el outbox no suma nada.", { controlled: true }),
  definition("12", "Pasar a Soporte", "Pasar manda la versión de la fila y la conversación queda en Soporte."),
  definition("13", "Contacto con etiqueta nueva", "La ficha del contacto edita sus etiquetas creando una nueva; F5 la conserva."),
  definition("14", "Cargar teléfonos: revisar", "La revisión dice cuántos se invitan y cuántos son inválidos, sin decir si hay cuenta y sin mandar invitaciones."),
  definition("15", "Mensajes de la persona", "La persona entra por WhatsApp y ve en «Mensajes» la respuesta de la organización y nunca la nota."),
];

/** El número que conecta el control (WhatsAppBrowserControl.OrganizationDisplayNumber). */
export const e11OrganizationNumber = "+5491134567700";
const linkButton = "bot.link";

/** La fila del menú que mostró el bot con ese título, como la toca la persona. */
export function botOption(turn, title) {
  const row = turn?.list?.find((item) => item.title === title);
  assert.ok(row, "El bot no mostró la opción en su menú.");
  return { type: "list", id: row.id };
}

/** Lo que salió de la conversación: cuántos envíos hay y que ninguno sea una nota. */
export function outboundCount(rows) {
  assert.ok(Array.isArray(rows) && rows.every((row) => typeof row?.kind === "string" && typeof row?.status === "string"), "El control devuelve solo tipo y estado.");
  assert.ok(rows.every((row) => row.kind !== "Note"), "Una nota no sale nunca.");
  return rows.length;
}

/** Un teléfono argentino E.164 como lo escribe la Dueña en «Cargar teléfonos»: 11 3456-7884. */
export function nationalPhone(e164) {
  const match = /^\+549(11)(\d{4})(\d{4})$/.exec(e164);
  assert.ok(match, "El teléfono del recorrido es un celular sintético de Buenos Aires.");
  return `${match[1]} ${match[2]}-${match[3]}`;
}

/** Sigue a E8 y 8b en las mismas pestañas: arranca y termina con la persona afuera y Plataforma adentro. */
export async function runE11Journey({ page, platformPage, width, env, base, record, signOut, awaitApp, loginBusiness, organization }) {
  const begin = requireE8Control(env);
  const customer = width === 1440 ? "+5491134567884" : "+5491134567885";
  const option = "Hacer un pedido";
  // No empieza como la organización («Recorrido 1440 …»), para que buscarla no encuentre otra cosa.
  const tag = `VIP ${width}`;
  const answer = `Hola, ya te tomamos el pedido (${width}).`;
  const note = `Revisar stock antes de confirmar (${width}).`;
  const organizationApi = "/api/organization/whatsapp";
  let phase = "step"; let lastHttp = null;
  const step = (id, action, target = page) => {
    phase = "step"; lastHttp = null;
    return record(`E11-${id}`, width, () => target, action,
      (error) => `Ruta ${new URL(target.url()).pathname}; tipo ${safeActionErrorKind(error)}; fase ${phase}; HTTP ${JSON.stringify(lastHttp)}. Las pruebas privadas se omiten.`);
  };
  const url = (route) => new URL(route, base).href;
  const responseFor = (endpoint, method = "GET") => (reply) => new URL(reply.url()).pathname === endpoint && reply.request().method() === method;
  const act = async (target, action, endpoint, method = "POST") => {
    const [reply] = await responsesForAction(target, [responseFor(endpoint, method)], action);
    lastHttp = safeJourneyHttp(reply.status(), reply.status() >= 400 ? await reply.json().catch(() => ({})) : {});
    assert.ok(reply.ok(), "La acción de la UI no pasó en la API.");
    return reply;
  };
  const visit = async (route, endpoints) => {
    const replies = await responsesForAction(page, endpoints.map((endpoint) => responseFor(endpoint)), () => page.goto(url(route)));
    for (const reply of replies) assert.equal(reply.status(), 200);
    return Promise.all(replies.map((reply) => reply.json()));
  };
  const closeMenu = async () => { if (await page.getByRole("menu").isVisible()) await page.keyboard.press("Escape"); };
  /** En el teléfono, lo que no está a la vista va en el ⋮ de la barra (moreActions de Page). */
  const barAction = async (label) => {
    await page.getByRole("button", { name: /^Acciones de / }).first().click();
    await page.getByRole("menuitem", { name: label, exact: true }).click();
  };
  const channel = async (destination) => {
    await page.getByRole("button", { name: "WhatsApp", exact: true }).click();
    await page.getByRole("textbox", { name: /^(Tu )?número de WhatsApp$/i }).fill(destination);
  };
  const sendCode = (button, endpoint) => sendWithCooldown(async () => (await responsesForAction(page, [responseFor(endpoint, "POST")], () => button.click()))[0],
    { observe: (value) => { lastHttp = value; } });

  let tenantId; let org; let numberId; let conversation; let sent; const teams = {};
  await step("01", async () => {
    phase = "owner"; await loginBusiness();
    tenantId = (await readJourneyIdentity(page, { base, access: "business" })).activeTenantId;
    assert.equal(typeof tenantId, "string", "La Dueña tiene una organización activa.");
    phase = "modules";
    await platformPage.goto(url(`/plataforma/organizaciones/${tenantId}?tab=modules`));
    await platformPage.getByRole("tab", { name: /^Módulos/ }).click();
    await platformPage.getByRole("button", { name: "Acciones de WhatsApp", exact: true }).click();
    await platformPage.getByRole("menuitem", { name: "Prender", exact: true }).click();
    const dialog = platformPage.getByRole("dialog");
    await dialog.getByRole("textbox", { name: /Motivo/ }).fill("Recorrido E11 con el canal privado de Testing.");
    await act(platformPage, () => dialog.getByRole("button", { name: "Prender", exact: true }).click(), `/api/platform/tenants/${tenantId}/features/whatsapp`, "PUT");
    await dialog.waitFor({ state: "hidden" });
    return "Plataforma prendió WhatsApp con motivo y la versión leída, por UI.";
  }, platformPage);
  await step("02", async () => {
    org = await begin(`walkthrough-e11-org-${width}`, customer);
    numberId = (await org("orgNumber", { tenantId })).numberId;
    assert.equal(typeof numberId, "string");
    phase = "numbers";
    const [list] = await visit("/org/whatsapp/numeros", [`${organizationApi}/numbers`]);
    const number = list.numbers.items.find((item) => item.id === numberId);
    assert.equal(number?.status, "Connected"); assert.equal(number.displayNumber, e11OrganizationNumber);
    const main = page.getByRole("main");
    await main.getByText(/3456-7700/).first().waitFor(); await main.getByText(/\bConectado\b/).first().waitFor();
    await page.reload(); await main.getByText(/3456-7700/).first().waitFor();
    return "Número conectado por el control, sin Meta; la Dueña lo ve Conectado y F5 lo conserva.";
  });
  await step("03", async () => {
    await page.goto(url("/org/whatsapp/equipos"));
    for (const name of ["Ventas", "Soporte"]) {
      await page.getByRole("button", { name: "Crear equipo", exact: true }).first().click();
      const dialog = page.getByRole("dialog", { name: "Crear equipo", exact: true });
      await dialog.getByRole("textbox", { name: "Nombre", exact: true }).fill(name);
      await dialog.getByRole("radio", { name: "Clientes", exact: true }).click();
      await dialog.getByRole("button", { name: "Personas", exact: true }).click();
      await page.getByRole("menuitemcheckbox").first().click(); await closeMenu();
      await dialog.getByRole("combobox", { name: "Aviso por correo si nadie lo toma", exact: true }).click();
      await page.getByRole("option", { name: "No avisar", exact: true }).click();
      const created = await act(page, () => dialog.getByRole("button", { name: "Crear equipo", exact: true }).click(), `${organizationApi}/teams`);
      const team = await created.json(); assert.equal(created.status(), 201); assert.equal(team.inbox, "Customers"); teams[name] = team.id;
      await dialog.waitFor({ state: "hidden" });
      await page.getByRole("main").getByText(name, { exact: true }).first().waitFor();
    }
    return "Ventas y Soporte, de Clientes, creados por UI.";
  });
  await step("04", async () => {
    await page.goto(url("/org/whatsapp/bot"));
    await page.getByRole("button", { name: "Agregar opción", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Agregar opción", exact: true });
    await dialog.getByRole("textbox", { name: "Texto de la opción", exact: true }).fill(option);
    await dialog.getByRole("radio", { name: "Pasa a un equipo", exact: true }).click();
    await dialog.getByRole("combobox", { name: "Equipo", exact: true }).click();
    await page.getByRole("option", { name: "Ventas", exact: true }).click();
    const saved = await act(page, () => dialog.getByRole("button", { name: "Guardar", exact: true }).click(), `${organizationApi}/numbers/${numberId}/bot`, "PUT");
    assert.ok((await saved.json()).menu.some((item) => item.label === option && item.action === "Team" && item.teamId === teams.Ventas));
    await dialog.waitFor({ state: "hidden" });
    await page.reload(); await page.getByRole("main").getByText(option, { exact: true }).first().waitFor();
    return "El menú del bot suma «Hacer un pedido» → Ventas y F5 la conserva.";
  });
  await signOut(page, organization);
  await step("05", async () => {
    const signup = await begin(`walkthrough-e11-signup-${width}`, customer);
    await page.goto(url("/registro")); await channel(customer);
    await page.getByRole("checkbox", { name: /Acepto los Términos/ }).check();
    await sendCode(page.getByRole("button", { name: "Crear cuenta", exact: true }), "/api/auth/signup");
    await fillOtp(page, (await signup("code")).proof);
    const verified = await act(page, () => page.getByRole("button", { name: "Verificar y crear la cuenta", exact: true }).click(), "/api/auth/signup/verify");
    assert.equal(verified.status(), 204);
    await awaitApp(page); await signOut();
    return "Cuenta Phone creada por UI con el OTP controlado; sin envío Meta.";
  });
  let turn; let chosen;
  await step("06", async () => {
    assert.equal((await org("orgInbound", { text: "Hola" })).status, 200);
    turn = await org("orgProcess");
    chosen = botOption(turn, option);
    assert.ok(typeof turn.text === "string" && turn.text.length > 0, "El bot contesta la bienvenida.");
    assert.equal(turn.buttons.length, 0, "El bot ofrece vincular cuando termina su parte, no antes.");
    return "«Hola» firmado al webhook real; el worker contestó la bienvenida con el menú. WhatsApp real queda manual.";
  });
  await step("07", async () => {
    assert.equal((await org("orgInbound", { reply: chosen })).status, 200);
    turn = await org("orgProcess");
    assert.deepEqual(turn.buttons.map((button) => button.id), [linkButton], "Al terminar su parte, el bot ofrece vincular la cuenta.");
    assert.equal(turn.list.length, 0);
    return "La opción pasó la conversación a Ventas y el bot ofreció «Vincular mi cuenta».";
  });
  await step("08", async () => {
    assert.equal((await org("orgInbound", { reply: { type: "button", id: linkButton } })).status, 200);
    turn = await org("orgProcess");
    assert.ok(typeof turn.text === "string" && turn.text.length > 0, "El bot confirma el vínculo.");
    assert.equal(turn.buttons.length + turn.list.length, 0);
    sent = outboundCount(await org("orgOutbound"));
    return "El botón vinculó la conversación con la cuenta y el bot lo confirmó.";
  });
  await step("09", async () => {
    phase = "owner"; await loginBusiness();
    phase = "chats";
    const [untaken, list] = await visit("/org/whatsapp/chats", [`${organizationApi}/untaken`, `${organizationApi}/customers/conversations`]);
    assert.equal(untaken.customers, 1);
    conversation = list.conversations.items.find((item) => item.displayNumber === customer);
    assert.ok(conversation, "La conversación del cliente está en la bandeja.");
    assert.equal(conversation.team?.name, "Ventas"); assert.equal(conversation.assignee ?? null, null); assert.equal(conversation.linkedToAccount, true);
    await page.getByRole("link", { name: "Chats 1", exact: true }).first().waitFor();
    phase = "open";
    const endpoint = `${organizationApi}/customers/conversations/${conversation.id}`;
    const [detail] = await responsesForAction(page, [responseFor(endpoint)], () => page.locator(`a[href='/org/whatsapp/chats/${conversation.id}']`).first().click());
    assert.equal(detail.status(), 200);
    conversation = (await detail.json()).conversation;
    await page.getByRole("log", { name: /^Mensajes con / }).waitFor();
    return "Chats cuenta una sin tomar; la conversación está en Ventas y vinculada a su cuenta.";
  });
  const conversationApi = () => `${organizationApi}/customers/conversations/${conversation.id}`;
  await step("10", async () => {
    const take = () => width === 390 ? barAction("Tomar") : page.getByRole("button", { name: "Tomar", exact: true }).click();
    await act(page, take, `${conversationApi()}/take`);
    await page.getByRole("textbox", { name: "Mensaje", exact: true }).fill(answer);
    await act(page, () => page.getByRole("button", { name: "Enviar", exact: true }).click(), `${conversationApi()}/messages`);
    await page.getByRole("log", { name: /^Mensajes con / }).getByText(answer, { exact: true }).waitFor();
    const now = outboundCount(await org("orgOutbound"));
    assert.equal(now, sent + 1, "La respuesta salió una sola vez por el outbox.");
    sent = now;
    return "Tomó y respondió por UI; la respuesta está en el hilo y en el outbox de prueba. La entrega en Meta queda manual.";
  });
  await step("11", async () => {
    await page.getByRole("button", { name: "Nota interna", exact: true }).click();
    await page.getByRole("textbox", { name: "Nota interna", exact: true }).fill(note);
    const saved = await act(page, () => page.getByRole("button", { name: "Guardar nota", exact: true }).click(), `${conversationApi()}/notes`);
    assert.equal((await saved.json()).kind, "Note");
    await page.getByRole("log", { name: /^Mensajes con / }).getByText(note, { exact: true }).waitFor();
    assert.equal(outboundCount(await org("orgOutbound")), sent, "La nota no sale por WhatsApp.");
    return "La nota quedó en el hilo para el equipo y el outbox no sumó nada.";
  });
  await step("12", async () => {
    const transfer = async () => {
      if (width === 390) {
        await barAction("Pasar");
        await page.getByRole("dialog", { name: "Pasar a", exact: true }).getByRole("button", { name: /^Soporte/ }).click();
      } else {
        await page.getByRole("button", { name: "Pasar", exact: true }).click();
        await page.getByRole("menu").getByRole("menuitem", { name: /^Soporte/ }).click();
      }
    };
    const moved = await act(page, transfer, `${conversationApi()}/transfer`);
    const row = await moved.json();
    assert.equal(row.team?.id, teams.Soporte); assert.ok(Number.isSafeInteger(moved.request().postDataJSON().version), "Pasar manda la versión de la fila.");
    return "Pasó la conversación a Soporte con la versión de la fila.";
  });
  await step("13", async () => {
    assert.equal(typeof conversation.contactId, "string", "La entrada de un cliente abre su contacto.");
    await page.goto(url(`/org/whatsapp/contactos/${conversation.contactId}`));
    if (width === 390) await barAction("Editar contacto");
    else await page.getByRole("button", { name: "Editar contacto", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Editar contacto", exact: true });
    await dialog.getByRole("button", { name: /Etiquetas/ }).click();
    await page.getByRole("searchbox", { name: "Buscar", exact: true }).fill(tag);
    await page.getByRole("menuitem", { name: `Crear «${tag}»`, exact: true }).click(); await closeMenu();
    const saved = await act(page, () => dialog.getByRole("button", { name: "Guardar cambios", exact: true }).click(), `${organizationApi}/contacts/${conversation.contactId}`, "PUT");
    assert.ok((await saved.json()).tags.includes(tag));
    await dialog.waitFor({ state: "hidden" });
    const reread = await reloadResponse(page, responseFor(`${organizationApi}/contacts/${conversation.contactId}`));
    assert.ok((await reread.json()).tags.includes(tag));
    // La ficha dice sus etiquetas juntas en el subtítulo («… · Mayorista, VIP 1440 · …»); en el teléfono, en la barra.
    await page.getByText(tag).first().waitFor();
    return "La ficha sumó una etiqueta nueva creada en el campo y F5 la conserva.";
  });
  await step("14", async () => {
    let invited = 0;
    const count = (request) => { if (new URL(request.url()).pathname === `${organizationApi}/phone-imports` && request.method() === "POST") invited++; };
    page.on("request", count);
    try {
      await page.goto(url("/org/usuarios/cargar-telefonos"));
      await page.getByRole("textbox", { name: "Uno por renglón, hasta 200", exact: true }).fill(`${nationalPhone(customer)}\n11 4444`);
      await act(page, () => page.getByRole("button", { name: /^Revisar \d+ teléfonos$/ }).first().click(), `${organizationApi}/phone-imports/preview`);
      const main = page.getByRole("main");
      // El resumen va en la banda; en el teléfono, corto (sin los inválidos) y en la barra de arriba.
      await page.getByText(width === 390 ? "2 teléfonos · 1 invitación" : "2 teléfonos · 1 invitación · 1 inválido", { exact: true }).first().waitFor();
      await page.getByRole("button", { name: "Vincular y mandar 1 invitación", exact: true }).first().waitFor();
      assert.equal(/cuenta/i.test(await main.innerText()), false, "La revisión no dice si un teléfono tiene cuenta.");
      assert.equal(invited, 0);
    } finally { page.off("request", count); }
    return "La revisión contó una invitación y un inválido, sin decir si hay cuenta y sin mandar nada.";
  });
  await signOut(page, organization);
  await step("15", async () => {
    const login = await begin(`walkthrough-e11-login-${width}`, customer);
    await page.goto(url("/login")); await channel(customer);
    await sendCode(page.getByRole("button", { name: "Enviar código", exact: true }), "/api/auth/login-code");
    await page.getByRole("heading", { name: "Revisá tu WhatsApp", exact: true }).waitFor();
    await fillOtp(page, (await login("code")).proof);
    await act(page, () => page.getByRole("button", { name: "Verificar", exact: true }).click(), "/api/auth/login-code/verify");
    await awaitApp(page);
    await page.getByRole("link", { name: "Mensajes", exact: true }).first().waitFor();
    phase = "messages";
    const [list] = await visit("/mensajes", ["/api/me/whatsapp/conversations"]);
    const linked = list.items.find((item) => item.organizationName === organization);
    assert.equal(linked?.displayNumber, e11OrganizationNumber);
    const endpoint = `/api/me/whatsapp/conversations/${linked.id}`;
    const [detail] = await responsesForAction(page, [responseFor(endpoint)], () => page.locator(`a[href='/mensajes/${linked.id}']`).first().click());
    const texts = (await detail.json()).messages.items.map((message) => message.text);
    assert.ok(texts.includes(answer)); assert.equal(texts.includes(note), false, "La copia de la persona nunca lleva las notas.");
    await page.getByRole("log", { name: /^Mensajes con / }).getByText(answer, { exact: true }).waitFor();
    assert.equal(await page.getByText(note, { exact: true }).count(), 0);
    await signOut();
    return "Entró por WhatsApp con OTP controlado y vio en «Mensajes» la respuesta de la organización, sin la nota.";
  });
}
