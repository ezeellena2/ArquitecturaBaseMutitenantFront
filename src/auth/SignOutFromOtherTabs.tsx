import { useSignOutFromOtherTabs } from "./useSignOut";

/// Escucha, en toda la app y en cualquier pantalla, que otra pestaña del mismo navegador salió de su mismo lado (N12),
/// y cierra esta. Va en los providers (`app/providers.tsx`), adentro de la sesión y de la caché, y no dibuja nada.
export function SignOutFromOtherTabs() {
  useSignOutFromOtherTabs();
  return null;
}
