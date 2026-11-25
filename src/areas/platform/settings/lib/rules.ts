import { validationConstraints } from "@/shared/api/generated/validation";

// Los límites del contrato (272 y 273, spec «Base de la 12, segunda parte»), como los publica openapi.json; el back los
// vuelve a validar con el 400 de siempre en su campo.
const contract = validationConstraints.UpdatePlatformSettingsHttpRequest;
const bounds = (field: "loginAuditRetentionMonths" | "loginCodeRetentionDays" | "closedInvitationRetentionDays") =>
  ({ min: contract[field].minimum, max: contract[field].maximum });
export const retentionBounds = {
  loginAuditRetentionMonths: bounds("loginAuditRetentionMonths"),
  loginCodeRetentionDays: bounds("loginCodeRetentionDays"),
  closedInvitationRetentionDays: bounds("closedInvitationRetentionDays"),
} as const;
export type RetentionField = keyof typeof retentionBounds;
export const retentionFields = Object.keys(retentionBounds) as RetentionField[];
export const emailNameMaxLength = contract.appName.maxLength;

/** Una dirección que se puede mostrar como logo de los correos: vacío o `https://` (273). */
export function isEmailLogoUrl(value: string) {
  return /^https:\/\/[^\s/]+\S*$/i.test(value.trim());
}
