import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router";
import { apiErrorMessage, isNotFoundError, toastActionError } from "@/shared/api/errorMessage";
import { pageSizes, type PageSize } from "@/shared/api/pageSizes";
import { useFormat } from "@/shared/format/useFormat";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { usePagination } from "@/shared/hooks/usePagination";
import { AppBarTools } from "@/shared/ui/app/AppBarTools";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { FixedActions } from "@/shared/ui/app/FixedActions";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { EmptyState } from "@/shared/ui/EmptyState";
import { FilterBar } from "@/shared/ui/FilterBar";
import { IconButton } from "@/shared/ui/IconButton";
import { MoreVerticalIcon, WhatsAppIcon } from "@/shared/ui/icons";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { LoadMore } from "@/shared/ui/LoadMore";
import { Page } from "@/shared/ui/Page";
import { Surface } from "@/shared/ui/Surface";
import type { PersonalWhatsAppConversationResponse } from "../../api/types";
import { conversationRefetchInterval } from "../../api/untaken";
import { OrganizationAvatar } from "../../chats/components/ChatAvatar";
import { ChatColumns } from "../../chats/components/ConversationView";
import { ConversationItem } from "../../chats/components/ConversationItem";
import { MessageThread } from "../../chats/components/MessageThread";
import { chatTime, chronological, phoneLabel, whatsappLink } from "../../chats/lib/conversation";
import { ChatsIcon } from "../../components/icons";
import { countOf } from "../../lib/values";
import { fetchPersonalConversation, fetchPersonalConversations, personalConversationQueryKey, personalConversationsQueryKey, personalMessagesQueryRoot, unlinkConversation } from "../api/messages";

const basePath = "/mensajes";
const firstPageSize: PageSize = 20;

/// «Mensajes» del perfil personal (WA-Mensajes, M-WA-Mensajes y M-WA-Mensaje): las conversaciones de la persona con las
/// organizaciones, vinculadas a su cuenta y de solo lectura. En la compu, la lista y la conversación lado a lado; en el
/// teléfono, la conversación es otra pantalla. «Seguir en WhatsApp» abre el chat y «Desvincular» (CC06) la saca de acá.
export function MessagesPage() {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  const { phone } = useAppChrome();
  const { conversationId } = useParams();
  const location = useLocation();
  const pagination = usePagination();
  const search = useDebouncedValue(pagination.search ?? "");
  const request = { page: pagination.page, pageSize: pagination.pageSize, search: search || undefined };
  const list = useQuery({
    queryKey: personalConversationsQueryKey(request), queryFn: ({ signal }) => fetchPersonalConversations(request, signal),
    placeholderData: keepPreviousData, enabled: !(phone && conversationId), meta: { silent: true, blocksView: true },
  });
  const settled = list.isPlaceholderData ? undefined : list.data;
  const { page, pageSize, setPage, setPageSize } = pagination;
  useEffect(() => {
    if (!settled || settled.items.length !== 0 || settled.totalCount === 0) return;
    const lastPage = Math.max(1, Math.ceil(settled.totalCount / pageSize));
    if (lastPage !== page) setPage(lastPage);
  }, [settled, page, pageSize, setPage]);

  const title = t("personal.title");
  const back = { to: `${basePath}${location.search}`, label: t("personal.back") };
  if (phone && conversationId) return <PersonalConversation key={conversationId} id={conversationId} back={back} phone />;
  const data = list.data;
  if (!data && list.isError) return <LoadErrorPage screen={title} onRetry={() => { void list.refetch(); }} />;

  const rows = data?.items ?? [];
  const selectedId = conversationId ?? (phone ? undefined : rows[0]?.id);
  const none = data !== undefined && data.totalCount === 0 && !search;
  const words = { today: t("format:calendar.today"), yesterday: t("format:calendar.yesterday") };
  const loadMore = data?.hasNext ? <LoadMore hasMore isLoading={list.isFetching} onLoadMore={() => {
    const larger = pageSizes.find((size) => size > pageSize);
    if (larger) setPageSize(larger); else setPage(page + 1);
  }} /> : null;
  const listColumn = <>
    <FilterBar label={t("personal.filters")} searchLabel={t("personal.search")} searchValue={pagination.search ?? ""} onSearchChange={pagination.setSearch}
      filters={[]} clearLabel={t("common:actions.clear")} onClear={() => pagination.setSearch("")}
      className="rounded-none border-0 border-b shadow-none! md:px-3 md:py-3 md:[&>div:first-child]:w-full" />
    {data && rows.length === 0 ? <EmptyState framed={false} title={t("personal.noMatches")} /> : <ul aria-label={t("personal.list")} className={phone ? undefined : "min-h-0 flex-1 overflow-y-auto"}>
      {rows.map((row) => <ConversationItem key={row.id} to={`${basePath}/${encodeURIComponent(row.id)}${location.search}`} selected={row.id === selectedId} phone={phone}
        avatar={<OrganizationAvatar name={row.organizationName} size={phone ? "row" : "default"} />} title={row.organizationName}
        time={row.lastMessageAtUtc && !format.isLoading ? <time dateTime={row.lastMessageAtUtc}>{chatTime(format, row.lastMessageAtUtc, words, { yesterday: t("chats.day.yesterday") })}</time> : null}
        preview={row.lastMessagePreview} />)}
    </ul>}
    {!data ? <p role="status" className="px-4 py-3 text-[var(--t2)]">{t("common:states.loading")}</p> : null}
    {loadMore}
  </>;
  const empty = <p className="flex flex-1 items-center justify-center p-12 text-center text-[14px] font-semibold text-[var(--t2)]">{t("personal.empty")}</p>;

  if (phone) return <Page title={title} phoneBody="flush">{none ? empty : listColumn}</Page>;
  const summary = data ? data.totalCount === 0 ? t("personal.noOrganizations") : t("personal.organizations", countOf(format, data.totalCount)) : undefined;
  return <div className="flex h-full min-h-0 flex-col">
    <Page icon={ChatsIcon} title={title} summary={summary} bodyClassName={none ? undefined : "flex min-h-0 flex-1 flex-col"}>
      {none ? <Surface className="flex overflow-hidden">{empty}</Surface> : <ChatColumns>
        <aside aria-label={t("personal.list")} className="flex w-[380px] shrink-0 flex-col border-r border-[var(--borde)]">{listColumn}</aside>
        {selectedId ? <PersonalConversation key={selectedId} id={selectedId} back={back} phone={false} /> : <div className="flex-1 bg-[var(--s2)]" />}
      </ChatColumns>}
    </Page>
  </div>;
}

/// La conversación con una organización, de solo lectura: lo que escribió la persona a la derecha y lo de la organización
/// a la izquierda, con su nombre. El ⋮ ofrece «Desvincular», que se confirma.
function PersonalConversation({ id, back, phone }: { id: string; back: { to: string; label: string }; phone: boolean }) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [pageSize, setPageSize] = useState<PageSize>(firstPageSize);
  const [confirming, setConfirming] = useState<{ trigger: HTMLButtonElement | null } | null>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const pageRequest = { page: 1, pageSize };
  const query = useQuery({
    queryKey: personalConversationQueryKey(id, pageRequest), queryFn: ({ signal }) => fetchPersonalConversation(id, pageRequest, signal),
    refetchInterval: conversationRefetchInterval, placeholderData: keepPreviousData, meta: { silent: true },
  });
  const unlink = useMutation({
    mutationFn: () => unlinkConversation(id),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: personalMessagesQueryRoot }); void navigate(back.to); },
    onError: (error) => toastActionError(error, t),
  });

  const data = query.data;
  if (!data) {
    if (query.isError && phone && !isNotFoundError(query.error)) return <LoadErrorPage back={back} screen={t("personal.title")} onRetry={() => { void query.refetch(); }} />;
    const body = query.isError ? <EmptyState framed={false} title={apiErrorMessage(query.error, t)} />
      : <p role="status" className="p-6 text-[var(--t2)]">{t("common:states.loading")}</p>;
    return phone ? <Page title={t("personal.title")} backTo={back} phoneBody="flush">{body}</Page> : <section className="flex min-w-0 flex-1 flex-col">{body}</section>;
  }

  const conversation: PersonalWhatsAppConversationResponse = data.conversation;
  const name = conversation.organizationName;
  const since = format.isLoading ? "" : t("personal.linkedSince", { date: format.formatDate(conversation.linkedAtUtc) });
  const larger = pageSizes.find((size) => size > pageSize);
  const thread = <MessageThread messages={chronological(data.messages.items)} perspective={{ kind: "person", organizationName: name }} phone={phone}
    label={t("chats.thread.label", { name })} hasEarlier={data.messages.hasNext === true && larger !== undefined}
    loadingEarlier={query.isFetching && query.isPlaceholderData} onLoadEarlier={() => { if (larger) setPageSize(larger); }} />;
  const follow = <Button asChild><a href={whatsappLink(conversation.displayNumber)} target="_blank" rel="noreferrer">
    <WhatsAppIcon aria-hidden="true" className="size-4" />{t("personal.continueOnWhatsApp")}
  </a></Button>;
  const confirm = confirming ? <ConfirmDialog open onOpenChange={(open) => { if (!open) setConfirming(null); }} destructive returnFocusTo={confirming.trigger}
    title={t("personal.unlinkTitle", { name })} description={t("personal.unlinkDescription", { name })} confirmLabel={t("personal.unlink")}
    onConfirm={() => unlink.mutate()} /> : null;

  if (phone) return <Page title={name} backTo={back} phoneBody="flush" phoneSubtitle={since || undefined}
    moreActions={{ label: t("personal.actionsOf", { name }), items: [{ label: t("personal.unlink"), destructive: true, onSelect: (trigger) => setConfirming({ trigger }) }] }}>
    <AppBarTools placement="leading"><OrganizationAvatar name={name} size="bar" /></AppBarTools>
    {thread}
    <FixedActions>{follow}</FixedActions>
    {confirm}
  </Page>;

  return <section aria-label={name} className="flex min-w-0 flex-1 flex-col">
    <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-[var(--borde)] pr-3 pl-4">
      <OrganizationAvatar name={name} />
      <div className="flex min-w-0 flex-1 flex-col leading-[1.3]">
        <h2 className="truncate text-[14px] font-semibold text-[var(--t1)]">{name}</h2>
        <span className="truncate text-[12.5px] text-[var(--t3)]">{[phoneLabel(format, conversation.displayNumber), since].filter(Boolean).join(" · ")}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><IconButton ref={menuTrigger} label={t("personal.actionsOf", { name })}><MoreVerticalIcon className="size-4" /></IconButton></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* El menú se va con la opción: el diálogo le devuelve el foco al ⋮. */}
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming({ trigger: menuTrigger.current })}>{t("personal.unlink")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
    {thread}
    <div className="flex shrink-0 justify-center border-t border-[var(--borde)] bg-[var(--lado-activo)] px-4 py-3">{follow}</div>
    {confirm}
  </section>;
}
