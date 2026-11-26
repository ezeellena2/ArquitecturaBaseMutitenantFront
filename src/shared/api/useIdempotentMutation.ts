import { useMutation, type MutationMeta } from "@tanstack/react-query";
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

const isInProgress = (error: unknown): error is ApiError => error instanceof ApiError && error.code === "Request.InProgress";

/**
 * Repite el envío con la misma clave mientras el servidor responda `Request.InProgress` (otro envío con esa clave
 * todavía no terminó), con su Retry-After y hasta treinta veces. Lo usan esta mutación y la clave de una propuesta del
 * asistente, que dos pestañas comparten.
 */
export async function retryWhileInProgress<T>(send: () => Promise<T>, signal: AbortSignal): Promise<T> {
  let retries = 0;
  for (;;) {
    signal.throwIfAborted();
    try {
      const result = await send();
      signal.throwIfAborted();
      return result;
    } catch (error) {
      if (!isInProgress(error) || retries >= maxInProgressRetries) throw error;
      retries++;
      await waitForRetry(Math.max(1, error.retryAfterSeconds ?? 1), signal);
    }
  }
}

// El callback usa la clave con httpClient, por ejemplo:
// (body, key) => api.post(path, body, { headers: { "Idempotency-Key": key } }).
// La clave pertenece al formulario montado: red y 5xx la conservan; 4xx definitivos la renuevan.
// `sameOperation` permite distinguir envíos con datos corregidos o un recorrido nuevo mediante variables completas.
// `meta` va al manejo global de errores; por ejemplo, `{ handlesError: true }` si la pantalla muestra también red,
// 5xx y 429 en su lugar.
export function useIdempotentMutation<TData, TVariables>(
  fn: (variables: TVariables, idempotencyKey: string) => Promise<TData>,
  options?: { meta?: MutationMeta; sameOperation?: (previous: TVariables, next: TVariables) => boolean },
) {
  const keyRef = useRef<string | null>(null);
  const operationRef = useRef<{ variables: TVariables } | null>(null);
  const lifetimeRef = useRef<AbortController | null>(null);
  keyRef.current ??= globalThis.crypto.randomUUID();

  useEffect(() => {
    const lifetime = new AbortController();
    lifetimeRef.current = lifetime;
    return () => lifetime.abort();
  }, []);

  return useMutation<TData, ApiError, TVariables>({
    retry: false,
    meta: options?.meta,
    mutationFn: async (variables) => {
      if (options?.sameOperation) {
        if (operationRef.current && !options.sameOperation(operationRef.current.variables, variables)) {
          keyRef.current = globalThis.crypto.randomUUID();
        }
        operationRef.current = { variables };
      }
      // Capturamos la clave por envío: otro pedido que termine mientras esperamos no la cambia.
      const key = keyRef.current!;
      const signal = lifetimeRef.current?.signal;
      if (!signal) throw new DOMException("", "AbortError");
      try {
        const result = await retryWhileInProgress(() => fn(variables, key), signal);
        if (keyRef.current === key) {
          keyRef.current = globalThis.crypto.randomUUID();
          operationRef.current = null;
        }
        return result;
      } catch (error) {
        // Un Request.InProgress que agotó los reintentos no es un 4xx definitivo: la clave sigue.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500 && !isInProgress(error)
          && keyRef.current === key && !signal.aborted) {
          keyRef.current = globalThis.crypto.randomUUID();
          operationRef.current = null;
        }
        throw error;
      }
    },
  });
}
