import { zodResolver } from "@hookform/resolvers/zod";
import { useIsMutating, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { PlatformRecoveryResponse, VersionResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useFormat } from "@/shared/format/useFormat";
import { useDialogFailure } from "@/shared/hooks/useDialogFailure";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/button";
import { DetailGrid } from "@/shared/ui/DetailGrid";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Textarea } from "@/shared/ui/textarea";
import { changeRecovery, recoveriesQueryRoot, type RecoveryAction } from "../api/recoveries";
import { recoveryStatusTones } from "../columns";
import { recoveryActionError, recoveryStateConflictCodes } from "../errors";

export interface RecoveryOperation { id: string; action: RecoveryAction; version: number; reason: string; draft: number }
function sameOperation(previous: RecoveryOperation, next: RecoveryOperation) { return previous.id === next.id && previous.action === next.action && previous.version === next.version && previous.reason === next.reason && previous.draft === next.draft; }

// El dueño nativo se desmonta al abandonar el borrador o la elección. Un Retry viejo conserva
// su propia clave abortada y no puede rotar la clave del dueño nuevo; el formulario queda afuera.
function RecoveryMutationOwner({ operation, operationId, execute }: {
  operation: RecoveryOperation; operationId: string; execute: (operation: RecoveryOperation, key: string) => Promise<VersionResponse>;
}) {
  const { mutate } = useIdempotentMutation(execute, { meta: { recoveryReview: operationId }, sameOperation });
  useEffect(() => {
    let mounted = true;
    // En StrictMode la primera preparación se limpia antes de enviar; el dueño definitivo envía una vez.
    queueMicrotask(() => { if (mounted) mutate(operation); });
    return () => { mounted = false; };
  }, [mutate, operation]);
  return null;
}

export function ReviewRecoveryDialog({ recovery, returnFocusTo, onClose, onResolved }: {
  recovery: PlatformRecoveryResponse; returnFocusTo: HTMLElement | null; onClose: () => void; onResolved: (response: VersionResponse, operation: RecoveryOperation) => void;
}) {
  const { t } = useTranslation(["platformRecoveries", "common"]); const format = useFormat(); const { phone } = useAppChrome(); const client = useQueryClient();
  const operationId = useId(); const active = useRef(true); const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  const [submittedAction, setSubmittedAction] = useState<RecoveryAction | null>(null);
  const [operation, setOperation] = useState<RecoveryOperation | null>(null);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const pending = recovery.status === "Pending"; const hasAccount = Boolean(recovery.accountId); const base = useRef(recovery.version); const draft = useRef(0); const choice = useRef<RecoveryAction | null>(null);
  const schema = useMemo(() => z.object({ reason: z.string().trim().min(1, t("common:reasonDialog.reasonRequired")) }), [t]);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { reason: "" }, reValidateMode: "onSubmit" });
  const { getValues, setError } = form; const { failure, fail, clear, close } = useDialogFailure(onClose, recoveriesQueryRoot, recoveryStateConflictCodes);
  const current = useCallback((operation: RecoveryOperation) => active.current && pending && operation.id === recovery.id && operation.version === base.current && operation.draft === draft.current && operation.action === choice.current && operation.reason === getValues().reason.trim() && (operation.action === "reject" || hasAccount), [pending, recovery.id, getValues, hasAccount]);
  useEffect(() => client.getMutationCache().subscribe((event) => {
    if (event.type !== "updated" || event.action.type !== "error" || event.mutation.meta?.recoveryReview !== operationId) return;
    const operation = event.mutation.state.variables as RecoveryOperation | undefined;
    const error = event.mutation.state.error;
    if (!operation || !current(operation) || !(error instanceof ApiError)) return;
    if (applyApiErrorToForm(error, setError, { reason: "reason" })) return;
    fail(recoveryActionError(error, t));
  }), [client, operationId, current, setError, t, fail]);
  const execute = async (operation: RecoveryOperation, key: string) => {
    if (!current(operation)) throw new DOMException("", "AbortError");
    setSubmittedAction(operation.action);
    try {
      const response = await changeRecovery(operation.id, operation.action, { version: operation.version, reason: operation.reason }, key);
      if (!current(operation)) throw new DOMException("", "AbortError");
      base.current = response.version; onResolved(response, operation); onClose(); return response;
    } catch (error) {
      if (!current(operation)) throw new DOMException("", "AbortError");
      throw error;
    }
  };
  const busy = useIsMutating({ predicate: (mutation) => mutation.meta?.recoveryReview === operationId }) > 0;
  const submit = (action: RecoveryAction) => form.handleSubmit((values) => {
    if (!pending || (action === "approve" && !hasAccount)) return;
    if (choice.current && choice.current !== action) draft.current++;
    choice.current = action; clear(); setOperation({ id: recovery.id, action, version: base.current, reason: values.reason, draft: draft.current });
  });
  const items = [
    { key: "previous", label: t("platformRecoveries:review.previous"), value: recovery.previousMethod },
    { key: "new", label: t("platformRecoveries:columns.new"), value: t("platformRecoveries:review.verified", { method: recovery.newMethod }) },
    { key: "account", label: t("platformRecoveries:review.account"), value: hasAccount ? recovery.accountName || <EmptyValue /> : t("platformRecoveries:review.none") },
    ...(!pending ? [
      { key: "status", label: t("platformRecoveries:columns.status"), value: <StatusBadge tones={recoveryStatusTones} value={recovery.status} /> },
      { key: "decidedBy", label: t("platformRecoveries:review.decidedBy"), value: recovery.decidedBy || <EmptyValue /> },
      { key: "reason", label: t("common:reasonDialog.reason"), value: recovery.reason || <EmptyValue /> },
    ] : []),
  ];
  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}><DialogContent onCloseAutoFocus={restoreFocus}>
    {operation ? <RecoveryMutationOwner key={operation.draft} operation={operation} operationId={operationId} execute={execute} /> : null}
    <DialogHeader><DialogTitle>{t(pending ? "platformRecoveries:review.title" : "platformRecoveries:review.resolvedTitle")}</DialogTitle></DialogHeader>
    <form noValidate onSubmit={(event) => { event.preventDefault(); }} className="flex min-h-0 flex-col">
      <DialogBody><DialogDescription>{t("platformRecoveries:review.requested", { date: format.formatDateTime(recovery.createdAtUtc) })}</DialogDescription>
        <DetailGrid items={items} phone={phone} />
        {pending ? <><Banner tone={hasAccount ? "info" : "warning"}>{t(hasAccount ? "platformRecoveries:review.withAccount" : "platformRecoveries:review.withoutAccount")}</Banner>
          <FormField label={t("common:reasonDialog.reason")} required error={form.formState.errors.reason?.message}>
            <Textarea {...form.register("reason")} onChange={(event) => { void form.register("reason").onChange(event); draft.current++; setOperation(null); form.clearErrors("reason"); clear(); }} disabled={busy} />
          </FormField><FormError message={actionErrorMessage(failure, t)} /></> : null}
      </DialogBody><DialogFooter>{pending ? <>
        <Button type="button" variant="outline" onClick={close}>{t("common:actions.cancel")}</Button>
        <Button type="button" variant="destructive" disabled={busy} pending={busy && submittedAction === "reject"} pendingLabel={t("platformRecoveries:actions.rejecting")} onClick={() => { void submit("reject")(); }}>{t("platformRecoveries:actions.reject")}</Button>
        <Button type="button" disabled={busy || !hasAccount} pending={busy && submittedAction === "approve"} pendingLabel={t("platformRecoveries:actions.approving")} onClick={() => { void submit("approve")(); }}>{t("platformRecoveries:actions.approve")}</Button>
      </> : <Button type="button" variant="outline" onClick={close}>{t("common:actions.close")}</Button>}</DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
