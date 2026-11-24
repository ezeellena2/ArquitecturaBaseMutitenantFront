import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useEffectEvent, useRef } from "react";
import { useAuth } from "react-oidc-context";
import { announceSignOut, listenForSignOutElsewhere, sideOfAccess, type SignOutSide } from "./signOutChannel";
import { beginSignOut, cancelSignOut, isSignOutInProgress } from "./signOutStatus";
import type { Access } from "@/tenancy/access";

type SignoutRedirectArgs = Parameters<ReturnType<typeof useAuth>["signoutRedirect"]>[0];

/// Salir, igual desde cualquier lado (el menú, «Más», la organización no disponible, los términos, la invitación):
/// «Cerrando sesión…» a pantalla completa, la caché limpia para que nada de esta sesión quede para la siguiente, y el
/// cierre en el servidor de ingreso. Antes de irse avisa a las demás pestañas de su lado (N12), que cierran la suya. Si
/// el navegador no se fue, la pantalla vuelve. Devuelve `false` si no se pudo.
export function useSignOut(access?: Access) {
  const auth = useAuth();
  const queryClient = useQueryClient();

  return useCallback(async (args?: SignoutRedirectArgs): Promise<boolean> => {
    // El lado que cierra el servidor: el de la puerta que pidió salir o, sin puerta, el de la sesión en memoria.
    const side = sideOfAccess(access ?? auth.user?.profile.access);
    beginSignOut();
    queryClient.clear();
    try {
      // OIDC toma el ID token del user en memoria aun si se pasa un hint vacío. La puerta pública nunca debe
      // cerrar Platform: descarta sólo ese user de esta pestaña para que logout elija la cookie pública sin hint.
      if (access && access !== "platform" && auth.user?.profile.access === "platform") await auth.removeUser();
      // La pestaña se va al servidor de ingreso y no vuelve a esta página: el aviso sale antes.
      announceSignOut(side);
      const result: unknown = await auth.signoutRedirect(args);
      if (result === null) cancelSignOut();
      return true;
    } catch {
      cancelSignOut();
      return false;
    }
  }, [access, auth, queryClient]);
}

/// Cierra esta pestaña cuando otra del mismo navegador salió de su mismo lado (N12): la pública o la de Plataforma,
/// nunca las dos. La monta `SignOutFromOtherTabs`, en los providers de la app, y el canal se cierra al desmontar.
///
/// No va al servidor de ingreso: la otra pestaña ya cierra la sesión de ese lado del navegador, con las autorizaciones
/// de todas sus pestañas, y la pista de esta (su `id_token`) deja de valer, así que el servidor cerraría la cookie
/// pública en su lugar. Muestra «Cerrando sesión…», limpia la caché y va al inicio, adonde lleva Salir; la página nueva
/// no trae los tokens, que viven en memoria. No vuelve a avisar.
///
/// Sin sesión en memoria no hay nada que cerrar, salvo la que traiga una recuperación silenciosa en curso: esa se cierra
/// apenas llega, si es del mismo lado. Si esta pestaña ya estaba saliendo, sigue la suya.
export function useSignOutFromOtherTabs(leave: () => void = () => globalThis.location.assign("/")): void {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const recovering = !auth.user && (auth.isLoading || auth.activeNavigator === "signinSilent");
  const pending = useRef<SignOutSide | null>(null);

  const close = useEffectEvent((side: SignOutSide) => {
    pending.current = null;
    if (isSignOutInProgress()) return;
    if (!auth.user) {
      if (recovering) pending.current = side;
      return;
    }
    if (sideOfAccess(auth.user.profile.access) !== side) return;
    beginSignOut();
    void queryClient.cancelQueries();
    queryClient.clear();
    leave();
  });

  useEffect(() => listenForSignOutElsewhere((side) => close(side)), []);

  useEffect(() => {
    if (pending.current && !recovering) close(pending.current);
  }, [recovering]);
}
