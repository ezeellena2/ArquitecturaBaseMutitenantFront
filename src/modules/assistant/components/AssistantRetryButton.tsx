import { useTranslation } from "react-i18next";
import { useCountdown } from "@/shared/hooks/useCountdown";
import { useFormat } from "@/shared/format/useFormat";
import { Button } from "@/shared/ui/button";

export function AssistantRetryButton({ retryAfter, pending, onRetry }: { retryAfter?: number | null; pending: boolean; onRetry: () => void }) {
  const { t } = useTranslation("assistant");
  const { formatDuration } = useFormat();
  const { seconds, isRunning } = useCountdown(Math.max(0, retryAfter ?? 0));
  return <Button variant="link" disabled={pending || isRunning} onClick={onRetry}>
    {isRunning ? t("errors:retryIn", { time: formatDuration(seconds) }) : t("retry")}
  </Button>;
}
