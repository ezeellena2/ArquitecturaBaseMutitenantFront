// El retorno del ingreso siempre queda en este origen; se ignoran destinos absolutos o ambiguos.
export function safeReturnUrl(candidate: string | null, fallback: string): string {
  if (!candidate?.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return fallback;
  try {
    const url = new URL(candidate, "https://local.invalid");
    return url.origin === "https://local.invalid" ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
}

// El ingreso admite autorización OIDC o el retorno exacto de invitación, sin elegir un acceso.
// Las demás rutas de la app se conservan como state de signinRedirect.
export function loginReturnUrl(value: string | null): string | undefined {
  if (value === "/invitacion") return value;
  const path = "/connect/authorize";
  if (!value?.startsWith(path)) return undefined;
  const rest = value.slice(path.length);
  if (rest !== "" && !rest.startsWith("?")) return undefined;
  return /\p{Cc}/u.test(value) ? undefined : value;
}
