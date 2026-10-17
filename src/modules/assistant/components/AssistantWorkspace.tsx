import { Trans, useTranslation } from "react-i18next";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage, apiErrorMessage, isRateLimitError } from "@/shared/api/errorMessage";
import { useRetryAfterOf } from "@/shared/api/useRetryAfterCountdown";
import { formatCountdown } from "@/shared/format/countdown";
import { FormError } from "@/shared/ui/FormError";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { AppBarTools } from "@/shared/ui/app/AppBarTools";
import { AppIconButton } from "@/shared/ui/app/AppBar";
import { Menu, Plus, Sparkles, SquarePen } from "lucide-react";
import { NumberText } from "@/shared/ui/format/NumberText";
import { ChevronLeftIcon } from "@/shared/ui/icons";
import { AssistantNotice } from "./AssistantNotice";
import { AssistantThread } from "./AssistantThread";
import { AttachmentComposer } from "./AttachmentComposer";
import { assistantAttachmentTypes, validateAssistantFiles } from "../lib/assistantFiles";
import { ConversationList } from "./ConversationList";
import { ConversationDialog } from "./ConversationDialog";
import { LimitReached } from "./LimitReached";
import { NotConfigured } from "./NotConfigured";
import { QuickQueries } from "./QuickQueries";
import { assistantStreamErrorMessage, canRetryAssistantFailure } from "../errors";
import type { AssistantHomeProps } from "../pages/assistantHomeProps";
import type { AssistantStateResponse } from "../api/types";
import type { useAssistantSession } from "../hooks/useAssistantSession";

export function AssistantWorkspace({ props, session, state }: { props: AssistantHomeProps; session: ReturnType<typeof useAssistantSession>; state: AssistantStateResponse }) {
  const { t } = useTranslation("assistant");
  const { scope, format, phone, selectedId, generation, collapsed, setCollapsed, historyOpen, setHistoryOpen, retentionOpen, setRetentionOpen, phoneActions, setPhoneActions, historyTrigger, restoreHistory, restoreRetention, restoreActions, dialog, files, fileError, fileErrorId, invalidFiles, hasAttachmentError, operations, runtime, select, quick, actions, download, retryFailed, acceptNotice, confirmDialog, closeDialog, setFileError } = session;
  const code = runtime.blockedCode ?? (operations.error instanceof ApiError ? operations.error.code : null);
  const configured = state.configured && code !== "Assistant.Settings.NotConfigured";
  const monthly = state.monthlyBudgetProgress?.status === "LimitReached" || code === "Assistant.Limit.MonthlyReached";
  const limited = state.remainingMessages === 0 || code === "Assistant.Limit.DailyReached" || monthly;
  const notice = configured && (!state.noticeAccepted || code === "Assistant.Notice.AcceptanceRequired");
  const busy = operations.pending || runtime.isPending;
  const actionError = actionErrorMessage(operations.error, t);
  // P2 (E9, Asistente-Org «Demasiadas consultas seguidas»): el aviso va arriba de la caja con la cuenta, porque mandar es un
  // ícono; lo escrito queda y mandar vuelve a mano cuando termina.
  const rateLimit = [operations.error, runtime.error].find(isRateLimitError) ?? null;
  const limit = useRetryAfterOf(rateLimit);
  const limitNotice = limit.isRunning ? <FormError tone="warning" message={t("rateLimited", { time: formatCountdown(limit.seconds) })} /> : null;
  const runtimeError = runtime.error && "code" in runtime.error && !runtime.blockedCode && !isRateLimitError(runtime.error)
    ? runtime.error instanceof ApiError ? apiErrorMessage(runtime.error, t)
      : runtime.turn?.start ? null : assistantStreamErrorMessage(runtime.error, t) : null;
  const canViewUsage = scope.access === "business" ? props.hasPermission("assistant.configure") : scope.access === "platform" && props.hasPermission("platform.assistant.read");
  const history = <ConversationList scope={scope} lifetime={operations.lifetime} enabled={operations.active && state.noticeAccepted && code !== "Assistant.Notice.AcceptanceRequired"} selectedId={selectedId} retentionDays={state.retentionDays} onNew={() => select(null)} onSelect={select} actions={actions}
    onRetentionInfo={() => { setHistoryOpen(false); setRetentionOpen(true); }}
    onActions={phone ? (conversation) => { setHistoryOpen(false); setPhoneActions({ title: conversation.title ?? null, items: actions(conversation) }); } : undefined} />;
  const composer = <><AttachmentComposer key={generation} limits={state} files={files} errorId={hasAttachmentError ? fileErrorId : undefined} placeholder={phone ? t("composer.phonePlaceholder") : t(`composer.${scope.access}Placeholder`, { organization: props.organizationName ?? t("composer.organization") })} unavailable={!configured || limited || notice || !!selectedId && !runtime.canSend && !runtime.isPending} sendBlocked={limit.isRunning} pending={busy} canStop={runtime.canStop}
    onFiles={(chosen) => {
      const issue = validateAssistantFiles(chosen, files.length, state);
      // El exceso permitido queda local para corregirlo; no admite un MIME
      // rechazado que la prioridad tooLarge de la validación de lote ocultó.
      const retainOversized = issue === "tooLarge" && chosen.every((file) => (assistantAttachmentTypes as readonly string[]).includes(file.type));
      setFileError(issue && !retainOversized ? t(`attachments.${issue}`, { count: state.maxAttachments, maxFiles: format.formatInteger(state.maxAttachments), size: format.formatFileSize(state.maxAttachmentBytes) }) : null);
      if (!issue || retainOversized) for (const file of chosen) void runtime.runtime.thread.composer.addAttachment(file).catch(() => undefined);
    }}
    onStop={() => { void runtime.stop().catch(() => undefined); }} />
      {state.remainingMessages != null && state.remainingMessages > 0 && state.remainingMessages <= 10 ? <p className="pb-3 text-center text-sm text-[var(--t2)]"><Trans ns="assistant" i18nKey="limit.remaining" count={state.remainingMessages} components={{ remaining: <NumberText value={state.remainingMessages} /> }} /></p> : null}
      {hasAttachmentError ? <p id={fileErrorId} role="alert" className="px-5 pb-3 text-[var(--peligro)]">{fileError ? <span className="block">{fileError}</span> : null}{invalidFiles.map(({ id, file }) =>
        <span key={id} id={`${fileErrorId}-${id}`} className="block">{t("attachments.tooLargeNamed", { name: file.name, size: format.formatFileSize(state.maxAttachmentBytes) })}</span>)}</p> : null}
    </>;
  const queries = <QuickQueries scope={scope} queries={state.quickQueries} disabled={busy || notice} onSelect={quick} />;
  return <AssistantRuntimeProvider runtime={runtime.runtime}><div className="relative flex min-h-0 flex-1 overflow-hidden text-[var(--t1)]">
    {!phone ? <aside aria-label={t("history.title")} className={`${collapsed ? "w-14" : "w-[264px]"} shrink-0 border-r border-[var(--borde)] bg-[var(--lado-activo)]`}>
      <Button variant="icon" size="icon" className={`absolute top-5 z-10 size-7 rounded-full border border-[var(--borde2)] bg-[var(--lado-activo)] shadow-[var(--sombra-flecha)] ${collapsed ? "left-[42px]" : "left-[250px]"}`} aria-label={t(collapsed ? "history.show" : "history.hide")} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}><ChevronLeftIcon className={`size-[18px] ${collapsed ? "rotate-180" : ""}`} /></Button>
      {collapsed ? <Button variant="icon" size="icon" className="m-3 mt-14" aria-label={t("history.new")} onClick={() => select(null)}><Plus className="size-[18px]" /></Button> : history}
    </aside> : null}
    <section aria-label={t("title")} className="flex min-h-0 min-w-0 flex-1 flex-col">
      {props.banner}
      {phone ? <><AppBarTools placement="leading"><AppIconButton ref={historyTrigger} label={t("history.title")} onClick={() => setHistoryOpen(true)}><Menu className="size-[22px]" /></AppIconButton></AppBarTools><AppBarTools><AppIconButton label={t("history.new")} onClick={() => select(null)}><SquarePen className="size-[22px]" /></AppIconButton></AppBarTools></> : null}
      {!configured ? <div className="min-h-0 flex-1 overflow-auto px-5 py-7 md:px-8"><div className="mx-auto flex max-w-[760px] flex-col gap-3.5 max-md:h-full max-md:justify-center"><NotConfigured canConfigure={state.canConfigure} onConfigure={props.onConfigure} />{props.children}</div></div> : <>
        {selectedId ? <AssistantThread turn={runtime.turn} turnPending={runtime.isPending} messages={runtime.messages} links={{ scope, hasPermission: props.hasPermission, organizationIds: props.organizationIds, organizationNames: props.organizationNames, onOpenOrganization: props.onOpenOrganization }} canOpenLink={props.canOpenLink} pending={busy}
          onDownload={download} retry={runtime.messages.at(-1)?.status === "Failed" && runtime.canSend && canRetryAssistantFailure(runtime.turn?.error) ? { messageId: runtime.messages.at(-1)!.id, retryAfter: runtime.turn?.error?.retryAfter, onRetry: retryFailed } : undefined} /> : <div className="min-h-0 flex-1 overflow-auto px-5 py-7 md:px-8"><div className="mx-auto flex max-w-[760px] flex-col gap-3.5 max-md:min-h-full max-md:justify-center"><div className="mb-1 flex items-center justify-center gap-3 max-md:flex-col"><span className="flex size-9 items-center justify-center rounded-full bg-[var(--marca-t)] text-[var(--marca-tx)]"><Sparkles className="size-5" aria-hidden="true" /></span><h2 className="text-center text-[26px] font-semibold">{t("welcome")}</h2></div>{props.welcome}{!phone ? limited ? <LimitReached organizationName={props.organizationName} monthly={monthly} state={state} onUsage={canViewUsage ? props.onUsage : undefined} /> : <>{limitNotice}{composer}</> : null}{queries}{props.children}</div></div>}
        {selectedId || phone ? <div className="mx-auto flex w-full max-w-[824px] shrink-0 flex-col gap-3 px-5 pb-4 md:px-8">{limited ? <LimitReached organizationName={props.organizationName} monthly={monthly} state={state} onUsage={canViewUsage ? props.onUsage : undefined} /> : <>{limitNotice}{composer}</>}</div> : null}
      </>}
      {actionError && !dialog && !notice ? <p role="alert" className="px-5 pb-3 text-[var(--peligro)]">{actionError}</p> : null}
      {runtimeError ? <p role="alert" className="px-5 pb-3 text-[var(--peligro)]">{runtimeError}</p> : null}
      {runtime.error instanceof ApiError && runtime.error.isNetworkError ? <Button variant="link" onClick={() => { void runtime.retryNetwork().catch(() => undefined); }}>{t("retry")}</Button> : null}
    </section>
    {phone && historyOpen && !notice ? <Dialog open onOpenChange={setHistoryOpen}><DialogContent aria-describedby={undefined} onCloseAutoFocus={restoreHistory}><DialogHeader><DialogTitle>{t("history.title")}</DialogTitle></DialogHeader><DialogBody>{history}</DialogBody></DialogContent></Dialog> : null}
    {phone && phoneActions && !notice ? <Dialog open onOpenChange={(open) => { if (!open) setPhoneActions(null); }}><DialogContent size="sm" aria-describedby={undefined} onCloseAutoFocus={restoreActions}>
      <DialogHeader><DialogTitle>{phoneActions.title ?? t("history.untitled")}</DialogTitle></DialogHeader>
      <div role="menu" className="flex flex-col pb-5">{phoneActions.items.map((action) => <button key={action.label} type="button" role="menuitem" aria-label={action.accessibleName}
        className={`min-h-[54px] border-t border-[var(--borde)] px-5 text-left text-[16.5px] ${"destructive" in action && action.destructive ? "text-[var(--peligro)]" : "text-[var(--t1)]"}`}
        onClick={() => { setPhoneActions(null); action.onSelect(historyTrigger.current); }}>{action.label}</button>)}</div>
    </DialogContent></Dialog> : null}
    {retentionOpen && !notice ? <Dialog open onOpenChange={setRetentionOpen}><DialogContent size="sm" onCloseAutoFocus={restoreRetention}>
      <DialogHeader><DialogTitle>{t("history.recent")}</DialogTitle></DialogHeader>
      <DialogBody><DialogDescription>{t("history.retention", { days: format.formatInteger(state.retentionDays) })}</DialogDescription></DialogBody>
      <DialogFooter><Button onClick={() => setRetentionOpen(false)}>{t("common:notice.understood")}</Button></DialogFooter>
    </DialogContent></Dialog> : null}
    {notice ? <AssistantNotice pending={operations.pending} error={actionError} onAccept={acceptNotice} onPrivacy={props.onPrivacy} /> : null}
    {dialog && !notice ? <ConversationDialog value={dialog} pending={operations.pending} error={actionError} onClose={closeDialog} onConfirm={confirmDialog} /> : null}
  </div></AssistantRuntimeProvider>;
}
