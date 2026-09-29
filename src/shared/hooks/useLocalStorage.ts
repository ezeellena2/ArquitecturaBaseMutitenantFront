import { useCallback, useState } from "react";
import { safeStorageGet, safeStorageSet } from "./safeStorage";

const storageKeyPrefix = "arquitecturabasemt.";

/// Estado persistido en localStorage, bajo la clave `arquitecturabasemt.<key>`. Lee una sola vez, en la
/// inicialización perezosa de useState, y escribe en cada cambio. Todo el acceso a localStorage va en
/// try/catch: puede fallar (por ejemplo, en modo privado), y en ese caso seguimos solo con el estado en memoria.
export function useLocalStorage<T>(key: string, initialValue: T) {
  const storageKey = `${storageKeyPrefix}${key}`;

  const [value, setValue] = useState<T>(() => {
    try {
      const stored = safeStorageGet(storageKey);

      return stored === null ? initialValue : (JSON.parse(stored) as T);
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = useCallback(
    (next: T | ((previous: T) => T)) => {
      setValue((previous) => {
        const resolved = typeof next === "function" ? (next as (previous: T) => T)(previous) : next;

        try {
          safeStorageSet(storageKey, JSON.stringify(resolved));
        } catch {
          // Modo privado u otra restricción: el valor sigue viviendo en el estado del componente.
        }

        return resolved;
      });
    },
    [storageKey],
  );

  return [value, setStoredValue] as const;
}
