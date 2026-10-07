import { z } from "zod";

const storageKey = "arquitecturabasemt.login-email";

export function emailFromNavigation(state: unknown): string {
  const value = typeof state === "object" && state !== null && "email" in state ? state.email : undefined;
  const parsed = z.email().safeParse(value);
  return parsed.success ? parsed.data : "";
}

// Como loginRedirectError: un dato temporal de esta pestaña cruza la navegación OIDC sin ir a la URL.
export function carryLoginEmail(email: string): void {
  try { globalThis.sessionStorage.setItem(storageKey, email); } catch { /* Almacenamiento bloqueado. */ }
}

export function carriedLoginEmail(): string {
  try {
    const email = globalThis.sessionStorage.getItem(storageKey);
    return emailFromNavigation({ email });
  } catch { return ""; }
}

export function forgetLoginEmail(): void {
  try { globalThis.sessionStorage.removeItem(storageKey); } catch { /* Sin dato temporal para quitar. */ }
}
