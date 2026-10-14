import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage, isNotFoundError, toastActionError } from "@/shared/api/errorMessage";
import { pageSizes, type PageSize } from "@/shared/api/pageSizes";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import type { MeResponse } from "@/shared/api/types";
import { useFormat } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { AppBarTools } from "@/shared/ui/app/AppBarTools";
import { Button } from "@/shared/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { EmptyState } from "@/shared/ui/EmptyState";
import { IconButton } from "@/shared/ui/IconButton";
import { MoreVerticalIcon } from "@/shared/ui/icons";
import { ImportantNotice } from "@/shared/ui/ImportantNotice";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { Page } from "@/shared/ui/Page";
import { toastError } from "@/shared/ui/sonner";
import type { AddWhatsAppNoteRequest, SendWhatsAppMessageRequest, WhatsAppChatMessageResponse } from "../../api/types";
import { conversationRefetchInterval, platformUntakenQueryKey, untakenQueryKey } from "../../api/untaken";
import { addNote, chatsScopeQueryRoot, conversationQueryKey, fetchConversation, sendMessage, takeConversation, transferConversation, type ChatsScope } from "../api/chats";
import { composerState, isUntaken, lastInbound, phoneLabel, rowDescriptors } from "../lib/conversation";
import { ChatAvatar } from "./ChatAvatar";
import { ChatComposer, type ComposerNotice } from "./ChatComposer";
import { MessageThread } from "./MessageThread";
import { TemplateDialog } from "./TemplateDialog";
import { TransferDropdown, TransferSheet, type TransferTarget } from "./TransferMenu";

/** El hilo arranca con los 20 más recientes y «Ver mensajes anteriores» pide la página más grande que sigue. */
const firstPageSize: PageSize = 20;

/** Lo que puede abrir quien mira, además de atender: la ficha del contacto (CC02) o la cuenta de la persona (Plataforma). */
export interface ConversationLinks {
  contact?: (contactId: string) => string;
  account?: (accountId: string) => string;
}

/// La conversación abierta (WA-Chats, .w-hilo; M-WA-Conversacion en el teléfono): el encabezado con quién es y sus
/// acciones (Tomar, Pasar, Ver ficha o Ver la cuenta), el hilo y la barra para escribir. Se relee cada 5 s (decisión
/// técnica 12). Tomar, mandar, pasar y la plantilla vuelven a leer la bandeja y el contador del menú. En el teléfono es
/// otra pantalla, con ‹ a la bandeja.
export function ConversationView({ scope, id, me, links, back, phone }: {
  scope: ChatsScope;
  id: string;
  me: MeResponse;
  links: ConversationLinks;
  back: { to: string; label: string };
  phone: boolean;
}) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  const client = useQueryClient();
  const navigate = useNavigate();
  const { hideBottomNav } = useAppChrome();
  const [pageSize, setPageSize] = useState<PageSize>(firstPageSize);
  // Lo que el back dijo al mandar y la fila todavía no refleja: hasta la relectura, el chat ya lo muestra.
  const [flags, setFlags] = useState({ paymentRequired: false, windowClosed: false, readOnly: false });
  const [notice, setNotice] = useState<ComposerNotice | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState<{ trigger: HTMLButtonElement | null } | null>(null);
  const page = { page: 1, pageSize };
  const query = useQuery({
    queryKey: conversationQueryKey(scope, id, page), queryFn: ({ signal }) => fetchConversation(scope, id, page, signal),
    refetchInterval: conversationRefetchInterval, placeholderData: keepPreviousData, meta: { silent: true },
  });

  // M-WA-Conversacion: en el teléfono el chat ocupa la pantalla, sin la barra de abajo.
  useEffect(() => {
    if (!phone) return;
    hideBottomNav(true);
    return () => hideBottomNav(false);
  }, [phone, hideBottomNav]);

  const refresh = () => Promise.all([
    client.invalidateQueries({ queryKey: chatsScopeQueryRoot(scope) }),
    client.invalidateQueries({ queryKey: scope.kind === "platform" ? platformUntakenQueryKey : untakenQueryKey }),
  ]);

  /** Los 409 del chat se dicen en el chat: el estado de abajo cambia y, si otra persona lo tomó, un aviso rojo. */
  function rejected(error: unknown, action: "send" | "take") {
    if (error instanceof ApiError && error.code === "WhatsApp.Conversation.TakenByOther") {
      const takenBy = error.problem.takenBy;
      toastError(typeof takenBy === "string" && takenBy
        ? t(action === "send" ? "chats.errors.takenByOtherSend" : "chats.errors.takenByOtherTake", { name: takenBy })
        : apiErrorMessage(error, t));
      void refresh();
    } else if (error instanceof ApiError && error.code === "WhatsApp.Conversation.WindowClosed") {
      setFlags((current) => ({ ...current, windowClosed: true }));
      void refresh();
    } else if (error instanceof ApiError && error.code === "WhatsApp.Conversation.PaymentRequired") {
      setFlags((current) => ({ ...current, paymentRequired: true }));
    } else if (error instanceof ApiError && error.code === "WhatsApp.Conversation.ReadOnly") {
      setFlags((current) => ({ ...current, readOnly: true }));
      void refresh();
    } else toastActionError(error, t);
  }

  const take = useMutation({ mutationFn: () => takeConversation(scope, id), onSuccess: refresh, onError: (error) => rejected(error, "take") });
  const send = useIdempotentMutation((request: SendWhatsAppMessageRequest, key) => sendMessage(scope, id, request, key));
  const note = useIdempotentMutation((request: AddWhatsAppNoteRequest, key) => addNote(scope, id, request, key));
  const transfer = useMutation({
    mutationFn: ({ target, version }: { target: TransferTarget; version: number }) => transferConversation(scope, id, { ...target, version }),
    onSuccess: refresh,
    onError: (error) => { toastActionError(error, t); void refresh(); },
  });

  const data = query.data;
  if (!data) {
    if (query.isError) {
      const missing = isNotFoundError(query.error);
      if (phone && !missing) return <LoadErrorPage back={back} screen={t(scope.kind === "platform" ? "chats.platform.title" : "chats.title")} onRetry={() => { void query.refetch(); }} />;
      const empty = <EmptyState framed={false} title={apiErrorMessage(query.error, t)}
        action={missing ? undefined : <Button type="button" variant="outline" onClick={() => { void query.refetch(); }}>{t("common:actions.retry")}</Button>} />;
      return phone ? <Page title={t(scope.kind === "platform" ? "chats.platform.title" : "chats.title")} backTo={back}>{empty}</Page>
        : <section className="flex min-w-0 flex-1 items-center justify-center">{empty}</section>;
    }
    const loading = <p role="status" className="p-6 text-[var(--t2)]">{t("common:states.loading")}</p>;
    return phone ? <Page title={t(scope.kind === "platform" ? "chats.platform.title" : "chats.title")} backTo={back} phoneBody="flush">{loading}</Page>
      : <section className="flex min-w-0 flex-1 flex-col">{loading}</section>;
  }

  const row = data.conversation;
  const messages = data.messages.items;
  const name = row.contactName ?? phoneLabel(format, row.displayNumber);
  const untaken = isUntaken(row);
  const readOnly = row.readOnly || flags.readOnly;
  const state = composerState({ ...row, readOnly }, me.id, flags);
  const descriptors = rowDescriptors(row, { untaken: t("chats.list.untaken"), linked: t("chats.header.linkedToAccount"), employee: t("chats.header.employee") });
  const contactPath = row.contactId && links.contact ? links.contact(row.contactId) : null;
  const accountPath = row.accountId && links.account ? links.account(row.accountId) : null;
  const larger = pageSizes.find((size) => size > pageSize);
  const earlier = data.messages.hasNext === true && larger !== undefined;

  const onSend = (text: string, done: () => void) => send.mutate({ text }, { onSuccess: () => { done(); void refresh(); }, onError: (error) => rejected(error, "send") });
  const onNote = (text: string, done: () => void) => note.mutate({ text }, { onSuccess: () => { done(); void refresh(); }, onError: (error) => toastActionError(error, t) });
  const onTransfer = (target: TransferTarget) => transfer.mutate({ target, version: row.version });

  const thread = <MessageThread messages={messages} perspective={{ kind: "team" }} phone={phone} label={t("chats.thread.label", { name })}
    hasEarlier={earlier} loadingEarlier={query.isFetching && query.isPlaceholderData} onLoadEarlier={() => { if (larger) setPageSize(larger); }} />;
  const composer = <ChatComposer key={row.id} state={state} phone={phone} sendPending={send.isPending} notePending={note.isPending}
    onSend={onSend} onNote={onNote} onChooseTemplate={() => setTemplateOpen(true)} onExplain={setNotice} />;
  const dialogs = <>
    {notice ? <ConversationNotice notice={notice} name={name} messages={messages} onClose={() => setNotice(null)} /> : null}
    {templateOpen ? <TemplateDialog scope={scope} row={row} name={name} onClose={() => setTemplateOpen(false)}
      onSent={() => { void refresh(); }} onConflict={(error) => rejected(error, "send")} /> : null}
    {transferOpen ? <TransferSheet scope={scope} row={row} onTransfer={onTransfer} onClose={() => setTransferOpen(null)} returnFocusTo={transferOpen.trigger} /> : null}
  </>;

  if (phone) {
    const subtitle = descriptors.join(" · ");
    return <Page title={name} backTo={back} phoneBody="flush"
      phoneSubtitle={untaken ? <span className="text-[var(--alerta)]">{subtitle}</span> : subtitle || undefined}
      moreActions={{ label: t("chats.header.actionsOf", { name }), items: [
        { label: t("chats.header.take"), hidden: !untaken || readOnly, onSelect: () => take.mutate() },
        { label: t("chats.header.transfer"), hidden: readOnly, onSelect: (trigger) => setTransferOpen({ trigger }) },
        { label: t("chats.header.viewContact"), hidden: !contactPath, onSelect: () => { if (contactPath) void navigate(contactPath); } },
        { label: t("chats.header.viewAccount"), hidden: !accountPath, onSelect: () => { if (accountPath) void navigate(accountPath); } },
      ] }}>
      <AppBarTools placement="leading"><ChatAvatar name={row.contactName} size="bar" /></AppBarTools>
      {thread}
      {composer}
      {dialogs}
    </Page>;
  }

  const subtitle = [...(row.contactName ? [phoneLabel(format, row.displayNumber)] : []), ...descriptors].join(" · ");
  return <section aria-label={name} className="flex min-w-0 flex-1 flex-col">
    <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-[var(--borde)] pr-3 pl-4">
      <ChatAvatar name={row.contactName} />
      <div className="flex min-w-0 flex-1 flex-col leading-[1.3]">
        <h2 className="truncate text-[14px] font-semibold text-[var(--t1)]">{name}</h2>
        {subtitle ? <span className="truncate text-[12.5px] text-[var(--t3)]">{subtitle}</span> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {accountPath ? <Button asChild variant="outline" size="sm"><Link to={accountPath}>{t("chats.header.viewAccount")}</Link></Button> : null}
        {readOnly ? null : untaken
          ? <Button type="button" size="sm" pending={take.isPending} pendingLabel={t("chats.header.taking")} onClick={() => take.mutate()}>{t("chats.header.take")}</Button>
          : <TransferDropdown scope={scope} row={row} pending={transfer.isPending} onTransfer={onTransfer} />}
        <HeaderMenu name={row.contactName ? t("chats.header.actionsOf", { name }) : t("chats.header.chatActions")}
          items={contactPath ? [{ label: t("chats.header.viewContact"), to: contactPath }] : []} />
      </div>
    </header>
    {thread}
    {composer}
    {dialogs}
  </section>;
}

/** El ⋮ del encabezado del chat en la compu: lo que lleva a otra pantalla. Sin nada que ofrecer, no va. */
function HeaderMenu({ name, items }: { name: string; items: readonly { label: string; to: string }[] }) {
  if (items.length === 0) return null;
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><IconButton label={name}><MoreVerticalIcon className="size-4" /></IconButton></DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {items.map((item) => <DropdownMenuItem key={item.label} asChild><Link to={item.to}>{item.label}</Link></DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}

/// El ⓘ de la barra de abajo (WA-Chats «qué significa» y WA-Chats-24h): por qué no se puede responder y qué hacer.
function ConversationNotice({ notice, name, messages, onClose }: {
  notice: ComposerNotice;
  name: string;
  messages: readonly WhatsAppChatMessageResponse[];
  onClose: () => void;
}) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  const close = (open: boolean) => { if (!open) onClose(); };
  if (notice === "window") {
    const last = lastInbound(messages);
    return <ImportantNotice open onOpenChange={close} title={t("chats.notices.window.title")}
      reason={last && !format.isLoading ? t("chats.notices.window.reason", { name, when: format.formatCalendar(last.createdAtUtc) }) : t("chats.notices.window.reasonUnknown", { name })}
      detail={t("chats.notices.window.detail")} steps={[t("chats.notices.window.stepTemplate"), t("chats.notices.window.stepReply")]} />;
  }
  if (notice === "readOnly") return <ImportantNotice open onOpenChange={close} title={t("chats.notices.readOnly.title", { name })}
    reason={t("chats.notices.readOnly.reason")} detail={t("chats.notices.readOnly.detail")} steps={[t("chats.notices.readOnly.step")]} />;
  return <ImportantNotice open onOpenChange={close} title={t("chats.notices.payment.title", { name })}
    reason={t("chats.notices.payment.reason")} steps={[t("chats.notices.payment.step")]} />;
}

/** Que el chat abierto ocupe el alto de la pantalla en la compu: la bandeja y el hilo se desplazan cada uno. */
export function ChatColumns({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex min-h-0 flex-1 bg-[var(--lado-activo)]", className)}>{children}</div>;
}
