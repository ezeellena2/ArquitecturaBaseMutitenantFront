import type { ApiSchemas } from "@/shared/api/types";

// Valores guardados del tablero v111; la gracia de baja no forma parte del contrato de esta pantalla.
export const platformSettingsFixture: ApiSchemas["PlatformSettingsResponse"] = {
  consumerSignup: "Open", businessSignup: "RequiresApproval", maxOwnedOrganizations: 3,
  salesEmail: "ventas@ejemplo.com", supportEmail: "soporte@ejemplo.com", version: 1,
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
