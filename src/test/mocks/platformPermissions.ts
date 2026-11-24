import type { ApiSchemas } from "@/shared/api/types";

/// `GET /api/platform/permissions` (260 y 269): los catorce permisos de un operador con los módulos instalados, lo que
/// incluye cada uno y si quien pide lo puede dar. Quien pide los tiene todos; cada test que apaga algo lo reemplaza.
export function platformPermissionsFixture(notGrantable: readonly string[] = []): ApiSchemas["PlatformPermissionItem"][] {
  const includes: Record<string, string[]> = {
    "platform.tenants.manage": ["platform.tenants.read"],
    "platform.accounts.manage": ["platform.accounts.read"],
    "platform.assistant.configure": ["platform.assistant.read"],
  };
  return ["platform.tenants.read", "platform.tenants.manage", "platform.accounts.read", "platform.accounts.manage", "platform.recoveries.manage",
    "platform.legal.manage", "platform.operators.manage", "platform.audit.read", "platform.whatsapp.manage", "platform.whatsapp.attend",
    "platform.assistant.use", "platform.assistant.configure", "platform.assistant.read", "platform.settings.manage"]
    .map((code) => ({ code, includes: includes[code] ?? [], grantable: !notGrantable.includes(code) }));
}
