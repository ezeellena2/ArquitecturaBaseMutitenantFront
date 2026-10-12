import { api } from "@/shared/api/httpClient";
import type { AssistantUsagePageResponse, OrganizationAssistantUsageQuery, PlatformAssistantUsageQuery } from "@/modules/assistant/api/types";
import { assistantPath, assistantQueryKeyRoot, withAssistantQuery, type AssistantScope } from "./assistant";

export const assistantUsageQueryKey = (scope: AssistantScope, query: OrganizationAssistantUsageQuery) =>
  [...assistantQueryKeyRoot(scope), "usage", query] as const;

export function fetchAssistantUsage(scope: AssistantScope, query: OrganizationAssistantUsageQuery, signal?: AbortSignal): Promise<AssistantUsagePageResponse> {
  // Platform no publica groupBy. La identidad y el contexto salen del token, nunca de la query.
  const platformQuery: PlatformAssistantUsageQuery = { month: query.month, page: query.page, pageSize: query.pageSize };
  return api.get<AssistantUsagePageResponse>(withAssistantQuery(`${assistantPath(scope)}/usage`, scope.access === "platform" ? platformQuery : query), { signal });
}
