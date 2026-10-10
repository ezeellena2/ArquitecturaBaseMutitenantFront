import type {
  AssistantConversationResponse, AssistantConversationSummaryCursorResponse, AssistantModelPricePageResponse,
  AssistantModelPriceResponse, AssistantStateResponse, AssistantStreamHttpResponse, AssistantTurnResultResponse,
  MeResponse, OrganizationAssistantSettingsResponse, PlatformAssistantSettingsResponse, ApiProblemDetails,
} from "@/shared/api/types";
import { currentUsers } from "./mocks/currentUsers.ts";
import type { CurrentUserFixture } from "./mocks/currentUsers.ts";
import { referenceDataFixture } from "./mocks/handlers.ts";

// Contratos reales; datos y claves exclusivamente ficticios del arnés.
export interface GalleryApiResponse {
  method: "GET" | "POST" | "PUT"; path: string; status: number; body?: unknown;
  rawBody?: string; contentType?: string; query?: Record<string, string>; afterResponse?: { method: "POST"; path: string };
}
export type GalleryAction = { type: "click" | "press" | "fill"; role?: "button" | "radio" | "combobox" | "textbox" | "option"; name?: string; label?: string; exact?: boolean; key?: string; value?: string };
export interface GalleryApp {
  path: string; captureMode: "harness"; site: "main"; userFixture: CurrentUserFixture;
  responses: GalleryApiResponse[]; actions: GalleryAction[]; readySelector: string; readyText?: string; now: string;
}
const api = (method: GalleryApiResponse["method"], path: string, body: unknown, status = 200): GalleryApiResponse => ({ method, path, status, body });
const click = (name: string, role: GalleryAction["role"] = "button"): GalleryAction => ({ type: "click", role, name, exact: true });
const fill = (name: string, value: string): GalleryAction => ({ type: "fill", role: "textbox", name, value, exact: true });
const open = (name: string, role: GalleryAction["role"] = "combobox"): GalleryAction => ({ type: "press", role, name, exact: true, key: "Enter" });
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
    dailyLimit: 50, dailyResetAtUtc: "2026-10-11T03:00:00Z", remainingMessages: 40, noticeVersion: "v1", noticeAccepted: true,
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
export function chatScenario(board: string, state: string): GalleryApp | undefined {
  const scope: Scope = board.includes("Personal") ? "consumer" : board.includes("Plat") ? "platform" : "business";
  const route = scope === "consumer" ? "/asistente" : scope === "platform" ? "/plataforma/asistente" : "/org/asistente";
  const prefix = `/api/${scope === "consumer" ? "me" : scope === "platform" ? "platform" : "organization"}/assistant`;
  const configure = state !== "Sin configurar (otro rol)" && scope !== "consumer";
  const app = baseApp(scope, route, configure); const initial = galleryState(scope); initial.canConfigure = configure;
  let history: AssistantConversationSummaryCursorResponse = { items: [], hasMore: false };
  switch (state) {
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
