import { accessOfPath, parseAccess, type Access } from "@/tenancy/access";

const key = "arquitecturabasemt.last-access";
export function rememberRecoveryAccess(value: unknown) {
  const access = parseAccess(value);
  if (!access) return;
  try { globalThis.sessionStorage?.setItem(key, access); } catch { /* La ruta explícita sigue funcionando. */ }
}
/** Preferencia para pedir una sesión nueva. La autorización sigue en los claims emitidos por el backend. */
export function recoveryAccess(path: string): Access {
  const fromPath = accessOfPath(path);
  if (fromPath) return fromPath;
  // La cuenta y los términos valen en cualquier acceso: se pide el que tenía la sesión.
  try { const previous = parseAccess(globalThis.sessionStorage?.getItem(key)); if (previous) return previous; } catch { /* Sin almacenamiento, puerta personal. */ }
  return "consumer";
}
