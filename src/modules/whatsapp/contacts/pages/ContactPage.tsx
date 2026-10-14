import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import { apiErrorMessage, isNotFoundError } from "@/shared/api/errorMessage";
import type { PagedRequest } from "@/shared/api/types";
import { useFormat } from "@/shared/format/useFormat";
import { useBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { usePagedQuery } from "@/shared/hooks/usePagedQuery";
import type { ModuleContentProps } from "@/shared/modules/types";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { PhoneText } from "@/shared/ui/format/PhoneText";
import { ChatsIcon, ContactsIcon } from "../../components/icons";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { NotFoundPage } from "@/shared/ui/NotFoundPage";
import { Page } from "@/shared/ui/Page";
import { Pagination } from "@/shared/ui/Pagination";
import { RowActions } from "@/shared/ui/RowActions";
import { Surface } from "@/shared/ui/Surface";
import { homeOf } from "@/tenancy/access";
import type { WhatsAppContactConversationResponse, WhatsAppContactResponse } from "../../api/types";
import { contactBroadcastsQueryKey, contactConversationsQueryKey, contactQueryKey, fetchContact, fetchContactBroadcasts, fetchContactConversations } from "../api/contacts";
import {
  chatPath, contactBroadcastPhoneRow, contactConversationPhoneRow, contactsPath, createContactBroadcastColumns, createContactConversationColumns,
} from "../columns";
import { EditContactDialog } from "../components/EditContactDialog";

type ContactTab = "conversations" | "broadcasts";
const noFilters = [] as const;
const paged = ({ page, pageSize }: PagedRequest): PagedRequest => ({ page, pageSize });

/**
 * Ficha del contacto (tableros WA-Contacto y M-WA-Contacto): la banda con el número, si está vinculado a su cuenta, sus
 * etiquetas y si acepta promociones; «Editar contacto» y «Abrir chat»; y sus dos grupos, Conversaciones y Difusiones,
 * cada uno paginado por el back. Desvincular es de la persona (D2 y D5): acá solo se ve si lo está.
 */
export function ContactPage(_props: ModuleContentProps) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const { contactId } = useParams();
  const id = contactId ?? "";
  const contact = useQuery({ queryKey: contactQueryKey(id), queryFn: ({ signal }) => fetchContact(id, signal), enabled: Boolean(id), meta: { silent: true, blocksView: true } });
  const back = { to: contactsPath, label: t("whatsapp:contacts.back") };
  const format = useFormat();
  useBreadcrumbLeaf(contact.data ? contact.data.name ?? (format.isLoading ? undefined : format.formatPhone(contact.data.displayNumber)) : undefined);

  if (contact.isPending) return <Page icon={ContactsIcon} title={t("whatsapp:contacts.detail.loading")} backTo={back}><p role="status" className="p-4 text-[13px] text-[var(--t2)]">{t("common:states.loading")}</p></Page>;
  if (!contact.data) return isNotFoundError(contact.error)
    ? <NotFoundPage homePath={homeOf("business")} screen={t("whatsapp:contacts.detail.title")} back={back} />
    : <LoadErrorPage onRetry={() => { void contact.refetch(); }} screen={t("whatsapp:contacts.detail.title")} back={back} />;
  return <ContactDetail key={contact.data.id} contact={contact.data} back={back} />;
}

function ContactDetail({ contact, back }: { contact: WhatsAppContactResponse; back: { to: string; label: string } }) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const { phone } = useAppChrome();
  const navigate = useNavigate();
  const format = useFormat();
  const [tab, setTab] = useState<ContactTab>("conversations");
  const [editing, setEditing] = useState<{ returnFocusTo?: HTMLElement | null } | null>(null);
  const conversations = usePagedQuery({ filterKeys: noFilters, prefix: "conversaciones.", toQuery: paged,
    queryKey: (query) => contactConversationsQueryKey(contact.id, query), queryFn: (query) => fetchContactConversations(contact.id, query), meta: { silent: true } });
  const broadcasts = usePagedQuery({ filterKeys: noFilters, prefix: "difusiones.", toQuery: paged,
    queryKey: (query) => contactBroadcastsQueryKey(contact.id, query), queryFn: (query) => fetchContactBroadcasts(contact.id, query), meta: { silent: true } });
  // «Abrir chat» lleva a la conversación más reciente, la primera de su lista.
  const latest = conversations.query.page === 1 ? conversations.result.data?.items[0] : undefined;
  const title = contact.name ?? (format.isLoading ? "" : format.formatPhone(contact.displayNumber));
  // Tablero WA-Contacto: «+54 9 11 5555-6203 · Vinculada a su cuenta · Mayorista · Acepta promociones».
  const details = [
    contact.name ? <PhoneText key="number" value={contact.displayNumber} /> : null,
    contact.linkedToAccount ? t("whatsapp:contacts.linked") : null,
    contact.tags.length > 0 ? contact.tags.join(", ") : null,
    t(`whatsapp:contacts.consentPhrase.${contact.consent}`),
  ].filter((detail) => detail !== null);
  const summary = <>{details.map((detail, index) => <span key={index}>{index > 0 ? " · " : null}{detail}</span>)}</>;

  const conversationActions = (row: WhatsAppContactConversationResponse) => <RowActions
    label={t("whatsapp:contacts.conversations.rowActions", { date: format.isLoading ? "" : format.formatDate(row.startedAtUtc) })}
    actions={[{ label: t("whatsapp:contacts.openChat"), accessibleName: t("whatsapp:contacts.openChat"), icon: ChatsIcon, onSelect: () => { void navigate(chatPath(row.conversationId)); } }]} />;
  const conversationColumns: Column<WhatsAppContactConversationResponse>[] = [
    ...createContactConversationColumns(t),
    { id: "actions", header: t("whatsapp:contacts.columns.actions"), type: "actions", cell: conversationActions },
  ];
  const openChat = latest ? <Button asChild><Link to={chatPath(latest.conversationId)}>{t("whatsapp:contacts.openChat")}</Link></Button> : null;

  return <>
    <Page icon={ContactsIcon} title={title} backTo={back} summary={summary} phoneSubtitle={summary} phoneBody="flush"
      actions={phone ? openChat ?? undefined : <>
        <Button type="button" variant="outline" onClick={() => setEditing({})}>{t("whatsapp:contacts.actions.edit")}</Button>
        {openChat}
      </>}
      // M-WA-Contacto: en el teléfono, «Editar contacto» va en el ⋮ de la barra; en la compu, en la banda.
      moreActions={{ label: t("whatsapp:contacts.rowActions", { name: title }), items: [
        { label: t("whatsapp:contacts.actions.edit"), hidden: !phone, onSelect: (trigger) => setEditing({ returnFocusTo: trigger }) },
      ] }}
      tabs={{ label: t("whatsapp:contacts.detail.tabs"), value: tab, onValueChange: (value) => setTab(value === "broadcasts" ? "broadcasts" : "conversations"), items: [
        { value: "conversations", label: t("whatsapp:contacts.conversations.title"), count: conversations.result.data?.totalCount, content: <Surface className="overflow-hidden" phoneFlush>
          <DataTable columns={conversationColumns} rows={conversations.result.data?.items ?? []} rowKey={(row) => row.conversationId}
            mobileRow={(row) => contactConversationPhoneRow(row, t)}
            isLoading={conversations.result.isPending} isFetching={conversations.result.isFetching}
            error={conversations.result.error ? apiErrorMessage(conversations.result.error, t) : undefined} onRetry={() => { void conversations.result.refetch(); }}
            emptyTitle={t("whatsapp:contacts.conversations.empty")} />
          {conversations.paginationProps ? <Pagination {...conversations.paginationProps} /> : null}
        </Surface> },
        { value: "broadcasts", label: t("whatsapp:contacts.broadcasts.title"), count: broadcasts.result.data?.totalCount, content: <Surface className="overflow-hidden" phoneFlush>
          <DataTable columns={createContactBroadcastColumns(t)} rows={broadcasts.result.data?.items ?? []} rowKey={(row) => row.broadcastId}
            mobileRow={contactBroadcastPhoneRow}
            isLoading={broadcasts.result.isPending} isFetching={broadcasts.result.isFetching}
            error={broadcasts.result.error ? apiErrorMessage(broadcasts.result.error, t) : undefined} onRetry={() => { void broadcasts.result.refetch(); }}
            emptyTitle={t("whatsapp:contacts.broadcasts.empty")} />
          {broadcasts.paginationProps ? <Pagination {...broadcasts.paginationProps} /> : null}
        </Surface> },
      ] }} />
    {editing ? <EditContactDialog contact={contact} returnFocusTo={editing.returnFocusTo} onClose={() => setEditing(null)} /> : null}
  </>;
}
