import { useSyncExternalStore } from "react";

let isSigningOut = false;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function beginSignOut(): void {
  isSigningOut = true;
  notify();
}

/// Si esta pestaña ya está saliendo: el aviso de otra no la vuelve a cerrar.
export function isSignOutInProgress(): boolean {
  return isSigningOut;
}

export function cancelSignOut(): void {
  isSigningOut = false;
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useIsSigningOut(): boolean {
  return useSyncExternalStore(subscribe, () => isSigningOut);
}
