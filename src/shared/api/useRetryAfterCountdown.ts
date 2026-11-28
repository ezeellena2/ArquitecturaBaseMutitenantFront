import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useCountdown } from "@/shared/hooks/useCountdown";
import { ApiError } from "./ApiError";
import { formatWait } from "@/shared/format/countdown";

/// El formulario le pasa el 429 del botón iniciador. El hook solo cuenta: nunca reenvía el pedido. La espera va en m:ss
/// y, desde una hora (un tope diario, 0063), en horas y minutos.
export function useRetryAfterCountdown() {
  const { t } = useTranslation(["errors", "format"]);
  const { seconds, isRunning, restart } = useCountdown(0);

  function startFromError(error: unknown): void {
    if (error instanceof ApiError && error.status === 429 && error.retryAfterSeconds !== undefined) {
      restart(Math.max(0, Math.ceil(error.retryAfterSeconds)));
    }
  }

  /// Corta la cuenta cuando cambió lo que se iba a mandar: la espera era de ese pedido, no del siguiente.
  function reset(): void {
    restart(0);
  }

  const time = formatWait(seconds, t);

  return {
    seconds,
    isRunning,
    label: isRunning ? t("retryIn", { time }) : null,
    startFromError,
    reset,
  };
}

/// La cuenta de un 429 que ya está en pantalla (una lista que no cargó, el aviso de una acción): arranca con cada error
/// nuevo. Solo cuenta: «Reintentar» se toca a mano cuando termina.
export function useRetryAfterOf(error: unknown) {
  const countdown = useRetryAfterCountdown();
  const { startFromError } = countdown;
  const seen = useRef<unknown>(null);
  useEffect(() => {
    if (!error || error === seen.current) return;
    seen.current = error;
    startFromError(error);
  }, [error, startFromError]);
  return countdown;
}
