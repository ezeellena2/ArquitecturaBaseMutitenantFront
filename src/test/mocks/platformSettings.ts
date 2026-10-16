import type { ApiSchemas } from "@/shared/api/types";

// Valores guardados del tablero v111; la gracia de baja no forma parte del contrato de esta pantalla.
export const platformSettingsFixture: ApiSchemas["PlatformSettingsResponse"] = {
  consumerSignup: "Open", businessSignup: "RequiresApproval", maxOwnedOrganizations: 3,
  salesEmail: "ventas@ejemplo.com", supportEmail: "soporte@ejemplo.com", version: 1,
  // Contrato E9: las cuotas de arranque (P3) hasta que F4 sume su editor.
  rateLimits: {
    ip: { permitLimit: 300, windowSeconds: 60 }, publicIp: { permitLimit: 60, windowSeconds: 60 },
    identity: { permitLimit: 120, windowSeconds: 60 }, tenant: { permitLimit: 600, windowSeconds: 60 },
    loginCode: { permitLimit: 20, windowSeconds: 900 }, loginVerify: { permitLimit: 30, windowSeconds: 900 },
    invitationPreview: { permitLimit: 60, windowSeconds: 900 }, invitationAccept: { permitLimit: 10, windowSeconds: 900 },
    assistantQuickQuery: { permitLimit: 20, windowSeconds: 60 }, assistantConversation: { permitLimit: 10, windowSeconds: 60 },
    assistantNewKey: { permitLimit: 3, windowSeconds: 900 }, whatsAppWebhook: { permitLimit: 120, windowSeconds: 60 },
  },
};

export function platformSettingsCaptureResponses({ conflict = false } = {}) {
  const saved: ApiSchemas["VersionResponse"] = { version: 2 };
  return [
    { method: "GET", path: "/api/platform/settings", status: 200, body: platformSettingsFixture },
    { method: "PUT", path: "/api/platform/settings", status: conflict ? 409 : 200,
      body: conflict ? { type: "about:blank", title: "Conflicto", status: 409,
        code: "General.ConcurrencyConflict", traceId: "capture-settings-conflict" } : saved },
  ];
}
