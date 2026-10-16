import type { FormatState } from "./useFormat";

/** Una cantidad en el texto: el plural con el número y la cifra con los separadores de la cultura («1.240 usuarios»). */
export const countOf = (format: FormatState, value: number) => ({ count: value, n: format.formatInteger(value) });
