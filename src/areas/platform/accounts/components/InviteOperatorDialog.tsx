import { validationConstraints } from "@/shared/api/generated/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TFunction } from "i18next";
import { useId, useMemo, useState } from "react";
import { useController, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { platformPermissions } from "@/auth/usePermissions";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { InvitePlatformOperatorRequest } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { useResourceAction } from "@/shared/hooks/useResourceAction";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { EmailField } from "@/shared/ui/fields/EmailField";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { inviteOperator } from "../api/operators";
import { operatorInvitationError } from "../errors";

function inviteSchema(t: TFunction) {
  // El backend resuelve duplicados antes que permisos. No tapar esos409 con una validación cliente nueva.
  return z.object({ email: z.string().trim().toLowerCase().min(1, t("platformAccounts:invite.emailRequired")).pipe(z.email(t("platformAccounts:invite.emailInvalid"))), permissions: z.array(z.string()) });
}
type InviteForm = z.infer<ReturnType<typeof inviteSchema>>;
const serverFields: Record<string, keyof InviteForm> = { email: "email", permissions: "permissions" };
function sameInvitation(previous: InvitePlatformOperatorRequest, next: InvitePlatformOperatorRequest) {
  return previous.email === next.email && previous.permissions?.length === next.permissions?.length
    && (previous.permissions ?? []).every((permission, index) => permission === next.permissions?.[index]);
}
export function InviteOperatorDialog({ onClose, onInvited }: { onClose: () => void; onInvited: () => Promise<unknown> }) {
  const { t } = useTranslation(["platformAccounts", "common"]);
  const operationId = useId(); const restoreFocus = useRestoreFocusOnClose();
  const schema = useMemo(() => inviteSchema(t), [t]);
  const form = useForm<InviteForm>({ resolver: zodResolver(schema), defaultValues: { email: "", permissions: [] } });
  const { getValues, setError } = form;
  const { field: { name: emailName, ref: emailRef, value: emailValue, onBlur: emailBlur, onChange: emailChange } } = useController({ control: form.control, name: "email" });
  const permissions = useController({ control: form.control, name: "permissions" });
  const matchesDraft = (request: InvitePlatformOperatorRequest) => {
    const current = getValues();
    return sameInvitation(request, { email: current.email.trim().toLowerCase(), permissions: current.permissions });
  };
  const [failure, setFailure] = useState<unknown>();
  const action = useResourceAction<InvitePlatformOperatorRequest>({
    matches: (meta) => meta?.operatorInvite === operationId,
    isCurrent: matchesDraft,
    onError: (error) => {
    if (applyApiErrorToForm(error, setError, serverFields)) return;
    const rejected = operatorInvitationError(error, t);
    if (rejected) setError(rejected.field, { type: "server", message: rejected.message }); else setFailure(error);
    },
  });
  const invite = useIdempotentMutation(action.guarded((request, key: string) => inviteOperator(request, key),
    (_response, request) => { toast.success(t("platformAccounts:messages.invited", { email: request.email })); onClose(); void onInvited(); }),
    { meta: { operatorInvite: operationId }, sameOperation: sameInvitation });
  const busy = action.isPending;
  const clear = (field: keyof InviteForm) => { form.clearErrors(field); setFailure(undefined); };
  const submit = form.handleSubmit((values) => { setFailure(undefined); invite.mutate(values); });
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent onCloseAutoFocus={restoreFocus}>
    <DialogHeader><DialogTitle>{t("platformAccounts:invite.title")}</DialogTitle></DialogHeader>
    <form noValidate onSubmit={(event) => { void submit(event); }} className="flex min-h-0 flex-col">
      <DialogBody>
        <FormField label={t("platformAccounts:invite.email")} required error={form.formState.errors.email?.message}>
          <EmailField name={emailName} ref={emailRef} value={emailValue} onBlur={emailBlur} onChange={(value) => { emailChange(value ?? ""); clear("email"); }} maxLength={validationConstraints.InvitePlatformOperatorHttpRequest.email.maxLength} disabled={busy} />
        </FormField>
        <FormField label={t("platformAccounts:invite.permissions")} error={form.formState.errors.permissions?.message}>
          <MultiSelect options={platformPermissions.map((value) => ({ value, label: t(`platformAccounts:permissions.${value}.name`), description: t(`platformAccounts:permissions.${value}.description`) }))}
            value={permissions.field.value} onChange={(value) => { permissions.field.onChange(value); clear("permissions"); }} placeholder={t("platformAccounts:invite.none")} />
        </FormField>
        <FormError message={actionErrorMessage(failure, t)} />
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>{t("common:actions.cancel")}</Button><Button type="submit" pending={busy} pendingLabel={t("platformAccounts:invite.sending")}>{t("platformAccounts:invite.send")}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
