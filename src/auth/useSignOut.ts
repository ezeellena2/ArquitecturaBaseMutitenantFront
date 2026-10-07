import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAuth } from "react-oidc-context";
import { beginSignOut, cancelSignOut } from "./signOutStatus";
import type { Access } from "@/tenancy/access";

type SignoutRedirectArgs = Parameters<ReturnType<typeof useAuth>["signoutRedirect"]>[0];

/// Salir, igual desde cualquier lado (el menú, «Más», la organización no disponible, los términos, la invitación):
/// «Cerrando sesión…» a pantalla completa, la caché limpia para que nada de esta sesión quede para la siguiente, y el
/// cierre en el servidor de ingreso. Si el navegador no se fue, la pantalla vuelve. Devuelve `false` si no se pudo.
export function useSignOut(access?: Access) {
  const auth = useAuth();
  const queryClient = useQueryClient();

  return useCallback(async (args?: SignoutRedirectArgs): Promise<boolean> => {
    beginSignOut();
    queryClient.clear();
    try {
      // OIDC toma el ID token del user en memoria aun si se pasa un hint vacío. La puerta pública nunca debe
      // cerrar Platform: descarta sólo ese user de esta pestaña para que logout elija la cookie pública sin hint.
      if (access && access !== "platform" && auth.user?.profile.access === "platform") await auth.removeUser();
      const result: unknown = await auth.signoutRedirect(args);
      if (result === null) cancelSignOut();
      return true;
    } catch {
      cancelSignOut();
      return false;
    }
  }, [access, auth, queryClient]);
}
