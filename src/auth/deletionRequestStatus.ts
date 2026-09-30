import { useSyncExternalStore } from "react";

let requestedDate: string | null = null;
const listeners = new Set<() => void>();
export function showDeletionRequested(date: string) { requestedDate = date; for (const listener of listeners) listener(); }
export function clearDeletionRequested() { requestedDate = null; for (const listener of listeners) listener(); }
export function useDeletionRequestedDate() {
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => requestedDate);
}
