import type {
  AssistantConversationResponse, AssistantConversationSummaryCursorResponse, AssistantModelPricePageResponse,
  AssistantModelPriceResponse, AssistantStateResponse, AssistantStreamHttpResponse, AssistantTurnResultResponse,
  MeResponse, OrganizationAssistantSettingsResponse, PlatformAssistantSettingsResponse, ApiProblemDetails,
  AssistantQuickResponse,
  AssistantAttachmentSummaryResponse, AssistantConversationSummaryResponse, AssistantLinkResponse,
} from "@/shared/api/types";
import { galleryImage, galleryPdf, type GalleryUploadFile } from "./galleryUploadFiles.ts";
import { currentUsers } from "./mocks/currentUsers.ts";
import type { CurrentUserFixture } from "./mocks/currentUsers.ts";
import { referenceDataFixture } from "./mocks/handlers.ts";

// Contratos reales; datos y claves exclusivamente ficticios del arnés.
export interface GalleryApiResponse {
  method: "GET" | "POST" | "PUT"; path: string; status: number; body?: unknown;
  rawBody?: string; contentType?: string; query?: Record<string, string>; afterResponse?: { method: "POST"; path: string };
  openStream?: true;
}
export type GalleryAction = { type: "click" | "press" | "fill"; role?: "button" | "radio" | "combobox" | "textbox" | "option" | "menuitem"; name?: string; label?: string; exact?: boolean; key?: string; value?: string; within?: { role: "complementary" | "dialog"; name: string } }
  | { type: "upload"; label: string; exact: boolean; files: GalleryUploadFile[] };
export interface GalleryApp {
  path: string; captureMode: "harness"; site: "main"; userFixture: CurrentUserFixture;
  responses: GalleryApiResponse[]; actions: GalleryAction[]; readySelector: string; readyText?: string; now: string;
  readyTexts?: string[];
}
const api = (method: GalleryApiResponse["method"], path: string, body: unknown, status = 200): GalleryApiResponse => ({ method, path, status, body });
const click = (name: string, role: "button" | "option" | "menuitem" = "button"): Extract<GalleryAction, { type: "click" | "press" | "fill" }> => ({ type: "click", role, name, exact: true });
const fill = (name: string, value: string): GalleryAction => ({ type: "fill", role: "textbox", name, value, exact: true });
const open = (name: string, role: "combobox" | "button" = "combobox"): GalleryAction => ({ type: "press", role, name, exact: true, key: "Enter" });
const secret = "e8b-fictitious-write-only-key";
const fixtureByScope = { business: "visual-owner", consumer: "visual-personal", platform: "visual-operator" } as const;
type Scope = keyof typeof fixtureByScope;
export function galleryMe(scope: Scope, configure = true): MeResponse {
  const base = currentUsers[fixtureByScope[scope]];
  return { ...base, features: scope === "platform" ? [] : ["assistant"], permissions: scope === "business" ? ["assistant.use", ...(configure ? ["assistant.configure"] : [])] : [],
    organizations: scope === "business" && !configure ? base.organizations.map((organization) => organization.id === base.activeTenantId ? { ...organization, roleName: "Miembro" } : organization) : base.organizations,
    effectivePermissions: { organization: scope === "business" ? ["assistant.use", ...(configure ? ["assistant.configure"] : [])] : [], companies: {}, platform: scope === "platform" ? ["platform.assistant.use"] : [] },
    moduleCapabilities: scope === "platform" ? [{ key: "assistant", available: true, canConfigure: configure, canReadUsage: false }] : [],
  };
}
export const galleryModels: AssistantModelPriceResponse[] = [{
  id: "11111111-1111-4111-8111-111111111111", name: "Modelo de prueba A", provider: "Anthropic", providerModelId: "test-a",
  inputPricePerMillion: { amount: 0.125, currency: "USD" }, outputPricePerMillion: { amount: 1, currency: "USD" }, isActive: true, version: 3,
}, {
  id: "22222222-2222-4222-8222-222222222222", name: "Modelo de prueba B", provider: "Anthropic", providerModelId: "test-b",
  inputPricePerMillion: { amount: 1, currency: "USD" }, outputPricePerMillion: { amount: 2, currency: "USD" }, isActive: true, version: 4,
}];
export const galleryModelPage: AssistantModelPricePageResponse = { items: galleryModels, page: 1, pageSize: 100, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false };
export const galleryOrganizationSettings: OrganizationAssistantSettingsResponse = {
  mode: "PlatformKey", modelId: galleryModels[0].id, effort: "medium", dailyMessageLimit: 50, monthlyBudget: { amount: 100, currency: "USD" },
  allowOwnKey: true, hasAlertRecipient: true, retentionDays: 30, hasKey: true, maskedKeySuffix: "test", version: 10,
  platformKeyModels: galleryModels, ownKeyModels: galleryModels,
};
export const galleryPlatformSettings: PlatformAssistantSettingsResponse = {
  defaultModelId: galleryModels[0].id, allowedModelIds: [galleryModels[0].id], effort: "medium", dailyMessageLimit: 50,
  monthlyOrganizationBudget: { amount: 100, currency: "USD" }, personalEnabled: true, retentionDays: 30, hasKey: true, maskedKeySuffix: "test", version: 20,
};
export function galleryState(scope: Scope): AssistantStateResponse {
  const keys = scope === "business" ? ["active_users", "expired_invitations", "owners", "recent_changes"] : scope === "consumer" ? ["my_organizations", "my_signin", "my_messages"] : ["pending_organizations", "pending_recoveries", "today_security", "assistant_usage"];
  return { configured: true, canConfigure: scope !== "consumer", models: [], quickQueries: keys.map((key) => ({ key, labelKey: `quick.${key}` })),
    dailyLimit: 50, dailyResetAtUtc: "2026-10-11T00:00:00Z", remainingMessages: 40, noticeVersion: "v1", noticeAccepted: true,
    retentionDays: 30, maxAttachmentBytes: 10 * 1024 * 1024, maxAttachments: 5 };
}
export const galleryConversation: AssistantConversationResponse = {
  conversation: { id: "gallery-chat", title: "Mi consulta", version: 2, isSaved: false, createdAtUtc: "2026-10-10T12:00:00Z", lastActivityAtUtc: "2026-10-10T12:00:00Z" },
  messages: { items: [
    { id: "gallery-user", role: "user", text: "Cuántos usuarios hay", status: "Complete", version: 1, createdAtUtc: "2026-10-10T12:00:00Z", attachments: [], links: [] },
    { id: "gallery-assistant", role: "assistant", text: "Respuesta **de prueba** del arnés.", status: "Complete", version: 1, createdAtUtc: "2026-10-10T12:00:00Z", attachments: [], links: [] },
  ], hasMore: false }, activeTurnId: null,
};
export const galleryTurn: AssistantTurnResultResponse = { turnId: "gallery-turn", message: galleryConversation.messages.items[1], conversationVersion: 2,
  usage: { inputTokens: 1, outputTokens: 1, cacheReadTokens: 0, cacheWriteTokens: 0, cost: { amount: 0, currency: "USD" }, remainingMessages: 39 } };
export const galleryStreamEvents: AssistantStreamHttpResponse[] = [
  { event: "start", data: { turnId: "gallery-turn", userMessageId: "gallery-user", assistantMessageId: "gallery-assistant", conversationVersion: 2 } },
  { event: "delta", data: { turnId: "gallery-turn", sequence: 1, text: galleryTurn.message.text } },
  { event: "done", data: galleryTurn },
];
export const galleryStream = galleryStreamEvents.map(({ event, data }) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`).join("");

function baseApp(scope: Scope, route: string, configure = true): GalleryApp {
  const userFixture = fixtureByScope[scope];
  const reference = referenceDataFixture();
  return { path: `/src/test/etapa8VisualApp.html?${new URLSearchParams({ as: userFixture, route })}`, captureMode: "harness", site: "main", userFixture,
    now: "2026-10-10T12:00:00Z", actions: [], readySelector: "main", responses: [api("GET", "/api/me", galleryMe(scope, configure)),
      api("GET", "/api/reference-data", { ...reference, currencies: [...reference.currencies, { ...reference.currencies[0], code: "USD", name: "Dólar estadounidense", displaySymbol: "USD", symbol: "$", minorUnits: 2 }] })] };
}
export function configurationScenario(board: string, state: string): GalleryApp | undefined {
  const platform = board.includes("Plat-"); const scope = platform ? "platform" : "business";
  const prefix = platform ? "/api/platform/assistant" : "/api/organization/assistant";
  const route = `${platform ? "/plataforma" : "/org"}/asistente/configuracion`;
  const app = baseApp(scope, route);
  app.readySelector = 'form[aria-label="Configuración"]';
  const org: OrganizationAssistantSettingsResponse = { ...galleryOrganizationSettings };
  const plat: PlatformAssistantSettingsResponse = { ...galleryPlatformSettings };
  switch (state) {
    case "Con la clave de la plataforma": case "Configurada": break;
    case "Elegir el modelo": app.actions = [open("Modelo")]; app.readySelector = '[role="listbox"]'; break;
    case "Elegir los modelos permitidos": app.actions = [open("Modelos que pueden elegir las organizaciones", "button")]; app.readySelector = '[role="menu"]'; break;
    case "Cambios sin guardar":
      app.actions = platform ? [fill("Consultas por persona por día", "75")] : [open("Modelo"), click(galleryModels[1].name, "option")];
      app.readyText = "Cambios sin guardar"; break;
    case "Con su clave": org.mode = "OwnKey"; break;
    case "Cambiar la clave": org.mode = "OwnKey"; app.actions = [click("Cambiar")]; app.readySelector = 'input[type="password"]'; break;
    case "Sin clave": plat.hasKey = false; plat.maskedKeySuffix = null; app.readySelector = 'input[type="password"]'; break;
    case "Clave rechazada": {
      org.mode = "OwnKey";
      const problem: ApiProblemDetails = { type: "about:blank", title: "Bad Request", status: 400, code: "Assistant.Settings.KeyRejected", traceId: "gallery-e8b" };
      app.responses.push(api("PUT", `${prefix}/settings`, problem, 400));
      app.actions = [click("Cambiar"), { type: "fill", label: platform ? "Clave de la plataforma" : "Clave de Anthropic", value: secret }, click("Guardar cambios")];
      app.readyText = "Anthropic rechazó la clave."; break;
    }
    case "La nuestra: ningún Dueño con correo verificado":
      org.mode = "OwnKey"; org.hasAlertRecipient = false; org.hasKey = false; org.maskedKeySuffix = null;
      app.readySelector = 'input[type="password"]'; app.readyText = "algún Dueño tiene que tener un correo verificado"; break;
    case "La plataforma no habilitó su clave": org.allowOwnKey = false; app.readyText = "La de la plataforma"; break;
    case "Catálogo de modelos": case "Agregar un modelo":
      app.path = baseApp(scope, `${route}?tab=catalog`).path;
      app.readySelector = 'input[aria-label="Buscar modelos"]';
      if (state === "Agregar un modelo") { app.actions = [click("Agregar modelo")]; app.readySelector = '[role="dialog"] input'; }
      break;
    default: return undefined;
  }
  app.responses.push(api("GET", `${prefix}/settings`, platform ? plat : org));
  if (platform) app.responses.push(api("GET", `${prefix}/models`, galleryModelPage));
  return app;
}
function createChatScenario(board: string, state: string): GalleryApp | undefined {
  const scope: Scope = board.includes("Personal") ? "consumer" : board.includes("Plat") ? "platform" : "business";
  const route = scope === "consumer" ? "/asistente" : scope === "platform" ? "/plataforma/asistente" : "/org/asistente";
  const prefix = `/api/${scope === "consumer" ? "me" : scope === "platform" ? "platform" : "organization"}/assistant`;
  const configure = state !== "Sin configurar (otro rol)" && scope !== "consumer";
  const app = baseApp(scope, route, configure); const initial = galleryState(scope); initial.canConfigure = configure;
  let history: AssistantConversationSummaryCursorResponse = { items: [], hasMore: false };
  const selectConversation = () => {
    history = { items: [galleryConversation.conversation], hasMore: false };
    app.responses.push(api("GET", `${prefix}/conversations/gallery-chat`, galleryConversation));
    app.actions = [...(board.startsWith("M-") ? [click("Conversaciones")] : []), click("Mi consulta")];
    app.readySelector = '[role="group"][aria-label="Asistente"] strong';
  };
  switch (state) {
    case "Bienvenida":
      initial.noticeAccepted = false;
      history = { items: [galleryConversation.conversation], hasMore: false };
      app.responses.push(api("POST", `${prefix}/notice`, {}), { ...api("GET", prefix, { ...initial, noticeAccepted: true } satisfies AssistantStateResponse), afterResponse: { method: "POST", path: `${prefix}/notice` } });
      app.actions = [click("Entendido")];
      app.readySelector = 'h2'; app.readyText = "¿Qué querés consultar?"; break;
    case "Con adjuntos": case "Adjunto de más de 10 MB":
      history = { items: [galleryConversation.conversation], hasMore: false };
      app.actions = [{ type: "upload", label: "Adjuntar", exact: true, files: [galleryImage] },
        { type: "upload", label: "Adjuntar", exact: true, files: [{ ...galleryPdf, ...(state === "Adjunto de más de 10 MB" ? { byteLength: 10 * 1024 * 1024 + 1 } : {}) }] }];
      app.readySelector = state === "Con adjuntos" ? 'button[aria-label="Quitar planilla-ventas.pdf"]' : '[role="alert"]';
      if (state !== "Con adjuntos") app.readyText = "El archivo pesa más de 10 MB.";
      break;
    case "Historial plegado": selectConversation(); app.actions.push(click("Ocultar las conversaciones")); app.readySelector = 'button[aria-label="Mostrar las conversaciones"][aria-expanded="false"]'; break;
    case "Historial":
      history = { items: [galleryConversation.conversation], hasMore: false };
      app.responses.push(api("GET", `${prefix}/conversations/gallery-chat`, galleryConversation));
      app.actions = [click("Conversaciones")]; app.readySelector = '[role="dialog"]'; app.readyText = "Mi consulta"; break;
    case "Menú de una conversación": case "Acciones de una conversación": case "Renombrar": case "Borrar":
      selectConversation();
      if (board.startsWith("M-")) app.actions.push(click("Conversaciones"));
      app.actions.push(open("Acciones de Mi consulta", "button"));
      app.readySelector = '[role="menu"]';
      if (state === "Renombrar" || state === "Borrar") {
        app.actions.push(click(`${state}: Mi consulta`, "menuitem"));
        app.readySelector = state === "Renombrar" ? '[role="dialog"] input' : '[role="dialog"]';
        app.readyText = state === "Renombrar" ? "Renombrar la conversación" : "Se borra para siempre, con sus adjuntos.";
      }
      break;
    case "Detenida": case "Falló la respuesta": {
      selectConversation();
      const terminal: AssistantConversationResponse = { ...galleryConversation, messages: { items: [galleryConversation.messages.items[0], {
        ...galleryConversation.messages.items[1], text: state === "Detenida" ? "Respuesta parcial del arnés." : "", status: state === "Detenida" ? "Stopped" : "Failed",
      }], hasMore: false } };
      app.responses[app.responses.length - 1] = api("GET", `${prefix}/conversations/gallery-chat`, terminal);
      app.readySelector = '[role="group"][aria-label="Asistente"] [role="status"]';
      app.readyText = state === "Detenida" ? "Detuviste la respuesta." : "El asistente no responde ahora."; break;
    }
    case "Tope del mes": {
      selectConversation();
      const problem: ApiProblemDetails = { type: "about:blank", title: "Too Many Requests", status: 429, code: "Assistant.Limit.MonthlyReached", traceId: "gallery-e8b" };
      app.responses.push(api("POST", `${prefix}/conversations/gallery-chat/messages`, problem, 429));
      app.actions.push(fill("Tu consulta", "Otra consulta"), click("Enviar"));
      app.readySelector = '[role="status"]'; app.readyText = "La organización llegó al tope del mes del asistente."; break;
    }
    case "Mis mensajes con empresas: sin mensajes": {
      // Quick.InteractionsEmpty del backend y ambos tableros Personal v115.
      const text = "Todavía no tenés mensajes con empresas.";
      const empty: AssistantConversationResponse = { ...galleryConversation, conversation: { ...galleryConversation.conversation, title: "Mis mensajes con empresas" }, messages: { items: [
        { ...galleryConversation.messages.items[0], text: "Mis mensajes con empresas" }, { ...galleryConversation.messages.items[1], text },
      ], hasMore: false } };
      const quick: AssistantQuickResponse = { conversation: empty.conversation, messages: empty.messages.items, result: { text, links: [], data: { interactions: { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false } } } };
      app.responses.push(api("POST", `${prefix}/quick/my_messages`, quick), api("GET", `${prefix}/conversations/gallery-chat`, empty),
        { ...api("GET", `${prefix}/conversations`, { items: [empty.conversation], hasMore: false } satisfies AssistantConversationSummaryCursorResponse), query: { saved: "false" }, afterResponse: { method: "POST", path: `${prefix}/quick/my_messages` } });
      app.actions = [click("Mis mensajes con empresas")]; app.readySelector = '[role="group"][aria-label="Asistente"]'; app.readyText = text; break;
    }
    case "Primera vez": initial.noticeAccepted = false; app.readySelector = '[role="dialog"]'; app.readyText = "Antes de tu primera consulta"; break;
    case "Quedan 10 consultas": case "Tope del día":
      initial.remainingMessages = state === "Quedan 10 consultas" ? 10 : 0;
      history = { items: [galleryConversation.conversation], hasMore: false };
      app.responses.push(api("GET", `${prefix}/conversations/gallery-chat`, galleryConversation));
      app.actions = [...(board.startsWith("M-") ? [click("Conversaciones")] : []), click("Mi consulta")];
      app.readySelector = '[role="group"][aria-label="Asistente"] strong';
      app.readyText = state === "Quedan 10 consultas" ? "consultas hoy." : "Se renuevan a las"; break;
    case "Sin configurar": case "Sin configurar (Dueño)": case "Sin configurar (otro rol)": initial.configured = false; app.readyText = "El asistente todavía no está configurado"; break;
    case "Respuesta": {
      const empty: AssistantConversationResponse = { ...galleryConversation, conversation: { ...galleryConversation.conversation, version: 1 }, messages: { items: [], hasMore: false } };
      history = { items: [empty.conversation], hasMore: false };
      app.responses.push({ ...api("GET", `${prefix}/conversations/gallery-chat`, galleryConversation), afterResponse: { method: "POST", path: `${prefix}/conversations/gallery-chat/messages` } }, api("GET", `${prefix}/conversations/gallery-chat`, empty),
        { ...api("GET", `${prefix}/conversations`, { items: [galleryConversation.conversation], hasMore: false } satisfies AssistantConversationSummaryCursorResponse), query: { saved: "false" }, afterResponse: { method: "POST", path: `${prefix}/conversations/gallery-chat/messages` } },
        { method: "POST", path: `${prefix}/conversations/gallery-chat/messages`, status: 200, contentType: "text/event-stream", rawBody: galleryStream });
      app.actions = [...(board.startsWith("M-") ? [click("Conversaciones")] : []), click("Mi consulta"), fill("Tu consulta", "Cuántos usuarios hay"), click("Enviar")];
      app.readyText = "de prueba"; break;
    }
    default: return undefined;
  }
  app.responses.push(api("GET", prefix, initial), api("GET", `${prefix}/conversations`, { items: [], hasMore: false } satisfies AssistantConversationSummaryCursorResponse));
  app.responses[app.responses.length - 1].query = { saved: "true" };
  app.responses.push({ ...api("GET", `${prefix}/conversations`, history), query: { saved: "false" } });
  return app;
}

export function chatScenario(board: string, state: string): GalleryApp | undefined {
  // El lienzo exige Ver uso. RegisteredAssistant todavía no entrega onUsage (T13).
  if (state === "Tope del mes") return undefined;
  // La fuente conserva el PDF inválido con chip rojo/peso/nombre. La UI actual lo rechaza.
  if (state === "Adjunto de más de 10 MB") return undefined;
  return createChatScenario(board, state);
}

// Probe dirigido del 429 actual, sin contarlo como escena de galería completa.
export function galleryMonthlyLimitProbe(board: string): GalleryApp {
  return createChatScenario(board, "Tope del mes")!;
}

// Valida el rechazo cliente existente; no representa el chip rojo exigido por la fuente.
export function galleryOversizedAttachmentProbe(board: string): GalleryApp {
  return createChatScenario(board, "Adjunto de más de 10 MB")!;
}

// Preparación de transporte/SDK: no cuenta como escena hasta corregir ToolStatus.
export function galleryOpenStreamProbe(board: string, state: "Consultando" | "Escribiendo"): GalleryApp {
  const scope: Scope = board.includes("Personal") ? "consumer" : board.includes("Plat") ? "platform" : "business";
  const prefix = `/api/${scope === "consumer" ? "me" : scope === "platform" ? "platform" : "organization"}/assistant`;
  const route = scope === "consumer" ? "/asistente" : scope === "platform" ? "/plataforma/asistente" : "/org/asistente";
  const app = baseApp(scope, route);
  const me = galleryMe(scope);
  if (scope === "business") {
    me.permissions = [...(me.permissions ?? []), "users.read"];
    me.effectivePermissions = { ...me.effectivePermissions, organization: [...me.effectivePermissions.organization, "users.read"] };
  } else if (scope === "platform") {
    me.effectivePermissions = { ...me.effectivePermissions, platform: [...me.effectivePermissions.platform, "platform.tenants.read"] };
  }
  app.responses[0] = api("GET", "/api/me", me);
  const source = scope === "business" ? {
    title: "Invitaciones vencidas", previous: "Invitaciones vencidas",
    answer: "Hay **2 invitaciones vencidas**:\n\n- carla.bianchi@delta.ejemplo.com · venció el 25/09/2026\n- martin.gomez@delta.ejemplo.com · venció el 30/09/2026",
    query: "¿Están todos los de esta planilla en Delta Norte?", delta: "En la planilla hay 6 personas. 4 ya son usuarios de Delta Norte; faltan",
    keys: ["org_companies", "org_users"],
  } : scope === "consumer" ? {
    title: "Por qué no puedo entrar a Beta", previous: "Mis organizaciones",
    answer: "Estás en **2 organizaciones**:\n\n- Grupo Delta · Dueño\n- Beta S.R.L. · suspendida",
    query: "¿Por qué no puedo entrar a Beta?", delta: "Beta S.R.L. está suspendida desde el 25/09/2026. Mientras", keys: ["my_organizations"],
  } : {
    title: "Organizaciones por aprobar", previous: "Organizaciones por aprobar",
    answer: "Hay **2 organizaciones** que esperan aprobación:\n\n- Gamma S.A. · se registró el 27/09/2026\n- Épsilon S.R.L. · se registró el 26/09/2026",
    query: "¿Cuánto costó el asistente este mes y quiénes lo usan más?", delta: "En octubre el asistente costó USD 112,40. Las que", keys: ["platform_assistant_usage"],
  };
  const previousLinks: AssistantLinkResponse[] = scope === "business" ? [{
    routeKey: "business.users", parameters: {}, query: { status: "Expired" }, labelKey: "Ver",
  }] : scope === "platform" ? [{
    routeKey: "platform.organizations", parameters: {}, query: { status: "Pending" }, labelKey: "Ver",
  }] : [];
  const initial: AssistantConversationResponse = { ...galleryConversation, conversation: { ...galleryConversation.conversation, title: source.title },
    messages: { items: [
      { ...galleryConversation.messages.items[0], id: "gallery-previous-user", text: source.previous },
      { ...galleryConversation.messages.items[1], id: "gallery-previous-assistant", text: source.answer, links: previousLinks },
    ], hasMore: false } };
  const historyTitles = scope === "business" ? {
    saved: ["Permisos del rol Auditor"], recent: [source.title, "Quién entró esta semana", "Empresas sin administrador", "Cambios de ayer en Roles"],
  } : scope === "consumer" ? {
    saved: ["Cómo recuperar mi cuenta"], recent: [source.title, "Mis organizaciones", "Correos de mi cuenta"],
  } : {
    saved: ["Altas de setiembre"], recent: [source.title, "Recuperaciones de la semana", "Cuentas suspendidas"],
  };
  const history = (saved: boolean): AssistantConversationSummaryCursorResponse => ({
    items: (saved ? historyTitles.saved : historyTitles.recent).map((title, index): AssistantConversationSummaryResponse => ({
      ...initial.conversation, id: !saved && index === 0 ? initial.conversation.id : `gallery-${scope}-${saved ? "saved" : "recent"}-${index}`,
      title, isSaved: saved,
    })), hasMore: false,
  });
  const attachment: AssistantAttachmentSummaryResponse = { id: "gallery-pdf", fileName: galleryPdf.name, mediaType: galleryPdf.mimeType, byteLength: 1258291, version: 1 };
  const admittedVersion = scope === "business" ? 4 : 3;
  const pending: AssistantConversationResponse = { ...initial, conversation: { ...initial.conversation, version: admittedVersion }, activeTurnId: "gallery-turn",
    messages: { items: [...initial.messages.items,
      { ...galleryConversation.messages.items[0], text: source.query, attachments: scope === "business" ? [attachment] : [] },
      { ...galleryConversation.messages.items[1], status: "Generating", text: state === "Escribiendo" ? source.delta : "" },
    ], hasMore: false } };
  const messagePath = `${prefix}/conversations/gallery-chat/messages`;
  const events: AssistantStreamHttpResponse[] = [
    { event: "start", data: { turnId: "gallery-turn", userMessageId: "gallery-user", assistantMessageId: "gallery-assistant", conversationVersion: admittedVersion } },
    ...source.keys.map((toolKey, index): AssistantStreamHttpResponse => ({ event: "tool", data: {
      turnId: "gallery-turn", toolKey, labelKey: `Tool.${toolKey}`, state: state === "Escribiendo" || index < source.keys.length - 1 ? "complete" : "running",
    } })),
    ...(state === "Escribiendo" ? [{ event: "delta", data: { turnId: "gallery-turn", sequence: 1, text: source.delta } } satisfies AssistantStreamHttpResponse] : []),
  ];
  const afterResponse = { method: "POST" as const, path: messagePath };
  app.responses.push(api("GET", prefix, galleryState(scope)),
    { ...api("GET", `${prefix}/conversations`, history(true)), query: { saved: "true" } },
    { ...api("GET", `${prefix}/conversations`, history(false)), query: { saved: "false" } },
    { ...api("GET", `${prefix}/conversations/gallery-chat`, pending), afterResponse });
  if (scope === "business") {
    const uploaded: AssistantConversationResponse = { ...initial, conversation: { ...initial.conversation, version: 3 } };
    app.responses.push({ ...api("GET", `${prefix}/conversations/gallery-chat`, uploaded), afterResponse: { method: "POST", path: `${prefix}/conversations/gallery-chat/attachments` } },
      api("POST", `${prefix}/conversations/gallery-chat/attachments`, attachment));
  }
  app.responses.push(api("GET", `${prefix}/conversations/gallery-chat`, initial),
    { method: "POST", path: messagePath, status: 200, contentType: "text/event-stream; charset=utf-8", openStream: true,
      rawBody: events.map(({ event, data }) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`).join("") });
  app.actions = [...(board.startsWith("M-") ? [click("Conversaciones")] : []), { ...click(source.title), within: { role: board.startsWith("M-") ? "dialog" : "complementary", name: "Conversaciones" } },
    ...(scope === "business" ? [{ type: "upload", label: "Adjuntar", exact: true, files: [galleryPdf] } satisfies GalleryAction] : []),
    fill("Tu consulta", source.query), click("Enviar")];
  app.readySelector = '[role="group"][aria-label="Asistente"] [role="status"]';
  app.readyTexts = state === "Escribiendo" ? [source.delta, "Escribiendo…", "Información consultada"]
    : ["Consultando…", "Consultando información…", ...(scope === "business" ? ["Información consultada"] : [])];
  if (scope !== "consumer") app.readyTexts.push(scope === "business" ? "Ver usuarios" : "Ver organizaciones");
  return app;
}
