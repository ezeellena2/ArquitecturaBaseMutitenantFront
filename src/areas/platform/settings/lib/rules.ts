// Los límites del contrato (272 y 273, spec «Base de la 12, segunda parte»): openapi.json todavía no los publica, y el
// back los vuelve a validar con el 400 de siempre en su campo.
export const retentionBounds = { loginAuditRetentionMonths: { min: 1, max: 120 }, loginCodeRetentionDays: { min: 1, max: 3650 }, closedInvitationRetentionDays: { min: 7, max: 3650 } } as const;
export type RetentionField = keyof typeof retentionBounds;
export const retentionFields = Object.keys(retentionBounds) as RetentionField[];
export const emailNameMaxLength = 60;

/** Una dirección que se puede mostrar como logo de los correos: vacío o `https://` (273). */
export function isEmailLogoUrl(value: string) {
  return /^https:\/\/[^\s/]+\S*$/i.test(value.trim());
}
