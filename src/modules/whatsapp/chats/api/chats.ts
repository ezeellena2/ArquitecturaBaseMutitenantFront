import { api } from "@/shared/api/httpClient";
import type { PageSize } from "@/shared/api/pageSizes";
import type { ResourceOptions } from "@/shared/api/resourceOptions";
import { toSearch } from "@/shared/api/toSearch";
import type { PagedRequest } from "@/shared/api/types";
import type { inboxPermission } from "../../access";
import type {
  AddWhatsAppNoteRequest,
  PagedResultOfWhatsAppTeamResponse,
  PagedResultOfWhatsAppTemplateOptionResponse,
  PagedResultOfWhatsAppTransferPersonResponse,
  PagedResultOfWhatsAppTransferTeamResponse,
  SendWhatsAppMessageRequest,
  SendWhatsAppTemplateRequest,
  TransferWhatsAppConversationRequest,
  WhatsAppChatMessageResponse,
  WhatsAppConversationFilter,
  WhatsAppConversationListResponse,
  WhatsAppConversationResponse,
  WhatsAppConversationRowResponse,
  WhatsAppTeamResponse,
  WhatsAppTemplateOptionResponse,
  WhatsAppTransferPersonResponse,
  WhatsAppTransferTeamResponse,
} from "../../api/types";
import { whatsappQueryRoot } from "../../api/untaken";

/** Las dos bandejas de la organización, con el segmento de su ruta (`customers/conversations`, `internal/conversations`). */
export type InboxKey = keyof typeof inboxPermission;

/** Dónde se atiende: una bandeja de la organización o las Consultas de Plataforma, con las mismas acciones. */
export type ChatsScope = { readonly kind: "organization"; readonly inbox: InboxKey } | { readonly kind: "platform" };

export interface ConversationsQuery {
  readonly page: number;
  readonly pageSize: PageSize;
  readonly search?: string;
  readonly teamId?: string;
  readonly state?: NonNullable<WhatsAppConversationFilter>;
}

const conversationsPath = (scope: ChatsScope) => scope.kind === "platform"
  ? "/api/platform/whatsapp/conversations" : `/api/organization/whatsapp/${scope.inbox}/conversations`;
const conversationPath = (scope: ChatsScope, id: string) => `${conversationsPath(scope)}/${encodeURIComponent(id)}`;
const scopeKey = (scope: ChatsScope) => scope.kind === "platform" ? "platform" : scope.inbox;
const withQuery = (path: string, query: object) => { const search = toSearch(query); return search ? `${path}?${search}` : path; };
const idempotent = (key: string) => ({ headers: { "Idempotency-Key": key } });

export const chatsQueryRoot = [...whatsappQueryRoot, "chats"] as const;
/** Todo lo de una bandeja (la lista y sus conversaciones): lo que se invalida después de tomar, mandar o pasar. */
export const chatsScopeQueryRoot = (scope: ChatsScope) => [...chatsQueryRoot, scopeKey(scope)] as const;
export const conversationsQueryKey = (scope: ChatsScope, query: ConversationsQuery) => [...chatsScopeQueryRoot(scope), "list", query] as const;
export const conversationQueryKey = (scope: ChatsScope, id: string, page: PagedRequest) =>
  [...chatsScopeQueryRoot(scope), "conversation", id, page] as const;

export function fetchConversations(scope: ChatsScope, query: ConversationsQuery, signal?: AbortSignal) {
  return api.get<WhatsAppConversationListResponse>(withQuery(conversationsPath(scope), query), { signal });
}

export function fetchConversation(scope: ChatsScope, id: string, page: PagedRequest, signal?: AbortSignal) {
  return api.get<WhatsAppConversationResponse>(withQuery(conversationPath(scope, id), page), { signal });
}

export function takeConversation(scope: ChatsScope, id: string) {
  return api.post<WhatsAppConversationRowResponse>(`${conversationPath(scope, id)}/take`);
}

/** Toma el chat si estaba sin tomar (B4); si otra persona lo tomó, 409 `TakenByOther` y el mensaje no sale. */
export function sendMessage(scope: ChatsScope, id: string, request: SendWhatsAppMessageRequest, key: string) {
  return api.post<WhatsAppChatMessageResponse>(`${conversationPath(scope, id)}/messages`, request, idempotent(key));
}

/** Las notas nunca salen a Meta: las ve solo el equipo. */
export function addNote(scope: ChatsScope, id: string, request: AddWhatsAppNoteRequest, key: string) {
  return api.post<WhatsAppChatMessageResponse>(`${conversationPath(scope, id)}/notes`, request, idempotent(key));
}

export function transferConversation(scope: ChatsScope, id: string, request: TransferWhatsAppConversationRequest) {
  return api.post<WhatsAppConversationRowResponse>(`${conversationPath(scope, id)}/transfer`, request);
}

export function sendTemplate(scope: ChatsScope, id: string, request: SendWhatsAppTemplateRequest, key: string) {
  return api.post<WhatsAppChatMessageResponse>(`${conversationPath(scope, id)}/templates`, request, idempotent(key));
}

// Las opciones se piden de a páginas de 10 con búsqueda en el servidor (`useResourceOptions`); estas rutas no ordenan.
const optionQuery = ({ page, pageSize, search }: PagedRequest) => ({ page, pageSize, search });

/** CC01: los equipos a los que se puede pasar el chat, con su cantidad de personas. */
export function transferTeamOptions(scope: ChatsScope, id: string): ResourceOptions<WhatsAppTransferTeamResponse> {
  return {
    queryKeyRoot: [...chatsScopeQueryRoot(scope), "transfer", id, "teams"], id: (team) => team.id,
    queryFn: (query, signal) => api.get<PagedResultOfWhatsAppTransferTeamResponse>(
      withQuery(`${conversationPath(scope, id)}/transfer-options/teams`, optionQuery(query)), { signal }),
  };
}

/** CC01: las personas del equipo del chat, con los chats que ya tienen tomados. */
export function transferPeopleOptions(scope: ChatsScope, id: string): ResourceOptions<WhatsAppTransferPersonResponse> {
  return {
    queryKeyRoot: [...chatsScopeQueryRoot(scope), "transfer", id, "people"], id: (person) => person.id,
    queryFn: (query, signal) => api.get<PagedResultOfWhatsAppTransferPersonResponse>(
      withQuery(`${conversationPath(scope, id)}/transfer-options/people`, optionQuery(query)), { signal }),
  };
}

/** Las plantillas que se le pueden mandar, con la vista previa (CC03) y el costo estimado que calcula el back. */
export function templateOptions(scope: ChatsScope, id: string): ResourceOptions<WhatsAppTemplateOptionResponse> {
  return {
    queryKeyRoot: [...chatsScopeQueryRoot(scope), "templates", id], id: (template) => template.templateId,
    queryFn: (query, signal) => api.get<PagedResultOfWhatsAppTemplateOptionResponse>(
      withQuery(`${conversationPath(scope, id)}/template-options`, optionQuery(query)), { signal }),
  };
}

/** Los equipos para el filtro «Equipo» de la bandeja: los lee quien administra WhatsApp. */
export function teamFilterOptions(scope: ChatsScope): ResourceOptions<WhatsAppTeamResponse> {
  const path = scope.kind === "platform" ? "/api/platform/whatsapp/teams" : "/api/organization/whatsapp/teams";
  return {
    queryKeyRoot: [...chatsQueryRoot, "team-options", scope.kind], id: (team) => team.id,
    queryFn: (query, signal) => api.get<PagedResultOfWhatsAppTeamResponse>(withQuery(path, optionQuery(query)), { signal }),
  };
}
