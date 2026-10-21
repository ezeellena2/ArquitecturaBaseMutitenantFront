import { useEffect, useEffectEvent, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { MessageNotSentError } from "@assistant-ui/react";
import type { AssistantAttachmentSummaryResponse, AssistantConversationSummaryResponse, AssistantMessageResponse, SendAssistantMessageRequest } from "@/modules/assistant/api/types";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { toastError } from "@/shared/ui/sonner";
import type { RowAction } from "@/shared/ui/RowActions";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { useFormat } from "@/shared/format/useFormat";
import { CopyIcon, PencilIcon, TrashIcon } from "@/shared/ui/icons";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { acceptAssistantNotice, assistantConversationQueryKey, assistantQueryKeyRoot, createAssistantConversation, deleteAssistantConversation, fetchAssistantConversation, runAssistantQuick, setAssistantFeedback, updateAssistantConversation } from "../api/assistant";
import { deleteAssistantAttachment, downloadAssistantAttachment, uploadAssistantAttachment } from "../api/attachments";
import { exportAssistantConversation } from "../api/export";
import { useAssistantRuntime } from "../runtime/useAssistantRuntime";
import { useAssistantOperations, type AssistantOperationContext, type AssistantConversationOperationContext } from "../hooks/useAssistantOperations";
import { saveAssistantDownload } from "../lib/privateDownload";
import { assistantAttachmentTypes, validateAssistantFiles, type PendingAssistantFile } from "../lib/assistantFiles";
import { type ConversationDialogState } from "../components/ConversationDialog";
import type { AssistantHomeProps } from "../pages/assistantHomeProps";

export function useAssistantSession(props: AssistantHomeProps) {
  const { access, tenantId, userId } = props.scope;
  const scope = useMemo(() => ({ access, tenantId, userId }), [access, tenantId, userId]);
  const { t } = useTranslation("assistant");
  const format = useFormat();
  const client = useQueryClient();
  const { phone } = useAppChrome();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [retentionOpen, setRetentionOpen] = useState(false);
  const [phoneActions, setPhoneActions] = useState<{ title: string | null; items: RowAction[] } | null>(null);
  const historyTrigger = useRef<HTMLButtonElement>(null);
  const restoreHistory = useRestoreFocusOnClose(historyOpen, historyTrigger);
  const restoreRetention = useRestoreFocusOnClose(retentionOpen, historyTrigger);
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
      if (!operations.lifetime.getSnapshot() || !current.state.data?.configured || !current.state.data.noticeAccepted || current.state.data.remainingMessages === 0 || current.state.data.monthlyBudgetProgress?.status === "LimitReached" || current.isPending || operations.pending) throw new MessageNotSentError();
      const text = message.content.filter((part) => part.type === "text").map((part) => part.text).join("\n").trim();
      if (!text || !await send(text, (message.attachments ?? []).map((item) => item.id))) throw new MessageNotSentError();
    },
    adapters: {
      attachments: {
        accept: assistantAttachmentTypes.join(","),
        add: async ({ file }) => {
          operations.lifetime.assertActive();
          const limits = latest.current.state.data;
          if (!limits) throw new MessageNotSentError();
          const id = crypto.randomUUID();
          changeFiles([...filesRef.current, { id, file, ...(validateAssistantFiles([file], 0, limits) === "tooLarge" ? { invalid: "tooLarge" as const } : {}) }]);
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
    setRetentionOpen(false);
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
    const limits = latest.current.state.data;
    if (!limits) return false;
    const issue = validateAssistantFiles(chosen.map((item) => item.file), 0, limits);
    if (issue) { setFileError(invalidFiles.length ? null : t(`attachments.${issue}`, { count: limits.maxAttachments, maxFiles: format.formatInteger(limits.maxAttachments), size: format.formatFileSize(limits.maxAttachmentBytes) })); return false; }
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
  function retryFailed() {
    const original = runtime.messages.findLast((message) => message.role === "user");
    if (!selectedId || !original?.text || !runtime.canSend || operations.pending) return;
    const id = selectedId;
    const copies = original.attachments.map((attachment) => ({ attachment, key: crypto.randomUUID(), version: undefined as number | undefined, uploadedId: undefined as string | undefined }));
    fire(async (context) => {
      let current = await read(id, context);
      for (const copy of copies) {
        if (copy.uploadedId) continue;
        const response = await downloadAssistantAttachment(scope, id, copy.attachment.id, context.signal);
        context.assertActive();
        const mediaType = response.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase();
        if (mediaType !== copy.attachment.mediaType || !(assistantAttachmentTypes as readonly string[]).includes(mediaType)) throw new ApiError(422, { code: "Assistant.Attachment.UnsupportedType" });
        const bytes = await response.arrayBuffer();
        context.assertActive();
        const file = new File([bytes], copy.attachment.fileName, { type: mediaType });
        copy.version ??= current.conversation.version;
        const attachment = await uploadAssistantAttachment(scope, id, { file, conversationVersion: copy.version }, copy.key, context.signal);
        context.assertActive(); copy.uploadedId = attachment.id;
        current = await read(id, context);
      }
      // Ni una descarga ni una subida fallida entrega sólo el texto. El Retry
      // de red del POST final conserva su propio cuerpo y clave en el runtime.
      try { await latest.current.retryFailed({ text: original.text, attachmentIds: copies.map((copy) => copy.uploadedId!), conversationVersion: current.conversation.version }); }
      catch { context.assertActive(); return; }
      context.assertActive();
      await invalidateHistory(context);
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
    const edit = (kind: "rename" | "delete", trigger: HTMLButtonElement | null) => {
      setHistoryOpen(false);
      if (kind === "rename") { setDialog({ kind, conversation, trigger }); return; }
      // Un envío propio ya puede haber cambiado la versión aunque su fila de
      // historial todavía no se haya invalidado. La base se captura al abrir;
      // confirmar conserva esa versión y no reintenta un conflicto posterior.
      fire(async (context) => {
        const current = await read(conversation.id, context);
        setDialog({ kind, conversation: current.conversation, trigger });
      }, conversation.id);
    };
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
      } else await updateAssistantConversation(scope, original.conversation.id, { title, isSaved: original.conversation.isSaved, version: original.conversation.version }, context.signal);
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
  const recoverUnavailable = useEffectEvent(() => { props.onUnavailable?.(); });
  const recoverConversation = useEffectEvent((queryKey: readonly unknown[], error: unknown) => {
    const expected = assistantConversationQueryKey(scope, selectedId ?? "");
    if (expected.slice(0, 6).some((part, index) => part !== queryKey[index])) return;
    if (!selectedId || !operations.lifetime.getSnapshot() || !(error instanceof ApiError) || error.status !== 404) return;
    toastError(apiErrorMessage(error, t));
    // El historial nuevo debe tener su dueño activo antes de la relectura.
    flushSync(() => select(null));
    void client.invalidateQueries({ queryKey: [...root, "conversations"] });
  });
  const unavailable = runtime.state.error instanceof ApiError && [403, 404].includes(runtime.state.error.status);
  useEffect(() => { if (unavailable) recoverUnavailable(); }, [unavailable]);
  useEffect(() => client.getQueryCache().subscribe((event) => {
    if (event.type === "updated" && event.action.type === "error") recoverConversation(event.query.queryKey, event.query.state.error);
  }), [client]);
  return { scope, t, format, phone, selectedId, generation, collapsed, setCollapsed, historyOpen, setHistoryOpen, retentionOpen, setRetentionOpen, phoneActions, setPhoneActions, historyTrigger, restoreHistory, restoreRetention, restoreActions, dialog, files, fileError, fileErrorId, invalidFiles, hasAttachmentError, operations, runtime, state, select, quick, actions, download, retryFailed, acceptNotice, confirmDialog, closeDialog, unavailable, setFileError };
}
