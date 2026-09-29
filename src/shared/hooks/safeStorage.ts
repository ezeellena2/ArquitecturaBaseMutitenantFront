/** El navegador puede negar el almacenamiento local incluso durante el arranque. */
export function safeStorageGet(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function safeStorageSet(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // La preferencia sigue en memoria durante esta sesión.
  }
}
