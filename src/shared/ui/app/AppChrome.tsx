import { createContext, useContext } from "react";

/// Lo que el marco le cuenta a la pantalla en el teléfono: si es un teléfono, a dónde vuelve ‹ cuando la pantalla
/// no es una ficha (Usuarios vuelve a «Más») y qué dice debajo del título («Administración», «Grupo Delta»). La
/// pantalla con una acción fija abajo esconde la barra de abajo (tablero «Criterio · Marco»).
export interface AppChrome {
  phone: boolean;
  parent: { to: string; label: string } | null;
  subtitle: string | null;
  /** El nombre de la pantalla de Administración en la que está («Auditoría»): lo usa el aviso de error (M-Error-Org). */
  title?: string | null;
  hideBottomNav: (hidden: boolean) => void;
  /** Una pantalla que no es de ninguna sección (el 403 o el 404, M-Error-Org) apaga la marca de la barra de abajo. */
  hideActiveSection?: (hidden: boolean) => void;
}

const AppChromeContext = createContext<AppChrome>({ phone: false, parent: null, subtitle: null, hideBottomNav: () => {} });

export const AppChromeProvider = AppChromeContext.Provider;

export function useAppChrome(): AppChrome {
  return useContext(AppChromeContext);
}
