import { api } from "@/shared/api/httpClient";
import type { VersionResponse } from "@/shared/api/types";
import type { OrganizationAssistantSettingsResponse, PlatformAssistantSettingsResponse, UpdateOrganizationAssistantSettingsRequest, UpdatePlatformAssistantSettingsRequest } from "@/modules/assistant/api/types";
import { assistantPath, assistantQueryKeyRoot, type AssistantScope } from "./assistant";

export const assistantSettingsKey = (scope: AssistantScope) => [...assistantQueryKeyRoot(scope), "settings"] as const;
export function fetchOrganizationAssistantSettings(signal?: AbortSignal) {
  return api.get<OrganizationAssistantSettingsResponse>("/api/organization/assistant/settings", { signal });
}
export function fetchPlatformAssistantSettings(signal?: AbortSignal) {
  return api.get<PlatformAssistantSettingsResponse>("/api/platform/assistant/settings", { signal });
}
export function updateAssistantSettings(scope: AssistantScope, body: UpdateOrganizationAssistantSettingsRequest | UpdatePlatformAssistantSettingsRequest, key: string, signal: AbortSignal) {
  return api.put<VersionResponse>(`${assistantPath(scope)}/settings`, body, { signal, headers: { "Idempotency-Key": key } });
}
