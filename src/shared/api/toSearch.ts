/** Conserva cero y false, omite filtros vacíos y codifica claves y valores una sola vez. */
export function toSearch(query: object, withQuestionMark = false): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const search = params.toString();
  return withQuestionMark && search ? `?${search}` : search;
}
