import { createContext, useContext, useEffect, type ReactNode } from "react";

/// Lo que sigue pasando en toda la app (sin conexión, versión nueva). En el teléfono va debajo de la barra de la
/// pantalla (tablero M-Avisos): la barra lo reclama al montarse y, mientras lo tenga, el armazón no lo pone arriba.
export interface AppNoticesHost {
  notices: ReactNode;
  /** Reclama los avisos para mostrarlos; devuelve cómo soltarlos. */
  claim: () => () => void;
}

const AppNoticesContext = createContext<AppNoticesHost | null>(null);

export const AppNoticesProvider = AppNoticesContext.Provider;

export function useHostedNotices(): ReactNode {
  const host = useContext(AppNoticesContext);
  const claim = host?.claim;
  useEffect(() => claim?.(), [claim]);
  return host?.notices ?? null;
}
