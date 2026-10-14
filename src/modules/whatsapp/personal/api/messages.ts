import { api } from "@/shared/api/httpClient";
import { toSearch } from "@/shared/api/toSearch";
import type { PagedRequest } from "@/shared/api/types";
import type { PagedResultOfPersonalWhatsAppConversationResponse, PersonalWhatsAppConversationDetailResponse } from "../../api/types";
import { whatsappQueryRoot } from "../../api/untaken";

const base = "/api/me/whatsapp/conversations";
const withQuery = (path: string, query: object) => { const search = toSearch(query); return search ? `${path}?${search}` : path; };

/** «Mensajes» de la persona: las conversaciones vinculadas a su cuenta, de solo lectura (D5: desde que se vinculó). */
export const personalMessagesQueryRoot = [...whatsappQueryRoot, "personal"] as const;
export const personalConversationsQueryKey = (query: PagedRequest) => [...personalMessagesQueryRoot, "list", query] as const;
export const personalConversationQueryKey = (id: string, page: PagedRequest) => [...personalMessagesQueryRoot, "conversation", id, page] as const;

export function fetchPersonalConversations(query: PagedRequest, signal?: AbortSignal) {
  return api.get<PagedResultOfPersonalWhatsAppConversationResponse>(withQuery(base, query), { signal });
}

export function fetchPersonalConversation(id: string, page: PagedRequest, signal?: AbortSignal) {
  return api.get<PersonalWhatsAppConversationDetailResponse>(withQuery(`${base}/${encodeURIComponent(id)}`, page), { signal });
}

/** CC06: desvincular es solo de la persona; la conversación sigue en WhatsApp y en la organización. */
export function unlinkConversation(id: string) {
  return api.delete<void>(`${base}/${encodeURIComponent(id)}/link`);
}
