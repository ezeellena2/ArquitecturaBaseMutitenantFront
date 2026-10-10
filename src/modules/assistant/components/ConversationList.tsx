import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { AssistantConversationSummaryResponse } from "@/shared/api/types";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { Button } from "@/shared/ui/button";
import { RowActions, type RowAction } from "@/shared/ui/RowActions";
import { InfoIcon, MoreVerticalIcon } from "@/shared/ui/icons";
import { useFormat } from "@/shared/format/useFormat";
import { assistantConversationsQueryKey, fetchAssistantConversations, type AssistantScope } from "../api/assistant";
import type { AssistantLifetime } from "../runtime/assistantLifetime";

export interface ConversationListProps {
  scope: AssistantScope; lifetime: AssistantLifetime; enabled: boolean; selectedId: string | null; retentionDays: number;
  onSelect: (id: string) => void; onNew: () => void; actions: (conversation: AssistantConversationSummaryResponse) => readonly RowAction[];
  onActions?: (conversation: AssistantConversationSummaryResponse) => void;
}
function Group({ saved, ...props }: ConversationListProps & { saved: boolean }) {
  const { t } = useTranslation("assistant");
  const format = useFormat();
  const query = useInfiniteQuery({
    queryKey: [...assistantConversationsQueryKey(props.scope, { saved }), "pages"], initialPageParam: undefined as string | undefined,
    enabled: props.enabled,
    queryFn: async ({ pageParam, signal }) => {
      const controller = props.lifetime.controller();
      try {
        const result = await fetchAssistantConversations(props.scope, { saved, cursor: pageParam }, AbortSignal.any([signal, controller.signal]));
        props.lifetime.assertActive();
        signal.throwIfAborted();
        return result;
      } finally { props.lifetime.release(controller); }
    },
    getNextPageParam: (page) => page.hasMore ? page.nextCursor ?? undefined : undefined,
    meta: { silent: true },
  });
  return <section className="flex flex-col gap-1">
    <h2 className="flex items-center gap-1.5 px-2.5 pt-3.5 pb-1.5 text-[12.5px] font-semibold text-[var(--t3)]">{t(saved ? "history.saved" : "history.recent")}
      {!saved ? <span role="img" tabIndex={0} aria-label={t("history.retention", { days: format.formatInteger(props.retentionDays) })} title={t("history.retention", { days: format.formatInteger(props.retentionDays) })}><InfoIcon className="size-3.5" /></span> : null}
    </h2>
    {query.data?.pages.flatMap((page) => page.items).map((conversation) => <div key={conversation.id} className={`flex min-w-0 items-center rounded-lg ${props.selectedId === conversation.id ? "bg-[var(--s2)]" : "hover:bg-[var(--s2)]"}`}>
      <button type="button" aria-current={props.selectedId === conversation.id ? "true" : undefined} onClick={() => props.onSelect(conversation.id)}
        className="min-w-0 flex-1 truncate px-2.5 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-[var(--foco)]">{conversation.title ?? t("history.untitled")}</button>
      {props.onActions ? <button type="button" aria-label={t("history.actions", { title: conversation.title ?? t("history.untitled") })} className="flex size-11 items-center justify-center" onClick={() => props.onActions?.(conversation)}><MoreVerticalIcon className="size-5" /></button>
        : <RowActions label={t("history.actions", { title: conversation.title ?? t("history.untitled") })} title={conversation.title ?? t("history.untitled")} actions={props.actions(conversation)} />}
    </div>)}
    {query.isError ? <div role="alert"><p>{apiErrorMessage(query.error, t)}</p><Button variant="link" onClick={() => void query.refetch()}>{t("retry")}</Button></div> : null}
    {!saved && query.isSuccess && query.data.pages.every((page) => page.items.length === 0) ? <p className="px-2.5 py-4 text-[13.5px] text-[var(--t3)]">{t("history.empty")}</p> : null}
    {query.hasNextPage ? <Button variant="link" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>{t("history.more")}</Button> : null}
  </section>;
}
export function ConversationList(props: ConversationListProps) {
  const { t } = useTranslation("assistant");
  return <div className="flex min-h-0 flex-col overflow-auto p-3">
    <Button variant="outline" onClick={props.onNew}>{t("history.new")}</Button>
    <Group {...props} saved /><Group {...props} saved={false} />
  </div>;
}
