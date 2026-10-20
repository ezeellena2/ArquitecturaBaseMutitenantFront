import { AssistantRuntimeProvider, ThreadListItemPrimitive, ThreadListPrimitive, useExternalStoreRuntime, type ThreadMessageLike } from "@assistant-ui/react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AssistantConversationSummaryResponse } from "@/modules/assistant/api/types";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { Button } from "@/shared/ui/button";
import { RowActions, type RowAction } from "@/shared/ui/RowActions";
import { MoreVerticalIcon } from "@/shared/ui/icons";
import { InfoButton } from "@/shared/ui/InfoButton";
import { useFormat } from "@/shared/format/useFormat";
import { useCursorList } from "@/shared/hooks/useCursorList";
import { assistantConversationsQueryKey, fetchAssistantConversations, type AssistantScope } from "../api/assistant";
import type { AssistantLifetime } from "../runtime/assistantLifetime";

export interface ConversationListProps {
  scope: AssistantScope; lifetime: AssistantLifetime; enabled: boolean; selectedId: string | null; retentionDays: number;
  onSelect: (id: string) => void; onNew: () => void; actions: (conversation: AssistantConversationSummaryResponse) => readonly RowAction[];
  onActions?: (conversation: AssistantConversationSummaryResponse) => void;
  onRetentionInfo: () => void;
}
function useConversationGroup(props: ConversationListProps, saved: boolean) {
  return useCursorList([...assistantConversationsQueryKey(props.scope, { saved }), "pages"],
    async (after, signal) => {
      const controller = props.lifetime.controller();
      try {
        const result = await fetchAssistantConversations(props.scope, { saved, cursor: after ?? undefined }, AbortSignal.any([signal, controller.signal]));
        props.lifetime.assertActive();
        signal.throwIfAborted();
        return result;
      } finally { props.lifetime.release(controller); }
    }, { enabled: props.enabled, retainPreviousData: false, meta: { silent: true } });
}
function Group({ saved, query, ...props }: ConversationListProps & { saved: boolean; query: ReturnType<typeof useConversationGroup> }) {
  const { t } = useTranslation("assistant");
  const format = useFormat();
  return <section className="flex flex-col gap-1">
    <h2 className="flex items-center gap-1.5 px-2.5 pt-3.5 pb-1.5 text-[12.5px] font-semibold text-[var(--t3)]">{t(saved ? "history.saved" : "history.recent")}
      {!saved ? <InfoButton label={t("history.retention", { days: format.formatInteger(props.retentionDays) })} onClick={props.onRetentionInfo} /> : null}
    </h2>
    <ThreadListPrimitive.Items>{({ threadListItem }) => {
      const conversation = query.items.find((item) => item.id === threadListItem.id);
      if (!conversation) return null;
      return <ThreadListItemPrimitive.Root className={`flex min-w-0 items-center rounded-lg ${props.selectedId === conversation.id ? "bg-[var(--s2)]" : "hover:bg-[var(--s2)]"}`}>
      <ThreadListItemPrimitive.Trigger asChild><button type="button" aria-current={props.selectedId === conversation.id ? "true" : undefined}
        className="min-w-0 flex-1 truncate px-2.5 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-[var(--foco)]"><ThreadListItemPrimitive.Title /></button></ThreadListItemPrimitive.Trigger>
      {props.onActions ? <button type="button" aria-label={t("history.actions", { title: conversation.title ?? t("history.untitled") })} className="flex size-11 items-center justify-center" onClick={() => props.onActions?.(conversation)}><MoreVerticalIcon className="size-5" /></button>
        : <RowActions label={t("history.actions", { title: conversation.title ?? t("history.untitled") })} title={conversation.title ?? t("history.untitled")} actions={props.actions(conversation)} />}
    </ThreadListItemPrimitive.Root>;
    }}</ThreadListPrimitive.Items>
    {query.isError ? <div role="alert"><p>{apiErrorMessage(query.error, t)}</p><Button variant="link" onClick={() => void query.refetch()}>{t("retry")}</Button></div> : null}
    {!saved && query.isSuccess && query.items.length === 0 ? <p className="px-2.5 py-4 text-[13.5px] text-[var(--t3)]">{t("history.empty")}</p> : null}
    {query.hasNextPage ? <Button variant="link" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>{t("history.more")}</Button> : null}
  </section>;
}
export function ConversationList(props: ConversationListProps) {
  const { t } = useTranslation("assistant");
  const saved = useConversationGroup(props, true);
  const recent = useConversationGroup(props, false);
  const conversations = [...saved.items, ...recent.items];
  // Sólo metadatos: cambiar threadId en este adaptador no descarta el borrador
  // del runtime de mensajes cuando el servidor asigna el primer id real.
  const runtime = useExternalStoreRuntime<ThreadMessageLike>({ messages: [], convertMessage: (message) => message, onNew: async () => {}, adapters: { threadList: {
    threadId: props.selectedId ?? undefined, isLoading: saved.isLoading || recent.isLoading,
    threads: conversations.filter((item, index) => conversations.findIndex((other) => other.id === item.id) === index).map((item) => ({ id: item.id, remoteId: item.id, status: "regular", title: item.title ?? t("history.untitled") })),
    onSwitchToNewThread: props.onNew, onSwitchToThread: props.onSelect,
  } } });
  return <AssistantRuntimeProvider runtime={runtime}><ThreadListPrimitive.Root className="flex min-h-0 flex-col overflow-auto p-3">
    {/* «Criterio · Botones»: el único ícono es el «+» de agregar, crear o invitar (Asistente-Org, -Personal y -Plat). */}
    <ThreadListPrimitive.New asChild><Button variant="outline"><Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />{t("history.new")}</Button></ThreadListPrimitive.New>
    {saved.isSuccess && recent.isSuccess && conversations.length === 0 ? <p className="px-2.5 py-4 text-[13.5px] text-[var(--t3)]">{t("history.empty")}</p>
      : <><Group {...props} query={saved} saved /><Group {...props} query={recent} saved={false} /></>}
  </ThreadListPrimitive.Root></AssistantRuntimeProvider>;
}
