import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { ApiError } from "./ApiError";

// El callback usa la clave con httpClient, por ejemplo:
// (body, key) => api.post(path, body, { headers: { "Idempotency-Key": key } }).
// La clave pertenece al formulario montado: una falla o un reintento conserva la misma.
export function useIdempotentMutation<TData, TVariables>(
  fn: (variables: TVariables, idempotencyKey: string) => Promise<TData>,
) {
  const keyRef = useRef<string | null>(null);
  keyRef.current ??= globalThis.crypto.randomUUID();

  return useMutation<TData, ApiError, TVariables>({
    retry: false,
    mutationFn: async (variables) => {
      // Capturamos la clave por envío: otro pedido que termine mientras esperamos no la cambia.
      const key = keyRef.current!;
      for (;;) {
        try {
          return await fn(variables, key);
        } catch (error) {
          if (!(error instanceof ApiError) || error.code !== "Request.InProgress") throw error;
          const seconds = Math.max(1, error.retryAfterSeconds ?? 1);
          await new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000));
        }
      }
    },
    onSuccess: () => {
      keyRef.current = globalThis.crypto.randomUUID();
    },
  });
}
