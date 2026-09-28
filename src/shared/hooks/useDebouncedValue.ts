import { useEffect, useState } from "react";

// Las búsquedas cambian la URL y la query solo después de 300 ms sin escribir.
export function useDebouncedValue<T>(value: T): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  return debounced;
}
