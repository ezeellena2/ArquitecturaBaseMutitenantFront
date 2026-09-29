import { useSyncExternalStore } from "react";
import type { ApiError } from "./ApiError";

let accessError: ApiError | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function publishAccessError(error: ApiError): void {
  accessError = error;
  notify();
}

export function clearAccessError(): void {
  accessError = null;
  notify();
}

export function getAccessError(): ApiError | null {
  return accessError;
}

export function useAccessError(): ApiError | null {
  return useSyncExternalStore((listener) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, getAccessError);
}
