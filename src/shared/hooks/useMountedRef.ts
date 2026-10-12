import { useEffect, useRef } from "react";

/** Vida del dueño de una operación, también al preparar y limpiar efectos en StrictMode. */
export function useMountedRef() {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  return mounted;
}
