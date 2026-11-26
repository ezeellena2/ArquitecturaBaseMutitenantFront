import { api } from "@/shared/api/httpClient";
import type { AssistantProposalAppliedRequest, AssistantProposalAttemptResponse, AssistantProposalResponse } from "@/shared/api/types";

const proposalPath = (id: string) => `/api/organization/assistant/proposals/${encodeURIComponent(id)}`;

/** La misma consulta para la tarjeta del hilo y la pantalla que confirma: guardar en una la actualiza en la otra. */
export const assistantProposalQueryKey = (id: string) => ["assistant-actions", "proposal", id] as const;

export function readAssistantProposal(id: string, signal?: AbortSignal) {
  return api.get<AssistantProposalResponse>(proposalPath(id), { signal });
}

/** La clave del intento de guardar: la misma mientras ese intento no termine en 4xx (sin `Idempotency-Key` propia). */
export function requestAssistantProposalAttempt(id: string) {
  return api.post<AssistantProposalAttemptResponse>(`${proposalPath(id)}/attempts`, {});
}

export function markAssistantProposalApplied(id: string, version?: number) {
  const request: AssistantProposalAppliedRequest = version === undefined ? {} : { version };
  return api.post<AssistantProposalResponse>(`${proposalPath(id)}/applied`, request);
}
