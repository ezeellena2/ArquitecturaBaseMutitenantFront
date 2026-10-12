import { toSearch } from "@/shared/api/toSearch";
import { api } from "@/shared/api/httpClient";
import type { VersionResponse } from "@/shared/api/types";
import type { AssistantConversationListQuery, AssistantConversationResponse, AssistantConversationSummaryCursorResponse, AssistantConversationSummaryResponse, AssistantFeedbackRequest, AssistantMessageListQuery, AssistantNoticeRequest, AssistantQuickRequest, AssistantQuickResponse, AssistantStateResponse, CreateAssistantConversationRequest, SendAssistantMessageRequest, StopAssistantTurnRequest, UpdateAssistantConversationRequest } from "@/modules/assistant/api/types";
import type { Access } from "@/tenancy/access";

// Identidad local para caché y vida del runtime. La autorización HTTP sale solo del token.
export interface AssistantScope {
  access: Access;
  userId: string;
  tenantId: string | null;
}

export const assistantQueryKeyRoot = (scope: AssistantScope) => ["assistant", scope.access, scope.tenantId, scope.userId] as const;
export const assistantStateQueryKey = (scope: AssistantScope) => [...assistantQueryKeyRoot(scope), "state"] as const;
export const assistantConversationsQueryKey = (scope: AssistantScope, query: AssistantConversationListQuery = {}) =>
  [...assistantQueryKeyRoot(scope), "conversations", query] as const;
export const assistantConversationQueryKey = (scope: AssistantScope, id: string, query: AssistantMessageListQuery = {}) =>
  [...assistantQueryKeyRoot(scope), "detail", id, query] as const;

const prefixes: Record<Access, string> = { consumer: "me", business: "organization", platform: "platform" };

export function assistantPath(scope: AssistantScope): string {
  return `/api/${prefixes[scope.access]}/assistant`;
}

export function assistantConversationPath(scope: AssistantScope, id: string): string {
  return `${assistantPath(scope)}/conversations/${encodeURIComponent(id)}`;
}

export function withAssistantQuery(path: string, query: object | undefined): string {
  return `${path}${toSearch(query ?? {}, true)}`;
}

export function fetchAssistantState(scope: AssistantScope, signal?: AbortSignal): Promise<AssistantStateResponse> {
  return api.get<AssistantStateResponse>(assistantPath(scope), { signal });
}

export function acceptAssistantNotice(scope: AssistantScope, request: AssistantNoticeRequest, key: string, signal?: AbortSignal): Promise<void> {
  return api.post<void>(`${assistantPath(scope)}/notice`, request, { signal, headers: { "Idempotency-Key": key } });
}

export function createAssistantConversation(scope: AssistantScope, request: CreateAssistantConversationRequest, key: string, signal?: AbortSignal): Promise<AssistantConversationSummaryResponse> {
  return api.post<AssistantConversationSummaryResponse>(`${assistantPath(scope)}/conversations`, request, { signal, headers: { "Idempotency-Key": key } });
}

export function fetchAssistantConversations(scope: AssistantScope, query: AssistantConversationListQuery = {}, signal?: AbortSignal): Promise<AssistantConversationSummaryCursorResponse> {
  return api.get<AssistantConversationSummaryCursorResponse>(withAssistantQuery(`${assistantPath(scope)}/conversations`, query), { signal });
}

export function fetchAssistantConversation(scope: AssistantScope, id: string, query: AssistantMessageListQuery = {}, signal?: AbortSignal): Promise<AssistantConversationResponse> {
  return api.get<AssistantConversationResponse>(withAssistantQuery(assistantConversationPath(scope, id), query), { signal });
}

export function updateAssistantConversation(scope: AssistantScope, id: string, request: UpdateAssistantConversationRequest, signal?: AbortSignal): Promise<VersionResponse> {
  return api.put<VersionResponse>(assistantConversationPath(scope, id), request, { signal });
}

export function deleteAssistantConversation(scope: AssistantScope, id: string, version: VersionResponse["version"], signal?: AbortSignal): Promise<void> {
  return api.delete<void>(withAssistantQuery(assistantConversationPath(scope, id), { version }), { signal });
}

export function sendAssistantMessageResponse(scope: AssistantScope, id: string, request: SendAssistantMessageRequest, key: string, signal?: AbortSignal): Promise<Response> {
  return api.response(`${assistantConversationPath(scope, id)}/messages`, {
    method: "POST", body: JSON.stringify(request), signal, cache: "no-store",
    headers: { Accept: "text/event-stream, application/json", "Idempotency-Key": key },
  });
}

export function stopAssistantTurn(scope: AssistantScope, id: string, turnId: string, request: StopAssistantTurnRequest, key: string, signal?: AbortSignal): Promise<void> {
  return api.post<void>(`${assistantConversationPath(scope, id)}/turns/${encodeURIComponent(turnId)}/stop`, request, { signal, headers: { "Idempotency-Key": key } });
}

export function runAssistantQuick(scope: AssistantScope, key: string, request: AssistantQuickRequest, idempotencyKey: string, signal?: AbortSignal): Promise<AssistantQuickResponse> {
  return api.post<AssistantQuickResponse>(`${assistantPath(scope)}/quick/${encodeURIComponent(key)}`, request, { signal, headers: { "Idempotency-Key": idempotencyKey } });
}

export function setAssistantFeedback(scope: AssistantScope, id: string, messageId: string, request: AssistantFeedbackRequest, signal?: AbortSignal): Promise<VersionResponse> {
  return api.put<VersionResponse>(`${assistantConversationPath(scope, id)}/messages/${encodeURIComponent(messageId)}/feedback`, request, { signal });
}
