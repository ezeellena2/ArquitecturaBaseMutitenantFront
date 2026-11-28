const present = (value: unknown) => value !== undefined && value !== null && value !== "";

/** Conserva cero y false, omite filtros vacíos y codifica claves y valores una sola vez; una lista repite su clave. */
export function toSearch(query: object, withQuestionMark = false): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) for (const item of value.filter(present)) params.append(key, String(item));
    else if (present(value)) params.set(key, String(value));
  }
  const search = params.toString();
  return withQuestionMark && search ? `?${search}` : search;
}
