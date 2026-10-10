import { zodResolver } from "@hookform/resolvers/zod";
import { useIsMutating, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useController, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { platformPermissions } from "@/auth/usePermissions";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { ChangePlatformOperatorRequest, PlatformAccountDetailResponse, VersionResponse } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { orderLike } from "@/shared/lib/orderLike";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { Textarea } from "@/shared/ui/textarea";
import { changeOperatorPermissions } from "../api/operators";
import { accountLabel } from "../columns";
import { operatorInvitationError } from "../errors";

function sameRequest(previous: ChangePlatformOperatorRequest, next: ChangePlatformOperatorRequest) {
  return previous.version === next.version && previous.reason === next.reason && previous.permissions?.length === next.permissions?.length
    && (previous.permissions ?? []).every((permission, index) => permission === next.permissions?.[index]);
}
export function OperatorPermissionsDialog({ account, returnFocusTo, onClose, onSaved }: {
  account: PlatformAccountDetailResponse; returnFocusTo: HTMLElement | null; onClose: (conflicted: boolean) => void;
  onSaved: (response: VersionResponse, permissions: string[]) => void;
}) {
  const { t } = useTranslation(["platformAccounts", "common"]); const client = useQueryClient();
  const operationId = useId(); const active = useRef(true); const conflict = useRef(false); const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const schema = useMemo(() => z.object({ permissions: z.array(z.string()), reason: z.string().trim().min(1, t("common:reasonDialog.reasonRequired")) }), [t]);
  const initial = account.operatorPermissions ?? [];
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { permissions: initial, reason: "" } });
  const { getValues, setError } = form; const permissions = useController({ control: form.control, name: "permissions" });
  const [failure, setFailure] = useState<unknown>(); const close = () => onClose(conflict.current);
  const matches = (request: ChangePlatformOperatorRequest) => sameRequest(request, { ...getValues(), reason: getValues().reason.trim(), version: account.operatorVersion });
  useEffect(() => client.getMutationCache().subscribe((event) => {
    if (!active.current || event.type !== "updated" || event.action.type !== "error" || event.mutation.meta?.operatorPermissions !== operationId) return;
    const request = event.mutation.state.variables as ChangePlatformOperatorRequest | undefined;
    if (!request || !sameRequest(request, { ...getValues(), reason: getValues().reason.trim(), version: account.operatorVersion })) return;
    const error = event.mutation.state.error; if (!(error instanceof ApiError)) return;
    if (error.code === "General.ConcurrencyConflict") conflict.current = true;
    if (applyApiErrorToForm(error, setError, { permissions: "permissions", reason: "reason" })) return;
    const rejected = operatorInvitationError(error, t);
    if (rejected?.field === "permissions") setError("permissions", { type: "server", message: rejected.message }); else setFailure(error);
  }), [account.operatorVersion, client, getValues, operationId, setError, t]);
  const save = useIdempotentMutation(async (request: ChangePlatformOperatorRequest, key) => {
    if (!active.current || !matches(request)) throw new DOMException("", "AbortError");
    try {
      const response = await changeOperatorPermissions(account.id, request, key);
      if (!active.current || !matches(request)) throw new DOMException("", "AbortError");
      onSaved(response, request.permissions ?? []); onClose(false); return response;
    } catch (error) {
      if (!active.current || !matches(request)) throw new DOMException("", "AbortError");
      throw error;
    }
  }, { meta: { operatorPermissions: operationId }, sameOperation: sameRequest });
  const busy = useIsMutating({ predicate: (mutation) => mutation.meta?.operatorPermissions === operationId }) > 0;
  const submit = form.handleSubmit((values) => { setFailure(undefined); save.mutate({ ...values, version: account.operatorVersion }); });
  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}><DialogContent onCloseAutoFocus={restoreFocus}>
    <DialogHeader><DialogTitle>{t("platformAccounts:operator.changeTitle", { name: accountLabel(account, t) })}</DialogTitle></DialogHeader>
    <form noValidate onSubmit={(event) => { void submit(event); }} className="flex min-h-0 flex-col"><DialogBody>
      <FormField label={t("platformAccounts:invite.permissions")} error={form.formState.errors.permissions?.message}>
        <MultiSelect options={platformPermissions.map((value) => ({ value, label: t(`platformAccounts:permissions.${value}.name`), description: t(`platformAccounts:permissions.${value}.description`) }))}
          value={permissions.field.value} onChange={(value) => { permissions.field.onChange(orderLike(initial, value)); form.clearErrors("permissions"); setFailure(undefined); }} placeholder={t("platformAccounts:invite.none")} />
      </FormField>
      <FormField label={t("common:reasonDialog.reason")} required error={form.formState.errors.reason?.message}>
        <Textarea {...form.register("reason", { onChange: () => setFailure(undefined) })} disabled={busy} />
      </FormField><FormError message={actionErrorMessage(failure, t)} />
    </DialogBody><DialogFooter><Button type="button" variant="outline" onClick={close}>{t("common:actions.cancel")}</Button>
      <Button type="submit" disabled={!form.formState.isDirty} pending={busy} pendingLabel={t("platformAccounts:operator.saving")}>{t("platformAccounts:operator.save")}</Button>
    </DialogFooter></form>
  </DialogContent></Dialog>;
}
