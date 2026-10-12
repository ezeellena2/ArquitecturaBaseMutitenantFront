import { useTranslation } from "react-i18next";
import { ActionBarPrimitive } from "@assistant-ui/react";
import { Button } from "@/shared/ui/button";
import type { AssistantMessageResponse } from "@/modules/assistant/api/types";
import { Copy, ThumbsDown, ThumbsUp } from "lucide-react";

export function AssistantMessageActions({ message, pending }: {
  message?: AssistantMessageResponse; pending: boolean;
}) {
  const { t } = useTranslation("assistant");
  return <ActionBarPrimitive.Root className="flex gap-1">
    <ActionBarPrimitive.Copy asChild><Button variant="icon" size="icon" disabled={pending} aria-label={t("message.copy")}><Copy className="size-4" /></Button></ActionBarPrimitive.Copy>
    {message ? <>
      <ActionBarPrimitive.FeedbackPositive asChild><Button variant="icon" size="icon" disabled={pending} aria-label={t("message.up")} aria-pressed={message.rating === "up"}><ThumbsUp className="size-4" /></Button></ActionBarPrimitive.FeedbackPositive>
      <ActionBarPrimitive.FeedbackNegative asChild><Button variant="icon" size="icon" disabled={pending} aria-label={t("message.down")} aria-pressed={message.rating === "down"}><ThumbsDown className="size-4" /></Button></ActionBarPrimitive.FeedbackNegative>
    </> : null}
  </ActionBarPrimitive.Root>;
}
