import type { MeResponse, VersionResponse } from "@/shared/api/types";
import type { AssistantPolicyResponse, UpdateAssistantPolicyRequest } from "@/modules/assistant/api/types";
import { api } from "@/shared/api/httpClient";

export const assistantPolicyQueryRoot = (me: Pick<MeResponse, "access" | "id" | "activeTenantId">) => ["assistant-policy", me.access, me.id, me.activeTenantId ?? null] as const;
export const assistantPolicyQueryKey = (me: Pick<MeResponse, "access" | "id" | "activeTenantId">, organizationId: string) => [...assistantPolicyQueryRoot(me), organizationId] as const;
const policyPath = (organizationId: string) => `/api/platform/tenants/${encodeURIComponent(organizationId)}/assistant/policy`;
export const fetchAssistantPolicy = (organizationId: string, signal?: AbortSignal) => api.get<AssistantPolicyResponse>(policyPath(organizationId), { signal });
export const updateAssistantPolicy = (organizationId: string, request: UpdateAssistantPolicyRequest, signal?: AbortSignal) => api.put<VersionResponse>(policyPath(organizationId), request, { signal });
