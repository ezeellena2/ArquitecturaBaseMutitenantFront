import { useEffect, useSyncExternalStore } from "react";

// «Confirmá que sos vos» (E9, P1): una escritura sensible de Plataforma sin una confirmación de los últimos 10 minutos
// responde 403 Auth.Platform.ReauthenticationRequired antes de registrar la clave de idempotencia. El cliente HTTP espera
// acá a que el operador confirme y repite el mismo pedido una vez: mismo cuerpo, misma versión y misma clave. Cancelar,
// navegar o salir de Plataforma lo rechaza con `ReauthenticationCancelled` y el formulario queda como estaba.

export const reauthenticationRequiredCode = "Auth.Platform.ReauthenticationRequired";

/** Se canceló la confirmación: no es un error que se muestre; el formulario conserva lo cargado. */
export class ReauthenticationCancelled extends Error {
  constructor() {
    super("Se canceló la confirmación.");
    this.name = "ReauthenticationCancelled";
  }
}
export const isReauthenticationCancelled = (error: unknown): error is ReauthenticationCancelled => error instanceof ReauthenticationCancelled;

export interface PendingRecentAuthentication {
  /** «Para guardar los permisos de Laura Díaz»: lo que declaró la acción que se está confirmando; sin ella, el genérico. */
  purpose: string | null;
}

interface Entry extends PendingRecentAuthentication { promise: Promise<void>; settle: (confirmed: boolean) => void }

let hosts = 0;
let pending: Entry | null = null;
let sequence = 0;
const purposes: { id: number; text: string }[] = [];
const listeners = new Set<() => void>();
const notify = () => { for (const listener of listeners) listener(); };

/** El diálogo de Plataforma se anota mientras está montado. Sin nadie que confirme, el 403 sigue como error. */
export function registerRecentAuthenticationHost(): () => void {
  hosts++;
  return () => {
    hosts--;
    if (hosts === 0) settleRecentAuthentication(false);
  };
}

/**
 * Pide la confirmación, o se suma a la que ya está abierta: dos pedidos a la vez abren un solo diálogo. `null` si no hay
 * quien la muestre. Con `signal`, abortar deja de esperar sin cancelar la de los demás.
 */
export function requestRecentAuthentication(signal?: AbortSignal | null): Promise<void> | null {
  if (hosts === 0) return null;
  signal?.throwIfAborted();
  if (!pending) {
    let settle: (confirmed: boolean) => void = () => {};
    const promise = new Promise<void>((resolve, reject) => { settle = (confirmed) => confirmed ? resolve() : reject(new ReauthenticationCancelled()); });
    // Nadie espera la base si todos los pedidos abortaron: su rechazo no queda suelto.
    promise.catch(() => {});
    pending = { purpose: purposes.at(-1)?.text ?? null, promise, settle };
    notify();
  }
  const current = pending.promise;
  if (!signal) return current;
  return new Promise<void>((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    current.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

/** Confirmó (repite los pedidos que esperaban) o canceló (los rechaza). */
export function settleRecentAuthentication(confirmed: boolean): void {
  const current = pending;
  if (!current) return;
  pending = null;
  notify();
  current.settle(confirmed);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
const snapshot = (): PendingRecentAuthentication | null => pending;

export function useRecentAuthentication(): PendingRecentAuthentication | null {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/**
 * Lo que una pantalla muestra «en curso»: mientras su escritura espera «Confirmá que sos vos», nada. La escritura sigue
 * pendiente, pero «Publicar» o «Guardar cambios» y el formulario de atrás se ven como antes de tocarlos (tableros Legales
 * y Config-Plat).
 */
export function useVisiblePending(pending: boolean): boolean {
  const confirming = useRecentAuthentication() !== null;
  return pending && !confirming;
}

/** El formulario de una acción sensible dice para qué es la confirmación mientras está montado («Para guardar …»). */
export function useRecentAuthenticationPurpose(text: string): void {
  useEffect(() => {
    const entry = { id: ++sequence, text };
    purposes.push(entry);
    return () => {
      const index = purposes.findIndex((item) => item.id === entry.id);
      if (index >= 0) purposes.splice(index, 1);
    };
  }, [text]);
}
