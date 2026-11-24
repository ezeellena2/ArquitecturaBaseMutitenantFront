import type { ApiSchemas } from "@/shared/api/types";

/** El tono de un estado: pinta el punto (tema.md); la palabra va en el color del texto. */
export type StatusTone = "success" | "warning" | "danger" | "neutral" | "pending";

/** Los cinco tonos del tema, en el orden de tema.md. */
export const statusTones = {
  available: ["success", "warning", "danger", "neutral", "pending"],
} as const satisfies { available: readonly StatusTone[] };

/// Los enums del contrato (`schema.d.ts`): el nombre del esquema y sus valores. Un enum que el contrato declara con `null`
/// («sin dato», como `InvitationDeliveryStatus`) registra solo sus valores: el vacío lo pinta `StatusBadge`.
type ContractEnums = { [Name in keyof ApiSchemas as NonNullable<ApiSchemas[Name]> extends string ? Name : never]: NonNullable<ApiSchemas[Name]> };

/** Los tonos de un enum de estado: su texto sale de `enums.<Enum>.<Valor>` y su punto, del tono de cada valor. */
export interface StatusTones<TState extends string = string> {
  readonly enum: string;
  readonly tones: Readonly<Record<TState, StatusTone>>;
}

/// Cada feature registra los tonos de sus estados con el nombre del enum del contrato y el color que le da el lienzo a
/// cada estado («Criterio · Tablas»): TypeScript pide un tono por cada valor del enum. `StatusBadge` los pinta.
export function defineStatusTones<TEnum extends keyof ContractEnums>(enumName: TEnum,
  tones: Readonly<Record<ContractEnums[TEnum], StatusTone>>): StatusTones<ContractEnums[TEnum]> {
  return { enum: enumName, tones };
}

/// El estado de la Página pública lo muestran dos features, su ficha (tableros Pagina-Org y M-Pagina-Org, `.w-est`) y su
/// tarjeta del Inicio (Inicio-Org): se registra una sola vez, acá (estructura-y-features.md). Publicada en verde, borrador
/// en gris y despublicada por la plataforma en rojo, con la palabra también en rojo (tema.md); la palabra sale de
/// `enums.HomePublicPageState` (formatos.md).
export const publicPageStateTones = defineStatusTones("HomePublicPageState", { Published: "success", Draft: "neutral", Blocked: "danger" });

/// Configuración de Empresa y Dominio de Plataforma muestran el mismo estado del contrato con los mismos tonos.
export const tenantDomainStatusTones = defineStatusTones("TenantDomainStatus", { Pending: "warning", Verified: "success", Removed: "neutral" });

/** Compartidos por las fichas/listados de Plataforma y Para resolver. */
export const tenantStatusTones = defineStatusTones("TenantStatus", { PendingApproval: "pending", Provisioning: "danger", Active: "success", Suspended: "warning", Closed: "neutral" });
export const recoveryStatusTones = defineStatusTones("AccountRecoveryStatus", { Pending: "pending", Approved: "success", Rejected: "danger" });

/// La entrega de una invitación (`invitationDelivery`, 0066 §4), en Usuarios, Usuario, los miembros de una empresa, Cuentas y
/// la ficha de un operador (tableros `-Base2`): en la cola en celeste, enviada en verde, sin confirmar en ámbar y la que no
/// se pudo enviar en rojo.
export const invitationDeliveryTones = defineStatusTones("InvitationDeliveryStatus", { Pending: "pending", Sent: "success", Uncertain: "warning", Failed: "danger" });
