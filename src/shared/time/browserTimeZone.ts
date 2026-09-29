/** Zona IANA informada por el navegador; el backend la valida contra el catálogo. */
export function browserTimeZone(): string | undefined {
  try {
    return new Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}
