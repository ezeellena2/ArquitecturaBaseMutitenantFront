// El backend vuelve a /login sin returnUrl al fallar Google; OIDC vuelve luego con uno.
// Solo cruzamos el código de error entre ambos redirects, nunca datos de identidad ni tokens.
const storageKey = "arquitecturabasemt.login-google-error";

export function carryLoginRedirectError(code: string): void {
  try { globalThis.sessionStorage.setItem(storageKey, code); } catch { /* Almacenamiento bloqueado. */ }
}

export function carriedLoginRedirectError(): string | undefined {
  try { return globalThis.sessionStorage.getItem(storageKey) ?? undefined; } catch { return undefined; }
}

export function forgetLoginRedirectError(): void {
  try { globalThis.sessionStorage.removeItem(storageKey); } catch { /* Sin marca para quitar. */ }
}
