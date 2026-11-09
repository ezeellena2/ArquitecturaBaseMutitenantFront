import { createContext, useContext } from "react";

/**
 * La versión nueva que anuncia el front, cuando Vite no pudo cargar una pantalla (`vite:preloadError`). La detecta
 * `AppShell`; la campana la pone primera y sin leer, y abrirla recarga la página. Sin franja (decisión del 2026-10-25).
 */
export interface NewVersion {
  /** Cuándo se detectó, en UTC: la fecha del aviso. */
  detectedAtUtc: string;
  reload: () => void;
}

const NewVersionContext = createContext<NewVersion | null>(null);

export const NewVersionProvider = NewVersionContext.Provider;

export function useNewVersion(): NewVersion | null {
  return useContext(NewVersionContext);
}
