import { createContext, useContext } from "react";
import { AssistantRuntimeProvider, MessagePrimitive, ThreadPrimitive, useAuiState, type TextMessagePartProps } from "@assistant-ui/react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { AssistantAttachmentSummaryResponse, AssistantMessageResponse, AssistantRouteKey } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { Sparkles } from "lucide-react";
import { AssistantMarkdown } from "./AssistantMarkdown";
import { AssistantMessageActions } from "./AssistantMessageActions";
import { resolveAssistantLink, type AssistantLinkContext } from "../lib/assistantLinks";
import type { useAssistantRuntime } from "../runtime/useAssistantRuntime";
import { ToolStatus } from "./ToolStatus";
import type { AssistantTurnState } from "../runtime/assistantTurnState";

interface MessageContextValue {
  turn: AssistantTurnState | null;
  turnPending: boolean;
  messages: readonly AssistantMessageResponse[];
  links: AssistantLinkContext;
  canOpenLink?: (routeKey: AssistantRouteKey) => boolean;
  pending: boolean;
  onCopy: (text: string) => void;
  onFeedback: (message: AssistantMessageResponse, rating: "up" | "down" | null) => void;
  onDownload: (attachment: AssistantAttachmentSummaryResponse) => void;
}
const MessageContext = createContext<MessageContextValue | null>(null);
function MarkdownPart({ text }: TextMessagePartProps) {
  const id = useAuiState((state) => state.message.id);
  const role = useAuiState((state) => state.message.role);
  const context = useContext(MessageContext)!;
  const writing = role === "assistant" && context.turnPending && context.turn?.phase === "writing" && context.turn.start?.assistantMessageId === id;
  return <div data-cursor-state={writing ? "writing" : undefined} className="[&[data-cursor-state=writing]>div>:last-child]:after:ml-[3px] [&[data-cursor-state=writing]>div>:last-child]:after:inline-block [&[data-cursor-state=writing]>div>:last-child]:after:h-[17px] [&[data-cursor-state=writing]>div>:last-child]:after:w-2 [&[data-cursor-state=writing]>div>:last-child]:after:rounded-[2px] [&[data-cursor-state=writing]>div>:last-child]:after:bg-[var(--marca)] [&[data-cursor-state=writing]>div>:last-child]:after:align-[-3px] [&[data-cursor-state=writing]>div>:last-child]:after:content-[''] [&[data-cursor-state=writing]>div>:last-child]:after:animate-pulse motion-reduce:[&[data-cursor-state=writing]>div>:last-child]:after:animate-none"><AssistantMarkdown text={text} /></div>;
}

function Message() {
  const { t } = useTranslation("assistant");
  const id = useAuiState((state) => state.message.id);
  const role = useAuiState((state) => state.message.role);
  const text = useAuiState((state) => state.message.content.filter((part) => part.type === "text").map((part) => part.text).join("\n"));
  const status = useAuiState((state) => state.message.status);
  const context = useContext(MessageContext)!;
  const durable = context.messages.find((message) => message.id === id);
  return <MessagePrimitive.Root className={`flex gap-3 ${role === "user" ? "ml-auto max-w-[76%] rounded-[16px_16px_4px_16px] bg-[var(--marca-t)] px-3.5 py-2.5" : "w-full"}`}>
    {role === "assistant" ? <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--marca-t)] text-[var(--marca-tx)]"><Sparkles className="size-4" aria-hidden="true" /></span> : null}
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
    {role === "assistant" && context.turn?.start?.assistantMessageId === id ? <ToolStatus turn={context.turn} pending={context.turnPending} /> : null}
    <MessagePrimitive.Parts components={{ Text: MarkdownPart }} />
    {durable?.attachments.map((attachment) => <Button key={attachment.id} variant="outline" onClick={() => context.onDownload(attachment)}>{attachment.fileName}</Button>)}
    {durable?.links.map((link, index) => {
      if (context.canOpenLink && !context.canOpenLink(link.routeKey)) return null;
      const target = resolveAssistantLink(link, context.links);
      return target?.to ? <Link key={index} className="text-[var(--marca-tx)] underline" to={target.to}>{t(target.labelKey)}</Link>
        : target?.organizationId ? <Button key={index} variant="link" onClick={() => context.links.onOpenOrganization?.(target.organizationId!)}>{t(target.labelKey, { name: target.organizationName })}</Button> : null;
    })}
    {status?.type === "incomplete" ? <p role="status" className="text-sm text-[var(--t2)]">{t(status.reason === "cancelled" ? "status.stopped" : "status.failed")}</p> : null}
    {role === "assistant" && status?.type !== "running" ? <AssistantMessageActions message={durable} text={text} pending={context.pending} onCopy={context.onCopy} onFeedback={context.onFeedback} /> : null}
    </div>
  </MessagePrimitive.Root>;
}

export function AssistantThread({ runtime, ...context }: MessageContextValue & {
  runtime: ReturnType<typeof useAssistantRuntime>["runtime"];
}) {
  const { t } = useTranslation("assistant");
  return <AssistantRuntimeProvider runtime={runtime}><MessageContext.Provider value={context}>
    <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col" role="group" aria-label={t("title")}>
      <ThreadPrimitive.Viewport className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto p-5 md:px-8 md:py-6">
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6"><ThreadPrimitive.Messages components={{ Message }} />{context.turnPending && !context.turn?.start ? <ToolStatus turn={null} pending /> : null}</div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  </MessageContext.Provider></AssistantRuntimeProvider>;
}
