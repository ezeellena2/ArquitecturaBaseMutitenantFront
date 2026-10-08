import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useController, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRetryAfterCountdown } from "@/shared/api/useRetryAfterCountdown";
import { useCountdown } from "@/shared/hooks/useCountdown";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import type { AccountLoginMethod, LoginDestination } from "@/shared/api/types";
import { maskEmail, maskPhone } from "@/shared/format/personalData";
import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/FormField";
import { FormError } from "@/shared/ui/FormError";
import { EmailField } from "@/shared/ui/fields/EmailField";
import { PhoneField } from "@/shared/ui/fields/PhoneField";
import { OtpInput } from "@/shared/ui/OtpInput";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { accountMethodsQueryKey, addLoginMethod, sendLoginMethodCode, verifyLoginMethod } from "./api/loginMethods";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { loginMethodErrorField } from "./errors";
import { useHasLoginChannel } from "./useLoginChannels";
import { useAppChrome } from "@/shared/ui/app/AppChrome";

interface Props { open: boolean; onOpenChange: (open: boolean) => void; onComplete: () => void; method?: AccountLoginMethod }
const codeLength = 6;
const codeLifetimeSeconds = 10 * 60;

function destinationSchema(t: TFunction) {
  return z.discriminatedUnion("type", [
    z.object({ type: z.literal("email"), email: z.email(t("auth:login.emailInvalid")) }),
    z.object({ type: z.literal("phone"), phone: z.object({ country: z.string(), number: z.string() }).refine((phone) => phone.country !== "" && phone.number.trim() !== "", t("common:phone.invalid")) }),
  ]);
}
function codeSchema(t: TFunction) { return z.object({ code: z.string().length(codeLength, t("common:code.incomplete")) }); }
type CodeForm = z.infer<ReturnType<typeof codeSchema>>;
type SendOperation = { revision: number } & ({ destination: LoginDestination; methodId?: string } | { destination: null; methodId: string });
interface VerifyOperation { revision: number; methodId: string; code: string }
function sameSend(a: SendOperation, b: SendOperation) {
  if (a.revision !== b.revision || a.methodId !== b.methodId) return false;
  if (!a.destination || !b.destination) return a.destination === b.destination;
  return a.destination.type === "email" && b.destination.type === "email" ? a.destination.email === b.destination.email
    : a.destination.type === "phone" && b.destination.type === "phone" && a.destination.phone.country === b.destination.phone.country && a.destination.phone.number === b.destination.phone.number;
}

/** Un recorrido nuevo al abrir o cambiar de método; ningún dato personal sale de la memoria del diálogo. */
export function AddLoginMethodDialog(props: Props) {
  return props.open ? <AddLoginMethodFlow key={props.method?.id ?? "new"} {...props} /> : null;
}

function AddLoginMethodFlow({ onOpenChange, onComplete, method }: Props) {
  const { t } = useTranslation(["account", "auth", "common", "errors"]);
  const restoreFocus = useRestoreFocusOnClose();
  const whatsApp = useHasLoginChannel("whatsapp");
  const queryClient = useQueryClient();
  const { phone: isPhone } = useAppChrome();
  const [step, setStep] = useState<SendOperation | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const schema = useMemo(() => destinationSchema(t), [t]);
  const otpSchema = useMemo(() => codeSchema(t), [t]);
  const form = useForm<LoginDestination>({ resolver: zodResolver(schema), defaultValues: { type: "email", email: method?.value ?? "" }, reValidateMode: "onSubmit" });
  const codeForm = useForm<CodeForm>({ resolver: zodResolver(otpSchema), defaultValues: { code: "" }, reValidateMode: "onSubmit" });
  const code = useController({ control: codeForm.control, name: "code" });
  const type = useWatch({ control: form.control, name: "type" });
  const retry = useRetryAfterCountdown();
  const resend = useCountdown(0);
  const expiry = useCountdown(0);
  const revision = useRef(0);
  const alive = useRef(true);
  const started = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  function refreshAccount() {
    void queryClient.invalidateQueries({ queryKey: accountMethodsQueryKey });
    void queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
  }
  const request = useIdempotentMutation(async (operation: SendOperation, key) => {
    if (operation.destination === null) return sendLoginMethodCode(operation.methodId, key);
    if (operation.methodId) return sendLoginMethodCode(operation.methodId, key);
    const result = await addLoginMethod(operation.destination.type === "phone" ? { phone: operation.destination.phone, channel: "whatsapp" } : { email: operation.destination.email }, key);
    refreshAccount();
    return result;
  },
  { meta: { handlesError: true }, sameOperation: sameSend });
  const verify = useIdempotentMutation(async (operation: VerifyOperation, key) => {
    await verifyLoginMethod(operation.methodId, { code: operation.code }, key);
    // Reconciliar antes de que el helper descarte la respuesta de un diálogo desmontado.
    refreshAccount();
  },
    { meta: { handlesError: true }, sameOperation: (a, b) => a.revision === b.revision && a.methodId === b.methodId && a.code === b.code });
  const busy = request.isPending || verify.isPending;
  const phone = method?.type === "Phone" || (step?.destination?.type ?? type) === "phone";
  const expired = step !== null && !expiry.isRunning;
  function current(operation: { revision: number }) { return alive.current && operation.revision === revision.current; }
  function edit() { revision.current++; form.clearErrors(); setFailure(null); }
  function close() { alive.current = false; revision.current++; onOpenChange(false); }
  function sendExisting() {
    if (method) send({ revision: revision.current, methodId: method.id, destination: null });
  }

  function sendRejected(error: unknown) {
    retry.startFromError(error);
    if (!method && !step && error instanceof ApiError) {
      if (applyApiErrorToForm(error, form.setError, { email: "email", phone: "phone" })) return;
      // Con campos desconocidos, el error general también se muestra; nunca pisa el mensaje ya ubicado.
      if (error.errors?.phone?.[0] || error.errors?.email?.[0]) { setFailure(apiErrorMessage(error, t)); return; }
    }
    if (!method && !step && loginMethodErrorField(error) === "phone") form.setError("phone", { type: "server", message: apiErrorMessage(error, t) });
    else setFailure(apiErrorMessage(error, t));
  }
  function send(operation: SendOperation) {
    setFailure(null);
    request.mutate(operation, {
      onSuccess: (result) => {
        if (!current(operation)) return;
        // Un reenvío aceptado invalida también el intento de verificación anterior.
        revision.current++;
        setStep({ ...operation, revision: revision.current, methodId: result.methodId });
        codeForm.reset({ code: "" });
        resend.restart(result.resendAfterSeconds); expiry.restart(codeLifetimeSeconds);
      },
      onError: (error) => { if (current(operation)) sendRejected(error); },
    });
  }
  useEffect(() => {
    if (method && !started.current) {
      started.current = true;
      // Un Phone pendiente ya fue normalizado: /code recibe sólo su id y no vuelve a validar países de alta.
      sendExisting();
    }
  });
  function confirm(values: CodeForm) {
    if (!step?.methodId || expired) return;
    setFailure(null);
    const operation = { revision: revision.current, methodId: step.methodId, code: values.code };
    verify.mutate(operation, {
      onSuccess: () => {
        if (!current(operation)) return;
        const value = phone ? maskPhone(destination) : destination;
        toast.success(t(method ? "account:verifiedToast" : phone ? "account:phoneAdded" : "account:added", { value }));
        onComplete(); close();
      },
      onError: (error) => {
        if (!current(operation)) return;
        retry.startFromError(error);
        if (error instanceof ApiError && applyApiErrorToForm(error, codeForm.setError, { code: "code" })) return;
        if (loginMethodErrorField(error) === "code") codeForm.setError("code", { type: "server", message: apiErrorMessage(error, t) });
        else setFailure(apiErrorMessage(error, t));
      },
    });
  }
  const destination = method?.value ?? (step?.destination?.type === "phone" ? step.destination.phone.number : step?.destination?.email ?? "");
  const hint = t(phone ? "account:phoneSentHint" : "account:sentHint", { value: phone ? maskPhone(destination) : maskEmail(destination) });
  const resendAction = step ? <Button type="button" variant="link" className="self-start md:mr-auto" disabled={busy || resend.isRunning || retry.isRunning}
    onClick={() => send({ ...step, revision: revision.current })}>{retry.label ?? (resend.isRunning ? t("common:code.resendIn", { seconds: resend.seconds }) : t("common:code.resend"))}</Button> : null;
  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent size="sm" onCloseAutoFocus={restoreFocus} aria-describedby={step ? "method-code-hint" : undefined}>
      <form noValidate onSubmit={(event) => {
        if (method && !step) { event.preventDefault(); sendExisting(); }
        else void (step ? codeForm.handleSubmit(confirm) : form.handleSubmit((destination) => send({ destination, revision: revision.current })))(event);
      }}>
        <DialogHeader><DialogTitle>{t(method || step ? phone ? "account:verifyPhoneTitle" : "account:verifyTitle" : whatsApp ? "account:add" : "account:addEmail")}</DialogTitle></DialogHeader>
        <DialogBody>
          {step ? <>
            <DialogDescription id="method-code-hint">{hint}</DialogDescription>
            <OtpInput length={codeLength} value={code.field.value} label={t("common:code.label")} autoFocus disabled={busy || expired} error={expired ? undefined : codeForm.formState.errors.code?.message}
              aria-describedby="method-code-hint" onChange={(value) => { revision.current++; code.field.onChange(value); codeForm.clearErrors("code"); setFailure(null); }} />
            {phone ? <p className="text-xs text-[var(--t3)]">{t("common:code.whatsappNotice")}</p> : null}
            {isPhone ? resendAction : null}
          </> : method ? <DialogDescription>{request.isPending ? t("common:code.sending") : phone ? maskPhone(method.value ?? "") : maskEmail(method.value ?? "")}</DialogDescription> : <>
            {whatsApp ? <div role="group" aria-label={t("account:chooseMethod")} className="flex rounded-lg bg-[var(--s3)] p-1">
              {(["email", "phone"] as const).map((choice) => <button key={choice} type="button" disabled={busy} aria-pressed={type === choice}
                className={`flex-1 rounded-md py-2 text-[13px] font-medium ${type === choice ? "bg-[var(--lado-activo)]" : ""}`}
                onClick={() => { edit(); form.reset(choice === "email" ? { type: choice, email: "" } : { type: choice, phone: { country: "", number: "" } }); }}>{t(choice === "phone" ? "account:phone" : "account:email")}</button>)}
            </div> : null}
            {type === "phone" && whatsApp ? <Controller control={form.control} name="phone" render={({ field }) => <FormField label={t("account:phoneNumber")} error={form.getFieldState("phone", form.formState).error?.message}>
              <PhoneField usage="whatsapp" name={field.name} value={field.value} onChange={(value) => { edit(); field.onChange(value); }} disabled={busy} />
            </FormField>} /> : <Controller control={form.control} name="email" render={({ field }) => <FormField label={t("account:email")} error={form.getFieldState("email", form.formState).error?.message}>
              <EmailField name={field.name} ref={field.ref} value={field.value ?? ""} onChange={(value) => { edit(); field.onChange(value); }} onBlur={field.onBlur} disabled={busy} />
            </FormField>} />}
          </>}
          <FormError message={failure ?? (expired ? t("account:codeExpired") : null)} />
        </DialogBody>
        <DialogFooter>
          {!isPhone ? resendAction : null}
          <Button type="button" variant="outline" onClick={close}>{t("account:cancel")}</Button>
          <Button type="submit" disabled={retry.isRunning || expired} pending={busy} pendingLabel={t(step ? "common:code.verifying" : "common:code.sending")}>{retry.label ?? t(step ? "common:code.verify" : "common:code.send")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
