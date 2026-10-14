import type { FormatState, MoneyValue } from "@/shared/format/useFormat";

/**
 * Los costos estimados llegan como `Money`, que el contrato publica sin forma (`unknown`): se leen tal cual llegan, con su
 * importe y su moneda, y nunca se calculan en el front. Lo que no tiene esa forma no se muestra.
 */
export function asMoney(value: unknown): MoneyValue | null {
  if (typeof value !== "object" || value === null || !("amount" in value) || !("currency" in value)) return null;
  return typeof value.amount === "number" && typeof value.currency === "string" ? { amount: value.amount, currency: value.currency } : null;
}

/** Una cantidad en el texto: el plural con el número y la cifra con los separadores de la cultura («1.240 contactos»). */
export const countOf = (format: FormatState, value: number) => ({ count: value, n: format.formatInteger(value) });
