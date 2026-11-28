import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage, isNotFoundError, toastActionError } from "@/shared/api/errorMessage";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useResourceAction } from "@/shared/hooks/useResourceAction";
import { useFormat } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { AppBarTools } from "@/shared/ui/app/AppBarTools";
import { Button } from "@/shared/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { EmptyState } from "@/shared/ui/EmptyState";
import { IconButton } from "@/shared/ui/IconButton";
import { EyeIcon, MoreVerticalIcon, type IconComponent } from "@/shared/ui/icons";
import { PhoneText } from "@/shared/ui/format/PhoneText";
import { ImportantNotice } from "@/shared/ui/ImportantNotice";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { Page } from "@/shared/ui/Page";
import { toastError } from "@/shared/ui/sonner";
import type { WhatsAppChatMessageResponse } from "../../api/types";
import { conversationRefetchInterval, platformUntakenQueryKey, untakenQueryKey } from "../../api/untaken";
import { addNote, chatsScopeQueryRoot, conversationQueryKey, fetchConversation, reviewMessage, sendMessage, takeConversation, transferConversation, type ChatsScope } from "../api/chats";
import { chronological, composerState, isUntaken, lastInbound, phoneLabel, pruneComposerFlags, rowDescriptors, type ComposerFlags } from "../lib/conversation";
import { usePagedAccumulation } from "../lib/usePagedAccumulation";
import { ChatAvatar } from "./ChatAvatar";
import { ChatComposer, type ComposerNotice } from "./ChatComposer";
import { MessageThread } from "./MessageThread";
import { TemplateDialog } from "./TemplateDialog";
import { TransferDropdown, TransferSheet, type TransferTarget } from "./TransferMenu";

/** Lo que puede abrir quien mira, además de atender: la ficha del contacto (CC02) o la cuenta de la persona (Plataforma). */
export interface ConversationLinks {
  contact?: (contactId: string) => string;
  account?: (accountId: string) => string;
}

/** Lo que se manda desde la barra de abajo y cómo vaciarla cuando salió. */
interface ComposerOperation { text: string; done: () => void }
/** Repetir el mismo texto conserva la clave; cambiarlo es otro mensaje (R05). */
const sameText = (previous: ComposerOperation, next: ComposerOperation) => previous.text === next.text;

/// La conversación abierta (WA-Chats, .w-hilo; M-WA-Conversacion en el teléfono): el encabezado con quién es y sus
/// acciones (Tomar, Pasar, Ver ficha o Ver la cuenta), el hilo y la barra para escribir. Se relee cada 5 s (decisión
/// técnica 12). Tomar, mandar, pasar y la plantilla vuelven a leer la bandeja y el contador del menú. En el teléfono es
/// otra pantalla, con ‹ a la bandeja.
export function ConversationView({ scope, id, links, back, phone }: {
  scope: ChatsScope;
  id: string;
  links: ConversationLinks;
  back: { to: string; label: string };
  phone: boolean;
}) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  const client = useQueryClient();
  const navigate = useNavigate();
  const { hideBottomNav } = useAppChrome();
  const scopeId = `${scope.kind === "platform" ? "platform" : scope.inbox}:${id}`;
  // Lo que el back dijo al mandar y la fila todavía no refleja: anclado a la conversación y al estado que rechazó, se
  // despeja solo cuando el servidor trae la ventana abierta o el canal conectado de nuevo (KAN-93).
  const [flagState, setFlagState] = useState<{ scopeId: string; flags: ComposerFlags }>({ scopeId, flags: {} });
  const activeFlags = flagState.scopeId === scopeId ? flagState.flags : {};
  const [notice, setNotice] = useState<ComposerNotice | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState<{ trigger: HTMLButtonElement | null } | null>(null);
  const threadQuery = usePagedAccumulation({
    resetKey: scopeId,
    queryKey: (page, pageSize) => conversationQueryKey(scope, id, { page, pageSize }),
    queryFn: (page, pageSize, signal) => fetchConversation(scope, id, { page, pageSize }, signal),
    selectItems: (data) => data.messages.items,
    hasNext: (data) => data.messages.hasNext === true,
    refetchInterval: conversationRefetchInterval,
    refetchIntervalInBackground: false,
    meta: { silent: true },
  });

  const currentRow = threadQuery.firstPage?.conversation;
  const currentUpdateCount = threadQuery.firstPageUpdateCount;
  const resolvedFlags = currentRow ? pruneComposerFlags(currentRow, activeFlags, currentUpdateCount) : activeFlags;

  // M-WA-Conversacion: en el teléfono el chat ocupa la pantalla, sin la barra de abajo.
  useEffect(() => {
    if (!phone) return;
    hideBottomNav(true);
    return () => hideBottomNav(false);
  }, [phone, hideBottomNav]);

  const setFlags = (updater: (current: ComposerFlags) => ComposerFlags) =>
    setFlagState((previous) => {
      const base = previous.scopeId === scopeId ? previous.flags : {};
      const pruned = currentRow ? pruneComposerFlags(currentRow, base, currentUpdateCount) : base;
      return { scopeId, flags: updater(pruned) };
    });

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
      setFlags((current) => ({ ...current, windowClosed: { windowOpenUntilUtc: currentRow?.windowOpenUntilUtc ?? null } }));
      void refresh();
    } else if (error instanceof ApiError && error.code === "WhatsApp.Conversation.PaymentRequired") {
      setFlags((current) => ({
        ...current,
        paymentRequired: { channelStatus: currentRow?.channel.status ?? "PaymentMissing", rejectedAt: currentUpdateCount },
      }));
      void refresh();
    } else if (error instanceof ApiError && error.code === "WhatsApp.Conversation.ReadOnly") {
      setFlags((current) => ({ ...current, readOnly: { rejectedAt: currentUpdateCount } }));
      void refresh();
    } else toastActionError(error, t);
  }

  const take = useMutation({ mutationFn: () => takeConversation(scope, id), onSuccess: refresh, onError: (error) => rejected(error, "take") });
  // Si la respuesta se pierde, corregir el texto es otro mensaje con otra clave y repetirlo conserva la suya (R05). Vaciar
  // la barra y releer salen del intento original, también desde «Reintentar».
  const sendAction = useResourceAction<ComposerOperation>({ onError: (error) => rejected(error, "send") });
  const send = useIdempotentMutation(sendAction.guarded(({ text }, key: string) => sendMessage(scope, id, { text }, key), (_message, operation) => { operation.done(); void refresh(); }),
    { meta: sendAction.meta, sameOperation: sameText });
  const noteAction = useResourceAction<ComposerOperation>({ onError: (error) => toastActionError(error, t) });
  const note = useIdempotentMutation(noteAction.guarded(({ text }, key: string) => addNote(scope, id, { text }, key), (_response, operation) => { operation.done(); void refresh(); }),
    { meta: noteAction.meta, sameOperation: sameText });
  const transfer = useMutation({
    mutationFn: ({ target, version }: { target: TransferTarget; version: number }) => transferConversation(scope, id, { ...target, version }),
    onSuccess: refresh,
    onError: (error) => { toastActionError(error, t); void refresh(); },
  });

  // «Marcar como revisado» (0066): si ya no está «Sin confirmar» (409), el aviso dice por qué y el chat se relee.
  const review = useMutation({
    mutationFn: (messageId: string) => reviewMessage(scope, id, messageId),
    onSuccess: refresh,
    onError: (error) => { toastActionError(error, t); void refresh(); },
  });

  const data = threadQuery.firstPage;
  if (!data) {
    if (threadQuery.isError) {
      const missing = isNotFoundError(threadQuery.error);
      if (phone && !missing) return <LoadErrorPage back={back} screen={t(scope.kind === "platform" ? "chats.platform.title" : "chats.title")} onRetry={() => { void threadQuery.refetchFirst(); }} />;
      const empty = <EmptyState framed={false} title={apiErrorMessage(threadQuery.error, t)}
        action={missing ? undefined : <Button type="button" variant="outline" onClick={() => { void threadQuery.refetchFirst(); }}>{t("common:actions.retry")}</Button>} />;
      return phone ? <Page title={t(scope.kind === "platform" ? "chats.platform.title" : "chats.title")} backTo={back}>{empty}</Page>
        : <section className="flex min-w-0 flex-1 items-center justify-center">{empty}</section>;
    }
    const loading = <p role="status" className="p-6 text-[var(--t2)]">{t("common:states.loading")}</p>;
    return phone ? <Page title={t(scope.kind === "platform" ? "chats.platform.title" : "chats.title")} backTo={back} phoneBody="flush">{loading}</Page>
      : <section className="flex min-w-0 flex-1 flex-col">{loading}</section>;
  }

  const row = data.conversation;
  const messages = chronological(threadQuery.items);
  const name = row.contactName ?? phoneLabel(format, row.displayNumber);
  const untaken = isUntaken(row);
  const state = composerState(row, resolvedFlags, currentUpdateCount);
  const readOnly = state.kind === "readOnly";
  const descriptors = rowDescriptors(row, { untaken: t("chats.list.untaken"), linked: t("chats.header.linkedToAccount"), employee: t("chats.header.employee") });
  const contactPath = row.contactId && links.contact ? links.contact(row.contactId) : null;
  const accountPath = row.accountId && links.account ? links.account(row.accountId) : null;

  const onSend = (text: string, done: () => void) => send.mutate({ text, done });
  const onNote = (text: string, done: () => void) => note.mutate({ text, done });
  // La versión es la de cuando se abrió «Pasar» (R01): si una relectura la cambió, el back responde 409.
  const onTransfer = (target: TransferTarget, version: number) => transfer.mutate({ target, version });

  const thread = <MessageThread messages={messages} perspective={{ kind: "team" }} phone={phone} label={t("chats.thread.label", { name })}
    hasEarlier={threadQuery.hasMore} loadingEarlier={threadQuery.isLoadingMore} onLoadEarlier={threadQuery.loadMore}
    review={{ onReview: (message) => review.mutate(message.id), pendingId: review.isPending ? review.variables : null }} />;
  const composer = <ChatComposer key={row.id} state={state} phone={phone} sendPending={send.isPending} notePending={note.isPending}
    onSend={onSend} onNote={onNote} onChooseTemplate={() => setTemplateOpen(true)} onExplain={setNotice} />;
  const dialogs = <>
    {notice ? <ConversationNotice notice={notice} name={name} number={row.channel.displayNumber} messages={messages} onClose={() => setNotice(null)} /> : null}
    {templateOpen ? <TemplateDialog scope={scope} row={row} name={name} onClose={() => setTemplateOpen(false)}
      onSent={() => { void refresh(); }} onConflict={(error) => rejected(error, "send")} /> : null}
    {transferOpen ? <TransferSheet scope={scope} row={row} onTransfer={onTransfer} onClose={() => setTransferOpen(null)} returnFocusTo={transferOpen.trigger} /> : null}
  </>;

  if (phone) {
    const subtitle = descriptors.join(" · ");
    return <Page title={name} backTo={back} phoneBody="flush"
      phoneSubtitle={untaken ? <span className="text-[var(--alerta)]">{subtitle}</span> : subtitle || undefined}
      moreActions={{ label: t("chats.header.actionsOf", { name }), pending: take.isPending, items: [
        // M-Plat-WA-Conversacion: «Ver la cuenta» va primero; en la organización, «Ver ficha del contacto» va al final.
        { label: t("chats.header.viewAccount"), hidden: !accountPath, onSelect: () => { if (accountPath) void navigate(accountPath); } },
        { label: t("chats.header.take"), hidden: !untaken || readOnly, onSelect: () => take.mutate() },
        { label: t("chats.header.transfer"), hidden: readOnly, onSelect: (trigger) => setTransferOpen({ trigger }) },
        { label: t("chats.header.viewContact"), hidden: !contactPath, onSelect: () => { if (contactPath) void navigate(contactPath); } },
      ] }}>
      <AppBarTools placement="leading"><ChatAvatar name={row.contactName} size="bar" /></AppBarTools>
      {thread}
      {composer}
      {dialogs}
    </Page>;
  }

  const subtitle = [...(row.contactName ? [phoneLabel(format, row.displayNumber)] : []), ...descriptors].join(" · ");
  return <section aria-label={name} className="flex min-w-0 flex-1 flex-col">
    <header className="flex min-h-15 shrink-0 items-center gap-3 border-b border-[var(--borde)] py-2 pr-3 pl-4">
      <ChatAvatar name={row.contactName} />
      <div className="flex min-w-0 flex-1 flex-col leading-[1.3]">
        <h2 className="wrap-break-word text-[0.875rem] font-semibold text-[var(--t1)]">{name}</h2>
        {subtitle ? <span className="wrap-break-word text-[0.78125rem] text-[var(--t3)]">{subtitle}</span> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {accountPath ? <Button asChild variant="outline" size="sm"><Link to={accountPath}>{t("chats.header.viewAccount")}</Link></Button> : null}
        {readOnly ? null : untaken
          ? <Button type="button" size="sm" pending={take.isPending} pendingLabel={t("chats.header.taking")} onClick={() => take.mutate()}>{t("chats.header.take")}</Button>
          : <TransferDropdown scope={scope} row={row} pending={transfer.isPending} onTransfer={onTransfer} />}
        <HeaderMenu name={row.contactName ? t("chats.header.actionsOf", { name }) : t("chats.header.chatActions")}
          items={contactPath ? [{ label: t("chats.header.viewContact"), icon: EyeIcon, to: contactPath }] : []} />
      </div>
    </header>
    {thread}
    {composer}
    {dialogs}
  </section>;
}

/** El ⋮ del encabezado del chat en la compu: lo que lleva a otra pantalla, cada opción con su ícono gris («Criterio · Menús»,
 * WA-Chats). Sin nada que ofrecer, no va. */
function HeaderMenu({ name, items }: { name: string; items: readonly { label: string; icon: IconComponent; to: string }[] }) {
  if (items.length === 0) return null;
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><IconButton label={name}><MoreVerticalIcon className="size-4" /></IconButton></DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {items.map(({ label, icon: Icon, to }) => <DropdownMenuItem key={label} asChild><Link to={to}><Icon className="size-4 text-[var(--t3)]" />{label}</Link></DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}

/// El ⓘ de la barra de abajo (WA-Chats «qué significa» y WA-Chats-24h): por qué no se puede responder y qué hacer.
function ConversationNotice({ notice, name, number, messages, onClose }: {
  notice: ComposerNotice;
  name: string;
  /** El número de la organización al que escribió (CC13, `channel.displayNumber`). */
  number: string;
  messages: readonly WhatsAppChatMessageResponse[];
  onClose: () => void;
}) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  const close = (open: boolean) => { if (!open) onClose(); };
  if (notice === "window") {
    const last = lastInbound(messages);
    return <ImportantNotice open onOpenChange={close} title={t("chats.notices.window.title")}
      reason={last && !format.isLoading ? t("chats.notices.window.reason", { name, when: format.formatDateTime(last.createdAtUtc) }) : t("chats.notices.window.reasonUnknown", { name })}
      detail={t("chats.notices.window.detail")} steps={[t("chats.notices.window.stepTemplate"), t("chats.notices.window.stepReply")]} />;
  }
  if (notice === "readOnly") return <ImportantNotice open onOpenChange={close} title={t("chats.notices.readOnly.title", { name })}
    reason={<Trans t={t} i18nKey="chats.notices.readOnly.reason" components={{ number: <PhoneText value={number} /> }} />}
    detail={t("chats.notices.readOnly.detail")} steps={[t("chats.notices.readOnly.step")]} />;
  // Pasadas 24 h solo queda una plantilla, y sin medio de pago no sale; pasado el tope gratis, tampoco una respuesta (D1).
  const template = notice === "paymentTemplate";
  return <ImportantNotice open onOpenChange={close} title={t("chats.notices.payment.title", { name })}
    reason={t("chats.notices.payment.reason")}
    detail={<Trans t={t} i18nKey={template ? "chats.notices.payment.detailTemplate" : "chats.notices.payment.detail"} components={{ number: <PhoneText value={number} /> }} />}
    steps={[t("chats.notices.payment.step"), ...(template ? [t("chats.notices.payment.stepReply", { name })] : [])]} />;
}

/** Que el chat abierto ocupe el alto de la pantalla en la compu: la bandeja y el hilo se desplazan cada uno. */
export function ChatColumns({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex min-h-0 flex-1 bg-[var(--superficie)]", className)}>{children}</div>;
}
