import type { AccessKind } from "./AccessRoute";

const key = "arquitecturabasemt.last-access";
export function rememberRecoveryAccess(value: unknown) {
  if (value !== "consumer" && value !== "business" && value !== "platform") return;
  try { globalThis.sessionStorage?.setItem(key, value); } catch { /* La ruta explícita sigue funcionando. */ }
}
/** Preferencia para pedir una sesión nueva. La autorización sigue en los claims emitidos por el backend. */
export function recoveryAccess(path: string): AccessKind {
  if (path === "/org" || path.startsWith("/org/")) return "business";
  if (path === "/plataforma" || path.startsWith("/plataforma/")) return "platform";
  if (path === "/cuenta" || path === "/aceptar-terminos") {
    try { const previous = globalThis.sessionStorage?.getItem(key); if (previous === "business" || previous === "platform") return previous; } catch { /* Sin almacenamiento, puerta personal. */ }
  }
  return "consumer";
}
