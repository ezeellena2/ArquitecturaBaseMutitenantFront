import { api } from "@/shared/api/httpClient";
import type { ChangePlatformOperatorRequest, InvitePlatformOperatorRequest, PlatformAccountActionRequest, PlatformOperatorInvitationResponse, VersionResponse } from "@/shared/api/types";

export function inviteOperator(request: InvitePlatformOperatorRequest, key: string): Promise<PlatformOperatorInvitationResponse> {
  return api.post("/api/platform/operators/invitations", request, { headers: { "Idempotency-Key": key } });
}
export function resendOperatorInvitation(id: string, key: string): Promise<PlatformOperatorInvitationResponse> {
  return api.post(`/api/platform/operators/${encodeURIComponent(id)}/invitation/resend`, undefined, { headers: { "Idempotency-Key": key } });
}
export function revokeOperatorInvitation(id: string): Promise<void> { return api.delete(`/api/platform/operators/${encodeURIComponent(id)}/invitation`); }
export function changeOperatorPermissions(id: string, request: ChangePlatformOperatorRequest, key: string): Promise<VersionResponse> {
  return api.put(`/api/platform/accounts/${encodeURIComponent(id)}/operator`, request, { headers: { "Idempotency-Key": key } });
}
export function removeOperator(id: string, request: PlatformAccountActionRequest, key: string): Promise<void> {
  return api.delete(`/api/platform/accounts/${encodeURIComponent(id)}/operator`, { body: JSON.stringify(request), headers: { "Idempotency-Key": key } });
}
