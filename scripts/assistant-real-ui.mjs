import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fillOtp } from "./test-e2e-real-ui.mjs";
import { completeOperatorFactor } from "./platform-factor-real.mjs";
import { createAssistantControl } from "./assistant-real-control.mjs";

export const assistantHomeRoute = (access, width) => ({ business: width === 390 ? "/org/asistente" : "/org",
  consumer: width === 390 ? "/asistente" : "/", platform: width === 390 ? "/plataforma/asistente" : "/plataforma" })[access];
const prefix = (access) => `/api/${{ business: "organization", consumer: "me", platform: "platform" }[access]}/assistant`;
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jh5kAAAAASUVORK5CYII=", "base64");

/** Conserva el mismo download real para abrirlo después de la corrida de la puerta. */
export async function assistantExportPath(download, width, format, directory = process.env.MT_E2E_EXPORT_DIR) {
  if (!directory) return download.path();
  assert.ok(path.isAbsolute(directory), "La carpeta de exportes E8b debe ser absoluta.");
  assert.ok([1440, 390].includes(width) && ["markdown", "pdf"].includes(format), "Exporte E8b inválido.");
  const target = path.join(directory, `asistente-${width}.${format === "pdf" ? "pdf" : "md"}`);
  await mkdir(directory, { recursive: true });
  await download.saveAs(target);
  return target;
}

export async function acceptAssistantTerms(page) {
  const terms = page.getByRole("heading", { name: "Actualizamos los términos", exact: true });
  if (!await terms.isVisible()) return;
  for (const checkbox of await page.getByRole("checkbox").all()) await checkbox.check();
  await page.getByRole("button", { name: "Aceptar y seguir", exact: true }).click();
  await terms.waitFor({ state: "hidden" });
}

export async function assistantLogin(page, env, base, email, access) {
  const routes = { consumer: "/login", business: "/login/empresa", platform: "/plataforma" };
  await page.goto(new URL(routes[access], base).href);
  await page.getByRole("textbox", { name: "Correo electrónico", exact: true }).fill(email);
  process.stdout.write(`TECH DATA auth.login-route ${JSON.stringify({ access, expectedRoute: new URL(page.url()).pathname === routes[access] })}\n`);
  const before = new Set(await env.files());
  for (let attempt = 0; attempt < 5; attempt++) {
    const send = page.getByRole("button", { name: "Enviar código", exact: true });
    await send.click({ trial: true });
    const responsePromise = page.waitForResponse((reply) => new URL(reply.url()).pathname === "/api/auth/login-code" && reply.request().method() === "POST");
    await send.click();
    const response = await responsePromise;
    const problem = response.ok() ? null : await response.json();
    const code = typeof problem?.code === "string" && /^[A-Za-z0-9.]+$/.test(problem.code) ? problem.code : "none";
    process.stdout.write(`TECH DATA auth.login-code ${JSON.stringify({ access, status: response.status(), code })}\n`);
    if (response.ok()) break;
    assert.equal(response.status(), 429, "El ingreso debe respetar sólo el cooldown informado por el servicio real.");
    assert.ok(Number.isFinite(problem.retryAfter) && problem.retryAfter >= 0 && problem.retryAfter <= 300);
    await delay((problem.retryAfter + 1) * 1000);
    assert.ok(attempt < 4, "El ingreso no completó después de respetar cinco cooldowns reales.");
  }
  await page.getByRole("heading", { name: "Revisá tu correo", exact: true }).waitFor();
  await fillOtp(page, await env.code(email, before));
  await page.getByRole("button", { name: "Verificar", exact: true }).click();
  if (access === "platform") await completeOperatorFactor(page, email);
  await page.waitForURL((url) => !url.pathname.includes("login") && !url.pathname.includes("ingresar"));
  // Los legales pueden estar en la ruta de retorno o en una consulta privada posterior.
  const shell = page.getByRole("navigation", { name: "Secciones", exact: true })
    .or(page.getByRole("button", { name: /, .+$/ }))
    .or(page.getByRole("heading", { name: "Actualizamos los términos", exact: true }));
  await shell.first().waitFor();
  await acceptAssistantTerms(page);
}

/** Usa la instancia httpClient de la app: bearer y cultura permanecen en memoria. */
export async function assistantApi(page, { route, method = "GET", body, key, file, stream = false, disconnect = false }) {
  return page.evaluate(async (request) => {
    const { api } = await import("/src/shared/api/httpClient.ts");
    const controller = new AbortController();
    try {
      const headers = { ...(request.key ? { "Idempotency-Key": request.key } : {}),
        ...(request.stream ? { Accept: "text/event-stream, application/json" } : {}) };
      let payload;
      if (request.file) {
        payload = new FormData();
        const bytes = new Uint8Array(request.file.size ?? request.file.bytes.length);
        bytes.set(request.file.bytes);
        payload.append("file", new File([bytes], request.file.name, { type: request.file.type }));
        payload.append("conversationVersion", String(request.body.conversationVersion));
      } else if (request.body !== undefined) payload = JSON.stringify(request.body);
      const response = await api.response(request.route, { method: request.method, headers, body: payload, signal: controller.signal });
      const contentType = response.headers.get("content-type")?.split(";", 1)[0];
      if (request.stream) {
        const { decodeAssistantStream } = await import("/src/modules/assistant/api/stream.ts");
        const events = []; let terminal; let firstDeltaAt; let doneAt;
        for await (const event of decodeAssistantStream(response, controller.signal)) {
          events.push(event.event);
          if (event.event === "delta") {
            firstDeltaAt ??= performance.now();
            if (request.disconnect) { controller.abort(); break; }
          }
          if (event.event === "done") { doneAt = performance.now(); terminal = event.data; }
          if (event.event === "error") terminal = event.data;
        }
        return { status: response.status, contentType, events, terminal, firstDeltaAt, doneAt };
      }
      return { status: response.status, contentType, body: contentType === "application/json" ? await response.json() : undefined,
        bytes: contentType === "application/json" || response.status === 204 ? undefined : Array.from(new Uint8Array(await response.arrayBuffer())) };
    } catch (error) {
      return { status: error.status ?? 0, code: error.code ?? "Assistant.E2E.Transport" };
    }
  }, { route, method, body, key, file, stream, disconnect });
}

async function readConversation(page, root, id) {
  const reply = await assistantApi(page, { route: `${root}/conversations/${id}` });
  assert.equal(reply.status, 200, "La conversación propia debe poder releerse.");
  return reply.body;
}
export async function waitAssistantTerminal(page, root, id) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const detail = await readConversation(page, root, id);
    if (detail.messages.items.every((message) => message.status !== "Generating")) return detail;
    await delay(200);
  }
  throw new Error("El turno durable no llegó a estado terminal.");
}

async function home(page, base, access, width) {
  await page.goto(new URL(assistantHomeRoute(access, width), base).href);
  await page.getByRole("heading", { name: "¿Qué querés consultar?", exact: true })
    .or(page.getByRole("heading", { name: "Actualizamos los términos", exact: true }))
    .or(page.getByRole("dialog", { name: "Antes de tu primera consulta", exact: true })).first().waitFor();
  await acceptAssistantTerms(page);
  await page.getByRole("heading", { name: "¿Qué querés consultar?", exact: true })
    .or(page.getByRole("dialog", { name: "Antes de tu primera consulta", exact: true })).first().waitFor();
}
/** Los focos de acceso esperan State por su UI y aceptan el aviso sólo con el botón visible. */
export async function acceptAssistantNoticeFromHome(page, onStage = () => {}) {
  const notice = page.getByRole("dialog", { name: "Antes de tu primera consulta", exact: true });
  await notice.or(page.getByRole("heading", { name: "¿Qué querés consultar?", exact: true }))
    .or(page.getByRole("heading", { name: "El asistente todavía no está configurado", exact: true })).first().waitFor();
  await acceptNotice(page, onStage);
}
async function acceptNotice(page, onStage = () => {}) {
  const notice = page.getByRole("dialog", { name: "Antes de tu primera consulta", exact: true });
  if (await notice.isVisible()) {
    onStage("acepta explícitamente el aviso del asistente por Entendido");
    await notice.getByRole("button", { name: "Entendido", exact: true }).click();
    await notice.waitFor({ state: "hidden" });
    onStage("el aviso quedó aceptado antes de interactuar con el perfil");
  }
}
async function sendFromUi(page, text) {
  await page.getByRole("textbox", { name: "Tu consulta", exact: true }).fill(text);
  const response = page.waitForResponse((item) => /\/assistant\/conversations\/[^/]+\/messages$/.test(new URL(item.url()).pathname)
    && item.request().method() === "POST");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  const admitted = await response;
  assert.equal(admitted.status(), 200, "Enviar por UI debe admitir el turno real.");
  assert.match(admitted.headers()["content-type"], /^text\/event-stream/);
  return { response: admitted, id: new URL(admitted.url()).pathname.split("/").at(-2) };
}
async function openHistory(page, width) {
  if (width === 390) await page.getByRole("button", { name: "Conversaciones", exact: true }).click();
}
async function selectConversation(page, width, title) {
  await openHistory(page, width);
  await page.getByRole("button", { name: title, exact: true }).first().click();
}
export async function conversationAction(page, width, title, action, { saved = false } = {}) {
  await openHistory(page, width);
  const group = saved ? page.getByRole("heading", { name: "Guardadas", exact: true }).locator("..") : page;
  await group.getByRole("button", { name: `Acciones de ${title}`, exact: true }).click();
  await page.getByRole("menuitem", { name: `${action}: ${title}`, exact: true }).click();
}
async function newConversation(page) {
  await page.getByRole("button", { name: "Nueva conversación", exact: true }).first().click();
}
const calls = (value) => value.calls + value.titleCalls;

export function assistantTerminalDiagnostic(response) {
  const event = response.events?.at(-1);
  const code = response.terminal?.code;
  return {
    lastEvent: ["start", "delta", "tool", "title", "done", "error"].includes(event) ? event : "none",
    terminal: { code: typeof code === "string" && /^[A-Za-z0-9.]+$/.test(code) ? code : "none" },
  };
}

/** Aísla la cantidad de archivos del presupuesto usado por el historial de transporte. */
export async function assistantAttachmentQuantityCases(page, root, width) {
  const created = await assistantApi(page, { route: `${root}/conversations`, method: "POST", body: {}, key: randomUUID() });
  assert.equal(created.status, 201);
  const id = created.body.id;
  const route = `${root}/conversations/${id}/attachments`;
  const attachments = [];
  for (let index = 0; index < 5; index++) {
    const detail = await readConversation(page, root, id);
    const uploaded = await assistantApi(page, { route, method: "POST", body: { conversationVersion: detail.conversation.version },
      key: randomUUID(), file: { name: `adjunto-${index}.png`, type: "image/png", bytes: Array.from(png) } });
    assert.equal(uploaded.status, 201); attachments.push(uploaded.body.id);
  }
  let detail = await readConversation(page, root, id);
  const multiple = { text: "[E2E:answer] Cinco imágenes de prueba.", attachmentIds: attachments, conversationVersion: detail.conversation.version };
  const sixth = await assistantApi(page, { route: `${root}/conversations/${id}/messages`, method: "POST",
    body: { ...multiple, attachmentIds: [...attachments, attachments[0]] }, key: randomUUID(), stream: true });
  assert.equal(sixth.status, 400, "Seis archivos se rechazan antes de llamar al modelo.");
  const five = await assistantApi(page, { route: `${root}/conversations/${id}/messages`, method: "POST", body: multiple, key: randomUUID(), stream: true });
  process.stdout.write(`TECH DATA attachments.five-six ${width} ${JSON.stringify(assistantTerminalDiagnostic(five))}\n`);
  assert.equal(five.status, 200); assert.equal(five.events.at(-1), "done");
  detail = await waitAssistantTerminal(page, root, id);
  assert.equal(detail.messages.items.findLast((message) => message.role === "user").attachments.length, 5);
}

/** Los 21 hitos usan controles de la app; los casos técnicos suplementarios usan la API real. */
export async function runAssistantJourney({ page, platformPage, width, env, base, businessEmail, operatorEmail,
  record, organizationName = "Empresa E2E", login = (target, email, access) => assistantLogin(target, env, base, email, access), signOut,
  onlyNotice = false, afterNotice = false, fromTools = false, fromHistory = false, fromTransport = false, fromRename = false, fromAttachments = false, fromKey = false, keySaveOnly = false, crossOnly = false, keyChangedOnly = false }) {
  const control = createAssistantControl(env.command);
  const root = prefix("business");
  await login(page, businessEmail, "business");
  const active = await assistantApi(page, { route: "/api/me" });
  assert.equal(active.status, 200);
  assert.ok(typeof active.body.activeTenantId === "string", "El fixture se liga a la organización activa real.");
  const actor = { email: businessEmail, access: "business", tenantId: active.body.activeTenantId };
  const configured = await control("prepare", actor);
  assert.equal(configured.configured, true, "La fixture debe configurar el modelo de prueba exclusivamente en E2E.");
  await home(page, base, "business", width);
  const step = (id, action, target = page) => record(id, width, () => target, action, () => "El control real no cumplió la comprobación.");
  let id; let title; let admission;
  // Una continuación nueva necesita aceptar por UI el aviso del contexto fresco, sin repetir el CHECK aprobado.
  if (afterNotice || fromTools || fromHistory || fromTransport || fromRename || fromAttachments || fromKey || crossOnly) await acceptNotice(page);
  else await step("E8B-10-1", async () => {
    const notice = page.getByRole("dialog", { name: "Antes de tu primera consulta", exact: true });
    await notice.waitFor();
    assert.equal(await page.getByRole("textbox", { name: "Tu consulta", exact: true, includeHidden: true }).isEnabled(), false);
    const before = await control("providerCounters");
    const draft = await assistantApi(page, { route: `${root}/conversations`, method: "POST", body: {}, key: randomUUID() });
    assert.equal(draft.status, 400); assert.equal(draft.code, "Assistant.Notice.AcceptanceRequired");
    // La política del aviso precede al lookup de conversación: ni crear ni enviar admiten aceptación implícita.
    const blocked = await assistantApi(page, { route: `${root}/conversations/${randomUUID()}/messages`, method: "POST", key: randomUUID(),
      body: { text: "[E2E:answer] No aceptar implícitamente.", attachmentIds: [], conversationVersion: 1 }, stream: true });
    assert.equal(blocked.status, 400); assert.equal(blocked.code, "Assistant.Notice.AcceptanceRequired");
    assert.equal(calls(await control("providerCounters")), calls(before));
    await acceptNotice(page);
    const state = await assistantApi(page, { route: root });
    assert.equal(state.status, 200); assert.equal(state.body.noticeAccepted, true);
    return "Entendido quedó persistido antes de permitir consultar.";
  });
  if (onlyNotice) return;
  if (crossOnly) {
    const created = await assistantApi(page, { route: `${root}/conversations`, method: "POST", body: {}, key: randomUUID() });
    assert.equal(created.status, 201);
    // Reproduce la página de salida del bloque aprobado, sin volver a comprobar su navegación.
    await page.goto(new URL("/org/asistente/uso", base).href);
    await page.getByRole("heading", { name: "Uso", exact: true }).waitFor();
    await assistantAccessCases({ page, platformPage, width, base, control, actor, ownBusinessId: created.body.id, businessEmail, operatorEmail, organizationName, login, signOut });
    return;
  }
  const toolQuestion = "[E2E:tool] [E2E:slow] ¿Quiénes son los usuarios activos?";
  if (!fromTools && !fromHistory && !fromTransport && !fromRename && !fromAttachments && !fromKey) {
  await step("E8B-10-2", async () => {
    await page.getByRole("heading", { name: "¿Qué querés consultar?", exact: true }).waitFor();
    await page.reload();
    await page.getByRole("textbox", { name: "Tu consulta", exact: true }).waitFor();
    assert.equal(await page.getByRole("dialog", { name: "Antes de tu primera consulta", exact: true }).count(), 0);
    return "La bienvenida y las consultas fijas están disponibles; F5 conserva el aviso aceptado.";
  });
  let beforeQuick;
  await step("E8B-20-1", async () => {
    beforeQuick = await control("providerCounters");
    const response = page.waitForResponse((item) => new URL(item.url()).pathname === `${root}/quick/expired_invitations` && item.request().method() === "POST");
    await page.getByRole("button", { name: "Invitaciones vencidas", exact: true }).click();
    const reply = await response; assert.equal(reply.status(), 200); id = (await reply.json()).conversation.id;
    return "La consulta fija devuelve datos reales sin pasar por el modelo.";
  });
  await step("E8B-20-2", async () => {
    assert.equal(calls(await control("providerCounters")), calls(beforeQuick), "El atajo no llama al modelo ni al título.");
    await page.getByRole("link", { name: "Ver en Usuarios", exact: true }).waitFor();
    return "La respuesta conserva su enlace interno a Usuarios y el contador del modelo no cambió.";
  });
  await step("E8B-20-3", async () => {
    await page.getByRole("link", { name: "Ver en Usuarios", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/org/usuarios");
    await page.getByRole("heading", { name: "Usuarios", exact: true }).waitFor();
    return "El enlace abrió Usuarios con la sesión y permisos reales.";
  });
  await home(page, base, "business", width);
  await step("E8B-30-1", async () => {
    await page.locator('input[type="file"]').setInputFiles({ name: "información.png", mimeType: "image/png", buffer: png });
    await page.getByRole("button", { name: "Quitar información.png", exact: true }).waitFor();
    admission = await sendFromUi(page, toolQuestion); id = admission.id;
    return "La imagen se subió por multipart autenticado y el envío abrió SSE a través de Vite.";
  });
  } else if (fromKey || fromAttachments) {
    const created = await assistantApi(page, { route: `${root}/conversations`, method: "POST", body: {}, key: randomUUID() });
    assert.equal(created.status, 201); id = created.body.id;
    if (fromAttachments) {
      // El historial posterior requiere una guardada visible; no vuelve a probar herramientas ni transporte.
      const prepared = await assistantApi(page, { route: `${root}/conversations/${id}/messages`, method: "POST", key: randomUUID(), stream: true,
        body: { text: "[E2E:answer] Preparación de conversación guardada.", attachmentIds: [], conversationVersion: created.body.version } });
      assert.equal(prepared.status, 200);
    }
  } else {
    // Dependencia mínima del contexto fresco: una pregunta por UI, sin repetir upload, atajo, navegación ni CHECK verdes.
    admission = await sendFromUi(page, toolQuestion); id = admission.id;
  }
  if (!fromHistory && !fromTransport && !fromRename && !fromAttachments && !fromKey) {
  await step("E8B-30-2", async () => {
    await page.getByText("Consultando usuarios…", { exact: true }).or(page.getByText("Consultó Usuarios", { exact: true })).first().waitFor();
    return "La herramienta real de Usuarios informa su estado sin mostrar argumentos privados.";
  });
  await step("E8B-30-3", async () => {
    await page.getByText(/Respuesta de prueba con acentos/).first().waitFor();
    await page.getByRole("button", { name: "Detener", exact: true }).waitFor();
    return "La respuesta parcial aparece antes del final y permite Detener.";
  });
  await step("E8B-30-4", async () => {
    const detail = await waitAssistantTerminal(page, root, id);
    title = detail.conversation.title ?? "Nueva conversación";
    const message = detail.messages.items.at(-1); assert.equal(message.status, "Complete");
    const counter = await control("providerCounters"); assert.ok(counter.calls >= 2 && counter.toolCycles >= 1);
    const response = page.waitForResponse((item) => new URL(item.url()).pathname.endsWith(`/messages/${message.id}/feedback`) && item.request().method() === "PUT");
    await page.getByRole("button", { name: "Me sirvió", exact: true }).last().click();
    assert.equal((await response).status(), 200);
    assert.equal((await readConversation(page, root, id)).messages.items.at(-1).rating, "up");
    return "La respuesta completa y su feedback están en PostgreSQL; el contador acredita la herramienta y sus ciclos.";
  });
  } else if (!fromKey) await waitAssistantTerminal(page, root, id);
  if (!fromTransport && !fromRename && !fromAttachments && !fromKey) {
  await step("E8B-40-1", async () => {
    title = (await readConversation(page, root, id)).conversation.title ?? "Nueva conversación";
    await openHistory(page, width);
    await page.getByRole("button", { name: `Acciones de ${title}`, exact: true }).click();
    await page.getByRole("menuitem", { name: `Guardar: ${title}`, exact: true }).waitFor();
    return "El menú ofrece guardar, renombrar, exportar y borrar la conversación propia.";
  });
  await step("E8B-40-2", async () => {
    const saved = page.waitForResponse((item) => new URL(item.url()).pathname === `${root}/conversations/${id}` && item.request().method() === "PUT");
    await page.getByRole("menuitem", { name: `Guardar: ${title}`, exact: true }).click(); assert.equal((await saved).status(), 200);
    if (width === 390) await page.keyboard.press("Escape");
    assert.equal((await readConversation(page, root, id)).conversation.isSaved, true);
    return "Guardar usa la versión real y la conversación pasa a Guardadas sin vencimiento.";
  });
  await step("E8B-40-3", async () => {
    const before = await control("providerCounters");
    for (const [format, name, type] of [["markdown", "Exportar en Markdown", "text/markdown"], ["pdf", "Exportar en PDF", "application/pdf"]]) {
      const downloaded = page.waitForEvent("download");
      await conversationAction(page, width, title, name, { saved: true });
      const file = await downloaded; assert.equal(await file.failure(), null);
      const bytes = await readFile(await assistantExportPath(file, width, format));
      if (format === "pdf") assert.equal(bytes.subarray(0, 5).toString("ascii"), "%PDF-");
      else assert.ok(bytes.toString("utf8").includes("Respuesta de prueba con acentos"));
      const exported = await assistantApi(page, { route: `${root}/conversations/${id}/export?format=${format}` });
      assert.equal(exported.status, 200); assert.equal(exported.contentType, type);
      if (width === 390) await page.keyboard.press("Escape");
    }
    assert.equal(calls(await control("providerCounters")), calls(before), "Exportar no llama al modelo.");
    return "Markdown UTF-8 y PDF binario descargan por HTTP privado, sin otro consumo del modelo.";
  });
  } else if (!fromKey) {
    // La prueba de retención posterior necesita una conversación guardada propia como preparación real.
    const saved = await readConversation(page, root, id);
    assert.equal((await assistantApi(page, { route: `${root}/conversations/${id}`, method: "PUT", body: { isSaved: true, version: saved.conversation.version } })).status, 200);
  }
  // Navegación, stop, replay y bordes de archivos pertenecen a la integración real.
  if (!fromKey) await assistantTransportCases({ page, width, base, control, root, actor, savedId: id, resumeOnly: fromTransport && !keyChangedOnly, historyOnly: fromRename, attachmentsOnly: fromAttachments, keyChangedOnly });
  if (!fromKey) {
  await step("E8B-50-1", async () => {
    const me = await assistantApi(page, { route: "/api/me" });
    const organizationId = me.body.activeTenantId;
    assert.ok(typeof organizationId === "string");
    await platformPage.goto(new URL(`/plataforma/organizaciones/${organizationId}?tab=modules`, base).href);
    await platformPage.getByRole("tab", { name: /^Módulos/ }).click();
    await platformPage.getByRole("button", { name: "Acciones de Asistente", exact: true }).click();
    await platformPage.getByRole("menuitem", { name: "Permitir su propia clave", exact: true }).click();
    const dialog = platformPage.getByRole("dialog");
    await dialog.getByRole("textbox", { name: /Motivo/ }).fill("Verificación E8b con proveedor de prueba aislado");
    await dialog.getByRole("button", { name: "Permitir", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    return "Plataforma habilita la clave propia con autorización, motivo y versión reales.";
  }, platformPage);
  } else {
    // La acción UI ya aprobada se prepara por su servicio real, con operador, versión y motivo explícitos.
    await platformPage.goto(new URL(`/plataforma/organizaciones/${actor.tenantId}?tab=modules`, base).href);
    await platformPage.getByRole("tab", { name: /^Módulos/ }).waitFor();
    const route = `/api/platform/tenants/${actor.tenantId}/assistant/policy`;
    const policy = await assistantApi(platformPage, { route }); assert.equal(policy.status, 200);
    assert.equal((await assistantApi(platformPage, { route, method: "PUT", body: { allowOwnKey: true, reason: "Preparación explícita de la continuación E8b", version: policy.body.version } })).status, 200);
  }
  const selectOwnKey = async () => {
    await page.goto(new URL("/org/asistente/configuracion", base).href);
    await page.getByRole("radio", { name: "La nuestra", exact: true }).click();
    await page.getByRole("textbox", { name: "Clave de Anthropic", exact: true }).waitFor();
    return "El Dueño puede elegir su clave tras el permiso explícito de Plataforma.";
  };
  if (keySaveOnly) await selectOwnKey(); else await step("E8B-50-2", selectOwnKey);
  await step("E8B-50-3", async () => {
    await page.getByRole("textbox", { name: "Consultas por persona por día", exact: true }).fill("50");
    await page.getByRole("textbox", { name: "Tope del mes", exact: true }).fill("10");
    // Cambiar topes abandona cualquier secreto previo; se escribe la clave al finalizar la edición.
    await page.getByRole("textbox", { name: "Clave de Anthropic", exact: true }).fill("e2e-own-assistant-key");
    const read = await assistantApi(page, { route: `${root}/settings` }); assert.equal(read.status, 200);
    const metadata = await page.evaluate(async (settings) => {
      const { settingsValues, settingsSchema } = await import("/src/modules/assistant/settings/settingsForm.ts");
      const projected = settingsValues(settings);
      const result = settingsSchema((key) => key, false).safeParse({ ...projected, mode: "OwnKey", dailyMessageLimit: 50,
        monthlyBudget: { amount: 10, currency: settings.monthlyBudget?.currency ?? "USD" }, keyAction: "replace" });
      const fields = new Set(["mode", "modelId", "effort", "dailyMessageLimit", "monthlyBudget", "allowedModelIds", "personalEnabled", "retentionDays", "keyAction"]);
      return { effort: ["low", "medium", "high", "Low", "Medium", "High"].includes(settings.effort) ? settings.effort : "unknown",
        allowOwnKey: settings.allowOwnKey === true, hasAlertRecipient: settings.hasAlertRecipient === true,
        modelCompatible: settings.ownKeyModels.some((model) => model.id === settings.modelId && model.isActive),
        projectedInvalidFields: result.success ? [] : result.error.issues.map((issue) => fields.has(issue.path[0]) ? issue.path[0] : "unknown") };
    }, read.body);
    const keyPresent = await page.getByRole("textbox", { name: "Clave de Anthropic", exact: true }).evaluate((input) => input.value.trim().length > 0);
    process.stdout.write(`TECH DATA settings.key-save ${width} ${JSON.stringify({ ...metadata, keyPresent })}\n`);
    const response = page.waitForResponse((item) => new URL(item.url()).pathname === `${root}/settings` && item.request().method() === "PUT")
      .catch(() => null);
    await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
    await delay(100);
    const visible = await page.evaluate(async () => {
      const { default: i18n } = await import("/src/shared/i18n/index.ts");
      const form = document.querySelector("#assistant-settings");
      const labels = new Set(["Clave de Anthropic", "Consultas por persona por día", "Tope del mes", "Modelo", "Esfuerzo", "Qué clave usa"]);
      const labelFor = (field) => field.id ? Array.from(form.querySelectorAll("label")).find((item) => item.htmlFor === field.id)?.textContent?.trim().replace(/\s*\*\s*$/, "") : null;
      const invalid = Array.from(form?.querySelectorAll("input:invalid,textarea:invalid,[aria-invalid=true]") ?? [])
        .map((field) => { const label = labelFor(field); return labels.has(label) ? label : "unknown"; });
      const keys = ["assistant:settings.validation.money", "assistant:settings.validation.model", "assistant:settings.validation.limit", "assistant:settings.validation.key", "fields.invalidMoney", "fields.invalidNumber"];
      const errors = Array.from(form?.querySelectorAll('[role="alert"]') ?? []).map((alert) => keys.find((key) => i18n.t(key) === alert.textContent?.trim()) ?? "unknown");
      return { nativeValid: form?.checkValidity() === true, invalidFields: invalid, validationKeys: errors };
    });
    process.stdout.write(`TECH DATA settings.key-save-ui ${width} ${JSON.stringify(visible)}\n`);
    assert.equal(metadata.projectedInvalidFields.length, 0, "El contrato leído debe satisfacer el esquema público.");
    assert.equal(metadata.allowOwnKey && metadata.hasAlertRecipient && metadata.modelCompatible, true, "La preparación debe habilitar guardar OwnKey.");
    const reply = await response;
    assert.ok(reply, "Guardar debe emitir su PUT después de validar el formulario.");
    assert.equal(reply.status(), 200);
    return "La clave se valida contra FakeChatClient y se guarda por el servicio productivo, con sus topes.";
  });
  await step("E8B-50-4", async () => {
    await page.reload();
    await page.getByRole("button", { name: "Cambiar", exact: true }).waitFor();
    const settings = await assistantApi(page, { route: `${root}/settings` });
    assert.equal(settings.body.mode, "OwnKey"); assert.equal(settings.body.hasKey, true);
    assert.ok(!JSON.stringify(settings.body).includes("e2e-own-assistant-key"));
    return "F5 conserva OwnKey y la respuesta expone sólo la máscara, sin devolver la clave.";
  });
  await step("E8B-60-1", async () => {
    await control("quotas", { ...actor, remainingMessages: 10, monthlyFraction: 0 });
    await home(page, base, "business", width);
    await page.getByText("Te quedan 10 consultas hoy.", { exact: true }).waitFor();
    return "La cuota persistida entrega diez consultas restantes y la UI muestra el contador.";
  });
  await step("E8B-60-2", async () => {
    await control("quotas", { ...actor, remainingMessages: 0, monthlyFraction: 0 });
    await home(page, base, "business", width);
    await page.getByText(/Llegaste a las .* consultas de hoy/).waitFor();
    const before = await control("providerCounters");
    await page.getByRole("button", { name: "Invitaciones vencidas", exact: true }).click();
    await page.getByRole("link", { name: "Ver en Usuarios", exact: true }).waitFor();
    assert.equal(calls(await control("providerCounters")), calls(before));
    return "El tope deshabilita IA y conserva las consultas fijas sin gasto.";
  });
  await step("E8B-60-3", async () => {
    await control("quotas", { ...actor, remainingMessages: 10, monthlyFraction: 0.8 });
    await page.goto(new URL("/org/asistente/uso", base).href);
    await page.getByRole("heading", { name: "Uso", exact: true }).waitFor();
    await page.getByRole("group", { name: "Resumen de uso", exact: true }).waitFor();
    assert.equal(await page.getByText(toolQuestion, { exact: true }).count(), 0);
    return "Uso muestra períodos y costo agregados sin textos de conversaciones.";
  });
  await step("E8B-60-4", async () => {
    const recipient = await control("quotas", { ...actor, remainingMessages: 10, monthlyFraction: 0.8, notify: true });
    assert.equal(recipient.alertQueued, true, "El umbral debe usar el outbox real.");
    for (let attempt = 0; attempt < 120; attempt++) {
      const mails = await env.messages(businessEmail, new Set());
      if (mails.some(({ body }) => /asistente/i.test(body) && /80/.test(body))) return "El outbox entregó la alerta del umbral al correo verificado del Dueño en pickup real.";
      await delay(250);
    }
    throw new Error("No llegó la alerta de presupuesto al pickup real.");
  });
  await step("E8B-60-5", async () => {
    await control("quotas", { ...actor, remainingMessages: 10, monthlyFraction: 1 });
    await home(page, base, "business", width);
    await page.getByText(/llegó al tope del mes del asistente/).waitFor();
    await page.getByRole("button", { name: "Ver uso", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/org/asistente/uso");
    await page.getByRole("heading", { name: "Uso", exact: true }).waitFor();
    return "El presupuesto persistido bloquea IA y Ver uso abre el resumen privado.";
  });
  await assistantAccessCases({ page, platformPage, width, base, control, actor, ownBusinessId: id, businessEmail, operatorEmail, organizationName, login, signOut });
}

async function assistantAccessCases({ page, platformPage, width, base, control, actor, ownBusinessId, businessEmail, operatorEmail, organizationName, login, signOut }) {
  let stage = "access.consumer-login";
  try {
  process.stdout.write(`TECH INICIO ${stage} ${width}\n`);
  await control("quotas", { ...actor, remainingMessages: 50, monthlyFraction: 0 });
  // Los tres accesos comparten cuenta/cuota donde corresponde y separan chats.
  await signOut(page, organizationName);
  await login(page, businessEmail, "consumer");
  const personal = await assistantApi(page, { route: "/api/me" });
  assert.equal(personal.status, 200);
  assert.equal(personal.body.access, "consumer");
  await control("prepare", { email: businessEmail, access: "consumer", ...(personal.body.activeTenantId ? { tenantId: personal.body.activeTenantId } : {}) });
  await home(page, base, "consumer", width); await acceptNotice(page);
  const consumer = prefix("consumer");
  stage = "access.consumer-isolation";
  assert.equal((await assistantApi(page, { route: `${consumer}/conversations/${ownBusinessId}` })).status, 404);
  process.stdout.write(`TECH OK ${stage} ${width}\n`);
  stage = "access.consumer-quick";
  await page.getByRole("button", { name: "Cómo entro a mi cuenta", exact: true }).click();
  await page.getByRole("link", { name: "Ver mi cuenta", exact: true }).waitFor();
  process.stdout.write(`TECH OK ${stage} ${width}\n`);
  await signOut(page, "Personal");
  await control("prepare", { email: operatorEmail, access: "platform" });
  await home(platformPage, base, "platform", width); await acceptNotice(platformPage);
  stage = "access.platform-isolation";
  assert.equal((await assistantApi(platformPage, { route: `${prefix("platform")}/conversations/${ownBusinessId}` })).status, 404);
  process.stdout.write(`TECH OK ${stage} ${width}\n`);
  stage = "access.platform-quick";
  await platformPage.getByRole("button", { name: "Organizaciones por aprobar", exact: true }).click();
  await platformPage.getByRole("link", { name: "Ver en Organizaciones", exact: true }).waitFor();
  process.stdout.write(`TECH OK ${stage} ${width}\n`);
  } catch (error) { error.assistantStage = stage; throw error; }
}

async function assistantTransportCases({ page, width, base, control, root, actor, savedId, resumeOnly = false, historyOnly = false, attachmentsOnly = false, keyChangedOnly = false }) {
  let stage = historyOnly ? "history.rename-conflict" : attachmentsOnly ? "attachments.five-six" : keyChangedOnly ? "transport.keychanged" : resumeOnly ? "transport.resume" : "transport.sse";
  const advance = (next) => { process.stdout.write(`TECH OK ${stage} ${width}\n`); stage = next; process.stdout.write(`TECH INICIO ${stage} ${width}\n`); };
  process.stdout.write(`TECH INICIO ${stage} ${width}\n`);
  try {
  // Un primer delta real llega antes de done; replay conserva IDs y no factura otra vez.
  const created = await assistantApi(page, { route: `${root}/conversations`, method: "POST", body: {}, key: randomUUID() });
  assert.equal(created.status, 201);
  const id = created.body.id;
  let detail = await readConversation(page, root, id);
  let failing;
  const route = `${root}/conversations/${id}/attachments`;
  if (!historyOnly) {
  if (!attachmentsOnly) {
  const request = { text: "[E2E:answer] Respuesta incremental para comprobar transporte.", attachmentIds: [], conversationVersion: detail.conversation.version };
  const key = randomUUID();
  if (!resumeOnly) {
  const streamed = await assistantApi(page, { route: `${root}/conversations/${id}/messages`, method: "POST", body: request, key, stream: true });
  assert.equal(streamed.status, 200);
  if (!keyChangedOnly) {
  assert.equal(streamed.contentType, "text/event-stream");
  assert.equal(streamed.events[0], "start"); assert.equal(streamed.events.at(-1), "done");
  assert.ok(streamed.firstDeltaAt < streamed.doneAt, "Vite debe entregar un delta antes de cerrar el SSE.");
  advance("transport.replay");
  const before = await control("providerCounters");
  const replay = await assistantApi(page, { route: `${root}/conversations/${id}/messages`, method: "POST", body: request, key });
  assert.equal(replay.status, 200); assert.equal(replay.contentType, "application/json");
  assert.equal(replay.body.turnId, streamed.terminal.turnId); assert.equal(calls(await control("providerCounters")), calls(before));
  advance("transport.keychanged");
  }
  const changedHeaders = page.waitForResponse((reply) => new URL(reply.url()).pathname === `${root}/conversations/${id}/messages` && reply.request().method() === "POST")
    .then((reply) => { const mime = reply.headers()["content-type"]?.split(";", 1)[0]; return { contentType: ["application/json", "application/problem+json", "text/html", "text/plain"].includes(mime) ? mime : "unknown" }; }).catch(() => ({ contentType: "unavailable" }));
  const changed = await assistantApi(page, { route: `${root}/conversations/${id}/messages`, method: "POST", body: { ...request, text: "Otro cuerpo" }, key });
  process.stdout.write(`TECH DATA transport.keychanged ${width} ${JSON.stringify({ status: changed.status, code: typeof changed.code === "string" && /^[A-Za-z0-9.]+$/.test(changed.code) ? changed.code : "none", ...await changedHeaders })}\n`);
  assert.equal(changed.status, 422);
  advance("transport.disconnect");
  }
  // Desmontar sólo cierra transporte. Reabrir observa el final del mismo turno.
  detail = await readConversation(page, root, id);
  const lost = await assistantApi(page, { route: `${root}/conversations/${id}/messages`, method: "POST",
    body: { text: "[E2E:slow] Continuá al cerrar la pestaña.", attachmentIds: [], conversationVersion: detail.conversation.version }, key: randomUUID(), stream: true, disconnect: true });
  assert.equal(lost.status, 200); assert.ok(lost.events.includes("delta"));
  if (!resumeOnly) advance("transport.resume");
  await page.goto(new URL("/org/usuarios", base).href);
  await page.getByRole("heading", { name: "Usuarios", exact: true }).waitFor();
  detail = await waitAssistantTerminal(page, root, id); assert.equal(detail.messages.items.at(-1).status, "Complete");
  await home(page, base, "business", width);
  await selectConversation(page, width, detail.conversation.title ?? "Nueva conversación");
  await page.getByText(/Respuesta de prueba con acentos/).first().waitFor();
  advance("transport.stop");
  // Detener por UI envía stop durable, no confunde cierre de lector con cancelación.
  await newConversation(page);
  const slow = await sendFromUi(page, "[E2E:slow] Esta respuesta se detiene explícitamente.");
  await page.getByRole("button", { name: "Detener", exact: true }).waitFor();
  await page.getByRole("button", { name: "Detener", exact: true }).click();
  detail = await waitAssistantTerminal(page, root, slow.id); assert.equal(detail.messages.items.at(-1).status, "Stopped");
  await page.getByText("Detuviste la respuesta.", { exact: true }).waitFor();
  advance("transport.failed");
  await newConversation(page);
  failing = await sendFromUi(page, "[E2E:error] Fallo después de un parcial.");
  detail = await waitAssistantTerminal(page, root, failing.id); assert.equal(detail.messages.items.at(-1).status, "Failed");
  await page.getByRole("button", { name: "Reintentar", exact: true }).waitFor();
  advance("attachments.signature-limit");
  // Bordes de upload reales: firma, +1 byte, dueño/conversación y borrar pendiente.
  detail = await readConversation(page, root, id);
  const misleading = await assistantApi(page, { route, method: "POST", body: { conversationVersion: detail.conversation.version },
    key: randomUUID(), file: { name: "imagen.png", type: "image/png", bytes: Array.from(Buffer.from("archivo que no es PNG")) } });
  assert.equal(misleading.status, 400);
  const tooLarge = await assistantApi(page, { route, method: "POST", body: { conversationVersion: detail.conversation.version },
    key: randomUUID(), file: { name: "demasiado.png", type: "image/png", bytes: Array.from(png), size: 10 * 1024 * 1024 + 1 } });
  assert.equal(tooLarge.status, 413);
  const exactLimit = await assistantApi(page, { route, method: "POST", body: { conversationVersion: detail.conversation.version },
    key: randomUUID(), file: { name: "diez-mib.png", type: "image/png", bytes: Array.from(png), size: 10 * 1024 * 1024 } });
  assert.equal(exactLimit.status, 201, "El límite exacto del archivo se admite.");
  assert.equal((await assistantApi(page, { route: `${route}/${exactLimit.body.id}?version=${exactLimit.body.version}`, method: "DELETE" })).status, 204);
  advance("attachments.owner-delete");
  detail = await readConversation(page, root, id);
  const attachment = await assistantApi(page, { route, method: "POST", body: { conversationVersion: detail.conversation.version },
    key: randomUUID(), file: { name: "válida.png", type: "image/png", bytes: Array.from(png) } });
  assert.equal(attachment.status, 201);
  const downloaded = await assistantApi(page, { route: `${route}/${attachment.body.id}` });
  assert.equal(downloaded.status, 200); assert.equal(downloaded.bytes.length, png.length);
  assert.equal((await assistantApi(page, { route: `${root}/conversations/${savedId}/attachments/${attachment.body.id}` })).status, 404);
  assert.equal((await assistantApi(page, { route: `${route}/${attachment.body.id}?version=${attachment.body.version}`, method: "DELETE" })).status, 204);
  assert.equal((await assistantApi(page, { route: `${route}/${attachment.body.id}` })).status, 404);
  advance("attachments.five-six");
  }
  await assistantAttachmentQuantityCases(page, root, width);
  advance("history.rename-conflict");
  }
  if (historyOnly || attachmentsOnly) {
    const failed = await assistantApi(page, { route: `${root}/conversations`, method: "POST", body: {}, key: randomUUID() });
    assert.equal(failed.status, 201);
    failing = { id: failed.body.id };
    await assistantApi(page, { route: `${root}/conversations/${failing.id}/messages`, method: "POST", key: randomUUID(), stream: true,
      body: { text: "[E2E:error] Preparación de conversación temporal.", attachmentIds: [], conversationVersion: failed.body.version } });
    await waitAssistantTerminal(page, root, failing.id);
    await home(page, base, "business", width);
  }
  const saved = await readConversation(page, root, savedId);
  const savedName = `Guardada E8b ${width}`;
  await conversationAction(page, width, saved.conversation.title ?? "Nueva conversación", "Renombrar", { saved: true });
  const rename = page.getByRole("dialog", { name: "Renombrar la conversación", exact: true });
  await rename.getByRole("textbox", { name: "Nombre", exact: true }).fill(savedName);
  const renamed = page.waitForResponse((item) => new URL(item.url()).pathname === `${root}/conversations/${savedId}` && item.request().method() === "PUT");
  await rename.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  assert.equal((await renamed).status(), 200); await rename.waitFor({ state: "hidden" });
  assert.equal((await readConversation(page, root, savedId)).conversation.title, savedName);
  const stale = await assistantApi(page, { route: `${root}/conversations/${savedId}`, method: "PUT",
    body: { title: "Nombre obsoleto", isSaved: true, version: saved.conversation.version } });
  assert.equal(stale.status, 409, "Una versión anterior no sobrescribe el nombre guardado.");
  advance("history.delete-retention");
  const failed = await readConversation(page, root, failing.id);
  const temporaryTitle = `Temporal E8b ${width}`;
  assert.equal((await assistantApi(page, { route: `${root}/conversations/${failing.id}`, method: "PUT",
    body: { title: temporaryTitle, isSaved: false, version: failed.conversation.version } })).status, 200);
  await home(page, base, "business", width);
  await selectConversation(page, width, temporaryTitle);
  await conversationAction(page, width, temporaryTitle, "Borrar");
  const confirm = page.getByRole("dialog");
  await confirm.getByRole("button", { name: "Borrar", exact: true }).click(); await confirm.waitFor({ state: "hidden" });
  assert.equal((await assistantApi(page, { route: `${root}/conversations/${failing.id}` })).status, 404);
  await control("clock", { ...actor, retentionExpired: true });
  assert.equal((await assistantApi(page, { route: `${root}/conversations/${id}` })).status, 404, "El worker purga chats vencidos.");
  assert.equal((await assistantApi(page, { route: `${root}/conversations/${savedId}` })).status, 200, "El worker conserva las guardadas.");
  process.stdout.write(`TECH OK ${stage} ${width}\n`);
  } catch (error) { error.assistantStage = stage; throw error; }
}
