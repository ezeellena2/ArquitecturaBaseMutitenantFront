import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

// En el teléfono, lo que pertenece a la pantalla pero va en la barra de arriba (la lupa y el filtro de una lista,
// tablero M-Usuarios) se monta acá: `Page` deja el lugar y la pieza lo llena desde donde vive.
const AppBarToolsContext = createContext<HTMLElement | null>(null);
const AppBarLeadingToolsContext = createContext<HTMLElement | null>(null);

export const AppBarToolsProvider = AppBarToolsContext.Provider;
export const AppBarLeadingToolsProvider = AppBarLeadingToolsContext.Provider;

export function AppBarTools({ children, placement = "trailing" }: { children: ReactNode; placement?: "leading" | "trailing" }) {
  const trailing = useContext(AppBarToolsContext);
  const leading = useContext(AppBarLeadingToolsContext);
  const target = placement === "leading" ? leading : trailing;
  return target ? createPortal(children, target) : null;
}
