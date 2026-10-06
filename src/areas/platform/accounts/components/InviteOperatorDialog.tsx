import { zodResolver } from "@hookform/resolvers/zod";
import { useIsMutating, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useController, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { platformPermissions } from "@/auth/usePermissions";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { InvitePlatformOperatorRequest } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
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
  const { t } = useTranslation(["platformAccounts", "common"]); const client = useQueryClient();
  const operationId = useId(); const active = useRef(true); const restoreFocus = useRestoreFocusOnClose();
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
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
  useEffect(() => client.getMutationCache().subscribe((event) => {
    if (!active.current || event.type !== "updated" || event.action.type !== "error" || event.mutation.meta?.operatorInvite !== operationId) return;
    const request = event.mutation.state.variables as InvitePlatformOperatorRequest | undefined;
    const current = getValues();
    if (!request || !sameInvitation(request, { email: current.email.trim().toLowerCase(), permissions: current.permissions })) return;
    const error = event.mutation.state.error;
    if (!(error instanceof ApiError)) return;
    if (applyApiErrorToForm(error, setError, serverFields)) return;
    const rejected = operatorInvitationError(error, t);
    if (rejected) setError(rejected.field, { type: "server", message: rejected.message }); else setFailure(error);
  }), [client, getValues, operationId, setError, t]);
  const invite = useIdempotentMutation(async (request: InvitePlatformOperatorRequest, key) => {
    if (!active.current || !matchesDraft(request)) throw new DOMException("", "AbortError");
    try {
      const response = await inviteOperator(request, key);
      if (!active.current || !matchesDraft(request)) throw new DOMException("", "AbortError");
      toast.success(t("platformAccounts:messages.invited", { email: request.email })); onClose(); void onInvited(); return response;
    } catch (error) {
      if (!active.current || !matchesDraft(request)) throw new DOMException("", "AbortError");
      throw error;
    }
  }, { meta: { operatorInvite: operationId }, sameOperation: sameInvitation });
  const busy = useIsMutating({ predicate: (mutation) => mutation.meta?.operatorInvite === operationId }) > 0;
  const clear = (field: keyof InviteForm) => { form.clearErrors(field); setFailure(undefined); };
  const submit = form.handleSubmit((values) => { setFailure(undefined); invite.mutate(values); });
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent onCloseAutoFocus={restoreFocus}>
    <DialogHeader><DialogTitle>{t("platformAccounts:invite.title")}</DialogTitle></DialogHeader>
    <form noValidate onSubmit={(event) => { void submit(event); }} className="flex min-h-0 flex-col">
      <DialogBody>
        <FormField label={t("platformAccounts:invite.email")} required error={form.formState.errors.email?.message}>
          <EmailField name={emailName} ref={emailRef} value={emailValue} onBlur={emailBlur} onChange={(value) => { emailChange(value ?? ""); clear("email"); }} maxLength={254} disabled={busy} />
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
