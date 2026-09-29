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
