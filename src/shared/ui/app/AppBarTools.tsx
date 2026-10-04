import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

// En el teléfono, lo que pertenece a la pantalla pero va en la barra de arriba (la lupa y el filtro de una lista,
// tablero M-Usuarios) se monta acá: `Page` deja el lugar y la pieza lo llena desde donde vive.
const AppBarToolsContext = createContext<HTMLElement | null>(null);

export const AppBarToolsProvider = AppBarToolsContext.Provider;

export function AppBarTools({ children }: { children: ReactNode }) {
  const target = useContext(AppBarToolsContext);
  return target ? createPortal(children, target) : null;
}
