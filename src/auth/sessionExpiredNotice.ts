const storageKey = "arquitecturabasemt.sessionExpired";

export function rememberExpiredSessionNotice(): void {
  try { globalThis.sessionStorage.setItem(storageKey, "1"); } catch { /* Sin almacenamiento disponible. */ }
}

export function takeExpiredSessionNotice(): boolean {
  try {
    const stored = globalThis.sessionStorage.getItem(storageKey) === "1";
    globalThis.sessionStorage.removeItem(storageKey);
    return stored;
  } catch {
    return false;
  }
}
