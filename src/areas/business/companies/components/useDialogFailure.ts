import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ApiError } from "@/shared/api/ApiError";
import { companiesQueryRoot } from "../api/companies";

/// El error de un diálogo de Empresas, que se va con el diálogo. Un 409 de concurrencia deja la ficha y la lista viejas:
/// al cerrar el diálogo (Cancelar, ✕ o Escape), `close` las vuelve a leer; no tienen cambios sin guardar propios.
export function useDialogFailure(onClose: () => void) {
  const queryClient = useQueryClient();
  const [failure, setFailure] = useState<unknown>();
  const stale = useRef(false);

  return {
    failure,
    clear: () => setFailure(undefined),
    fail: (error: unknown) => {
      if (error instanceof ApiError && error.code === "General.ConcurrencyConflict") stale.current = true;
      setFailure(error);
    },
    close: () => {
      if (stale.current) void queryClient.invalidateQueries({ queryKey: companiesQueryRoot });
      onClose();
    },
  };
}
