import { api } from "@/shared/api/httpClient";
import type { AssistantCreatedModelResponse, AssistantModelListQuery, AssistantModelPricePageResponse, AssistantModelPriceResponse, CreateAssistantModelRequest, UpdateAssistantModelRequest, VersionResponse } from "@/shared/api/types";
import { assistantQueryKeyRoot, withAssistantQuery, type AssistantScope } from "./assistant";

const path = "/api/platform/assistant/models";
export const assistantModelsRoot = (scope: AssistantScope) => [...assistantQueryKeyRoot(scope), "models"] as const;
export const assistantModelsKey = (scope: AssistantScope, query: AssistantModelListQuery) => [...assistantModelsRoot(scope), query] as const;
export async function fetchAssistantModels(query: AssistantModelListQuery, signal?: AbortSignal) {
  const response = await api.get<AssistantModelPricePageResponse>(withAssistantQuery(path, query), { signal });
  const totalPages = response.totalPages ?? Math.ceil(response.totalCount / response.pageSize);
  return { ...response, totalPages, hasPrevious: response.hasPrevious ?? response.page > 1, hasNext: response.hasNext ?? response.page < totalPages };
}
/** La selección incluye todas las páginas; los inactivos permiten identificar una selección guardada inválida. */
export async function fetchAssistantModelOptions(signal?: AbortSignal): Promise<AssistantModelPriceResponse[]> {
  const items: AssistantModelPriceResponse[] = [];
  for (let page = 1; ; page++) {
    const response = await fetchAssistantModels({ page, pageSize: 100 }, signal);
    items.push(...response.items);
    if (items.length >= response.totalCount || response.items.length === 0) return items;
  }
}
export function createAssistantModel(body: CreateAssistantModelRequest, key: string, signal: AbortSignal) {
  return api.post<AssistantCreatedModelResponse>(path, body, { signal, headers: { "Idempotency-Key": key } });
}
export function updateAssistantModel(id: string, body: UpdateAssistantModelRequest, signal: AbortSignal) {
  return api.put<VersionResponse>(`${path}/${encodeURIComponent(id)}`, body, { signal });
}
