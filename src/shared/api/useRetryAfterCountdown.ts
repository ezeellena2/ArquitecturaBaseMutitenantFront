import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useCountdown } from "@/shared/hooks/useCountdown";
import { ApiError } from "./ApiError";
import { formatCountdown } from "@/shared/format/countdown";

/// El formulario le pasa el 429 del botón iniciador. El hook solo cuenta: nunca reenvía el pedido.
export function useRetryAfterCountdown() {
  const { t } = useTranslation("errors");
  const { seconds, isRunning, restart } = useCountdown(0);

  function startFromError(error: unknown): void {
    if (error instanceof ApiError && error.status === 429 && error.retryAfterSeconds !== undefined) {
      restart(Math.max(0, Math.ceil(error.retryAfterSeconds)));
    }
  }

  const time = formatCountdown(seconds);

  return {
    seconds,
    isRunning,
    label: isRunning ? t("retryIn", { time }) : null,
    startFromError,
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
