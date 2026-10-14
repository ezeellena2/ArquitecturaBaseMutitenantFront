import type { MeResponse } from "@/shared/api/types";
import type { ModuleGuard } from "@/shared/modules/types";

/** Los permisos de la organización del módulo (D3): solo el Dueño los recibe de entrada. */
export const whatsappPermissions = ["whatsapp.customers", "whatsapp.internal", "whatsapp.broadcasts", "whatsapp.manage"] as const;
export type WhatsAppPermission = (typeof whatsappPermissions)[number];

/** Los de Plataforma: Número, Bot, Equipos y Plantillas (`manage`) y Consultas (`attend`). */
export const platformWhatsAppPermissions = ["platform.whatsapp.manage", "platform.whatsapp.attend"] as const;
export type PlatformWhatsAppPermission = (typeof platformWhatsAppPermissions)[number];

/** La llave del módulo por organización (`[FeatureGate("whatsapp")]`): apagada, las rutas son un 404. */
export const whatsappFeature = "whatsapp";

const hasFeature = (me: MeResponse) => me.features.includes(whatsappFeature);

/** Una pantalla de la organización: el módulo prendido y alguno de los permisos (las bandejas aceptan cualquiera de los dos). */
export function businessGuard(...permissions: readonly (WhatsAppPermission | "users.invite")[]): ModuleGuard {
  return (me) => me.access !== "business" ? "forbidden" : !hasFeature(me) ? "unavailable"
    : permissions.some((permission) => me.effectivePermissions.organization.includes(permission)) ? "allowed" : "forbidden";
}

/** Plataforma no tiene llave por organización: el módulo instalado y el permiso del operador. */
export function platformGuard(...permissions: readonly PlatformWhatsAppPermission[]): ModuleGuard {
  return (me) => me.access !== "platform" ? "forbidden"
    : permissions.some((permission) => me.effectivePermissions.platform.includes(permission)) ? "allowed" : "forbidden";
}

/** «Mensajes» del perfil personal: sin permisos propios, solo el módulo (receta Personal). */
export const personalGuard: ModuleGuard = (me) => me.access !== "consumer" ? "forbidden" : hasFeature(me) ? "allowed" : "unavailable";

/** Las dos bandejas de la organización y el permiso que abre cada una. */
export const inboxPermission = { customers: "whatsapp.customers", internal: "whatsapp.internal" } as const satisfies Record<string, WhatsAppPermission>;
