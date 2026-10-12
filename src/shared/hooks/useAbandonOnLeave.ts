import { useCallback, useRef } from "react";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";

/** Se conecta al único useBlocker de useEditPage: retira el recorrido antes de decidir la salida. */
export function useAbandonOnLeave(isDirty: boolean, searchKeys?: readonly string[], abandon?: () => void) {
  const leaving = useRef(false);
  const onNavigationAttempt = useCallback(() => {
    leaving.current = true;
    abandon?.();
  }, [abandon]);
  const guard = useUnsavedChangesGuard(isDirty, searchKeys, onNavigationAttempt);
  return {
    ...guard,
    canAct: () => !leaving.current,
    stay: () => { leaving.current = false; guard.stay(); },
    allowNextNavigation: () => { leaving.current = false; guard.allowNextNavigation(); },
  };
}
