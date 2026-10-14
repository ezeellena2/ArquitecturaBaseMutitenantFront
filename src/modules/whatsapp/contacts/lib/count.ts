import type { FormatState } from "@/shared/format/useFormat";

/** Una cantidad en el texto: el plural con el número y la cifra con los separadores de la cultura («1.240 contactos»). */
export const countOf = (format: FormatState, value: number) => ({ count: value, n: format.formatInteger(value) });
