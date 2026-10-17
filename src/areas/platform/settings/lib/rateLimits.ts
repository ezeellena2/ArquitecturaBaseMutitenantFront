import { validationConstraints } from "@/shared/api/generated/validation";
import type { ApiSchemas } from "@/shared/api/types";

// Los límites de uso de Plataforma (E9, Config-Plat «Límites de uso»): los doce perfiles cerrados de `rateLimits`, en el orden
// y los grupos del tablero. La pantalla edita pedidos y «cada» con su unidad; el contrato guarda la ventana en segundos.

export const rateLimitProfiles = [
  { key: "ip", group: "service" }, { key: "publicIp" }, { key: "identity" }, { key: "tenant" },
  { key: "loginCode", group: "login" }, { key: "loginVerify" }, { key: "invitationPreview" }, { key: "invitationAccept" },
  { key: "assistantQuickQuery", group: "assistant" }, { key: "assistantConversation" }, { key: "assistantNewKey" },
  { key: "whatsAppWebhook", group: "whatsapp" },
] as const satisfies readonly { key: keyof ApiSchemas["PlatformRateLimitsInput"]; group?: string }[];

export type RateLimitProfile = (typeof rateLimitProfiles)[number]["key"];
export type RateLimitUnit = "s" | "m" | "h";
export interface RateLimitDraft { permitLimit: number | null; amount: number | null; unit: RateLimitUnit }
export type RateLimitsDraft = Record<RateLimitProfile, RateLimitDraft>;

const unitSeconds: Record<RateLimitUnit, number> = { s: 1, m: 60, h: 3600 };
export const rateLimitBounds = validationConstraints.RateLimitQuotaInput;

/** La ventana en la unidad más grande que la divide: 900 s son 15 minutos; 90 s, 90 segundos. */
export function draftOf(quota: ApiSchemas["RateLimitQuotaResponse"]): RateLimitDraft {
  const unit: RateLimitUnit = quota.windowSeconds % 3600 === 0 ? "h" : quota.windowSeconds % 60 === 0 ? "m" : "s";
  return { permitLimit: quota.permitLimit, amount: quota.windowSeconds / unitSeconds[unit], unit };
}

export function draftsOf(limits: ApiSchemas["PlatformRateLimitsResponse"]): RateLimitsDraft {
  return Object.fromEntries(rateLimitProfiles.map(({ key }) => [key, draftOf(limits[key])])) as RateLimitsDraft;
}

export const windowSecondsOf = (draft: RateLimitDraft): number | null => draft.amount === null ? null : draft.amount * unitSeconds[draft.unit];

export const validPermitLimit = (value: number | null) =>
  value !== null && Number.isInteger(value) && value >= rateLimitBounds.permitLimit.minimum && value <= rateLimitBounds.permitLimit.maximum;
export function validWindow(draft: RateLimitDraft): boolean {
  const seconds = windowSecondsOf(draft);
  return draft.amount !== null && Number.isInteger(draft.amount) && seconds !== null
    && seconds >= rateLimitBounds.windowSeconds.minimum && seconds <= rateLimitBounds.windowSeconds.maximum;
}

/** Los doce perfiles completos para el PUT; solo se llama con un borrador válido. */
export function rateLimitsInput(drafts: RateLimitsDraft): ApiSchemas["PlatformRateLimitsInput"] {
  return Object.fromEntries(rateLimitProfiles.map(({ key }) => [key, { permitLimit: drafts[key].permitLimit ?? 0, windowSeconds: windowSecondsOf(drafts[key]) ?? 0 }])) as ApiSchemas["PlatformRateLimitsInput"];
}

export function sameRateLimits(left: RateLimitsDraft, right: RateLimitsDraft): boolean {
  return rateLimitProfiles.every(({ key }) => left[key].permitLimit === right[key].permitLimit && windowSecondsOf(left[key]) === windowSecondsOf(right[key]));
}
