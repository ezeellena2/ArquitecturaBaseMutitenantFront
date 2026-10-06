import { api } from "@/shared/api/httpClient";
import type { InvitePlatformOperatorRequest, PlatformOperatorInvitationResponse } from "@/shared/api/types";

export function inviteOperator(request: InvitePlatformOperatorRequest, key: string): Promise<PlatformOperatorInvitationResponse> {
  return api.post("/api/platform/operators/invitations", request, { headers: { "Idempotency-Key": key } });
}
export function resendOperatorInvitation(id: string, key: string): Promise<PlatformOperatorInvitationResponse> {
  return api.post(`/api/platform/operators/${encodeURIComponent(id)}/invitation/resend`, undefined, { headers: { "Idempotency-Key": key } });
}
export function revokeOperatorInvitation(id: string): Promise<void> { return api.delete(`/api/platform/operators/${encodeURIComponent(id)}/invitation`); }
