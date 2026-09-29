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

// El código verifica únicamente el pedido OIDC que emitió el servidor. Una ruta de la app
// (`/org`, por ejemplo) se conserva como state de signinRedirect y no se manda a verify.
export function authorizeReturnUrl(value: string | null): string | undefined {
  const path = "/connect/authorize";
  if (!value?.startsWith(path)) return undefined;
  const rest = value.slice(path.length);
  if (rest !== "" && !rest.startsWith("?")) return undefined;
  return /\p{Cc}/u.test(value) ? undefined : value;
}
