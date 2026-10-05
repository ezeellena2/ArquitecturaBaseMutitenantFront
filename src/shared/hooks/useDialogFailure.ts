import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ApiError } from "@/shared/api/ApiError";

/** El error pertenece al diálogo. Al cerrarlo, una concurrencia o un 409 de estado declarado por el caller relee
 * su raíz de consultas; corregir un campo borra la franja, pero conserva esa necesidad de relectura. */
export function useDialogFailure(onClose: () => void, queryRoot: QueryKey, stateConflictCodes: readonly string[] = []) {
  const queryClient = useQueryClient();
  const [failure, setFailure] = useState<unknown>();
  const stale = useRef(false);

  return {
    failure,
    clear: () => setFailure(undefined),
    fail: (error: unknown) => {
      if (error instanceof ApiError && (error.code === "General.ConcurrencyConflict"
        || (error.status === 409 && stateConflictCodes.includes(error.code ?? "")))) stale.current = true;
      setFailure(error);
    },
    close: () => {
      if (stale.current) void queryClient.invalidateQueries({ queryKey: queryRoot });
      onClose();
    },
  };
}
