import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useParams } from "react-router";
import type { MeResponse } from "@/shared/api/types";
import { useFormat } from "@/shared/format/useFormat";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useFilters } from "@/shared/hooks/useFilters";
import { usePagination } from "@/shared/hooks/usePagination";
import { useResourceOptions } from "@/shared/hooks/useResourceOptions";
import { pageSizes } from "@/shared/api/pageSizes";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { EmptyState } from "@/shared/ui/EmptyState";
import { FilterBar, type FilterBarFilter } from "@/shared/ui/FilterBar";
import { WhatsAppIcon } from "@/shared/ui/icons";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { LoadMore } from "@/shared/ui/LoadMore";
import { Page, SublineSeparator } from "@/shared/ui/Page";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { inboxPermission } from "../../access";
import type { WhatsAppConversationFilter, WhatsAppConversationRowResponse } from "../../api/types";
import { inboxRefetchInterval } from "../../api/untaken";
import { ChatsIcon } from "../../components/icons";
import { conversationsQueryKey, fetchConversations, teamFilterOptions, type ChatsScope, type ConversationsQuery, type InboxKey } from "../api/chats";
import { chatTime, isUntaken, phoneLabel, rowAssignment } from "../lib/conversation";
import { ChatAvatar } from "./ChatAvatar";
import { ChatColumns, ConversationView, type ConversationLinks } from "./ConversationView";
import { ConversationItem } from "./ConversationItem";

const filterKeys = ["inbox", "teamId", "state"] as const;
const inboxKeys = Object.keys(inboxPermission) as InboxKey[];
const inboxEnum = { customers: "Customers", internal: "Internal" } as const satisfies Record<InboxKey, string>;
const states = ["All", "Untaken", "Mine"] as const satisfies readonly NonNullable<WhatsAppConversationFilter>[];
const isState = (value: string | undefined): value is (typeof states)[number] => states.some((state) => state === value);

export type ChatsVariant = "organization" | "platform";

/// Chats de la organización (WA-Chats, M-WA-Chats) y Consultas de Plataforma (Plat-WA-Chats, M-Plat-WA-Chats): en la compu
/// la bandeja y la conversación abierta lado a lado; en el teléfono, la lista y, al tocar una, otra pantalla. Las bandejas
/// «Clientes | Internos» van con el segmentado y solo las que la persona puede ver: con una sola, sin segmentado. La
/// búsqueda, los filtros y la bandeja viven en la URL; la bandeja se relee cada 10 s (decisión técnica 12).
export function ChatsWorkspace({ me, variant }: { me: MeResponse; variant: ChatsVariant }) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  const { phone } = useAppChrome();
  const { conversationId } = useParams();
  const location = useLocation();
  const platform = variant === "platform";
  const basePath = platform ? "/plataforma/whatsapp" : "/org/whatsapp/chats";
  // La conversación abierta: en Plataforma, debajo de «consultas», para no chocar con Número, Bot, Equipos y Plantillas.
  const conversationsPath = platform ? "/plataforma/whatsapp/consultas" : basePath;
  const organization = me.effectivePermissions.organization;
  const inboxes = platform ? [] : inboxKeys.filter((key) => organization.includes(inboxPermission[key]));
  const filters = useFilters(filterKeys);
  const pagination = usePagination();
  const inbox = inboxes.find((key) => key === filters.values.inbox) ?? inboxes[0] ?? "customers";
  const scope: ChatsScope = platform ? { kind: "platform" } : { kind: "organization", inbox };
  const search = useDebouncedValue(pagination.search ?? "");
  const state = isState(filters.values.state) ? filters.values.state : undefined;
  const request: ConversationsQuery = { page: pagination.page, pageSize: pagination.pageSize, search: search || undefined, teamId: filters.values.teamId, state };
  const list = useQuery({
    queryKey: conversationsQueryKey(scope, request), queryFn: ({ signal }) => fetchConversations(scope, request, signal),
    // Al cambiar de bandeja no se muestran las filas de la otra mientras llegan las nuevas.
    placeholderData: (previous, previousQuery) => previousQuery?.queryKey[2] === conversationsQueryKey(scope, request)[2] ? keepPreviousData(previous) : undefined,
    refetchInterval: inboxRefetchInterval, meta: { silent: true, blocksView: true },
  });

  // Como `usePagedQuery`: si la página quedó vacía con filas en otras, se va a la última que tiene.
  const settled = list.isPlaceholderData ? undefined : list.data?.conversations;
  const { page, pageSize, setPage, setPageSize } = pagination;
  useEffect(() => {
    if (!settled || settled.items.length !== 0 || settled.totalCount === 0) return;
    const lastPage = Math.max(1, Math.ceil(settled.totalCount / pageSize));
    if (lastPage !== page) setPage(lastPage);
  }, [settled, page, pageSize, setPage]);

  // El filtro «Equipo» lee los equipos de quien administra WhatsApp; en la organización, solo los de esta bandeja.
  const canReadTeams = platform ? me.effectivePermissions.platform.includes("platform.whatsapp.manage") : organization.includes("whatsapp.manage");
  const teams = useResourceOptions(teamFilterOptions(scope), canReadTeams);
  const teamItems = platform ? teams.items : teams.items.filter((team) => team.inbox === inboxEnum[inbox]);
  const teamId = filters.values.teamId;
  const links: ConversationLinks = platform
    ? me.effectivePermissions.platform.includes("platform.accounts.read") ? { account: (id) => `/plataforma/cuentas/${encodeURIComponent(id)}` } : {}
    : organization.includes(inboxPermission.customers) ? { contact: (id) => `/org/whatsapp/contactos/${encodeURIComponent(id)}` } : {};

  const title = t(platform ? "chats.platform.title" : "chats.title");
  const back = { to: `${basePath}${location.search}`, label: t(platform ? "chats.platform.back" : "chats.back") };
  if (phone && conversationId) return <ConversationView key={conversationId} scope={scope} id={conversationId} me={me} links={links} back={back} phone />;

  const data = list.data;
  if (!data && list.isError) return <LoadErrorPage screen={title} onRetry={() => { void list.refetch(); }} />;
  const rows = data?.conversations.items ?? [];
  const selectedId = conversationId ?? (phone ? undefined : rows[0]?.id);
  const counts = data?.counts;
  const total = counts ? platform ? counts.customers + counts.internal : counts[inbox] : undefined;
  const filtered = Boolean(search) || state !== undefined || teamId !== undefined;

  const filterBar: readonly FilterBarFilter[] = [
    ...(canReadTeams ? [{
      key: "teamId", label: t("chats.filters.team"), menuLabel: t("chats.filters.teamMenu"), value: teamId ?? "", active: teamId !== undefined,
      remote: teams.remote, selectedLabel: teams.knownItems.find((team) => team.id === teamId)?.name,
      onChange: (value: string) => filters.setFilter("teamId", value === "all" ? undefined : value),
      options: [{ value: "all", label: t("chats.filters.allTeams") }, ...teamItems.map((team) => ({ value: team.id, label: team.name }))],
    }] : []),
    {
      key: "state", label: format.isLoading ? "" : format.formatEnum("WhatsAppConversationFilter", "All"), menuLabel: t("chats.filters.stateMenu"),
      value: state ?? "", active: state !== undefined && state !== "All",
      onChange: (value: string) => filters.setFilter("state", value === "All" ? undefined : value),
      options: states.map((value) => ({ value, label: format.isLoading ? value : format.formatEnum("WhatsAppConversationFilter", value) })),
    },
  ];
  const conversationLink = (id: string) => `${conversationsPath}/${encodeURIComponent(id)}${location.search}`;
  const loadMore = data?.conversations.hasNext ? <LoadMore hasMore isLoading={list.isFetching} onLoadMore={() => {
    // Como «Cargar más» del teléfono: la página más grande que sigue; pasado el tamaño mayor, la página siguiente.
    const larger = pageSizes.find((size) => size > pageSize);
    if (larger) setPageSize(larger); else setPage(page + 1);
  }} /> : null;

  const inboxColumn = <>
    {inboxes.length > 1 ? <div className={phone ? "px-4 pt-1 pb-2" : "px-3 pt-3"}>
      <SegmentedControl fullWidth aria-label={t("chats.inbox")} options={inboxes.map((key) => ({
        key, label: format.isLoading ? "" : format.formatEnum("WhatsAppInbox", inboxEnum[key]), pressed: key === inbox,
        detail: counts ? format.formatInteger(counts[key]) : undefined,
        onSelect: () => filters.setFilter("inbox", key === inboxes[0] ? undefined : key),
      }))} />
    </div> : null}
    <FilterBar label={t("chats.filters.label")} searchLabel={t("chats.filters.search")} searchValue={pagination.search ?? ""} onSearchChange={pagination.setSearch}
      filters={filterBar} clearLabel={t("common:actions.clearFilters")} onClear={filters.clear}
      className="rounded-none border-0 border-b shadow-none! md:px-3 md:py-3 md:[&>div:first-child]:w-full" />
    {data && rows.length === 0
      ? <EmptyState framed={false} title={t(filtered ? "chats.list.noMatches" : "chats.list.empty")} />
      : <ul aria-label={t("chats.list.label")} aria-busy={list.isFetching || undefined} className={phone ? undefined : "min-h-0 flex-1 overflow-y-auto"}>
        {rows.map((row) => <InboxRow key={row.id} row={row} to={conversationLink(row.id)} selected={row.id === selectedId} phone={phone} />)}
      </ul>}
    {!data ? <p role="status" className="px-4 py-3 text-[var(--t2)]">{t("common:states.loading")}</p> : null}
    {loadMore}
  </>;

  const summary = counts && total !== undefined ? <>{t("chats.conversations", { count: total })}<SublineSeparator />{t("chats.untakenCount", { count: counts.untaken })}</> : undefined;
  if (phone) return <Page title={title} phoneBody="flush">{inboxColumn}</Page>;
  return <div className="flex h-full min-h-0 flex-col">
    <Page icon={platform ? WhatsAppIcon : ChatsIcon} title={title} summary={summary} bodyClassName="flex min-h-0 flex-1 flex-col">
      <ChatColumns>
        <aside aria-label={t("chats.list.label")} className="flex w-[380px] shrink-0 flex-col border-r border-[var(--borde)]">{inboxColumn}</aside>
        {selectedId ? <ConversationView key={selectedId} scope={scope} id={selectedId} me={me} links={links} back={back} phone={false} /> : <div className="flex-1 bg-[var(--s2)]" />}
      </ChatColumns>
    </Page>
  </div>;
}

/** Una fila de la bandeja: quién es, cuándo escribió, qué dijo y quién lo atiende. */
function InboxRow({ row, to, selected, phone }: { row: WhatsAppConversationRowResponse; to: string; selected: boolean; phone: boolean }) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  const untaken = isUntaken(row);
  return <ConversationItem to={to} selected={selected} phone={phone} unread={row.unread} unreadLabel={t("chats.list.unread")}
    avatar={<ChatAvatar name={row.contactName} size={phone ? "row" : "default"} />}
    title={row.contactName ?? phoneLabel(format, row.displayNumber)}
    time={format.isLoading ? null : <time dateTime={row.lastMessageAtUtc}>{chatTime(format, row.lastMessageAtUtc,
      { today: t("format:calendar.today"), yesterday: t("format:calendar.yesterday") }, { yesterday: t("chats.day.yesterday") })}</time>}
    preview={row.lastMessagePreview} assignment={rowAssignment(row, t("chats.list.untaken"))} assignmentTone={untaken ? "untaken" : undefined} />;
}
