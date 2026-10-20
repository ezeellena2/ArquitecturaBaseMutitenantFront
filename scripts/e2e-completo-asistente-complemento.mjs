import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { assistantHomeRoute, acceptAssistantNoticeFromHome, waitAssistantTerminal } from "./assistant-real-ui.mjs";
import { createAssistantControl } from "./assistant-real-control.mjs";
import { syntheticEmail } from "./e2e-completo-soporte.mjs";
import { clickForResponse } from "./e2e-completo-negocio.mjs";
import { fillOtp, accountAddMethodName } from "./test-e2e-real-ui.mjs";
import { requireE8Control, sendWithCooldown } from "./recorrido-usuario-whatsapp.mjs";
import { nationalPhone } from "./recorrido-usuario-e11.mjs";
import { confirmRecentAuthentication, stopConfirmingRecentAuthentication } from "./platform-factor-real.mjs";

const root = "/api/organization/assistant"; const platformRoot = "/api/platform/assistant";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jh5kAAAAASUVORK5CYII=", "base64");
const def = (number, actor, action, route, expected, covers = []) => ({ id: `AS-SUP-${String(number).padStart(2, "0")}`, area: "Asistente · complemento", actor, action, route, expected, covers, critical: true, source: "scripts/e2e-completo-asistente-complemento.mjs" });
export const assistantSupplementDefinitions = [
  def(1, "Administrador de empresa activa", "Usar el asistente por proyección del rol de empresa", "/org · /org/asistente", "assistant.use proyectado permite un turno real; configure y Uso403, sin cambiar Inicio Tus empresas ni otorgar users.manage.", ["BACK-AS-002"]),
  def(2, "Dueña sin correo verificado utilizable", "Intentar OwnKey y abrir Agregar un correo", "/cuenta · /org/asistente/configuracion", "Phone real conserva el ingreso tras quitar Email; hasAlertRecipient=false, AlertRecipientRequired400, formulario abre Agregar correo y no cambia clave/modo/versión.", ["BACK-AS-017"]),
  def(3, "Operador con assistant.configure", "Editar configuración global y catálogo con validaciones y versión anterior", "/plataforma/asistente/configuracion", "Prueba reciente403→confirmación200; versión anterior409; modelo creado/editado por UI y duplicados, moneda, tarifa y modelo inválidos rechazados. La clave permanece write-only.", ["BACK-AS-019"]),
  def(4, "Operador con assistant.read", "Consultar uso global con consumos Business, Personal y Plataforma", "/plataforma/asistente/uso", "Filas reales de organización/Personas/Operadores; OwnKey y PlatformKey separados, sumas Money coincidentes y ninguna conversación ni texto privado.", ["BACK-AS-020"]),
  def(5, "Operador sólo con assistant.use", "Usar su chat sin gestión ni lectura global", "/plataforma/asistente", "Turno real propio; configure y read403; otro operador completo recibe404 Conversation.NotFound para ese historial.", ["BACK-AS-021"]),
  def(6, "Dueña de conversación propia", "Rechazar feedback ajeno y borrar un turno activo con PNG", "/org/asistente", "Conversación propia ya listada tras un turno inicial por UI; otro turno con PNG en ese mismo ID permanece Generating antes de Borrar204. Conversación y archivo404 sin URL/bytes ni resurrección ni nuevos títulos después del plazo del Fake; metadatos del upload privados."),
];
export const assistantPreparationRepairDefinitions = assistantSupplementDefinitions.filter((entry) => ["AS-SUP-02", "AS-SUP-03", "AS-SUP-04", "AS-SUP-06"].includes(entry.id));
export const assistantOperatorRepairDefinitions = assistantSupplementDefinitions.filter((entry) => entry.id === "AS-SUP-05");
export const assistantAttachmentRepairDefinitions = assistantSupplementDefinitions.filter((entry) => entry.id === "AS-SUP-06");
export const assistantSupplementProofGroups = {
  "BACK-AS-011": [["BASE-E8B-30-4", "AS-SUP-06"]],
  "BACK-AS-012": [["BASE-E8B-30-1", "AS-TEC-01", "AS-TEC-02", "MOD-28"]],
  "BACK-AS-013": [["AS-TEC-01", "MOD-28", "AS-SUP-06"]],
  "BACK-AS-014": [["MOD-03", "MOD-27", "AS-TEC-03"]],
};

function noPrivateContent(value, privateValues = []) {
  const inspect = (node) => {
    if (!node || typeof node !== "object") return;
    for (const [key, nested] of Object.entries(node)) {
      assert.equal(/(?:url$|storagekey|bytes|conversation|messages|prompt|payload|apikey|encrypted|secret|^text$|^content$)/iu.test(key), false, "La respuesta no debe publicar contenido privado ni direcciones de archivos.");
      inspect(nested);
    }
  };
  inspect(value); const serialized = JSON.stringify(value);
  for (const text of privateValues.filter(Boolean)) assert.equal(serialized.includes(text), false, "La respuesta no debe copiar el contenido del chat privado.");
}
export async function requirePrivateProblem(response, status, code, operation) {
  const actualStatus = response.status(); let problem;
  if (operation) { try { problem = await response.json(); } catch { /* El diagnóstico no publica cuerpos que no sean ProblemDetails. */ } }
  const observedCode = typeof problem?.code === "string" && /^(?:Assistant|Http|Validation|General|Auth|Legal)(?:\.[A-Za-z][A-Za-z0-9]*)+$/u.test(problem.code) ? problem.code : "no disponible";
  const diagnostic = operation ? `Diagnóstico seguro: operación ${operation}; estado ${actualStatus}; problem.code ${observedCode}.` : undefined;
  assert.equal(actualStatus, status, diagnostic); problem ??= await response.json();
  if (operation) assert.ok(problem.code === code, diagnostic); else assert.equal(problem.code, code);
  assert.ok(typeof problem.traceId === "string" && problem.traceId.length > 0);
  noPrivateContent(problem); return problem;
}
export async function requireForeignAssistantFeedbackAfterNotice(h, page, chat, prepareHome) {
  // La política exige el aviso de este usuario antes de buscar la conversación y comprobar su propiedad.
  await prepareHome();
  const answer = chat.detail.messages.items.findLast((message) => message.role === "assistant");
  assert.ok(answer, "La prueba requiere la respuesta real del Administrador de empresa.");
  return requirePrivateProblem(await h.api(page, `${root}/conversations/${chat.id}/messages/${answer.id}/feedback`, {
    method: "PUT", data: { rating: "up", version: answer.version },
  }), 404, "Assistant.Conversation.NotFound", "PUT /api/organization/assistant/conversations/:id/messages/:messageId/feedback");
}
export function requireProjectedAssistant(me, organizationId, companyId) {
  assert.equal(me.access, "business"); assert.equal(me.activeTenantId, organizationId);
  assert.ok(me.effectivePermissions.organization.includes("assistant.use"));
  for (const forbidden of ["assistant.configure", "users.manage", "users.invite"]) assert.equal(me.effectivePermissions.organization.includes(forbidden), false);
  assert.ok(me.effectivePermissions.companies[companyId]?.length > 0); assert.deepEqual(me.effectivePermissions.platform, []);
}
export function requirePrivateAttachmentMetadata(metadata, fileName, byteLength) {
  assert.deepEqual(Object.keys(metadata).sort(), ["byteLength", "fileName", "id", "mediaType", "version"]);
  assert.ok(metadata.id && Number.isInteger(metadata.version)); assert.equal(metadata.fileName, fileName);
  assert.equal(metadata.mediaType, "image/png"); assert.equal(metadata.byteLength, byteLength); noPrivateContent(metadata);
}
export function requireGlobalUsage(usage, organizationId, privateValues = []) {
  assert.match(usage.month, /^\d{4}-\d{2}$/u); const rows = usage.rows.items;
  assert.ok(rows.some((row) => row.kind === "personal" && row.queries > 0)); assert.ok(rows.some((row) => row.kind === "operator" && row.queries > 0));
  for (const mode of ["PlatformKey", "OwnKey"]) assert.ok(rows.some((row) => row.kind === "organization" && row.organizationId === organizationId && row.fundingMode === mode && row.queries > 0 && row.cost.amount > 0));
  assert.equal(rows.length, usage.rows.totalCount, "Las sumas requieren todas las páginas reales.");
  for (const row of rows) { assert.ok(Number.isFinite(row.cost.amount) && row.cost.amount >= 0); assert.equal(row.cost.currency, usage.cost.currency); }
  const sum = (selected) => selected.reduce((total, row) => total + row.cost.amount, 0);
  assert.ok(Math.abs(sum(rows) - usage.cost.amount) < 0.000001);
  assert.ok(Math.abs(sum(rows.filter((row) => row.fundingMode === "PlatformKey")) - usage.platformKeyCost.amount) < 0.000001);
  assert.ok(usage.platformKeyCost.amount < usage.cost.amount); noPrivateContent(usage, privateValues);
}
export function platformSettingsValues(settings) {
  return { defaultModelId: settings.defaultModelId, allowedModelIds: [...settings.allowedModelIds].sort(), effort: settings.effort,
    dailyMessageLimit: settings.dailyMessageLimit, monthlyOrganizationBudget: { ...settings.monthlyOrganizationBudget }, personalEnabled: settings.personalEnabled,
    retentionDays: settings.retentionDays, keyAction: "keep", version: settings.version };
}
export function assertGlobalSettingsRestored(before, after) {
  const omitVersion = (settings) => { const values = platformSettingsValues(settings); delete values.version; return values; };
  assert.deepEqual(omitVersion(after), omitVersion(before)); assert.equal(after.hasKey, before.hasKey); assert.equal(after.maskedKeySuffix, before.maskedKeySuffix);
}
const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
const endpoint = (route, method = "GET") => (response) => new URL(response.url()).pathname === route && response.request().method() === method;
const decimal = (value) => String(value).replace(".", ",");
async function read(h, page, route) { const response = await h.api(page, route); assert.equal(response.status(), 200); return response.json(); }
async function mark(page, label, checked) {
  const field = page.getByRole("checkbox", { name: label, exact: true }); await field.waitFor();
  if (await field.isChecked() === checked) return; const id = await field.getAttribute("id"); assert.ok(id);
  await page.locator(`label[for="${id}"]`).click(); assert.equal(await field.isChecked(), checked);
}
async function discard(page) {
  const cancel = page.getByRole("dialog").getByRole("button", { name: "Cancelar", exact: true }).filter({ visible: true }).last(); if (await cancel.isVisible()) await cancel.click();
  const button = page.getByRole("button", { name: "Descartar cambios", exact: true }).filter({ visible: true }).first(); if (await button.isVisible() && await button.isEnabled()) await button.click();
}
export async function closeAssistantPublicSession(h, page, { setCapture = () => {}, discardDraft = discard } = {}) {
  setCapture(page); await discardDraft(page); await page.goto(new URL("/cuenta", h.base).href);
  await page.getByRole("heading", { name: "Mi cuenta", exact: true }).waitFor();
  const me = await read(h, page, "/api/me"); assert.ok(["consumer", "business"].includes(me.access));
  await h.signOut(page);
}
export async function closeAssistantPlatformSession(h, page, { setCapture = () => {}, discardDraft = discard } = {}) {
  setCapture(page); await stopConfirmingRecentAuthentication(page); await discardDraft(page); await page.goto(new URL("/plataforma", h.base).href);
  await page.getByRole("button", { name: /, Plataforma$/u }).or(page.getByRole("navigation", { name: "Secciones", exact: true })).filter({ visible: true }).first().waitFor();
  assert.equal((await read(h, page, "/api/me")).access, "platform"); await h.signOut(page);
}
export async function openAssistantOwnKeyPolicyAction(page) {
  await page.getByRole("button", { name: "Acciones de Asistente", exact: true }).click();
  const allow = page.getByRole("menuitem", { name: "Permitir su propia clave", exact: true });
  const revoke = page.getByRole("menuitem", { name: "Solo con la clave de la plataforma", exact: true });
  await allow.or(revoke).filter({ visible: true }).first().waitFor();
  return await allow.isVisible() ? allow : null;
}
export async function fillAssistantModelTechnicalValues(dialog) {
  for (const [label, value] of [["Contexto (tokens)", "100000"], ["Salida máxima (tokens)", "1024"]]) await dialog.getByRole("textbox", { name: label, exact: true }).fill(value);
  // Los campos homónimos de Contexto largo son opcionales; estas tarifas pertenecen al grupo normal del modelo.
  const cache = dialog.getByRole("group", { name: "Caché · por millón de tokens", exact: true });
  for (const label of ["Lectura de caché", "Escritura de 5 minutos", "Escritura de 1 hora"]) await cache.getByRole("textbox", { name: label, exact: true }).fill("1");
}
export async function withAssistantHomeDiagnostics(h, page, { access, expectedTenantId }, action) {
  try { return await action(); } catch (error) {
    const inspect = async (route) => {
      try { const response = await h.api(page, route); const status = response.status(); return { status, value: status === 200 ? await response.json() : null }; }
      catch { return { status: null, value: null }; }
    };
    const me = await inspect("/api/me"); const state = await inspect(`/api/${{ business: "organization", consumer: "me", platform: "platform" }[access]}/assistant`);
    const profile = me.value; const knownAccess = ["business", "consumer", "platform"].includes(profile?.access) ? profile.access : null;
    const permissions = knownAccess === "platform" ? profile?.effectivePermissions?.platform : profile?.effectivePermissions?.organization;
    const hasAssistantFeature = Array.isArray(profile?.features) ? profile.features.includes("assistant") : null;
    const assistantUse = Array.isArray(permissions) ? permissions.includes(knownAccess === "platform" ? "platform.assistant.use" : "assistant.use") : null;
    const assistantConfigure = Array.isArray(permissions) ? permissions.includes(knownAccess === "platform" ? "platform.assistant.configure" : "assistant.configure") : null;
    const capability = profile?.moduleCapabilities?.find((item) => item.key === "assistant");
    // State no expone canUse. Esta elegibilidad se deriva únicamente del guard publicado de Me.
    const canUseFromMe = knownAccess === "platform" ? !!capability?.available && assistantUse === true
      : knownAccess === "consumer" ? hasAssistantFeature : knownAccess === "business" && hasAssistantFeature !== null && assistantUse !== null ? hasAssistantFeature && assistantUse : null;
    const diagnostic = { meStatus: me.status, meAccess: knownAccess, activeTenantMatch: profile && expectedTenantId ? profile.activeTenantId === expectedTenantId : null,
      hasAssistantFeature, assistantUse, assistantConfigure, canUseFromMe, stateStatus: state.status,
      stateConfigured: typeof state.value?.configured === "boolean" ? state.value.configured : null,
      stateCanConfigure: typeof state.value?.canConfigure === "boolean" ? state.value.canConfigure : null };
    throw new Error(`Inicio de Asistente no quedó listo. Diagnóstico seguro: ${JSON.stringify(diagnostic)}. ${error.message}`, { cause: error });
  }
}
async function chatHome(h, page, access = "business", direct = false, diagnostic) {
  const route = direct ? "/org/asistente" : assistantHomeRoute(access, h.width);
  const open = async () => {
    await page.goto(new URL(route, h.base).href); await acceptAssistantNoticeFromHome(page);
    await page.getByRole("textbox", { name: "Tu consulta", exact: true }).waitFor();
  };
  return diagnostic ? withAssistantHomeDiagnostics(h, page, { access, ...diagnostic }, open) : open();
}

export async function openProjectedAssistantCompanyHome(h, page) {
  await page.goto(new URL("/org", h.base).href);
  // En desktop ModuleHome conserva Tus empresas detrás del aviso modal; PhoneHome no monta el Asistente.
  if (h.width === 1440) await acceptAssistantNoticeFromHome(page);
  await page.getByRole("heading", { name: "Tus empresas", exact: true }).waitFor();
}
async function sendUi(h, page, text, chatRoot = root, terminal = true) {
  await page.getByRole("textbox", { name: "Tu consulta", exact: true }).fill(text);
  const sent = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.startsWith(`${chatRoot}/conversations/`) && new URL(response.url()).pathname.endsWith("/messages"));
  void sent.catch(() => {}); await page.getByRole("button", { name: "Enviar", exact: true }).click(); const response = await sent;
  assert.equal(response.status(), 200); assert.match(response.headers()["content-type"], /^text\/event-stream/u);
  const id = new URL(response.url()).pathname.split("/").at(-2);
  return { id, ...(terminal ? { detail: await waitAssistantTerminal(page, chatRoot, id) } : {}) };
}

function selectedAssistantConversationRow(page, title) {
  return page.getByRole("button", { name: title, exact: true }).and(page.locator('[aria-current="true"]')).locator("..");
}
export async function prepareListedAssistantConversation(h, page, { send = sendUi } = {}) {
  const chat = await send(h, page, "[E2E:answer] Preparar la conversación propia que después tendrá un turno activo con PNG.");
  assert.equal(chat.detail.conversation.id, chat.id, "La preparación debe conservar el ID de su turno propio.");
  const title = chat.detail.conversation.title;
  assert.ok(typeof title === "string" && title.length > 0, "El turno inicial debe tener su título real antes de usar el historial.");
  if (h.width === 390) await page.getByRole("button", { name: "Conversaciones", exact: true }).click();
  const row = selectedAssistantConversationRow(page, title);
  await row.getByRole("button", { name: `Acciones de ${title}`, exact: true }).waitFor();
  if (h.width === 390) await page.keyboard.press("Escape");
  return { ...chat, title };
}
export async function openListedAssistantConversationAction(page, width, title, action) {
  if (width === 390) await page.getByRole("button", { name: "Conversaciones", exact: true }).click();
  await selectedAssistantConversationRow(page, title).getByRole("button", { name: `Acciones de ${title}`, exact: true }).click();
  await page.getByRole("menuitem", { name: `${action}: ${title}`, exact: true }).click();
}

export async function sendAssistantAttachmentTurn(h, page, { fileName, buffer, text }) {
  const uploaded = page.waitForResponse((response) => response.request().method() === "POST" && /^\/api\/organization\/assistant\/conversations\/[^/]+\/attachments$/u.test(new URL(response.url()).pathname));
  void uploaded.catch(() => {}); let phase = "seleccionar archivo";
  try {
    await page.locator('input[type="file"]').setInputFiles({ name: fileName, mimeType: "image/png", buffer });
    // El composer conserva el archivo local hasta Enviar; la UI sube el adjunto antes del POST de mensajes.
    phase = "enviar turno"; const sent = await sendUi(h, page, text, root, false);
    phase = "esperar adjunto"; return { upload: await uploaded, sent };
  } catch (cause) {
    throw new Error(`Adjunto de Asistente: etapa ${phase}; POST ${root}/conversations/:id/attachments; POST ${root}/conversations/:id/messages. ${cause.message}`, { cause });
  }
}

/** Las lecturas privadas no frenan abrir Borrar; el último Generating queda junto al clic real. */
export async function deleteActiveAssistantConversation({ inspectAttachment, readCounters, openDialog, requireGenerating, deleteByUi }) {
  const settled = await Promise.allSettled([inspectAttachment, readCounters, openDialog].map((operation) => Promise.resolve().then(operation)));
  const failures = settled.filter((result) => result.status === "rejected").map((result) => result.reason);
  // Esperar todas las tareas evita que la UI siga abriendo un diálogo mientras el caller restaura sus sesiones.
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) throw new AggregateError(failures, "Fallaron las comprobaciones previas a Borrar el turno activo.");
  await requireGenerating();
  await deleteByUi(settled[2].value);
  return { counters: settled[1].value };
}

async function runAssistantCases(h, selected) {
  const page = await h.newPage(); const platformPage = await h.newPage(); let stalePage;
  const control = createAssistantControl(h.env.command); const url = (route) => new URL(route, h.base).href;
  const operatorEmail = h.width === 1440 ? "e2e-e9a-operator@example.test" : "e2e-e9b-operator@example.test";
  let publicSession = false; let publicEmail; let publicAccess; let platformSession = false; let platformEmail;
  let originalGlobal; let owner; let ownerReady = false; let company; let companyAdmin; let adminChat; let businessChat; let useOperator; let onlyUseChat;
  let capturePage = page; const tag = randomUUID().slice(0, 8); const failures = [];
  const setCapture = (target) => { capturePage = target; };
  const run = async (number, action, target = page) => {
    if (!selected.has(number)) return;
    capturePage = target; const id = `AS-SUP-${String(number).padStart(2, "0")}`;
    return h.record(id, () => capturePage, action);
  };
  const leavePublic = async () => {
    if (!publicSession) return; await closeAssistantPublicSession(h, page, { setCapture });
    publicSession = false; publicEmail = undefined; publicAccess = undefined;
  };
  const business = async (email = owner.email) => {
    setCapture(page);
    if (publicSession && publicEmail === email && publicAccess === "business") return read(h, page, "/api/me");
    await leavePublic(); const me = await h.login(page, email, "business"); publicSession = true; publicEmail = email; publicAccess = "business"; return me;
  };
  const leavePlatform = async () => {
    if (!platformSession) return; await closeAssistantPlatformSession(h, platformPage, { setCapture }); platformSession = false; platformEmail = undefined;
  };
  const admin = async () => {
    setCapture(platformPage);
    if (platformSession && platformEmail === operatorEmail) return read(h, platformPage, "/api/me");
    await leavePlatform(); const me = await h.login(platformPage, operatorEmail, "platform"); platformSession = true; platformEmail = operatorEmail;
    assert.ok(me.effectivePermissions.platform.includes("platform.assistant.configure")); return me;
  };
  const operatorClick = async (button, route, method = "PUT", status = 200, target = platformPage) => {
    setCapture(target);
    await stopConfirmingRecentAuthentication(target);
    let response = await clickForResponse(target, button, route, method, null);
    if (response.status() === 403 && status !== 403) {
      await requirePrivateProblem(response, 403, "Auth.Platform.ReauthenticationRequired");
      const replay = target.waitForResponse((reply) => endpoint(route, method)(reply) && reply.status() !== 403); void replay.catch(() => {});
      await confirmRecentAuthentication(target, platformEmail); response = await replay;
    }
    assert.equal(response.status(), status); return response;
  };
  const prepareOwner = async () => {
    await admin(); if (!originalGlobal) originalGlobal = await read(h, platformPage, `${platformRoot}/settings`);
    if (!owner) { await leavePublic(); setCapture(page); owner = await h.registerBusiness(page); publicSession = true; publicEmail = owner.email; publicAccess = "business"; }
    await business();
    if (!ownerReady) {
      await control("prepare", { email: owner.email, access: "business", tenantId: owner.me.activeTenantId }); ownerReady = true;
      const companies = await read(h, page, "/api/companies/paged?pageSize=100"); company = companies.items.find((item) => item.name === owner.companyName); assert.equal(company.status, "Active");
    }
  };
  const allowOwnKey = async (tenantId) => {
    await admin(); await platformPage.goto(url(`/plataforma/organizaciones/${tenantId}?tab=modules`)); await platformPage.getByRole("tab", { name: /^Módulos/u }).click();
    const allow = await openAssistantOwnKeyPolicyAction(platformPage);
    if (allow) {
      await allow.click(); const dialog = platformPage.getByRole("dialog"); await dialog.getByRole("textbox", { name: /Motivo/u }).fill("Preparación propia de clave del Asistente con proveedor Fake aislado.");
      await operatorClick(dialog.getByRole("button", { name: "Permitir", exact: true }), `/api/platform/tenants/${tenantId}/assistant/policy`); await dialog.waitFor({ state: "hidden" });
    } else await platformPage.keyboard.press("Escape");
    assert.equal((await read(h, platformPage, `/api/platform/tenants/${tenantId}/assistant/policy`)).allowOwnKey, true);
  };
  const saveGlobal = async (desired) => {
    await admin(); const current = await read(h, platformPage, `${platformRoot}/settings`);
    const values = platformSettingsValues(desired); const currentValues = platformSettingsValues(current); delete values.version; delete currentValues.version;
    if (JSON.stringify(values) === JSON.stringify(currentValues)) return current;
    const models = (await read(h, platformPage, `${platformRoot}/models?pageSize=100`)).items;
    await platformPage.goto(url("/plataforma/asistente/configuracion"));
    const selected = models.find((model) => model.id === desired.defaultModelId); assert.ok(selected);
    await platformPage.getByRole("combobox", { name: "Modelo por defecto", exact: true }).click(); await platformPage.getByRole("option", { name: new RegExp(`^${escaped(selected.name)}(?:\\s|$)`, "u") }).click();
    const effort = { low: "Bajo", medium: "Medio", high: "Alto" }[desired.effort]; await platformPage.getByRole("radio", { name: effort, exact: true }).click();
    const picker = platformPage.getByRole("button", { name: "Modelos que pueden elegir las organizaciones", exact: true }); await picker.focus(); await picker.press("ArrowDown");
    for (const model of models.filter((item) => item.isActive || current.allowedModelIds.includes(item.id))) {
      const option = platformPage.getByRole("menuitemcheckbox", { name: model.name, exact: true }); const wanted = desired.allowedModelIds.includes(model.id);
      if (await option.getAttribute("aria-checked") !== String(wanted)) await option.click();
    }
    await platformPage.keyboard.press("Escape");
    for (const [label, value] of [["Consultas por persona por día", desired.dailyMessageLimit], ["Tope del mes por organización", desired.monthlyOrganizationBudget.amount], ["Días sin actividad para borrar una conversación", desired.retentionDays]]) await platformPage.getByRole("textbox", { name: label, exact: true }).fill(decimal(value));
    await mark(platformPage, "Las personas pueden usar el asistente", desired.personalEnabled);
    await operatorClick(platformPage.getByRole("button", { name: "Guardar cambios", exact: true }), `${platformRoot}/settings`);
    const after = await read(h, platformPage, `${platformRoot}/settings`); assertGlobalSettingsRestored(desired, after); return after;
  };
  const ownKey = async () => {
    await prepareOwner(); await allowOwnKey(owner.me.activeTenantId); await business(); await page.goto(url("/org/asistente/configuracion"));
    const before = await read(h, page, `${root}/settings`); if (before.mode === "OwnKey" && before.hasKey) return;
    await page.getByRole("radio", { name: "La nuestra", exact: true }).click();
    await page.getByRole("textbox", { name: "Consultas por persona por día", exact: true }).fill("50"); await page.getByRole("textbox", { name: "Tope del mes", exact: true }).fill("1000");
    await page.getByRole("textbox", { name: "Clave de Anthropic", exact: true }).fill("e2e-own-assistant-supplement");
    await clickForResponse(page, page.getByRole("button", { name: "Guardar cambios", exact: true }), `${root}/settings`, "PUT", 200);
    const saved = await read(h, page, `${root}/settings`); assert.equal(saved.mode, "OwnKey"); assert.equal(saved.hasKey, true); noPrivateContent(saved);
  };

  try {
    const prepareProjectedAdminChat = async () => {
      await prepareOwner(); companyAdmin = { email: syntheticEmail("as-admin") };
      await page.goto(url("/org/usuarios")); await page.getByRole("button", { name: "Invitar usuario", exact: true }).click(); const dialog = page.getByRole("dialog", { name: "Invitar usuario", exact: true });
      await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill(companyAdmin.email); await dialog.getByRole("combobox", { name: "Empresa", exact: true }).click(); await page.getByRole("option", { name: company.name, exact: true }).click();
      await dialog.getByRole("button", { name: "Roles en la empresa", exact: true }).click(); await page.getByRole("menuitemcheckbox", { name: "Administrador", exact: true }).click(); await page.keyboard.press("Escape");
      await clickForResponse(page, dialog.getByRole("button", { name: "Invitar", exact: true }), "/api/users/invitations", "POST", 201); await dialog.waitFor({ state: "hidden" });
      const me = await business(companyAdmin.email); requireProjectedAssistant(me, owner.me.activeTenantId, company.id);
      await openProjectedAssistantCompanyHome(h, page);
      await chatHome(h, page, "business", true, { expectedTenantId: owner.me.activeTenantId }); const state = await read(h, page, root); assert.equal(state.configured, true); assert.equal(state.canConfigure, false);
      adminChat = await sendUi(h, page, "[E2E:answer] Pregunta privada del administrador de empresa.");
      for (const suffix of ["settings", "usage"]) await requirePrivateProblem(await h.api(page, `${root}/${suffix}`), 403, "Http.Forbidden");
      await openProjectedAssistantCompanyHome(h, page); requireProjectedAssistant(await read(h, page, "/api/me"), owner.me.activeTenantId, company.id);
      return "Administrador de empresa activa usó un turno real por assistant.use proyectado, sin configure/Uso ni users.manage; Inicio conservó Tus empresas.";
    };
    await run(1, prepareProjectedAdminChat);
    await run(2, async () => {
      await prepareOwner(); await leavePublic(); setCapture(page); const phoneOwner = await h.registerBusiness(page); publicSession = true; publicEmail = phoneOwner.email; publicAccess = "business";
      await control("prepare", { email: phoneOwner.email, access: "business", tenantId: phoneOwner.me.activeTenantId }); await allowOwnKey(phoneOwner.me.activeTenantId);
      const phone = h.width === 1440 ? "+5491134567868" : "+5491134567869"; const cursor = await requireE8Control(h.env)(`as-sin-email-${tag}`, phone);
      setCapture(page); await page.goto(url("/cuenta")); await page.getByRole("button", { name: accountAddMethodName }).click(); let dialog = page.getByRole("dialog"); await dialog.getByRole("button", { name: "WhatsApp", exact: true }).click(); await dialog.getByRole("textbox", { name: "Número", exact: true }).fill(nationalPhone(phone));
      const sent = await sendWithCooldown(() => clickForResponse(page, dialog.getByRole("button", { name: "Enviar código", exact: true }), "/api/me/login-methods", "POST", null)); assert.equal(sent.status(), 202); const methodId = (await sent.json()).methodId;
      await fillOtp(dialog, (await cursor("code")).proof); await clickForResponse(page, dialog.getByRole("button", { name: "Verificar", exact: true }), `/api/me/login-methods/${methodId}/verify`, "POST", 204); await dialog.waitFor({ state: "hidden" });
      const methods = (await read(h, page, "/api/me/login-methods")).methods; const email = methods.find((item) => item.type === "Email" && item.isVerified); assert.ok(email);
      await page.getByRole("button", { name: `Acciones de ${phoneOwner.email}`, exact: true }).click(); await page.getByRole("menuitem", { name: "Quitar", exact: true }).click(); dialog = page.getByRole("dialog"); await clickForResponse(page, dialog.getByRole("button", { name: "Quitar", exact: true }), `/api/me/login-methods/${email.id}`, "DELETE", 204); await dialog.waitFor({ state: "hidden" });
      const afterMethods = (await read(h, page, "/api/me/login-methods")).methods; assert.equal(afterMethods.some((item) => item.type === "Email" && item.isVerified), false); assert.ok(afterMethods.some((item) => item.type === "Phone" && item.isVerified));
      await page.goto(url("/org/asistente/configuracion")); const settings = await read(h, page, `${root}/settings`); assert.equal(settings.hasAlertRecipient, false); assert.equal(settings.allowOwnKey, true);
      await page.getByRole("radio", { name: "La nuestra", exact: true }).click(); await page.getByRole("textbox", { name: "Clave de Anthropic", exact: true }).fill("e2e-rejected-before-key-validation");
      const writes = []; const watched = (request) => { if (endpoint(`${root}/settings`, "PUT")({ url: () => request.url(), request: () => request })) writes.push(request); }; page.on("request", watched);
      try { await page.getByRole("button", { name: "Guardar cambios", exact: true }).click(); await page.locator('[role="radiogroup"][aria-label="Qué clave usa"][aria-invalid="true"]').waitFor(); await page.getByRole("button", { name: "Agregar un correo", exact: true }).waitFor(); assert.equal(writes.length, 0); } finally { page.off("request", watched); }
      await requirePrivateProblem(await h.api(page, `${root}/settings`, { method: "PUT", data: { mode: "OwnKey", modelId: settings.modelId, effort: settings.effort, dailyMessageLimit: 50, monthlyBudget: settings.monthlyBudget, keyAction: "keep", apiKey: null, version: settings.version } }), 400, "Assistant.Settings.AlertRecipientRequired");
      const preserved = await read(h, page, `${root}/settings`); assert.equal(preserved.mode, settings.mode); assert.equal(preserved.version, settings.version); assert.equal(preserved.hasKey, settings.hasKey);
      await page.getByRole("button", { name: "Agregar un correo", exact: true }).click(); dialog = page.getByRole("dialog", { name: /Agregar correo/u }); await dialog.getByRole("textbox", { name: "Correo", exact: true }).waitFor(); assert.equal(new URL(page.url()).pathname, "/org/asistente/configuracion");
      return "Phone verificado sostuvo la cuenta sin Email; OwnKey quedó bloqueado sin PUT de la UI, la API devolvió AlertRecipientRequired400 y Agregar correo abrió el diálogo conservando configuración/versión.";
    });
    await run(3, async () => {
      await prepareOwner(); await admin(); capturePage = platformPage;
      const before = await read(h, platformPage, `${platformRoot}/settings`); noPrivateContent(before); stalePage = await h.newPage(); await stalePage.goto(url("/plataforma/asistente/configuracion")); await stalePage.getByRole("textbox", { name: "Consultas por persona por día", exact: true }).waitFor();
      await platformPage.goto(url("/plataforma/asistente/configuracion")); await platformPage.getByRole("textbox", { name: "Consultas por persona por día", exact: true }).fill(String(before.dailyMessageLimit + 1));
      await stopConfirmingRecentAuthentication(platformPage); assert.ok((await h.env.command("recent-proof", { kind: "expire", email: operatorEmail })).expired >= 1);
      const refused = await clickForResponse(platformPage, platformPage.getByRole("button", { name: "Guardar cambios", exact: true }), `${platformRoot}/settings`, "PUT", 403); await requirePrivateProblem(refused, 403, "Auth.Platform.ReauthenticationRequired");
      const saved = platformPage.waitForResponse((reply) => endpoint(`${platformRoot}/settings`, "PUT")(reply) && reply.status() !== 403); void saved.catch(() => {}); await confirmRecentAuthentication(platformPage, operatorEmail); assert.equal((await saved).status(), 200);
      const current = await read(h, platformPage, `${platformRoot}/settings`); assert.notEqual(current.version, before.version); assert.equal(current.dailyMessageLimit, before.dailyMessageLimit + 1); noPrivateContent(current);
      await stalePage.getByRole("textbox", { name: "Días sin actividad para borrar una conversación", exact: true }).fill(String(before.retentionDays + 1));
      const conflict = await clickForResponse(stalePage, stalePage.getByRole("button", { name: "Guardar cambios", exact: true }), `${platformRoot}/settings`, "PUT", 409); await requirePrivateProblem(conflict, 409, "General.ConcurrencyConflict"); assert.equal(await stalePage.getByRole("textbox", { name: "Días sin actividad para borrar una conversación", exact: true }).inputValue(), String(before.retentionDays + 1));
      await platformPage.getByRole("button", { name: "Cambiar", exact: true }).click(); assert.equal(await platformPage.getByRole("textbox", { name: "Clave de la plataforma", exact: true }).inputValue(), ""); await platformPage.getByRole("button", { name: "Descartar cambios", exact: true }).click();
      await platformPage.getByRole("tab", { name: /^Catálogo de modelos/u }).click(); await platformPage.getByRole("button", { name: "Agregar modelo", exact: true }).click(); const dialog = platformPage.getByRole("dialog", { name: "Agregar modelo", exact: true });
      await dialog.getByRole("textbox", { name: "Nombre", exact: true }).fill(`Modelo propio ${tag}`); await dialog.getByRole("textbox", { name: "ID", exact: true }).fill(`e2e-${tag}`);
      for (const label of ["Precio de entrada por millón", "Precio de salida por millón"]) await dialog.getByRole("textbox", { name: label, exact: true }).fill("1"); await mark(dialog, "Activo", false);
      await dialog.getByRole("button", { name: "Avanzado: datos técnicos", exact: true }).click(); for (const label of ["Texto", "Herramientas", "Imágenes en los adjuntos", "PDF en los adjuntos", "Bajo"]) await mark(dialog, label, true);
      await fillAssistantModelTechnicalValues(dialog);
      const created = await operatorClick(dialog.getByRole("button", { name: "Agregar modelo", exact: true }), `${platformRoot}/models`, "POST", 201); const payload = created.request().postDataJSON(); const issued = await created.json(); assert.ok(issued.id); await dialog.waitFor({ state: "hidden" });
      await requirePrivateProblem(await h.api(platformPage, `${platformRoot}/models`, { method: "POST", data: payload, headers: { "Idempotency-Key": randomUUID() } }), 409, "Assistant.Model.AlreadyExists");
      const reference = await read(h, platformPage, "/api/reference-data"); const currency = reference.currencies.find((item) => item.isEnabled && item.code !== payload.inputPricePerMillion.currency)?.code; assert.ok(currency);
      for (const changed of [{ inputPricePerMillion: { ...payload.inputPricePerMillion, amount: -1 } }, { inputPricePerMillion: { ...payload.inputPricePerMillion, currency }, outputPricePerMillion: { ...payload.outputPricePerMillion, currency } }]) await requirePrivateProblem(await h.api(platformPage, `${platformRoot}/models`, { method: "POST", data: { ...payload, providerModelId: `invalid-${randomUUID()}`, ...changed }, headers: { "Idempotency-Key": randomUUID() } }), 400, "Validation.Failed");
      const now = await read(h, platformPage, `${platformRoot}/settings`); await requirePrivateProblem(await h.api(platformPage, `${platformRoot}/settings`, { method: "PUT", data: { ...platformSettingsValues(now), defaultModelId: randomUUID() }, headers: { "Idempotency-Key": randomUUID() } }), 400, "Assistant.Model.NotAllowed");
      await platformPage.getByRole("button", { name: `Acciones de Modelo propio ${tag}`, exact: true }).click(); await platformPage.getByRole("menuitem", { name: `Editar Modelo propio ${tag}`, exact: true }).click(); const edit = platformPage.getByRole("dialog", { name: "Editar modelo", exact: true }); await edit.getByRole("textbox", { name: "Nombre", exact: true }).fill(`Modelo editado ${tag}`);
      await operatorClick(edit.getByRole("button", { name: "Guardar cambios", exact: true }), `${platformRoot}/models/${issued.id}`); await edit.waitFor({ state: "hidden" }); const model = (await read(h, platformPage, `${platformRoot}/models?pageSize=100`)).items.find((item) => item.id === issued.id); assert.equal(model.name, `Modelo editado ${tag}`); assert.equal(model.isActive, false); noPrivateContent(await read(h, platformPage, `${platformRoot}/settings`));
      return "Configuración global exigió prueba reciente, guardó200 y rechazó409 la versión anterior con borrador conservado. Catálogo UI creó/editó modelo propio inactivo y rechazó duplicado409, tarifa/moneda400 y modelo no permitido400; GET y Cambiar no revelaron la clave.";
    }, platformPage);
    await run(4, async () => {
      await prepareOwner(); await business(); await chatHome(h, page); const platformKeyChat = await sendUi(h, page, "[E2E:answer] Consumo Business con clave de Plataforma.");
      await ownKey(); await chatHome(h, page); businessChat = await sendUi(h, page, "[E2E:answer] Consumo Business con clave propia.");
      await leavePublic(); await h.login(page, owner.email, "consumer"); publicSession = true; publicEmail = owner.email; publicAccess = "consumer";
      await control("prepare", { email: owner.email, access: "consumer" }); await chatHome(h, page, "consumer"); const personalChat = await sendUi(h, page, "[E2E:answer] Consumo Personal privado.", "/api/me/assistant");
      await admin(); await control("prepare", { email: operatorEmail, access: "platform" }); await chatHome(h, platformPage, "platform"); const operatorChat = await sendUi(h, platformPage, "[E2E:answer] Consumo privado de Operador.", platformRoot);
      await platformPage.goto(url("/plataforma/asistente/uso")); await platformPage.getByRole("heading", { name: "Uso", exact: true }).waitFor(); const month = new Date().toISOString().slice(0, 7);
      const first = await read(h, platformPage, `${platformRoot}/usage?month=${month}&page=1&pageSize=100`); const items = [...first.rows.items];
      for (let index = 2; items.length < first.rows.totalCount; index++) items.push(...(await read(h, platformPage, `${platformRoot}/usage?month=${month}&page=${index}&pageSize=100`)).rows.items);
      const usage = { ...first, rows: { ...first.rows, items } }; requireGlobalUsage(usage, owner.me.activeTenantId, [businessChat.id, platformKeyChat.id, personalChat.id, operatorChat.id, "Consumo Business con clave propia.", "Consumo Personal privado."]);
      capturePage = platformPage; await platformPage.getByRole("group", { name: "Resumen de uso", exact: true }).waitFor(); assert.equal(await platformPage.getByRole("textbox", { name: "Tu consulta", exact: true }).count(), 0);
      return "La API global reunió todas las páginas reales: organización con ambas claves, Personas y Operadores; costo total y PlatformKeyCost coincidieron con sus filas y no incluyeron conversación, adjuntos ni texto privado.";
    }, platformPage);
    await run(5, async () => {
      await prepareOwner(); await admin(); useOperator = { email: syntheticEmail("as-solo-uso") };
      await platformPage.goto(url("/plataforma/cuentas")); await platformPage.getByRole("button", { name: "Invitar operador", exact: true }).filter({ visible: true }).first().click(); const dialog = platformPage.getByRole("dialog", { name: "Invitar operador", exact: true }); await dialog.getByRole("textbox", { name: "Correo", exact: true }).fill(useOperator.email);
      const picker = dialog.getByRole("button", { name: "Permisos de plataforma", exact: true }); await picker.focus(); await picker.press("ArrowDown"); await platformPage.getByRole("menuitemcheckbox", { name: "Usar el asistente de Plataforma", exact: true }).click(); await platformPage.keyboard.press("Escape"); const invitation = await operatorClick(dialog.getByRole("button", { name: "Invitar", exact: true }), "/api/platform/operators/invitations", "POST", 201); useOperator.id = (await invitation.json()).id; await dialog.waitFor({ state: "hidden" });
      // Salir de Plataforma conserva la cookie pública. Se cierra primero la sesión pública propia para volver a la portada anónima.
      await leavePublic(); await leavePlatform(); const me = await h.login(platformPage, useOperator.email, "platform"); platformSession = true; platformEmail = useOperator.email; assert.deepEqual(me.effectivePermissions.platform, ["platform.assistant.use"]); assert.equal(me.hasPersonalSpace, false); assert.deepEqual(me.organizations, []);
      await control("prepare", { email: useOperator.email, access: "platform" }); await chatHome(h, platformPage, "platform"); onlyUseChat = await sendUi(h, platformPage, "[E2E:answer] Conversación del operador con sólo uso.", platformRoot);
      for (const suffix of ["settings", "models", "usage"]) await requirePrivateProblem(await h.api(platformPage, `${platformRoot}/${suffix}`), 403, "Http.Forbidden");
      assert.equal((await read(h, platformPage, `${platformRoot}/conversations/${onlyUseChat.id}`)).conversation.id, onlyUseChat.id); await leavePlatform(); await admin(); await chatHome(h, platformPage, "platform");
      await requirePrivateProblem(await h.api(platformPage, `${platformRoot}/conversations/${onlyUseChat.id}`), 404, "Assistant.Conversation.NotFound"); capturePage = platformPage;
      return "Un operador con sólo assistant.use completó su turno y releyó su chat; configuración/modelos/Uso403. Otro operador con todos los permisos recibió404 exacto para ese historial propio ajeno.";
    }, platformPage);
    await run(6, async () => {
      // La reparación prepara por UI el mismo chat ajeno de01 dentro de06, sin registrar ni acreditar01.
      if (!selected.has(1)) await prepareProjectedAdminChat();
      await prepareOwner(); await business(); assert.ok(adminChat?.detail, "La prueba requiere la respuesta real del Administrador de empresa.");
      await requireForeignAssistantFeedbackAfterNotice(h, page, adminChat, () => chatHome(h, page, "business", false, { expectedTenantId: owner.me.activeTenantId }));
      await page.getByRole("button", { name: "Nueva conversación", exact: true }).first().click();
      // El historial se refresca al terminar un envío. La fila debe existir antes del turno que se borrará activo.
      const listed = await prepareListedAssistantConversation(h, page);
      const fileName = `activo-${tag}.png`; const { upload, sent } = await sendAssistantAttachmentTurn(h, page, { fileName, buffer: png, text: "[E2E:slow] Borrar este turno activo con su imagen." });
      assert.equal(upload.status(), 201); const attachment = await upload.json(); requirePrivateAttachmentMetadata(attachment, fileName, png.length);
      const id = new URL(upload.url()).pathname.split("/").at(-2); const fileRoute = `${root}/conversations/${id}/attachments/${attachment.id}`;
      assert.equal(sent.id, id); assert.equal(id, listed.id, "El PNG y el turno lento deben pertenecer a la conversación ya listada.");
      const { counters: before } = await deleteActiveAssistantConversation({
        inspectAttachment: async () => {
          const downloaded = await h.api(page, fileRoute); assert.equal(downloaded.status(), 200); assert.deepEqual(await downloaded.body(), png);
          assert.match(downloaded.headers()["cache-control"], /no-store/u); assert.match(downloaded.headers()["content-disposition"], /^attachment/iu);
        },
        readCounters: () => control("providerCounters"),
        openDialog: async () => {
          await page.getByRole("button", { name: "Detener", exact: true }).waitFor();
          const current = await read(h, page, `${root}/conversations/${id}`); assert.equal(current.messages.items.at(-1).status, "Generating");
          assert.equal(current.conversation.id, listed.id); assert.equal(current.conversation.title, listed.title);
          await openListedAssistantConversationAction(page, h.width, current.conversation.title, "Borrar");
          const dialog = page.getByRole("dialog"); await dialog.waitFor(); return dialog;
        },
        requireGenerating: async () => {
          const current = await read(h, page, `${root}/conversations/${id}`);
          assert.equal(current.messages.items.at(-1).status, "Generating", "La preparación debe llegar a Borrar antes del final del Fake.");
        },
        deleteByUi: async (dialog) => {
          await clickForResponse(page, dialog.getByRole("button", { name: "Borrar", exact: true }), `${root}/conversations/${id}`, "DELETE", 204);
          await dialog.waitFor({ state: "hidden" });
        },
      });
      await requirePrivateProblem(await h.api(page, `${root}/conversations/${id}`), 404, "Assistant.Conversation.NotFound"); await requirePrivateProblem(await h.api(page, fileRoute), 404, "Assistant.Attachment.NotFound");
      await delay(3500); await requirePrivateProblem(await h.api(page, `${root}/conversations/${id}`), 404, "Assistant.Conversation.NotFound"); assert.equal((await control("providerCounters")).titleCalls, before.titleCalls);
      return "Feedback a la respuesta de otro Dueño404; conversación propia quedó listada tras un turno inicial por UI. Otro turno lento con PNG usó ese mismo ID; descargó bytes exactos con attachment/no-store y sin URL. Borrar204 ocurrió mientras Generating; conversación/archivo404 y, pasado el Fake, no reaparecieron ni generaron nuevos títulos.";
    });
  } catch (error) { failures.push(error); } finally {
    if (stalePage) { try { await discard(stalePage); await stalePage.close(); } catch (error) { failures.push(error); } }
    try { if (originalGlobal) { await admin(); await saveGlobal(originalGlobal); assertGlobalSettingsRestored(originalGlobal, await read(h, platformPage, `${platformRoot}/settings`)); } } catch (error) { failures.push(error); }
    try { await leavePublic(); } catch (error) { failures.push(error); }
    try { await leavePlatform(); } catch (error) { failures.push(error); }
    try { await page.close(); } catch (error) { failures.push(error); }
    try { await platformPage.close(); } catch (error) { failures.push(error); }
  }
  if (failures.length) throw new AggregateError(failures, "No se pudo completar, restaurar configuración o cerrar las sesiones propias del complemento Asistente.");
}

export async function runAssistantSupplementCases(h) { return runAssistantCases(h, new Set([1, 2, 3, 4, 5, 6])); }
/** Sólo02/03/04/06: callbacks completos;06 prepara01 internamente sin acreditarlo. Restaura configuración en finally. */
export async function runAssistantPreparationRepairCases(h) { return runAssistantCases(h, new Set([2, 3, 4, 6])); }
export async function runAssistantOperatorRepairCases(h) { return runAssistantCases(h, new Set([5])); }
export async function runAssistantAttachmentRepairCases(h) { return runAssistantCases(h, new Set([6])); }
