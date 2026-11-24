/** Varias, por su nombre (262): tantos nombres elegidos como entran, en el orden de la lista, y «y N más» por el resto. El
 * primero va siempre, aunque el campo tenga que cortarlo. `fits` dice si un texto entra en el campo; `more` nombra el resto.
 * Copiado de ArquitecturaBaseFront (DS2-A). */
export function summarizeChoices(labels: readonly string[], fits: (text: string) => boolean, more: (count: number) => string): { names: string; more: string | null } {
  for (let count = labels.length; count > 1; count--) {
    const names = labels.slice(0, count).join(", "), rest = labels.length - count;
    const suffix = rest > 0 ? more(rest) : null;
    if (fits(suffix ? `${names} ${suffix}` : names)) return { names, more: suffix };
  }
  return { names: labels[0] ?? "", more: labels.length > 1 ? more(labels.length - 1) : null };
}
