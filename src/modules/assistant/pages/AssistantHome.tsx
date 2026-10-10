import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Trans, useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { AssistantRuntimeProvider, MessageNotSentError } from "@assistant-ui/react";
import type { AssistantAttachmentSummaryResponse, AssistantConversationSummaryResponse, AssistantMessageResponse, AssistantRouteKey, SendAssistantMessageRequest } from "@/shared/api/types";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage, apiErrorMessage } from "@/shared/api/errorMessage";
import { Button } from "@/shared/ui/button";
import type { RowAction } from "@/shared/ui/RowActions";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { AppBarTools } from "@/shared/ui/app/AppBarTools";
import { AppIconButton } from "@/shared/ui/app/AppBar";
import { Menu, Plus, Sparkles, SquarePen } from "lucide-react";
import { NumberText } from "@/shared/ui/format/NumberText";
import { ForbiddenPage } from "@/shared/ui/ForbiddenPage";
import { NotFoundPage } from "@/shared/ui/NotFoundPage";
import { ChevronLeftIcon, CopyIcon, PencilIcon, TrashIcon } from "@/shared/ui/icons";
import { homeOf } from "@/tenancy/access";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { acceptAssistantNotice, assistantConversationQueryKey, assistantQueryKeyRoot, createAssistantConversation, deleteAssistantConversation, fetchAssistantConversation, runAssistantQuick, setAssistantFeedback, updateAssistantConversation, type AssistantScope } from "../api/assistant";
import { deleteAssistantAttachment, downloadAssistantAttachment, uploadAssistantAttachment } from "../api/attachments";
import { exportAssistantConversation } from "../api/export";
import { useAssistantRuntime } from "../runtime/useAssistantRuntime";
import { useAssistantOperations, type AssistantOperationContext, type AssistantConversationOperationContext } from "../hooks/useAssistantOperations";
import { saveAssistantDownload } from "../lib/privateDownload";
import { AssistantNotice } from "../components/AssistantNotice";
import { AssistantThread } from "../components/AssistantThread";
import { AttachmentComposer } from "../components/AttachmentComposer";
import { assistantAttachmentTypes, validateAssistantFiles, type PendingAssistantFile } from "../lib/assistantFiles";
import { ConversationList } from "../components/ConversationList";
import { ConversationDialog, type ConversationDialogState } from "../components/ConversationDialog";
import { LimitReached } from "../components/LimitReached";
import { NotConfigured } from "../components/NotConfigured";
import { QuickQueries } from "../components/QuickQueries";
import { AssistantRetryButton } from "../components/AssistantRetryButton";
import { assistantStreamErrorMessage, canRetryAssistantFailure } from "../errors";

export interface AssistantHomeProps {
  scope: AssistantScope;
  enabled: boolean;
  /** El núcleo compone bienvenida, indicadores y Para resolver. */
  welcome?: ReactNode;
  /** Avisos del núcleo que siguen visibles con una conversación abierta. */
  banner?: ReactNode;
  children?: ReactNode;
  hasPermission: (permission: string) => boolean;
  canOpenLink?: (routeKey: AssistantRouteKey) => boolean;
  onConfigure?: () => void;
  onUsage?: () => void;
  onPrivacy: () => void;
  organizationName?: string;
  organizationIds?: readonly string[];
  organizationNames?: Readonly<Record<string, string>>;
  onOpenOrganization?: (id: string) => void;
}

export function AssistantHome(props: AssistantHomeProps) {
  if (!props.enabled) return null;
  return <AssistantSession key={`${props.scope.access}:${props.scope.tenantId}:${props.scope.userId}`} {...props} />;
}

function AssistantSession(props: AssistantHomeProps) {
  const { access, tenantId, userId } = props.scope;
  const scope = useMemo(() => ({ access, tenantId, userId }), [access, tenantId, userId]);
  const { t } = useTranslation("assistant");
  const client = useQueryClient();
  const { phone } = useAppChrome();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [phoneActions, setPhoneActions] = useState<{ title: string | null; items: RowAction[] } | null>(null);
  const historyTrigger = useRef<HTMLButtonElement>(null);
  const restoreHistory = useRestoreFocusOnClose(historyOpen, historyTrigger);
  const restoreActions = useRestoreFocusOnClose(!!phoneActions, historyTrigger);
  const [dialog, setDialog] = useState<ConversationDialogState | null>(null);
  const dialogRef = useRef(dialog);
  useLayoutEffect(() => { dialogRef.current = dialog; }, [dialog]);
  const [files, setFiles] = useState<PendingAssistantFile[]>([]);
  const filesRef = useRef(files);
  function changeFiles(items: PendingAssistantFile[]) { filesRef.current = items; setFiles(items); }
  const [fileError, setFileError] = useState<string | null>(null);
  const fileErrorId = useId();
  const invalidFiles = files.filter((item) => item.invalid);
  const hasAttachmentError = invalidFiles.length > 0 || !!fileError;
  const operations = useAssistantOperations(scope, generation);
  const runtime = useAssistantRuntime({ scope, conversationId: selectedId, enabled: true, ui: {
    onNew: async (message) => {
      const current = latest.current;
      if (!operations.lifetime.getSnapshot() || !current.state.data?.configured || !current.state.data.noticeAccepted || current.state.data.remainingMessages === 0 || current.isPending || operations.pending) throw new MessageNotSentError();
      const text = message.content.filter((part) => part.type === "text").map((part) => part.text).join("\n").trim();
      if (!text || !await send(text, (message.attachments ?? []).map((item) => item.id))) throw new MessageNotSentError();
    },
    adapters: {
      attachments: {
        accept: assistantAttachmentTypes.join(","),
        add: async ({ file }) => {
          operations.lifetime.assertActive();
          const id = crypto.randomUUID();
          changeFiles([...filesRef.current, { id, file, ...(validateAssistantFiles([file], 0) === "tooLarge" ? { invalid: "tooLarge" as const } : {}) }]);
          return { id, file, name: file.name, contentType: file.type, type: file.type.startsWith("image/") ? "image" : "document", status: { type: "requires-action", reason: "composer-send" } };
        },
        // Los bytes se suben una sola vez, con la versión releída, en send.
        send: async (attachment) => ({ ...attachment, status: { type: "complete" }, content: [] }),
        remove: async (attachment) => { if (operations.lifetime.getSnapshot()) await removeFile(attachment.id); },
      },
      feedback: { submit: ({ message, type }) => {
        const durable = latest.current.messages.find((item) => item.id === message.id);
        if (durable) { const rating = type === "positive" ? "up" : "down"; feedback(durable, durable.rating === rating ? null : rating); }
      } },
    },
  } });
  const latest = useRef(runtime);
  useLayoutEffect(() => { latest.current = runtime; });
  const detail = runtime.detail.data;
  const state = runtime.state.data;
  const root = assistantQueryKeyRoot(scope);
  const pendingKey = (id: string) => [...root, "pendingAttachments", id] as const;
  useEffect(() => operations.lifetime.subscribe(() => {
    if (!operations.lifetime.getSnapshot()) { changeFiles([]); void latest.current.runtime.thread.composer.reset(); setDialog(null); setPhoneActions(null); setFileError(null); }
  }), [operations.lifetime]);
  useEffect(() => () => { client.removeQueries({ queryKey: assistantQueryKeyRoot(scope) }); }, [client, scope]);

  function select(id: string | null) {
    operations.lifetime.close();
    setGeneration((value) => value + 1);
    setSelectedId(id);
    changeFiles([]);
    setFileError(null);
    setHistoryOpen(false);
    setPhoneActions(null);
    setDialog(null);
    client.removeQueries({ queryKey: [...root, "pendingAttachments"] });
  }
  async function read(id: string, context: AssistantOperationContext) {
    const result = await client.fetchQuery({ queryKey: assistantConversationQueryKey(scope, id), staleTime: 0,
      queryFn: async ({ signal }) => {
        const data = await fetchAssistantConversation(scope, id, {}, AbortSignal.any([signal, context.signal]));
        context.assertActive(); signal.throwIfAborted(); return data;
      }, meta: { silent: true },
    });
    context.assertActive();
    return result;
  }
  function adopt(id: string, context: AssistantOperationContext) {
    context.assertActive();
    // Mantiene el dueño del recorrido inicial; React publica el runtime de la
    // conversación real antes de entregar exactamente un primer mensaje.
    flushSync(() => setSelectedId(id));
    context.assertActive();
  }
  const fire = (work: (context: AssistantConversationOperationContext) => Promise<void>, conversationId?: string | null) => { void operations.run(work, conversationId).catch(() => undefined); };
  async function invalidateHistory(context: AssistantOperationContext) {
    await client.invalidateQueries({ queryKey: [...root, "conversations"] });
    context.assertActive();
  }
  function acceptNotice() {
    const noticeVersion = state!.noticeVersion;
    fire(async (context) => {
      await acceptAssistantNotice(scope, { noticeVersion }, context.key, context.signal);
      context.assertActive();
      await latest.current.refreshState();
      context.assertActive();
    });
  }
  function quick(key: string) {
    const request = { conversationId: selectedId, version: detail?.conversation.version };
    fire(async (context) => {
      const result = await runAssistantQuick(scope, key, request, context.key, context.signal);
      context.assertActive();
      context.ownConversation(result.conversation.id);
      await read(result.conversation.id, context);
      adopt(result.conversation.id, context);
      await latest.current.detail.refetch();
      context.assertActive();
      await invalidateHistory(context);
    }, selectedId);
  }
  async function send(text: string, attachmentIds: readonly string[]): Promise<boolean> {
    const chosen = filesRef.current.filter((item) => attachmentIds.includes(item.id));
    const issue = validateAssistantFiles(chosen.map((item) => item.file), 0);
    if (issue) { setFileError(invalidFiles.length ? null : t(`attachments.${issue}`)); return false; }
    setFileError(null);
    let id = selectedId;
    let created = false;
    let delivered = false;
    const existing = id ? client.getQueryData<Record<string, AssistantAttachmentSummaryResponse>>(pendingKey(id)) : undefined;
    const uploads = chosen.map((item) => ({ ...item, key: crypto.randomUUID(), version: undefined as number | undefined, attachmentId: existing?.[item.id]?.id }));
    try {
      await operations.run(async (context) => {
        if (!id) {
          const summary = await createAssistantConversation(scope, {}, context.key, context.signal);
          context.assertActive(); id = summary.id; created = true;
        }
        context.ownConversation(id);
        let current = await read(id, context);
        if (created) adopt(id, context);
        for (const upload of uploads) {
          if (upload.attachmentId) continue;
          upload.version ??= current.conversation.version;
          const attachment = await uploadAssistantAttachment(scope, id, { file: upload.file, conversationVersion: upload.version }, upload.key, context.signal);
          context.assertActive(); upload.attachmentId = attachment.id;
          client.setQueryData<Record<string, AssistantAttachmentSummaryResponse>>(pendingKey(id), (previous) => ({ ...previous, [upload.id]: attachment }));
          current = await read(id, context);
        }
        context.assertActive();
        if (!delivered) {
          const request: SendAssistantMessageRequest = { text, attachmentIds: uploads.flatMap((item) => item.attachmentId ? [item.attachmentId] : []), conversationVersion: current.conversation.version };
          const sentIds = new Set(chosen.map((item) => item.id));
          // El envío tiene su propio Retry inmutable en el runtime. El Retry de
          // preparar/adjuntar jamás vuelve a emitir un mensaje ya entregado.
          try { await latest.current.send(request, () => {
            context.assertActive();
            delivered = true;
            changeFiles(filesRef.current.filter((item) => !sentIds.has(item.id)));
            client.removeQueries({ queryKey: pendingKey(id!), exact: true });
            // Retry de red pudo devolver el borrador al SDK. La admisión quita
            // sólo esa consulta; conserva cualquier edición/archivo posterior.
            const composer = latest.current.runtime.thread.composer;
            if (composer.getState().text.trim() === text) composer.setText("");
            const attachments = composer.getState().attachments;
            for (let index = attachments.length - 1; index >= 0; index--) if (sentIds.has(attachments[index]!.id)) void composer.getAttachmentByIndex(index).remove().catch(() => undefined);
          }); }
          catch { context.assertActive(); return; }
          context.assertActive();
        }
        await invalidateHistory(context);
      }, selectedId);
      return delivered;
    } catch { return false; }
  }
  async function removeFile(fileId: string) {
    const attachment = selectedId ? client.getQueryData<Record<string, AssistantAttachmentSummaryResponse>>(pendingKey(selectedId))?.[fileId] : undefined;
    if (!attachment || !selectedId) { changeFiles(filesRef.current.filter((item) => item.id !== fileId)); return; }
    const id = selectedId;
    await operations.run(async (context) => {
      await deleteAssistantAttachment(scope, id, attachment.id, attachment.version, context.signal);
      context.assertActive();
      changeFiles(filesRef.current.filter((item) => item.id !== fileId));
      await read(id, context);
    }, id);
  }
  function feedback(message: AssistantMessageResponse, rating: "up" | "down" | null) {
    if (!selectedId) return;
    const id = selectedId;
    fire(async (context) => {
      await setAssistantFeedback(scope, id, message.id, { rating, version: message.version }, context.signal);
      context.assertActive(); await latest.current.detail.refetch(); context.assertActive();
    }, id);
  }
  function download(attachment: AssistantAttachmentSummaryResponse) {
    if (!selectedId) return;
    const id = selectedId;
    fire(async (context) => {
      const response = await downloadAssistantAttachment(scope, id, attachment.id, context.signal);
      context.assertActive();
      await saveAssistantDownload(response, attachment.fileName, assistantAttachmentTypes, context);
    }, id);
  }
  function exportConversation(conversation: AssistantConversationSummaryResponse, format: "markdown" | "pdf") {
    fire(async (context) => {
      const response = await exportAssistantConversation(scope, conversation.id, { format }, context.signal);
      context.assertActive();
      await saveAssistantDownload(response, `${conversation.title ?? t("history.untitled")}.${format === "pdf" ? "pdf" : "md"}`, [format === "pdf" ? "application/pdf" : "text/markdown"], context);
    }, conversation.id);
  }
  function actions(conversation: AssistantConversationSummaryResponse) {
    const title = conversation.title ?? t("history.untitled");
    const edit = (kind: "rename" | "delete", trigger: HTMLButtonElement | null) => { setHistoryOpen(false); setDialog({ kind, conversation, trigger }); };
    return [
      { label: t(conversation.isSaved ? "history.unsave" : "history.save"), accessibleName: t(conversation.isSaved ? "history.unsave" : "history.save"), icon: CopyIcon, onSelect: () => fire(async (context) => {
        await updateAssistantConversation(scope, conversation.id, { isSaved: !conversation.isSaved, version: conversation.version }, context.signal);
        context.assertActive(); await invalidateHistory(context);
        if (selectedId === conversation.id) { await latest.current.detail.refetch(); context.assertActive(); }
      }, conversation.id) },
      { label: t("history.rename"), accessibleName: t("history.rename"), icon: PencilIcon, onSelect: (trigger: HTMLButtonElement | null) => edit("rename", trigger) },
      ...(["markdown", "pdf"] as const).map((format) => ({ label: t(`history.export.${format}`), accessibleName: t(`history.export.${format}`), icon: CopyIcon, onSelect: () => exportConversation(conversation, format) })),
      { label: t("history.delete"), accessibleName: t("history.delete"), icon: TrashIcon, destructive: true, onSelect: (trigger: HTMLButtonElement | null) => edit("delete", trigger) },
    ].map((action) => ({ ...action, accessibleName: `${action.accessibleName}: ${title}` }));
  }
  function confirmDialog(title: string) {
    if (!dialog) return;
    const original = dialog;
    fire(async (context) => {
      const assertDialog = () => { context.assertActive(); if (dialogRef.current !== original) throw new DOMException("", "AbortError"); };
      assertDialog();
      if (original.kind === "delete") {
        await deleteAssistantConversation(scope, original.conversation.id, original.conversation.version, context.signal);
        assertDialog();
        operations.retireConversation(original.conversation.id);
        client.removeQueries({ queryKey: [...root, "detail", original.conversation.id] });
        if (selectedId === original.conversation.id) {
          // Publica la selección vacía y limpia runtime/streams/previews antes
          // de cualquier espera: los Retry del recurso ya borrado vencen acá.
          flushSync(() => select(null));
          void client.invalidateQueries({ queryKey: [...root, "conversations"] });
          return;
        }
      } else await updateAssistantConversation(scope, original.conversation.id, { title, version: original.conversation.version }, context.signal);
      assertDialog();
      await invalidateHistory(context);
      assertDialog();
      if (original.kind === "rename" && selectedId === original.conversation.id) { await latest.current.detail.refetch(); context.assertActive(); }
      setDialog(null);
    }, original.kind === "delete" ? undefined : original.conversation.id);
  }
  function closeDialog() {
    dialogRef.current = null;
    setDialog(null);
    if (operations.error instanceof ApiError && operations.error.code === "General.ConcurrencyConflict") {
      fire(async (context) => { await invalidateHistory(context); if (selectedId) { await latest.current.detail.refetch(); context.assertActive(); } });
    }
  }
  if (!operations.active) return null;
  const error = runtime.state.error ?? runtime.detail.error;
  if (error instanceof ApiError && error.status === 403) return <ForbiddenPage homePath={homeOf(scope.access)} />;
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage homePath={homeOf(scope.access)} />;
  if (error) return <div role="alert"><p>{apiErrorMessage(error, t)}</p><Button onClick={() => { void runtime.state.refetch(); if (selectedId) void runtime.detail.refetch(); }}>{t("retry")}</Button></div>;
  if (!state) return <p role="status">{t("loading")}</p>;
  const code = runtime.blockedCode ?? (operations.error instanceof ApiError ? operations.error.code : null);
  const configured = state.configured && code !== "Assistant.Settings.NotConfigured";
  const limited = state.remainingMessages === 0 || code === "Assistant.Limit.DailyReached" || code === "Assistant.Limit.MonthlyReached";
  const notice = configured && (!state.noticeAccepted || code === "Assistant.Notice.AcceptanceRequired");
  const busy = operations.pending || runtime.isPending;
  const actionError = actionErrorMessage(operations.error, t);
  const runtimeError = runtime.error && "code" in runtime.error && !runtime.blockedCode
    ? runtime.error instanceof ApiError ? apiErrorMessage(runtime.error, t)
      : runtime.turn?.start ? null : assistantStreamErrorMessage(runtime.error, t) : null;
  const canViewUsage = scope.access === "business" ? props.hasPermission("assistant.configure") : scope.access === "platform" && props.hasPermission("platform.assistant.read");
  const history = <ConversationList scope={scope} lifetime={operations.lifetime} enabled={operations.active} selectedId={selectedId} retentionDays={state.retentionDays} onNew={() => select(null)} onSelect={select} actions={actions}
    onActions={phone ? (conversation) => { setHistoryOpen(false); setPhoneActions({ title: conversation.title ?? null, items: actions(conversation) }); } : undefined} />;
  const composer = <AttachmentComposer key={generation} files={files} errorId={hasAttachmentError ? fileErrorId : undefined} placeholder={phone ? t("composer.phonePlaceholder") : t(`composer.${scope.access}Placeholder`, { organization: props.organizationName ?? t("composer.organization") })} unavailable={!configured || limited || notice || !!selectedId && !runtime.canSend && !runtime.isPending} pending={busy} canStop={runtime.canStop}
    onFiles={(chosen) => {
      const issue = validateAssistantFiles(chosen, files.length);
      // El exceso permitido queda local para corregirlo; no admite un MIME
      // rechazado que la prioridad tooLarge de la validación de lote ocultó.
      const retainOversized = issue === "tooLarge" && chosen.every((file) => (assistantAttachmentTypes as readonly string[]).includes(file.type));
      setFileError(issue && !retainOversized ? t(`attachments.${issue}`) : null);
      if (!issue || retainOversized) for (const file of chosen) void runtime.runtime.thread.composer.addAttachment(file).catch(() => undefined);
    }}
    onStop={() => { void runtime.stop().catch(() => undefined); }} />;
  const queries = <QuickQueries scope={scope} queries={state.quickQueries} disabled={busy || notice} onSelect={quick} />;
  return <AssistantRuntimeProvider runtime={runtime.runtime}><div className="relative flex min-h-0 flex-1 overflow-hidden text-[var(--t1)]">
    {!phone ? <aside aria-label={t("history.title")} className={`${collapsed ? "w-14" : "w-[264px]"} shrink-0 border-r border-[var(--borde)] bg-[var(--lado-activo)]`}>
      <Button variant="icon" size="icon" className={`absolute top-5 z-10 size-7 rounded-full border border-[var(--borde2)] bg-[var(--lado-activo)] shadow-[var(--sombra-flecha)] ${collapsed ? "left-[42px]" : "left-[250px]"}`} aria-label={t(collapsed ? "history.show" : "history.hide")} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}><ChevronLeftIcon className={`size-[18px] ${collapsed ? "rotate-180" : ""}`} /></Button>
      {collapsed ? <Button variant="icon" size="icon" className="m-3 mt-14" aria-label={t("history.new")} onClick={() => select(null)}><Plus className="size-[18px]" /></Button> : history}
    </aside> : null}
    <section aria-label={t("title")} className="flex min-h-0 min-w-0 flex-1 flex-col">
      {props.banner}
      {phone ? <><AppBarTools placement="leading"><AppIconButton ref={historyTrigger} label={t("history.title")} onClick={() => setHistoryOpen(true)}><Menu className="size-[22px]" /></AppIconButton></AppBarTools><AppBarTools><AppIconButton label={t("history.new")} onClick={() => select(null)}><SquarePen className="size-[22px]" /></AppIconButton></AppBarTools></> : null}
      {!configured ? <div className="min-h-0 flex-1 overflow-auto px-5 py-7 md:px-8"><div className="mx-auto flex max-w-[760px] flex-col gap-3.5"><NotConfigured canConfigure={state.canConfigure} onConfigure={props.onConfigure} />{props.children}</div></div> : <>
        {selectedId ? <AssistantThread turn={runtime.turn} turnPending={runtime.isPending} messages={runtime.messages} links={{ scope, hasPermission: props.hasPermission, organizationIds: props.organizationIds, organizationNames: props.organizationNames, onOpenOrganization: props.onOpenOrganization }} canOpenLink={props.canOpenLink} pending={busy}
          onDownload={download} /> : <div className="min-h-0 flex-1 overflow-auto px-5 py-7 md:px-8"><div className="mx-auto flex max-w-[760px] flex-col gap-3.5"><div className="mb-1 flex items-center justify-center gap-3 max-md:flex-col"><span className="flex size-9 items-center justify-center rounded-full bg-[var(--marca-t)] text-[var(--marca-tx)]"><Sparkles className="size-5" aria-hidden="true" /></span><h2 className="text-center text-[26px] font-semibold">{t("welcome")}</h2></div>{props.welcome}{!phone ? limited ? <LimitReached monthly={code === "Assistant.Limit.MonthlyReached"} state={state} onUsage={canViewUsage ? props.onUsage : undefined} /> : composer : null}{queries}{props.children}</div></div>}
        {selectedId || phone ? <div className="mx-auto flex w-full max-w-[824px] flex-col gap-3 px-5 pb-4 md:px-8">{limited ? <LimitReached monthly={code === "Assistant.Limit.MonthlyReached"} state={state} onUsage={canViewUsage ? props.onUsage : undefined} /> : composer}</div> : null}
      </>}
      {state.remainingMessages != null && state.remainingMessages > 0 && state.remainingMessages <= 10 ? <p className="pb-3 text-center text-sm text-[var(--t2)]"><Trans ns="assistant" i18nKey="limit.remaining" components={{ remaining: <NumberText value={state.remainingMessages} /> }} /></p> : null}
      {hasAttachmentError ? <p id={fileErrorId} role="alert" className="px-5 pb-3 text-[var(--peligro)]">{fileError ? <span className="block">{fileError}</span> : null}{invalidFiles.map(({ id, file }) =>
        <span key={id} id={`${fileErrorId}-${id}`} className="block">{t("attachments.tooLargeNamed", { name: file.name })}</span>)}</p> : null}
      {actionError && !dialog && !notice ? <p role="alert" className="px-5 pb-3 text-[var(--peligro)]">{actionError}</p> : null}
      {runtimeError ? <p role="alert" className="px-5 pb-3 text-[var(--peligro)]">{runtimeError}</p> : null}
      {runtime.error instanceof ApiError && runtime.error.isNetworkError ? <Button variant="link" onClick={() => { void runtime.retryNetwork().catch(() => undefined); }}>{t("retry")}</Button> : null}
      {runtime.messages.at(-1)?.status === "Failed" && runtime.canSend && canRetryAssistantFailure(runtime.turn?.error) ? <AssistantRetryButton key={runtime.turn?.start?.turnId ?? runtime.messages.at(-1)?.id} retryAfter={runtime.turn?.error?.retryAfter} pending={busy} onRetry={() => { const text = runtime.messages.findLast((message) => message.role === "user")?.text; if (text) void runtime.retryFailed({ text, attachmentIds: [], conversationVersion: detail?.conversation.version }).catch(() => undefined); }} /> : null}
    </section>
    {phone && historyOpen && !notice ? <Dialog open onOpenChange={setHistoryOpen}><DialogContent aria-describedby={undefined} onCloseAutoFocus={restoreHistory}><DialogHeader><DialogTitle>{t("history.title")}</DialogTitle></DialogHeader><DialogBody>{history}</DialogBody></DialogContent></Dialog> : null}
    {phone && phoneActions && !notice ? <Dialog open onOpenChange={(open) => { if (!open) setPhoneActions(null); }}><DialogContent size="sm" showCloseButton={false} aria-describedby={undefined} onCloseAutoFocus={restoreActions}>
      <DialogHeader><DialogTitle>{phoneActions.title ?? t("history.untitled")}</DialogTitle></DialogHeader>
      <div role="menu" className="flex flex-col pb-5">{phoneActions.items.map((action) => <button key={action.label} type="button" role="menuitem" aria-label={action.accessibleName}
        className={`min-h-[54px] border-t border-[var(--borde)] px-5 text-left text-[16.5px] ${"destructive" in action && action.destructive ? "text-[var(--peligro)]" : "text-[var(--t1)]"}`}
        onClick={() => { setPhoneActions(null); action.onSelect(historyTrigger.current); }}>{action.label}</button>)}</div>
    </DialogContent></Dialog> : null}
    {notice ? <AssistantNotice pending={operations.pending} error={actionError} onAccept={acceptNotice} onPrivacy={props.onPrivacy} /> : null}
    {dialog && !notice ? <ConversationDialog value={dialog} pending={operations.pending} error={actionError} onClose={closeDialog} onConfirm={confirmDialog} /> : null}
  </div></AssistantRuntimeProvider>;
}
