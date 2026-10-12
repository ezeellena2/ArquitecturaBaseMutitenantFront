import type { MutationMeta } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { RecoveryMethodText } from "./RecoveryMethodText";
import { z } from "zod";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { PlatformRecoveryResponse, VersionResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useFormat } from "@/shared/format/useFormat";
import { useDialogFailure } from "@/shared/hooks/useDialogFailure";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { useResourceAction } from "@/shared/hooks/useResourceAction";
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
function RecoveryMutationOwner({ operation, meta, execute }: {
  operation: RecoveryOperation; meta: MutationMeta; execute: (operation: RecoveryOperation, key: string) => Promise<VersionResponse>;
}) {
  const { mutate } = useIdempotentMutation(execute, { meta, sameOperation });
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
  const { t } = useTranslation(["platformRecoveries", "common"]); const format = useFormat(); const { phone } = useAppChrome();
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  const [submittedAction, setSubmittedAction] = useState<RecoveryAction | null>(null);
  const [operation, setOperation] = useState<RecoveryOperation | null>(null);
  const pending = recovery.status === "Pending"; const hasAccount = Boolean(recovery.accountId); const base = useRef(recovery.version); const draft = useRef(0); const choice = useRef<RecoveryAction | null>(null);
  const schema = useMemo(() => z.object({ reason: z.string().trim().min(1, t("common:reasonDialog.reasonRequired")) }), [t]);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { reason: "" }, reValidateMode: "onSubmit" });
  const { getValues, setError } = form; const { failure, fail, clear, close } = useDialogFailure(onClose, recoveriesQueryRoot, recoveryStateConflictCodes);
  const current = useCallback((operation: RecoveryOperation) => pending && operation.id === recovery.id && operation.version === base.current && operation.draft === draft.current && operation.action === choice.current && operation.reason === getValues().reason.trim() && (operation.action === "reject" || hasAccount), [pending, recovery.id, getValues, hasAccount]);
  const action = useResourceAction<RecoveryOperation>({
    isCurrent: current,
    onError: (error) => {
    if (applyApiErrorToForm(error, setError, { reason: "reason" })) return;
    fail(recoveryActionError(error, t));
    },
  });
  const execute = (operation: RecoveryOperation, key: string) => action.guarded(async (operation: RecoveryOperation, key: string) => {
    setSubmittedAction(operation.action);
    return changeRecovery(operation.id, operation.action, { version: operation.version, reason: operation.reason }, key);
  }, (response, sent) => { base.current = response.version; onResolved(response, sent); onClose(); })(operation, key);
  const busy = action.isPending;
  const submit = (action: RecoveryAction) => form.handleSubmit((values) => {
    if (!pending || (action === "approve" && !hasAccount)) return;
    if (choice.current && choice.current !== action) draft.current++;
    choice.current = action; clear(); setOperation({ id: recovery.id, action, version: base.current, reason: values.reason, draft: draft.current });
  });
  const items = [
    { key: "previous", label: t("platformRecoveries:review.previous"), value: <RecoveryMethodText type={recovery.previousMethodType} value={recovery.previousMethod} /> },
    { key: "new", label: t("platformRecoveries:columns.new"), value: recovery.newMethodType === "Phone" && recovery.newMethod.startsWith("+") ? <Trans i18nKey="platformRecoveries:review.verifiedPhone" components={{ phone: <RecoveryMethodText type={recovery.newMethodType} value={recovery.newMethod} /> }} /> : t("platformRecoveries:review.verified", { method: recovery.newMethod }) },
    { key: "account", label: t("platformRecoveries:review.account"), value: hasAccount ? recovery.accountName || <EmptyValue /> : t("platformRecoveries:review.none") },
    ...(!pending ? [
      { key: "status", label: t("platformRecoveries:columns.status"), value: <StatusBadge tones={recoveryStatusTones} value={recovery.status} /> },
      { key: "decidedBy", label: t("platformRecoveries:review.decidedBy"), value: recovery.decidedBy || <EmptyValue /> },
      { key: "reason", label: t("common:reasonDialog.reason"), value: recovery.reason || <EmptyValue /> },
    ] : []),
  ];
  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}><DialogContent onCloseAutoFocus={restoreFocus}>
    {operation ? <RecoveryMutationOwner key={operation.draft} operation={operation} meta={action.meta} execute={execute} /> : null}
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
