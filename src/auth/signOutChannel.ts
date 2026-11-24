/// Salir cierra también las demás pestañas de ese lado del mismo navegador (N12, ADR 0044): la pública (persona y
/// empresa) o la de Plataforma, nunca las dos. Cada pestaña tiene su propia sesión en memoria, así que el cierre de una
/// no saca a las otras: la que sale avisa por un BroadcastChannel y las que escuchan cierran la suya
/// (`useSignOutFromOtherTabs`).
///
/// El canal no guarda nada: una pestaña que entra después no recibe un cierre viejo. Sin BroadcastChannel (un navegador
/// viejo) no se avisa ni se escucha, y cada pestaña sigue con su sesión hasta que venza. El canal es del origen: no
/// llega a la página pública de otra organización, que está en su subdominio.

/// El lado que cierra: la sesión pública (persona y empresa comparten la cookie) o la de Plataforma.
export type SignOutSide = "public" | "platform";

const channelName = "arquitecturabasemt.sign-out";
const signedOut = "signed-out";

/// El lado de un acceso, o del de la sesión en memoria (`profile.access`).
export function sideOfAccess(access: unknown): SignOutSide {
  return access === "platform" ? "platform" : "public";
}

function sideOfMessage(data: unknown): SignOutSide | null {
  if (typeof data !== "object" || data === null) return null;
  const { type, side } = data as { type?: unknown; side?: unknown };
  return type === signedOut && (side === "public" || side === "platform") ? side : null;
}

/// El canal que escucha esta pestaña. El aviso sale por este mismo, porque un BroadcastChannel no se entrega a sí mismo:
/// la pestaña que sale no se escucha.
let listening: BroadcastChannel | undefined;

/// Escucha el aviso hasta que se llama a lo que devuelve, que cierra el canal.
export function listenForSignOutElsewhere(onSignOut: (side: SignOutSide) => void): () => void {
  if (typeof BroadcastChannel === "undefined") return () => undefined;

  const channel = new BroadcastChannel(channelName);
  channel.onmessage = (event: MessageEvent) => {
    const side = sideOfMessage(event.data);
    if (side) onSignOut(side);
  };
  listening = channel;

  return () => {
    channel.close();
    if (listening === channel) listening = undefined;
  };
}

/// Avisa a las demás pestañas. Lo llama solo «Salir», justo antes de ir a cerrar la sesión al servidor de ingreso; la
/// pestaña que recibe el aviso no lo repite.
export function announceSignOut(side: SignOutSide): void {
  try {
    listening?.postMessage({ type: signedOut, side });
  } catch {
    // Un canal que se cerró en el medio no impide salir.
  }
}
