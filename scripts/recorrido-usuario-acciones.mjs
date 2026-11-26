import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright";
import { createAssistantControl } from "./assistant-real-control.mjs";
import { acceptAssistantNoticeFromHome, assistantApi, assistantHomeRoute } from "./assistant-real-ui.mjs";
import { plainTextBody } from "./test-e2e-real-mail.mjs";

// Acciones del asistente en el recorrido de usuario (I3 del plan 2026-11-23-etapa-acciones-del-asistente): las seis acciones
// con el modelo falso, que propone con el escenario `[E2E:action]` (FakeChatClient del back) lo que escribe cada paso, con
// los nombres de su entorno. Va después de la segunda parte de la base, en las mismas pestañas: arranca y termina con la
// Dueña afuera. Los roles y la persona de los pasos los arma el primero por la API, como la Dueña los arma en su pantalla;
// la persona acepta su invitación en otro navegador y es quien propone sin poder dar todo (01) y quien pierde el permiso (08).

const definition = (id, title, expected) => ({ id: `ACC-${id}`, title: `Acciones · ${title}`, expected });
export const accionesDefinitions = [
  definition("01", "Un rol que no se puede dar", "Quien invita sin tener «Ver la auditoría» le pide al asistente invitar con un rol que la trae: no se resuelve, la IA dice que no pudo y no queda tarjeta. Con un rol que sí puede dar, «Revisar e invitar» abre el diálogo con «Propuesta del asistente», y el rol que no puede dar está apagado con su motivo."),
  definition("02", "Invitar desde la propuesta, y otra pestaña", "La tarjeta muestra cada dato con su nombre y «Revisá» con su motivo en el rol dudoso. El diálogo abre sobre el asistente con lo propuesto y el aviso de que manda la invitación; «Invitar» la manda y la tarjeta queda «Invitación enviada». En otra pestaña con la misma propuesta, invitar dice «Ya se guardó.» y no manda otra. En el teléfono, el botón de la tarjeta va abajo, entero, y el diálogo abre sobre el asistente."),
  definition("03", "Sumar y quitar un rol a una persona", "La tarjeta nombra a la persona, lo que se suma y lo que se quita. «Revisar cambios» abre su ficha con «Propuesta del asistente» y «Lo que cambia»; «Guardar cambios» lo guarda y la propuesta queda aplicada."),
  definition("04", "Crear un rol de empresa", "La tarjeta del rol nuevo dice su nombre, su descripción, que vale en una empresa, cuál y sus permisos. «Revisar y crear» abre el editor con todo cargado sin guardar; «Crear rol» lo crea, lleva al rol nuevo y la propuesta queda aplicada con su dirección."),
  definition("05", "Cambiar los permisos de un rol", "La tarjeta dice el rol, el permiso que se suma y el que se quita. «Revisar cambios» abre el editor del rol con «Lo que cambia»; «Guardar cambios» lo guarda y la propuesta queda aplicada."),
  definition("06", "Dar de baja un rol con personas", "«Revisar y dar de baja» abre en Roles la confirmación con «Propuesta del asistente»; como alguien tiene el rol, «Dar de baja» queda apagado con «Lo tiene 1 usuario. Quitáselo primero.», y cerrarla no lo da de baja."),
  definition("07", "Una tarjeta reemplazada", "Una segunda invitación propuesta en la misma conversación reemplaza a la primera: la anterior queda plegada como «Reemplazada», sin botón, y la nueva se puede revisar."),
  definition("08", "Una tarjeta sin el permiso", "A quien preparó una invitación la Dueña le saca el rol que le daba «Invitar usuarios»: su tarjeta se ve plegada, «Ya no disponible», con «Ya no tenés el permiso «Invitar usuarios».»."),
  definition("09", "Quitar a una persona", "La tarjeta de quitar nombra a la persona, con el botón rojo. «Revisar y quitar» abre en su ficha la confirmación con «Propuesta del asistente»; «Quitar» la quita, vuelve a Usuarios y la propuesta queda aplicada."),
];

// El modelo real no entra en el recorrido (la calificación va antes de la prueba integral del bloque, con el usuario).
export const accionesManualChecks = [];

/** Lo que la IA del modelo falso contesta (FakeChatTexts del back). */
export const proposedReply = "Te preparé la propuesta. Revisala antes de guardarla.";
export const notProposedReply = "No pude prepararla con esos datos. Revisalos y pedila de nuevo.";

/** El escenario de una acción del modelo falso: el marcador y la propuesta como la escribe el modelo. */
export const actionMarker = "[E2E:action]";
export function actionMessage(action, values, target) {
  assert.match(action, /^[a-z]+\.[a-z]+@\d+$/u, "La acción va con su versión, como la publica assistant-actions.json.");
  assert.ok(Array.isArray(values) && values.every((value) => value && typeof value.field === "string" && "value" in value),
    "Cada valor lleva su campo y lo que escribió el modelo.");
  assert.ok(target === undefined || (typeof target === "string" && target.trim() !== ""), "El destino es un texto.");
  return `${actionMarker} ${JSON.stringify(target === undefined ? { action, values } : { action, target, values })}`;
}

/** Los nombres de cada ancho y corrida: los roles parecidos (Ventas), la persona y los correos de prueba. */
export function accionesNames(width, tag) {
  assert.ok([1440, 390].includes(width), "Las acciones van en los dos anchos del recorrido.");
  assert.match(String(tag ?? ""), /^[a-z0-9]{2,8}$/u, "La marca de la corrida es corta.");
  const suffix = `${width} ${tag}`;
  return {
    sales: `Ventas ${suffix}`, wholesale: `Ventas mayoristas ${suffix}`, hr: `Recursos humanos ${suffix}`, depot: `Depósito ${suffix}`,
    assistant: `Asistente ${suffix}`, inviter: `Invita ${suffix}`, audit: `Auditoría ${suffix}`, coordination: `Coordinación ${suffix}`,
    member: `e2e-acc-persona-${width}-${tag}@example.test`, invitee: `e2e-acc-ana-${width}-${tag}@example.test`,
    other: `e2e-acc-otra-${width}-${tag}@example.test`, replaced: `e2e-acc-reemplazo-${width}-${tag}@example.test`,
  };
}

/** Los roles de la organización que usan los pasos, con sus permisos (`Permissions.cs`), de la organización. */
export function accionesRoles(names) {
  return [
    [names.sales, ["users.read"]],
    [names.wholesale, ["settings.read"]],
    [names.hr, ["companies.read"]],
    [names.depot, ["companies.read"]],
    [names.assistant, ["assistant.use"]],
    [names.inviter, ["users.invite", "roles.read"]],
    [names.audit, ["audit.read"]],
  ];
}

/** El id de la propuesta de la dirección de una tarjeta (`?proposal=<id>`). */
export function proposalIdOf(href, base) {
  const id = new URL(href, base).searchParams.get("proposal");
  assert.match(String(id ?? ""), /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu, "La tarjeta abre su pantalla con la propuesta.");
  return id;
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
const pause = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/** Crea los roles de la organización por la API, como la Dueña en su pantalla; devuelve sus ids por nombre. */
export async function createActionRoles(page, roles) {
  const ids = {};
  for (const [name, permissions] of roles) {
    const created = await assistantApi(page, { route: "/api/roles", method: "POST", key: randomUUID(),
      body: { name, description: null, scope: "Organization", companyId: null, permissions } });
    assert.equal(created.status, 201, `Crear el rol ${name} respondió ${created.status}.`);
    ids[name] = created.body;
  }
  return ids;
}

/** Una conversación nueva en el asistente: el botón de la lista (o el del teléfono), si no está ya en una nueva. */
export async function startConversation(page) {
  const button = page.getByRole("button", { name: "Nueva conversación", exact: true }).filter({ visible: true }).first();
  await button.waitFor();
  if (await button.isEnabled()) await button.click();
  await page.getByRole("textbox", { name: "Tu consulta", exact: true }).waitFor();
}

/** Manda una consulta por la pantalla y espera que la IA conteste `reply` una vez más que antes. */
export async function askAssistant(page, text, reply) {
  const before = await page.getByText(reply, { exact: true }).count();
  await page.getByRole("textbox", { name: "Tu consulta", exact: true }).fill(text);
  const [admitted] = await Promise.all([
    page.waitForResponse((response) => /\/assistant\/conversations\/[^/]+\/messages$/u.test(new URL(response.url()).pathname)
      && response.request().method() === "POST"),
    page.getByRole("button", { name: "Enviar", exact: true }).click(),
  ]);
  assert.equal(admitted.status(), 200, `Mandar la consulta respondió ${admitted.status()}.`);
  for (const deadline = Date.now() + 60_000; await page.getByText(reply, { exact: true }).count() <= before;) {
    assert.ok(Date.now() < deadline, `La IA no contestó «${reply}».`);
    await pause(250);
  }
}

/** La última tarjeta de una acción en el hilo, ya con su propuesta leída del servidor. */
export async function actionCard(page, name) {
  const card = page.getByRole("group", { name, exact: true }).last();
  await card.waitFor({ timeout: 30_000 });
  return card;
}

/** Los renglones de una tarjeta nueva, `[nombre, dato]`, como los dice la pantalla. */
export async function cardRows(card) {
  return card.locator("dl").evaluate((list) => Array.from(list.querySelectorAll("dt"), (term) => [
    term.textContent.trim(), term.nextElementSibling?.textContent.replace(/\s+/gu, " ").trim() ?? "",
  ]));
}

/** La propuesta como la lee la pantalla; espera el estado si se pide (la pantalla avisa `applied` sin esperar). */
export async function readProposal(page, id, state) {
  for (const deadline = Date.now() + 20_000; ;) {
    const read = await assistantApi(page, { route: `/api/organization/assistant/proposals/${id}` });
    assert.equal(read.status, 200, `Leer la propuesta respondió ${read.status}.`);
    if (!state || read.body.state === state) return read.body;
    assert.ok(Date.now() < deadline, `La propuesta quedó «${read.body.state}» y no «${state}».`);
    await pause(500);
  }
}

/** El texto con que se describe un control (su `aria-describedby`), como lo lee un lector de pantalla. */
async function descriptionOf(control) {
  return control.evaluate((element) => (element.getAttribute("aria-describedby") ?? "").split(/\s+/u).filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent?.trim() ?? "").filter(Boolean).join(" "));
}

/**
 * «Invitar usuario» desde una propuesta y «Ya se guardó» en otra pestaña (el E2E de la etapa y el paso 02): la tarjeta con
 * «Revisá», el diálogo con lo propuesto, la invitación mandada una vez y la otra pestaña, que no manda otra.
 * `page` está en una conversación nueva del asistente de la Dueña, con el aviso aceptado; los roles parecidos ya existen.
 */
export async function inviteFromProposalInTwoTabs({ page, base, width, names }) {
  const phone = width < 768;
  await askAssistant(page, actionMessage("users.invite@1", [
    { field: "email", value: names.invitee }, { field: "roles", value: ["Ventas"] },
  ]), proposedReply);
  const card = await actionCard(page, "Invitación de usuario");
  const rows = await cardRows(card);
  assert.deepEqual(rows, [["Correo", names.invitee], ["Roles de la organización", `${names.sales}Revisá`], ["Motivo", "Hay más de una opción parecida."]],
    `La tarjeta dice ${JSON.stringify(rows)}.`);
  const open = card.getByRole("link", { name: "Revisar e invitar", exact: true });
  if (phone) {
    const box = await open.boundingBox();
    const cardBox = await card.boundingBox();
    assert.ok(box && cardBox && box.width > cardBox.width * 0.8 && box.y > cardBox.y + cardBox.height / 2, "En el teléfono el botón va abajo, entero.");
  }
  const href = await open.getAttribute("href");
  const proposalId = proposalIdOf(href, base);

  // La otra pestaña abre la misma propuesta antes de que la primera la guarde.
  const second = await page.context().newPage();
  try {
    await second.setViewportSize(page.viewportSize());
    await second.goto(new URL(href, base).href);
    const otherDialog = second.getByRole("dialog", { name: "Invitar usuario", exact: true });
    await otherDialog.getByText("Propuesta del asistente", { exact: true }).waitFor({ timeout: 30_000 });

    await open.click();
    const dialog = page.getByRole("dialog", { name: "Invitar usuario", exact: true });
    await dialog.getByText("Propuesta del asistente", { exact: true }).waitFor();
    assert.equal(await dialog.getByRole("textbox", { name: /^Correo/u }).inputValue(), names.invitee);
    const roles = dialog.getByRole("button", { name: /^Roles de la organización/u });
    assert.match(await roles.innerText(), new RegExp(escapeRegExp(names.sales), "u"));
    assert.equal(await descriptionOf(roles), "Hay más de una opción parecida.");
    await dialog.getByText("Se le manda la invitación por correo.", { exact: true }).waitFor();
    const [sent] = await Promise.all([
      page.waitForResponse((response) => new URL(response.url()).pathname === "/api/users/invitations" && response.request().method() === "POST"),
      dialog.getByRole("button", { name: "Invitar", exact: true }).click(),
    ]);
    assert.equal(sent.status(), 201, `Invitar respondió ${sent.status()}.`);
    assert.ok(sent.request().headers()["idempotency-key"], "Invitar manda la clave del intento de la propuesta.");
    await dialog.waitFor({ state: "hidden" });
    await card.getByText("Invitación enviada", { exact: true }).waitFor({ timeout: 30_000 });
    await card.getByRole("link", { name: "Ver en Usuarios", exact: true }).waitFor();

    // La otra pestaña: «Invitar» pregunta la clave, el servidor dice que ya se guardó y no se manda otra.
    let resent = 0;
    const count = (request) => { if (new URL(request.url()).pathname === "/api/users/invitations" && request.method() === "POST") resent += 1; };
    second.on("request", count);
    try {
      const invite = otherDialog.getByRole("button", { name: "Invitar", exact: true });
      if (await invite.isVisible()) await invite.click();
      await otherDialog.getByText("Ya se guardó.", { exact: true }).waitFor({ timeout: 30_000 });
      await otherDialog.getByRole("link", { name: "Ver en Usuarios", exact: true }).waitFor();
    } finally { second.off("request", count); }
    assert.equal(resent, 0, "La otra pestaña no mandó otra invitación.");
    assert.equal((await readProposal(page, proposalId, "applied")).state, "applied");
  } finally { await second.close(); }
  return { proposalId };
}

/**
 * Los pasos, cada uno una función que devuelve lo que pasó. El recorrido los corre en orden con su registro; el conductor
 * de una I3 puede correrlos de a uno sobre el mismo entorno aislado.
 * `ctx`: la pestaña de la organización (`page`), el ancho, el entorno aislado (`env`, con `command`, `files` y `messages`),
 * la base, y las sesiones del recorrido (`login(email, access, target)`, `signOut`), con la Dueña (`owner`) y su
 * organización (`organization`).
 */
export function accionesSteps(ctx) {
  const { page, width, env, base, owner, organization } = ctx;
  const phone = width < 768;
  const tag = ctx.tag ?? Date.now().toString(36).slice(-4);
  const names = accionesNames(width, tag);
  const control = createAssistantControl(env.command);
  const url = (route) => new URL(route, base).href;
  const home = assistantHomeRoute("business", width);
  const heading = (target, name) => target.getByRole("heading", { name, exact: true }).filter({ visible: true }).first().waitFor();
  // Guardar o crear, el de la compu o el fijo del teléfono, como en la segunda parte de la base.
  const save = (target) => target.getByRole("button", { name: /^(Crear rol|Guardar cambios|Guardar)$/u }).filter({ visible: true }).last();
  let roles; let memberId; let memberLabel; let memberDetail; let memberBrowser; let member;

  // La pestaña de la Dueña: si no tiene sesión, la redirección al ingreso llega después de cargar; se espera lo que aparezca.
  const asOwner = async (route) => {
    await page.goto(url(route));
    const loginBox = page.getByRole("textbox", { name: "Correo electrónico", exact: true }).or(page.getByRole("link", { name: "Ingresá", exact: true }));
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
  // El asistente de la Dueña, en una conversación nueva.
  const ownerAssistant = async () => {
    await asOwner(home);
    await acceptAssistantNoticeFromHome(page);
    await startConversation(page);
  };
  // Lo que usan los pasos: el asistente listo para la Dueña, los roles y la persona, que acepta su invitación en otro
  // navegador con su propia sesión.
  const prepared = async () => {
    if (roles) return;
    await asOwner(home);
    await control("prepare", { email: owner, access: "business" });
    await page.reload();
    await acceptAssistantNoticeFromHome(page);
    roles = await createActionRoles(page, accionesRoles(names));
    const before = new Set(await env.files());
    const invited = await assistantApi(page, { route: "/api/users/invitations", method: "POST", key: randomUUID(),
      body: { email: names.member, roleIds: [roles[names.assistant], roles[names.inviter], roles[names.hr], roles[names.depot]], companies: [] } });
    assert.equal(invited.status, 201, `Invitar a la persona respondió ${invited.status}.`);
    let link;
    for (const deadline = Date.now() + 60_000; !link && Date.now() < deadline;) {
      link = (await env.messages(names.member, before)).map(({ body }) => plainTextBody(body)?.match(/https:\/\/[^\s]+\/invitacion#[A-Za-z0-9_-]+/u)?.[0]).find(Boolean);
      if (!link) await pause(250);
    }
    assert.ok(link, "Llegó la invitación de la persona al correo aislado.");
    memberBrowser = await chromium.launch({ channel: "chrome", headless: true });
    member = await (await memberBrowser.newContext({ ignoreHTTPSErrors: true, locale: "es-AR", viewport: page.viewportSize() })).newPage();
    member.setDefaultTimeout(30_000);
    await member.goto(link);
    await heading(member, `Te sumás a ${organization}`);
    await member.getByRole("button", { name: "Aceptar invitación", exact: true }).click();
    await heading(member, `Te sumaste a ${organization}`);
    await member.getByRole("button", { name: "Más tarde", exact: true }).click().catch(() => {});
    await member.waitForURL((current) => current.pathname.startsWith("/org"));
    const listed = await assistantApi(page, { route: `/api/users/paged?search=${encodeURIComponent(names.member)}` });
    assert.equal(listed.status, 200);
    const row = listed.body.items.find((item) => item.email === names.member);
    assert.ok(row?.memberId, "La persona quedó en Usuarios.");
    // Como la nombra la propuesta: por su nombre si lo cargó, y si no por su correo, que entonces no se repite (B6).
    memberId = row.memberId;
    memberLabel = row.displayName || names.member;
    memberDetail = row.displayName ? [["Correo", names.member]] : [];
  };
  // La pestaña de la persona en su asistente; la primera vez prepara su cupo y acepta el aviso.
  let memberReady = false;
  const memberAssistant = async () => {
    if (!memberReady) await control("prepare", { email: names.member, access: "business" });
    await member.goto(url(home));
    await acceptAssistantNoticeFromHome(member);
    await member.getByRole("textbox", { name: "Tu consulta", exact: true }).waitFor();
    memberReady = true;
  };

  return {
    /** Dónde se captura cada paso: los de la persona, en su navegador. */
    capture: (key) => (["01", "08"].includes(key) && member ? member : page),
    async close() { await memberBrowser?.close(); },

    // 0061 y 269: lo que no se puede dar no se resuelve, y en el diálogo queda apagado con su motivo.
    "01": async () => {
      await prepared();
      await memberAssistant();
      await startConversation(member);
      await askAssistant(member, actionMessage("users.invite@1", [
        { field: "email", value: names.other }, { field: "roles", value: [names.audit] },
      ]), notProposedReply);
      assert.equal(await member.getByRole("group", { name: "Invitación de usuario", exact: true }).count(), 0, "Lo que no se resuelve no deja tarjeta.");
      await askAssistant(member, actionMessage("users.invite@1", [
        { field: "email", value: names.other }, { field: "roles", value: [names.inviter] },
      ]), proposedReply);
      const card = await actionCard(member, "Invitación de usuario");
      await card.getByRole("link", { name: "Revisar e invitar", exact: true }).click();
      const dialog = member.getByRole("dialog", { name: "Invitar usuario", exact: true });
      await dialog.getByText("Propuesta del asistente", { exact: true }).waitFor();
      await dialog.getByRole("button", { name: /^Roles de la organización/u }).click();
      const audit = member.getByRole("option", { name: new RegExp(`^${escapeRegExp(names.audit)}`, "u") }).filter({ visible: true }).first();
      await audit.waitFor();
      assert.equal(await audit.getAttribute("aria-disabled"), "true", "El rol que no puede dar está apagado.");
      const reason = await descriptionOf(audit);
      assert.match(reason, /Tiene permisos que no tenés\./u, `Su motivo dice «${reason}».`);
      const proposed = member.getByRole("option", { name: new RegExp(`^${escapeRegExp(names.inviter)}`, "u") }).filter({ visible: true }).first();
      assert.equal(await proposed.getAttribute("aria-selected"), "true", "El rol propuesto está elegido.");
      // En la compu la lista se cierra con Escape; en el teléfono, con «Listo», como al elegir (segunda parte de la base).
      if (phone) await member.getByRole("button", { name: /^Listo/u }).filter({ visible: true }).first().click(); else await member.keyboard.press("Escape");
      await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
      return `Con «${names.audit}» la IA dijo «${notProposedReply}» sin tarjeta; con «${names.inviter}» el diálogo abrió con la propuesta y «${names.audit}» apagado con «${reason}».`;
    },
    // 0068 §9 y §10: el diálogo sobre el asistente, la clave del intento y «Ya se guardó» en otra pestaña.
    "02": async () => {
      await prepared();
      await ownerAssistant();
      const { proposalId } = await inviteFromProposalInTwoTabs({ page, base, width, names });
      return `La tarjeta dijo «Revisá» con «Hay más de una opción parecida.»; la invitación salió una vez desde el diálogo${phone ? " del teléfono" : ""}, la tarjeta quedó «Invitación enviada» y la otra pestaña dijo «Ya se guardó.» sin mandar otra (propuesta ${proposalId.slice(0, 8)}).`;
    },
    // Usuario-Propuesta: la ficha con «Lo que cambia», y «Guardar cambios» manda lo que se ve.
    "03": async () => {
      await prepared();
      await ownerAssistant();
      await askAssistant(page, actionMessage("users.edit@1", [
        { field: "roles", value: [{ op: "add", value: names.sales }, { op: "remove", value: names.depot }] },
      ], names.member), proposedReply);
      const card = await actionCard(page, "Cambio de roles");
      const rows = await cardRows(card);
      assert.deepEqual(rows, [["Persona", memberLabel], ["Se suma en la organización", names.sales], ["Se quita en la organización", names.depot]],
        `La tarjeta dice ${JSON.stringify(rows)}.`);
      const open = card.getByRole("link", { name: "Revisar cambios", exact: true });
      const proposalId = proposalIdOf(await open.getAttribute("href"), base);
      await open.click();
      await page.waitForURL((current) => current.pathname === `/org/usuarios/${memberId}`);
      await page.getByText("Propuesta del asistente", { exact: true }).filter({ visible: true }).first().waitFor();
      if (phone) {
        for (const text of ["Se suma en la organización", "Se quita en la organización", names.sales, names.depot])
          await page.getByText(text, { exact: true }).filter({ visible: true }).first().waitFor();
      } else {
        const table = page.getByRole("table", { name: "Lo que cambia", exact: true });
        const changes = await table.getByRole("row").evaluateAll((list) => list.map((row) => Array.from(row.children, (cell) => cell.textContent.trim())));
        assert.deepEqual(changes, [["Dónde", "Se suma", "Se quita"], ["Organización", names.sales, names.depot]], `«Lo que cambia» dice ${JSON.stringify(changes)}.`);
      }
      const [saved] = await Promise.all([
        page.waitForResponse((response) => new URL(response.url()).pathname === `/api/users/${memberId}` && response.request().method() === "PUT"),
        save(page).click(),
      ]);
      assert.equal(saved.status(), 200, `Guardar respondió ${saved.status()}.`);
      await readProposal(page, proposalId, "applied");
      return `La ficha abrió con «Lo que cambia»${phone ? " en renglones" : ""} (suma ${names.sales}, quita ${names.depot}); «Guardar cambios» respondió 200 y la propuesta quedó aplicada.`;
    },
    // Rol-Propuesta: un rol nuevo de una empresa, cargado en el editor sin guardar.
    "04": async () => {
      await prepared();
      const companies = await assistantApi(page, { route: "/api/companies/paged?page=1&pageSize=20" });
      assert.equal(companies.status, 200);
      const company = companies.body.items.find((item) => item.status === "Active")?.name;
      assert.ok(company, "La organización tiene una empresa activa.");
      await ownerAssistant();
      await askAssistant(page, actionMessage("roles.create@1", [
        { field: "name", value: names.coordination }, { field: "description", value: "Coordina a las personas de cada equipo." },
        { field: "scope", value: "Una empresa específica" }, { field: "company", value: company }, { field: "permissions", value: ["Ver miembros"] },
      ]), proposedReply);
      const card = await actionCard(page, "Rol nuevo");
      const rows = await cardRows(card);
      assert.deepEqual(rows, [["Nombre", names.coordination], ["Descripción", "Coordina a las personas de cada equipo."],
        ["Vale en", "Una empresa específica"], ["Empresa", company], ["Permisos", "Ver miembros"]], `La tarjeta dice ${JSON.stringify(rows)}.`);
      const open = card.getByRole("link", { name: "Revisar y crear", exact: true });
      const proposalId = proposalIdOf(await open.getAttribute("href"), base);
      await open.click();
      await page.waitForURL((current) => current.pathname === "/org/roles/nuevo");
      await page.getByText("Propuesta del asistente", { exact: true }).filter({ visible: true }).first().waitFor();
      const name = page.getByRole("textbox", { name: "Nombre", exact: true });
      for (const deadline = Date.now() + 15_000; await name.inputValue() !== names.coordination;) {
        assert.ok(Date.now() < deadline, "El editor no cargó el nombre propuesto.");
        await pause(200);
      }
      assert.match(await page.getByRole("button", { name: /^Vale en /u }).filter({ visible: true }).first().innerText(), new RegExp(escapeRegExp(company), "u"));
      const [created] = await Promise.all([
        page.waitForResponse((response) => new URL(response.url()).pathname === "/api/roles" && response.request().method() === "POST"),
        save(page).click(),
      ]);
      assert.equal(created.status(), 201, `Crear el rol respondió ${created.status()}.`);
      const roleId = await created.json();
      await page.waitForURL((current) => current.pathname === `/org/roles/${roleId}`);
      const applied = await readProposal(page, proposalId, "applied");
      assert.match(String(applied.appliedLocation ?? ""), new RegExp(`/api/roles/${roleId}$`, "iu"), "La propuesta aplicada lleva al rol creado.");
      return `El editor abrió «${names.coordination}» de ${company} sin guardar; «Crear rol» respondió 201, llevó al rol nuevo y la propuesta quedó aplicada con su dirección.`;
    },
    // Rol-Propuesta: el cambio de permisos de un rol, con «Lo que cambia».
    "05": async () => {
      await prepared();
      await ownerAssistant();
      await askAssistant(page, actionMessage("roles.edit@1", [
        { field: "permissions", value: [{ op: "add", value: "Ver roles" }, { op: "remove", value: "Ver usuarios" }] },
      ], names.sales), proposedReply);
      const card = await actionCard(page, "Cambio de rol");
      const rows = await cardRows(card);
      assert.deepEqual(rows, [["Rol", names.sales], ["Se suma", "Ver roles"], ["Se quita", "Ver usuarios"]], `La tarjeta dice ${JSON.stringify(rows)}.`);
      const open = card.getByRole("link", { name: "Revisar cambios", exact: true });
      const proposalId = proposalIdOf(await open.getAttribute("href"), base);
      await open.click();
      const roleId = roles[names.sales];
      await page.waitForURL((current) => current.pathname === `/org/roles/${roleId}`);
      await page.getByText("Propuesta del asistente", { exact: true }).filter({ visible: true }).first().waitFor();
      if (!phone) {
        const table = page.getByRole("table", { name: "Lo que cambia", exact: true });
        const changes = await table.getByRole("row").evaluateAll((list) => list.map((row) => Array.from(row.children, (cell) => cell.textContent.trim())));
        assert.deepEqual(changes, [["Se suma", "Se quita"], ["Ver roles", "Ver usuarios"]], `«Lo que cambia» dice ${JSON.stringify(changes)}.`);
      } else for (const text of ["Lo que cambia", "Ver roles", "Ver usuarios"]) await page.getByText(text, { exact: true }).filter({ visible: true }).first().waitFor();
      const [saved] = await Promise.all([
        page.waitForResponse((response) => new URL(response.url()).pathname === `/api/roles/${roleId}` && response.request().method() === "PUT"),
        save(page).click(),
      ]);
      assert.equal(saved.status(), 200, `Guardar el rol respondió ${saved.status()}.`);
      await readProposal(page, proposalId, "applied");
      return `El editor de «${names.sales}» abrió con «Lo que cambia» (suma Ver roles, quita Ver usuarios); «Guardar cambios» respondió 200 y la propuesta quedó aplicada.`;
    },
    // Confirmar-Propuesta: dar de baja un rol que alguien tiene se frena en la confirmación.
    "06": async () => {
      await prepared();
      await ownerAssistant();
      await askAssistant(page, actionMessage("roles.remove@1", [], names.hr), proposedReply);
      const card = await actionCard(page, "Baja de rol");
      assert.deepEqual(await cardRows(card), [["Rol", names.hr]]);
      const open = card.getByRole("link", { name: "Revisar y dar de baja", exact: true });
      const proposalId = proposalIdOf(await open.getAttribute("href"), base);
      await open.click();
      await page.waitForURL((current) => current.pathname === "/org/roles");
      const confirm = page.getByRole("dialog", { name: `¿Dar de baja el rol ${names.hr}?`, exact: true });
      await confirm.getByText("Propuesta del asistente", { exact: true }).waitFor({ timeout: 30_000 });
      const remove = confirm.getByRole("button", { name: "Dar de baja", exact: true });
      assert.equal(await remove.getAttribute("aria-disabled"), "true", "Con alguien que lo tiene, «Dar de baja» queda apagado.");
      const reason = await descriptionOf(remove);
      assert.equal(reason, "Lo tiene 1 usuario. Quitáselo primero.");
      await confirm.getByRole("button", { name: "Cancelar", exact: true }).click();
      await confirm.waitFor({ state: "hidden" });
      const role = await assistantApi(page, { route: `/api/roles/${roles[names.hr]}` });
      assert.equal(role.status, 200, "El rol sigue.");
      assert.equal((await readProposal(page, proposalId)).state, "new", "Cerrarla no la aplica.");
      return `La confirmación de Roles abrió con la propuesta y «Dar de baja» apagado con «${reason}»; cerrarla no dio de baja el rol.`;
    },
    // Asistente-Org-Acciones: la propuesta anterior de la misma clase queda «Reemplazada», plegada y sin botón.
    "07": async () => {
      await prepared();
      await ownerAssistant();
      await askAssistant(page, actionMessage("users.invite@1", [
        { field: "email", value: names.replaced }, { field: "roles", value: [names.sales] },
      ]), proposedReply);
      await actionCard(page, "Invitación de usuario");
      await askAssistant(page, actionMessage("users.invite@1", [
        { field: "email", value: names.replaced }, { field: "roles", value: [names.wholesale] },
      ]), proposedReply);
      const cards = page.getByRole("group", { name: "Invitación de usuario", exact: true });
      for (const deadline = Date.now() + 30_000; await cards.count() < 2;) {
        assert.ok(Date.now() < deadline, "La segunda tarjeta no llegó.");
        await pause(250);
      }
      await cards.first().getByText("Reemplazada", { exact: true }).waitFor({ timeout: 30_000 });
      assert.equal(await cards.first().getByRole("link").count(), 0, "La reemplazada va sin botón.");
      await cards.last().getByRole("link", { name: "Revisar e invitar", exact: true }).waitFor();
      return "La primera invitación quedó plegada como «Reemplazada», sin botón, y la segunda se puede revisar.";
    },
    // 0068 §9: sin el permiso, la tarjeta se ve «Ya no disponible» con su motivo.
    "08": async () => {
      await prepared();
      await asOwner("/org/usuarios");
      const detail = await assistantApi(page, { route: `/api/users/${memberId}` });
      assert.equal(detail.status, 200);
      const roleIds = detail.body.roles.map((role) => role.id).filter((id) => id !== roles[names.inviter]);
      const companies = detail.body.companies.map((item) => ({ companyId: item.companyId, roleIds: item.roles.map((role) => role.id) }));
      const changed = await assistantApi(page, { route: `/api/users/${memberId}`, method: "PUT",
        body: { isActive: true, roleIds, companies, version: detail.body.version } });
      assert.equal(changed.status, 200, `Sacarle el rol respondió ${changed.status}.`);
      await memberAssistant();
      if (phone) await member.getByRole("button", { name: "Conversaciones", exact: true }).click();
      await member.getByRole("button", { name: "Consulta de prueba", exact: true }).first().click();
      const card = await actionCard(member, "Invitación de usuario");
      await card.getByText("Ya no disponible", { exact: true }).waitFor({ timeout: 30_000 });
      await card.getByText("Ya no tenés el permiso «Invitar usuarios».", { exact: true }).waitFor();
      assert.equal(await card.getByRole("link").count(), 0, "Sin el permiso, la tarjeta va sin botón.");
      await memberBrowser.close();
      memberBrowser = undefined;
      return `Sin «${names.inviter}», la tarjeta de la persona quedó «Ya no disponible» con «Ya no tenés el permiso «Invitar usuarios».».`;
    },
    // Confirmar-Propuesta: quitar a una persona desde su ficha, con el botón rojo de la tarjeta.
    "09": async () => {
      await prepared();
      await ownerAssistant();
      await askAssistant(page, actionMessage("users.remove@1", [], names.member), proposedReply);
      const card = await actionCard(page, "Quitar de la organización");
      assert.deepEqual(await cardRows(card), [["Persona", memberLabel], ...memberDetail]);
      const open = card.getByRole("link", { name: "Revisar y quitar", exact: true });
      assert.equal(await open.getAttribute("data-variant"), "danger", "Quitar va con el botón rojo.");
      const proposalId = proposalIdOf(await open.getAttribute("href"), base);
      await open.click();
      await page.waitForURL((current) => current.pathname === `/org/usuarios/${memberId}`);
      const confirm = page.getByRole("dialog", { name: new RegExp(`^¿Quitar a .+ de ${escapeRegExp(organization)}\\?$`, "u") });
      await confirm.getByText("Propuesta del asistente", { exact: true }).waitFor({ timeout: 30_000 });
      const [removed] = await Promise.all([
        page.waitForResponse((response) => new URL(response.url()).pathname === `/api/users/${memberId}` && response.request().method() === "DELETE"),
        confirm.getByRole("button", { name: "Quitar", exact: true }).click(),
      ]);
      assert.equal(removed.status(), 204, `Quitar respondió ${removed.status()}.`);
      await page.waitForURL((current) => current.pathname === "/org/usuarios");
      await readProposal(page, proposalId, "applied");
      await ctx.signOut(page, organization);
      return `La confirmación de la ficha abrió con la propuesta; «Quitar» respondió 204, volvió a Usuarios y la propuesta quedó aplicada.`;
    },
  };
}

/** Sigue a la segunda parte de la base en las mismas pestañas; arranca y termina con la Dueña afuera. */
export async function runAccionesJourney(ctx) {
  assert.ok(typeof ctx?.env?.command === "function" && typeof ctx.env.files === "function" && typeof ctx.env.messages === "function",
    "Las acciones del asistente necesitan las órdenes y el correo aislados del mismo entorno.");
  assert.ok([ctx.record, ctx.login, ctx.signOut].every((value) => typeof value === "function")
    && [ctx.owner, ctx.organization].every((value) => typeof value === "string" && value.length > 0),
    "Las acciones del asistente siguen al recorrido: necesitan sus sesiones, la Dueña y su organización.");
  const steps = accionesSteps(ctx);
  try {
    for (const { id } of accionesDefinitions) {
      const key = id.slice("ACC-".length);
      await ctx.record(id, ctx.width, () => steps.capture(key), steps[key],
        (error) => `Ruta ${new URL(steps.capture(key).url()).pathname}; ${error.name}. Los correos y los códigos se omiten.`);
    }
  } finally { await steps.close(); }
}
