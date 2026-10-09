import type { AccountLoginMethodsResponse, BusinessSignupResponse, LoginMethodCodeResponse, LoginMethodsResponse, LoginLinkPreviewResponse, PendingDeletionState, RequestLoginCodeResponse } from "@/shared/api/types";

// Datos ficticios que copian los ejemplos del lienzo; sólo el arnés visual los usa.
export const etapa8Channels: LoginMethodsResponse = { channels: [
  { key: "email", countries: [] }, { key: "google", countries: [] },
  { key: "whatsapp", countries: ["AR"], contactPhone: "+5491155550000" },
] };
export const etapa8Code: RequestLoginCodeResponse = { resendAfterSeconds: 60 };
export const etapa8MethodCode: LoginMethodCodeResponse = { methodId: "phone-lucia", resendAfterSeconds: 60 };
export const etapa8Link: LoginLinkPreviewResponse = { displayName: "Lucía Fernández", maskedPhone: "•••• 4521" };
export const etapa8PendingDeletion: PendingDeletionState = {
  scheduledForUtc: "2026-10-27T12:15:00Z", timeZoneId: "America/Argentina/Buenos_Aires",
  cancelTicket: "e8_visual_cancel_ticket_only", returnUrl: "/login/enlace", expiresAtUtc: "2026-10-09T13:00:00Z",
};
export const etapa8BusinessApproval: BusinessSignupResponse = {
  tenantId: "visual-delta", organizationName: "Grupo Delta", slug: "grupo-delta", requiresApproval: true,
  firstCompanyId: "visual-company", status: "PendingApproval", notificationEmail: null,
};
export const etapa8Account: AccountLoginMethodsResponse = {
  methods: [
    { id: "email-lucia", type: "Email", value: "lucia.fer@gmail.com", isVerified: true, isPrimary: true, canRemove: true, canMakePrimary: false },
    { id: "email-delta", type: "Email", value: "lucia.fernandez@delta.ejemplo.com", isVerified: true, isPrimary: false, canRemove: false, canMakePrimary: false, managedByTenantId: "grupo-delta", managedByOrganizationName: "Grupo Delta" },
    { id: "phone-lucia", type: "Phone", value: "+5491155554521", isVerified: false, isPrimary: false, canRemove: false, canMakePrimary: false },
  ], canLinkGoogle: true, needsPersonalLoginMethod: false, accountDeletionGraceDays: 30, soleOwnerOrganizations: [],
};
export const etapa8AccountVerified: AccountLoginMethodsResponse = {
  ...etapa8Account,
  methods: [...etapa8Account.methods.map((method) => method.type === "Phone" ? { ...method, isVerified: true, canRemove: true, canMakePrimary: true } : method),
    { id: "google-lucia", type: "Google", value: "lucia.fer@gmail.com", isVerified: true, isPrimary: false, canRemove: true, canMakePrimary: true }],
  canLinkGoogle: false,
};
