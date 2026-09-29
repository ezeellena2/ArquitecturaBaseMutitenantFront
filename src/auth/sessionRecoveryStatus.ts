import { createContext, useContext } from "react";

export const SessionRecoveryContext = createContext(false);

export function useIsRecoveringSession(): boolean {
  return useContext(SessionRecoveryContext);
}
