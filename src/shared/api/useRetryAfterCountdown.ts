import { useTranslation } from "react-i18next";
import { useCountdown } from "@/shared/hooks/useCountdown";
import { ApiError } from "./ApiError";

/// El formulario le pasa el 429 del botón iniciador. El hook solo cuenta: nunca reenvía el pedido.
export function useRetryAfterCountdown() {
  const { t } = useTranslation("errors");
  const { seconds, isRunning, restart } = useCountdown(0);

  function startFromError(error: unknown): void {
    if (error instanceof ApiError && error.status === 429 && error.retryAfterSeconds !== undefined) {
      restart(Math.max(0, Math.ceil(error.retryAfterSeconds)));
    }
  }

  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return {
    seconds,
    isRunning,
    label: isRunning ? t("retryIn", { time }) : null,
    startFromError,
  };
}
