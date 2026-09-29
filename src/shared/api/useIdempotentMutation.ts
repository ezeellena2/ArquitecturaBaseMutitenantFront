import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ApiError } from "./ApiError";

const maxInProgressRetries = 30;

function waitForRetry(seconds: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, seconds * 1_000);
    function onAbort() {
      clearTimeout(timer);
      reject(signal.reason);
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

// El callback usa la clave con httpClient, por ejemplo:
// (body, key) => api.post(path, body, { headers: { "Idempotency-Key": key } }).
// La clave pertenece al formulario montado: red y 5xx la conservan; 4xx definitivos la renuevan.
export function useIdempotentMutation<TData, TVariables>(
  fn: (variables: TVariables, idempotencyKey: string) => Promise<TData>,
) {
  const keyRef = useRef<string | null>(null);
  const lifetimeRef = useRef<AbortController | null>(null);
  keyRef.current ??= globalThis.crypto.randomUUID();

  useEffect(() => {
    const lifetime = new AbortController();
    lifetimeRef.current = lifetime;
    return () => lifetime.abort();
  }, []);

  return useMutation<TData, ApiError, TVariables>({
    retry: false,
    mutationFn: async (variables) => {
      // Capturamos la clave por envío: otro pedido que termine mientras esperamos no la cambia.
      const key = keyRef.current!;
      const signal = lifetimeRef.current?.signal;
      if (!signal) throw new DOMException("", "AbortError");
      let inProgressRetries = 0;
      for (;;) {
        signal.throwIfAborted();
        try {
          const result = await fn(variables, key);
          signal.throwIfAborted();
          if (keyRef.current === key) keyRef.current = globalThis.crypto.randomUUID();
          return result;
        } catch (error) {
          if (error instanceof ApiError && error.code === "Request.InProgress") {
            if (inProgressRetries >= maxInProgressRetries) throw error;
            inProgressRetries++;
            await waitForRetry(Math.max(1, error.retryAfterSeconds ?? 1), signal);
            continue;
          }
          if (error instanceof ApiError && error.status >= 400 && error.status < 500
            && keyRef.current === key && !signal.aborted) {
            keyRef.current = globalThis.crypto.randomUUID();
          }
          throw error;
        }
      }
    },
  });
}
