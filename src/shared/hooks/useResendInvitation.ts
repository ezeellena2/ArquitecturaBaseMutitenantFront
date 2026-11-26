import { useState } from "react";
import type { InvitationDeliveryStatus } from "@/shared/api/types";

/// «Reenviar invitación» (0066 §4): va directo a la red, salvo que la anterior haya quedado «Sin confirmar». Entonces pide
/// revisar con la persona antes, en una confirmación (`ResendInvitationDialog`) que espera la respuesta y se cierra con ella
/// («Criterio · Diálogos»). `send` reenvía y llama a `settled` cuando llega la respuesta, sea cual sea.
export function useResendInvitation(delivery: InvitationDeliveryStatus | null | undefined, send: (settled?: () => void) => void) {
  const [confirming, setConfirming] = useState<{ trigger: HTMLElement | null } | null>(null);
  const close = () => setConfirming(null);
  return {
    /** Lo que hace «Reenviar invitación»; `trigger` es adónde vuelve el foco si se cancela (el ⋮ que la abrió). */
    start: (trigger: HTMLElement | null = null) => { if (delivery === "Uncertain") setConfirming({ trigger }); else send(); },
    confirming,
    confirm: () => send(close),
    close,
  };
}

export type ResendInvitation = ReturnType<typeof useResendInvitation>;

/// Con quién revisar antes de reenviar (`person` de `ResendInvitationDialog`): el nombre de la persona, solo si es un nombre.
/// La invitación de alguien sin nombre trae en `displayName` su correo o su teléfono, y entonces el diálogo dice «la persona»
/// (tableros `-Base2`): un nombre tiene letras y no tiene arroba.
export function invitationPerson(displayName: string | null | undefined): string | null {
  const name = displayName?.trim() ?? "";
  return /\p{L}/u.test(name) && !name.includes("@") ? name : null;
}
