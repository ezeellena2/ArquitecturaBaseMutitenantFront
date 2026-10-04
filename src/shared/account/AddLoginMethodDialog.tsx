import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRetryAfterCountdown } from "@/shared/api/useRetryAfterCountdown";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import type { AccountLoginMethod } from "@/shared/api/types";
import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/FormField";
import { FormError } from "@/shared/ui/FormError";
import { EmailField } from "@/shared/ui/fields/EmailField";
import { OtpInput } from "@/shared/ui/OtpInput";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { addLoginEmail, sendLoginMethodCode, verifyLoginMethod } from "./api/loginMethods";
import { ChangeLoginMethodDialog } from "./ChangeLoginMethodDialog";

interface Props { open: boolean; onOpenChange: (open: boolean) => void; onComplete: () => void; method?: AccountLoginMethod }
const schema = z.object({ email: z.email() });

export function AddLoginMethodDialog({ open, onOpenChange, onComplete, method }: Props) {
  const { t } = useTranslation("account");
  const { t: auth } = useTranslation("auth");
  const { t: errors } = useTranslation("errors");
  const restoreFocus = useRestoreFocusOnClose(open);
  const [methodId, setMethodId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const [reauthTicket, setReauthTicket] = useState<string | null>(null);
  const form = useForm<{ email: string }>({ resolver: zodResolver(schema), defaultValues: { email: method?.value ?? "" } });
  const retry = useRetryAfterCountdown();
  const request = useIdempotentMutation((email: string, key) => method ? sendLoginMethodCode(method.id, key) : addLoginEmail({ email, reauthTicket }, key), { meta: { handlesError: true } });
  const verify = useIdempotentMutation((value: string, key) => verifyLoginMethod(methodId!, { code: value }, key), { meta: { handlesError: true } });
  const busy = request.isPending || verify.isPending;
  const started = useRef(false);

  function showError(error: unknown) {
    retry.startFromError(error);
    if (error instanceof ApiError && !methodId && applyApiErrorToForm(error, form.setError, { email: "email" })) return;
    setFailure(apiErrorMessage(error, errors));
  }
  async function send({ email }: { email: string }) {
    setFailure(null);
    try { const result = await request.mutateAsync(email); setMethodId(result.methodId); }
    catch (error) { showError(error); }
  }
  useEffect(() => {
    if (method && open && !started.current) { started.current = true; void send({ email: method.value ?? "" }); }
  });
  async function confirm() {
    if (code.length !== 6) { setFailure(t("codeIncomplete")); return; }
    setFailure(null);
    try {
      await verify.mutateAsync(code);
      toast.success(t(method ? "verifiedToast" : "added", { value: form.getValues("email") }));
      onComplete();
      onOpenChange(false);
    } catch (error) { showError(error); }
  }
  if (!method && !reauthTicket && open) return <ChangeLoginMethodDialog action="addEmail" onClose={() => onOpenChange(false)} onAuthorized={setReauthTicket} />;
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent size="sm" onCloseAutoFocus={restoreFocus} aria-describedby={methodId ? "method-code-hint" : undefined}>
      <form noValidate onSubmit={(event) => { event.preventDefault(); if (methodId) void confirm(); else void form.handleSubmit(send)(event); }} >
        <DialogHeader><DialogTitle>{t(method ? "verifyTitle" : "add")}</DialogTitle></DialogHeader>
        <DialogBody>
        {methodId ? <DialogDescription id="method-code-hint">{t("sentHint", { value: form.getValues("email") })}</DialogDescription> : null}
        {methodId ? <OtpInput length={6} value={code} onChange={(value) => { setCode(value); setFailure(null); }} label={t("code")} autoFocus disabled={busy} aria-describedby="method-code-hint" /> : <>
          {!method ? <div role="group" aria-label={t("chooseMethod")} className="rounded-lg bg-[var(--s3)] p-1"><button type="button" aria-pressed="true" className="w-full rounded-md bg-[var(--lado-activo)] py-2 text-[13px] font-medium">{t("email")}</button></div> : null}
          <Controller control={form.control} name="email" render={({ field }) => <FormField label={t("email")} error={form.formState.errors.email?.type === "server" ? form.formState.errors.email.message : form.formState.errors.email ? auth("login.emailInvalid") : undefined}><EmailField name={field.name} ref={field.ref} value={field.value} onChange={field.onChange} onBlur={field.onBlur} disabled={!!method || busy} /></FormField>} />
        </>}
        <FormError message={failure} />
        </DialogBody>
        <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button><Button type="submit" disabled={busy || retry.isRunning}>{retry.label ?? t(methodId ? "verify" : "sendCode")}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
