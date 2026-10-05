import { zodResolver } from "@hookform/resolvers/zod";
import type { TFunction } from "i18next";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Controller, useController, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
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
import { loginMethodErrorField } from "./errors";

interface Props { open: boolean; onOpenChange: (open: boolean) => void; onComplete: () => void; method?: AccountLoginMethod }

const codeLength = 6;

/// Lo que se valida antes de mandar, con los textos de i18n: el correo bien escrito y el código entero.
function emailFormSchema(t: TFunction) {
  return z.object({ email: z.email(t("auth:login.emailInvalid")) });
}

function codeFormSchema(t: TFunction) {
  return z.object({ code: z.string().length(codeLength, t("common:code.incomplete")) });
}

type EmailForm = z.infer<ReturnType<typeof emailFormSchema>>;
type CodeForm = z.infer<ReturnType<typeof codeFormSchema>>;

/// «Agregar correo o teléfono» y «Verificar tu correo» (tableros Cuenta-Agregar, Cuenta-Verificar y sus M-*): el título
/// dice el paso. «Verificar» no se apaga por un código a medias; lo que falta y el código que el back rechaza van debajo
/// de los casilleros, en rojo, y un dígito nuevo los saca. Lo demás (vencido, sin conexión) va en la franja.
export function AddLoginMethodDialog({ open, onOpenChange, onComplete, method }: Props) {
  const { t } = useTranslation(["account", "auth", "common", "errors"]);
  const restoreFocus = useRestoreFocusOnClose(open);
  const codeErrorId = useId();
  const [methodId, setMethodId] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [reauthTicket, setReauthTicket] = useState<string | null>(null);
  const emailSchema = useMemo(() => emailFormSchema(t), [t]);
  const codeSchema = useMemo(() => codeFormSchema(t), [t]);
  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema), defaultValues: { email: method?.value ?? "" } });
  // El código no se vuelve a revisar mientras se escribe: lo que dice debajo se va con el dígito nuevo (`clearErrors`).
  const codeForm = useForm<CodeForm>({ resolver: zodResolver(codeSchema), defaultValues: { code: "" }, reValidateMode: "onSubmit" });
  const code = useController({ control: codeForm.control, name: "code" });
  const codeError = codeForm.formState.errors.code?.message;
  const retry = useRetryAfterCountdown();
  const request = useIdempotentMutation((value: string, key) => method ? sendLoginMethodCode(method.id, key) : addLoginEmail({ email: value, reauthTicket }, key), { meta: { handlesError: true } });
  const verify = useIdempotentMutation((value: string, key) => verifyLoginMethod(methodId!, { code: value }, key), { meta: { handlesError: true } });
  const busy = request.isPending || verify.isPending;
  const started = useRef(false);

  function sendRejected(error: unknown) {
    retry.startFromError(error);
    if (error instanceof ApiError && applyApiErrorToForm(error, emailForm.setError, { email: "email" })) return;
    setFailure(apiErrorMessage(error, t));
  }

  function verifyRejected(error: unknown) {
    retry.startFromError(error);
    if (error instanceof ApiError && applyApiErrorToForm(error, codeForm.setError, { code: "code" })) return;
    if (loginMethodErrorField(error) === "code") codeForm.setError("code", { type: "server", message: apiErrorMessage(error, t) });
    else setFailure(apiErrorMessage(error, t));
  }

  function send(values: EmailForm) {
    setFailure(null);
    request.mutate(values.email, { onSuccess: (result) => setMethodId(result.methodId), onError: sendRejected });
  }

  useEffect(() => {
    if (method && open && !started.current) { started.current = true; send({ email: method.value ?? "" }); }
  });

  function confirm(values: CodeForm) {
    setFailure(null);
    verify.mutate(values.code, {
      onSuccess: () => {
        toast.success(t(method ? "account:verifiedToast" : "account:added", { value: emailForm.getValues("email") }));
        onComplete();
        onOpenChange(false);
      },
      onError: verifyRejected,
    });
  }

  if (!method && !reauthTicket && open) return <ChangeLoginMethodDialog action="addEmail" onClose={() => onOpenChange(false)} onAuthorized={setReauthTicket} />;
  const codeStep = methodId !== null;
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent size="sm" onCloseAutoFocus={restoreFocus} aria-describedby={codeStep ? "method-code-hint" : undefined}>
      <form noValidate onSubmit={(event) => { void (codeStep ? codeForm.handleSubmit(confirm) : emailForm.handleSubmit(send))(event); }}>
        <DialogHeader><DialogTitle>{t(method || codeStep ? "account:verifyTitle" : "account:add")}</DialogTitle></DialogHeader>
        <DialogBody>
          {codeStep ? <>
            <DialogDescription id="method-code-hint">{t("account:sentHint", { value: emailForm.getValues("email") })}</DialogDescription>
            <OtpInput length={codeLength} value={code.field.value} label={t("common:code.label")} autoFocus disabled={busy} invalid={Boolean(codeError)}
              aria-describedby={codeError ? `method-code-hint ${codeErrorId}` : "method-code-hint"}
              onChange={(value) => { code.field.onChange(value); codeForm.clearErrors("code"); setFailure(null); }} />
            {/* Tableros Cuenta-Verificar (.err2) y M-Cuenta-Verificar (.ap-err): debajo de los casilleros, en 13 y 13,5. */}
            {codeError ? <p id={codeErrorId} role="alert" className="text-[13px] text-[var(--peligro)] max-md:-mt-0.5 max-md:text-[13.5px]">{codeError}</p> : null}
          </> : <>
            {!method ? <div role="group" aria-label={t("account:chooseMethod")} className="rounded-lg bg-[var(--s3)] p-1"><button type="button" aria-pressed="true" className="w-full rounded-md bg-[var(--lado-activo)] py-2 text-[13px] font-medium">{t("account:email")}</button></div> : null}
            <Controller control={emailForm.control} name="email" render={({ field }) => <FormField label={t("account:email")} error={emailForm.formState.errors.email?.message}>
              <EmailField name={field.name} ref={field.ref} value={field.value} onChange={field.onChange} onBlur={field.onBlur} disabled={!!method || busy} />
            </FormField>} />
          </>}
          <FormError message={failure} />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("account:cancel")}</Button>
          <Button type="submit" disabled={retry.isRunning} pending={busy} pendingLabel={t(codeStep ? "common:code.verifying" : "common:code.sending")}>{retry.label ?? t(codeStep ? "common:code.verify" : "common:code.send")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
