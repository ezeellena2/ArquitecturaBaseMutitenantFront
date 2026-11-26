import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { assistantProposalParam } from "./registry";

/** Lo que estos hooks necesitan de una propuesta abierta (`useAssistantProposal` con `status: "ready"`): su id. */
interface OpenedProposal {
  readonly proposalId: string;
}

/**
 * Saca `?proposal` de la dirección, sin sumar una entrada al historial: la pantalla vuelve a ser la de siempre y
 * `useAssistantProposal` deja de leer la propuesta. Lo usan descartar, cerrar la confirmación y cerrar el diálogo.
 */
export function useDropAssistantProposal(): () => void {
  const [params, setParams] = useSearchParams();
  const present = params.has(assistantProposalParam);
  return useCallback(() => {
    if (!present) return;
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.delete(assistantProposalParam);
      return next;
    }, { replace: true });
  }, [present, setParams]);
}

/**
 * Lo propuesto entra una vez en lo que se edita, sin guardar: `load` corre una sola vez por propuesta, cuando la pantalla
 * la tiene lista. Desde ahí la persona lo cambia como siempre, y otra lectura de la propuesta no pisa lo que cambió.
 * Devuelve si una propuesta ya entró (para saber, por ejemplo, si la que pasó a aplicada es la que se estaba editando).
 */
export function useLoadAssistantProposalOnce<T extends OpenedProposal>(ready: T | undefined, load: (ready: T) => void): (proposalId: string) => boolean {
  const loaded = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || loaded.current === ready.proposalId) return;
    loaded.current = ready.proposalId;
    load(ready);
  }, [ready, load]);
  return useCallback((proposalId: string) => loaded.current === proposalId, []);
}

/**
 * La confirmación que abre una propuesta (quitar, dar de baja): `open` es la propuesta mientras está lista y hasta que se
 * cierra. `close` la marca cerrada y saca `?proposal`, así no vuelve a abrir mientras cambia la dirección ni con otra
 * lectura de la propuesta.
 */
export function useAssistantProposalConfirmation<T extends OpenedProposal>(ready: T | undefined): {
  readonly open: T | undefined;
  readonly close: (proposalId: string) => void;
} {
  const [closed, setClosed] = useState<string | null>(null);
  const drop = useDropAssistantProposal();
  const close = useCallback((proposalId: string) => {
    setClosed(proposalId);
    drop();
  }, [drop]);
  return { open: ready && ready.proposalId !== closed ? ready : undefined, close };
}
