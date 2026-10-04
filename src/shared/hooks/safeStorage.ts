// Lo que el navegador no deja guardar (modo privado, almacenamiento bloqueado) vive en memoria durante esta sesión. Solo
// se lee cuando el navegador tampoco deja leer: si vuelve a andar, manda lo que tiene guardado.
const unsaved = new Map<string, string>();

/** El navegador puede negar el almacenamiento local incluso durante el arranque. */
export function safeStorageGet(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return unsaved.get(key) ?? null;
  }
}

export function safeStorageSet(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    unsaved.set(key, value);
  }
}
