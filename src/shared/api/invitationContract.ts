import { api } from "./httpClient";
import type { AcceptInvitationRequest, AcceptInvitationResponse, InvitationAntiforgeryResponse, InvitationPreviewResponse } from "./types";

export const invitationPaths = {
  preview: "/api/invitations/preview",
  accept: "/api/invitations/accept",
  page: "/invitacion",
} as const;

export const invitationPreviewQueryKey = ["invitations", "preview"] as const;
export const invitationAntiforgeryQueryKey = ["invitations", "antiforgery"] as const;

export function getInvitationAntiforgery(): Promise<InvitationAntiforgeryResponse> {
  return api.get<InvitationAntiforgeryResponse>("/api/auth/external/google/antiforgery");
}

export function previewInvitation(token: string | null, requestVerificationToken: string): Promise<InvitationPreviewResponse> {
  return api.post<InvitationPreviewResponse>(invitationPaths.preview, { token }, {
    headers: { "RequestVerificationToken": requestVerificationToken },
  });
}

export function acceptInvitation(request: AcceptInvitationRequest, key: string,
  requestVerificationToken: string): Promise<AcceptInvitationResponse> {
  return api.post<AcceptInvitationResponse>(invitationPaths.accept, request, {
    headers: { "Idempotency-Key": key, "RequestVerificationToken": requestVerificationToken },
  });
}
