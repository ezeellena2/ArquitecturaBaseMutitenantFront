import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import type { AssistantMessageResponse } from "@/shared/api/types";
import { Copy, ThumbsDown, ThumbsUp } from "lucide-react";

export function AssistantMessageActions({ message, text, pending, onCopy, onFeedback }: {
  message?: AssistantMessageResponse; text: string; pending: boolean;
  onCopy: (text: string) => void; onFeedback: (message: AssistantMessageResponse, rating: "up" | "down" | null) => void;
}) {
  const { t } = useTranslation("assistant");
  return <div className="flex gap-1">
    <Button variant="icon" size="icon" disabled={pending} aria-label={t("message.copy")} onClick={() => onCopy(text)}><Copy className="size-4" /></Button>
    {message ? <>{(["up", "down"] as const).map((rating) => <Button key={rating} variant="icon" size="icon" disabled={pending} aria-label={t(`message.${rating}`)}
      aria-pressed={message.rating === rating} onClick={() => onFeedback(message, message.rating === rating ? null : rating)}>{rating === "up" ? <ThumbsUp className="size-4" /> : <ThumbsDown className="size-4" />}</Button>)}</> : null}
  </div>;
}
