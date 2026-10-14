import type { WhatsAppTemplateVariableInput } from "../../api/types";

/// Meta numera los datos de una plantilla en el texto: «Hola {{1}}, tu pedido {{2}} está listo». Cada número es una
/// variable del pedido, en orden: `variables[0]` es la de `{{1}}`, con su nombre y un ejemplo para que Meta la revise.
const placeholder = /\{\{\s*(\d+)\s*\}\}/g;

/** Los números que aparecen en el texto, sin repetir y en orden. */
export function placeholderNumbers(body: string): number[] {
  return [...new Set([...body.matchAll(placeholder)].map((match) => Number(match[1])))].sort((left, right) => left - right);
}

/** El que sigue al más alto del texto: el de un dato nuevo. */
export function nextPlaceholder(body: string): number {
  return Math.max(0, ...placeholderNumbers(body)) + 1;
}

/** Suma `{{n}}` donde está el cursor (o al final) y devuelve el texto y dónde queda el cursor. */
export function insertPlaceholder(body: string, number: number, start = body.length, end = start): { body: string; cursor: number } {
  const token = `{{${number}}}`;
  return { body: `${body.slice(0, start)}${token}${body.slice(end)}`, cursor: start + token.length };
}

/** Los datos se numeran desde 1 y sin saltos: `{{1}}` y `{{3}}` sin `{{2}}` no los acepta Meta. */
export function placeholdersInOrder(body: string): boolean {
  return placeholderNumbers(body).every((number, index) => number === index + 1);
}

/// Las variables del pedido, en el orden de los números del texto, con lo que se cargó para cada una.
export function templateVariables(body: string, entries: Readonly<Record<string, { label: string; example: string }>>): WhatsAppTemplateVariableInput[] {
  return placeholderNumbers(body).map((number) => ({ label: entries[number]?.label.trim() ?? "", example: entries[number]?.example.trim() ?? "" }));
}
