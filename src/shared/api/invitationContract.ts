import { api } from "./httpClient";
import type { AcceptInvitationRequest, AcceptInvitationResponse, InvitationPreviewResponse } from "./types";

export const invitationPaths = {
  preview: "/api/invitations/preview",
  accept: "/api/invitations/accept",
  page: "/invitacion",
} as const;

export function previewInvitation(token: string, requestVerificationToken: string): Promise<InvitationPreviewResponse> {
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
