const accessKinds = new Set(["consumer", "business", "platform"]);
const oauthErrors = new Set(["access_denied", "login_required", "interaction_required", "invalid_request", "invalid_grant", "server_error", "temporarily_unavailable"]);

/** Sólo estado, acceso y código de dominio; nunca copia nombres, parámetros OIDC ni el enlace completo. */
export function safeAuthenticationEvent(response, base) {
  const url = new URL(response.url());
  if (url.origin !== base.origin || !["/connect/authorize", "/connect/token"].includes(url.pathname)) return null;
  const event = { route: url.pathname, status: response.status() };
  const access = url.searchParams.get("access");
  if (accessKinds.has(access)) event.access = access;
  if (url.pathname === "/connect/token") return event;
  const location = response.headers().location;
  if (!location) return event;
  let destination;
  try { destination = new URL(location, base); } catch { return event; }
  if (destination.origin !== base.origin || destination.pathname !== "/auth/callback") return event;
  const error = destination.searchParams.get("error");
  if (oauthErrors.has(error)) event.error = error;
  const code = destination.searchParams.get("error_description")?.split("|")[0];
  if (code && /^(?:Tenancy|Identity|Auth|Legal)\.[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)+$/u.test(code) && code.length <= 120) event.domainCode = code;
  return event;
}
