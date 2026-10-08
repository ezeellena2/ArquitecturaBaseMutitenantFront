import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { AuthLayout } from "@/layouts/AuthLayout";
import { useLoginChannels } from "@/shared/account/useLoginChannels";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { LoginDestination } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRetryAfterCountdown } from "@/shared/api/useRetryAfterCountdown";
import { useCountdown } from "@/shared/hooks/useCountdown";
import { phoneE164FromDraft } from "@/shared/phone/phoneInput";
import { Button } from "@/shared/ui/button";
import { PhoneText } from "@/shared/ui/format/PhoneText";
import { CheckIcon } from "@/shared/ui/icons";
import { previewAccountRecovery, requestRecoveryCode, submitAccountRecovery, verifyRecoveryCode } from "../api/recovery";
import { AuthCodeStep } from "../components/AuthCodeStep";
import { AuthDestinationField } from "../components/AuthDestinationField";
import { AuthLink, AuthLinkRow } from "../components/AuthLink";
import { AuthMessage } from "../components/AuthMessage";
import { AuthStatus } from "../components/AuthStatus";
import { loginCodeMessage } from "../errors";
import { authDestinationSchema, destinationFromFields } from "../lib/authDestinationForm";
import { loginDestinationErrorField, sameLoginDestination, toLoginDestinationRequest } from "../lib/loginDestination";

type Step = "previous" | "new" | "code" | "received";
type Operation = { destination: LoginDestination; previous?: LoginDestination; nonce: string; code?: string; revision: number };
function sameOperation(previous: Operation, next: Operation) {
  return previous.revision === next.revision && previous.nonce === next.nonce && previous.code === next.code && sameLoginDestination(previous.destination, next.destination)
    && (previous.previous && next.previous ? sameLoginDestination(previous.previous, next.previous) : previous.previous === next.previous);
}
const previousRequest = (destination: LoginDestination) => destination.type === "phone" ? { previousPhone: { ...destination.phone } } : { previousEmail: destination.email };
function recoveryNonce(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "");
}

export function RecoverAccountPage() {
  const { t } = useTranslation(["auth", "errors"]);
  const [step, setStep] = useState<Step>("previous");
  const [nonce] = useState(recoveryNonce);
  const [code, setCode] = useState("");
  const [destination, setDestination] = useState<LoginDestination>({ type: "email", email: "" });
  const previous = useRef<LoginDestination>({ type: "email", email: "" });
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const revision = useRef(0);
  const resendTimer = useCountdown(0);
  const sendRetry = useRetryAfterCountdown();
  const verifyRetry = useRetryAfterCountdown();
  const channels = useLoginChannels();
  const hasWhatsApp = channels.data?.channels.some((item) => item.key === "whatsapp") === true;
  const preview = useMutation({ mutationFn: previewAccountRecovery, meta: { handlesError: true } });
  const request = useIdempotentMutation((operation: Operation, key) => requestRecoveryCode({ ...toLoginDestinationRequest(operation.destination), nonce: operation.nonce }, key), { meta: { handlesError: true }, sameOperation });
  const verify = useIdempotentMutation((operation: Operation, key) => verifyRecoveryCode({ ...toLoginDestinationRequest(operation.destination), nonce: operation.nonce, code: operation.code! }, key), { meta: { handlesError: true }, sameOperation });
  const submit = useIdempotentMutation((operation: Operation, key) => submitAccountRecovery({ ...previousRequest(operation.previous!), ...toLoginDestinationRequest(operation.destination), nonce: operation.nonce }, key), { meta: { handlesError: true }, sameOperation });
  const schema = z.object({ previous: authDestinationSchema(t), next: z.object({ channel: z.enum(["email", "phone"]), email: z.string(), phone: z.object({ country: z.string(), number: z.string() }).nullable() }) }).superRefine((values, context) => {
    if (step === "previous") return;
    const parsed = authDestinationSchema(t).safeParse(values.next);
    if (!parsed.success) { for (const issue of parsed.error.issues) context.addIssue({ ...issue, path: ["next", ...issue.path] }); return; }
    if (sameLoginDestination(destinationFromFields(values.previous), destinationFromFields(values.next))) context.addIssue({ code: "custom", path: ["next", values.next.channel], message: t(values.next.channel === "phone" ? "recovery.phoneRepeated" : "recovery.emailRepeated") });
  });
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { previous: { channel: "email", email: "", phone: null }, next: { channel: "email", email: "", phone: null } } });
  useEffect(() => () => { revision.current++; }, []);

  function backTo(next: "previous" | "new") {
    revision.current++; setStep(next); setCode(""); setVerified(false); setError(null); form.clearErrors(); resendTimer.restart(0);
  }
  function destinationError(caught: ApiError, old = false) {
    const prefix = old ? "previous" : "next";
    const mapped = applyApiErrorToForm(caught, form.setError, old ? { previousEmail: "previous.email", previousPhone: "previous.phone", phone: "previous.phone" } : { email: "next.email", phone: "next.phone", previousEmail: "next.email", previousPhone: "next.phone" });
    if (mapped || caught.errors?.phone?.length || caught.errors?.previousPhone?.length) return true;
    if (loginDestinationErrorField(caught) || ["Platform.AccountRecovery.PhoneAccountNotFound", "Platform.AccountRecovery.PhoneMethodInUse", "Platform.AccountRecovery.AccountNotFound", "Platform.AccountRecovery.MethodInUse"].includes(caught.code ?? "")) {
      form.setError(`${prefix}.${form.getValues(prefix).channel}`, { type: "server", message: apiErrorMessage(caught, t) }); return true;
    }
    return false;
  }
  async function sendCode(target: LoginDestination, resend = false) {
    const current = revision.current; setError(null);
    try {
      const response = await request.mutateAsync({ destination: target, nonce, revision: current });
      if (current !== revision.current) return;
      revision.current++; setDestination(target); setCode(""); setVerified(false); resendTimer.restart(response.resendAfterSeconds); setStep("code");
      if (resend) toast.success(t("recovery.codeResent"));
    } catch (caught) {
      if (typeof caught === "object" && caught !== null && "name" in caught && caught.name === "AbortError") return;
      if (!(caught instanceof ApiError)) throw caught;
      if (current !== revision.current) return;
      if (!resend && destinationError(caught)) return;
      setError(caught); sendRetry.startFromError(caught);
    }
  }
  async function nextStep(target: LoginDestination) {
    const current = revision.current; setError(null);
    try {
      await preview.mutateAsync(previousRequest(target));
      if (current === revision.current) { previous.current = target; setStep("new"); }
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      if (current !== revision.current) return;
      if (!destinationError(caught, true)) setError(caught);
      sendRetry.startFromError(caught);
    }
  }
  async function verifyAndSubmit() {
    const current = revision.current; setError(null);
    try {
      if (!verified) {
        await verify.mutateAsync({ destination, nonce, code, revision: current });
        if (current !== revision.current) return;
        setVerified(true);
      }
      // Un reintento de red conserva la posesión comprobada y la clave, sin gastar otra vez el OTP.
      await submit.mutateAsync({ destination, previous: previous.current, nonce, revision: current });
      if (current === revision.current) setStep("received");
    } catch (caught) {
      if (typeof caught === "object" && caught !== null && "name" in caught && caught.name === "AbortError") return;
      if (!(caught instanceof ApiError)) throw caught;
      if (current !== revision.current) return;
      verifyRetry.startFromError(caught);
      if (["Platform.AccountRecovery.AccountNotFound", "Platform.AccountRecovery.PhoneAccountNotFound"].includes(caught.code ?? "")) { backTo("previous"); destinationError(caught, true); return; }
      if (["Platform.AccountRecovery.MethodInUse", "Platform.AccountRecovery.PhoneMethodInUse"].includes(caught.code ?? "") || (caught.code === "Validation.Failed" && (caught.errors?.email || caught.errors?.previousEmail || caught.errors?.phone || caught.errors?.previousPhone))) { backTo("new"); destinationError(caught); return; }
      if (caught.code === "Platform.AccountRecovery.VerificationRequired") { setVerified(false); setCode(""); }
      if (["Auth.LoginCode.Expired", "Auth.LoginCode.AlreadyUsed", "Auth.LoginCode.TooManyAttempts", "Platform.AccountRecovery.VerificationRequired"].includes(caught.code ?? "")) resendTimer.restart(0);
      setError(caught);
    }
  }
  const wrongCode = error?.code === "Auth.LoginCode.Invalid" || error?.code === "Auth.LoginCode.TooManyAttempts";
  const codeSpent = error?.code === "Auth.LoginCode.TooManyAttempts" || error?.code === "Auth.LoginCode.AlreadyUsed";
  const busy = verify.isPending || submit.isPending;
  const message = error ? { text: apiErrorMessage(error, t), details: error.code === "Auth.LoginCode.Invalid" ? loginCodeMessage(error, t).details : undefined } : null;
  const field = step === "previous" ? "previous" : "next";
  const previousFields = useWatch({ control: form.control, name: "previous" });
  const nextFields = useWatch({ control: form.control, name: "next" });
  const currentFields = step === "previous" ? previousFields : nextFields;
  return <AuthLayout access="consumer">
    {step === "received" ? <AuthStatus icon={CheckIcon} tone="ok" largeIcon title={t("recovery.receivedTitle")}
      detail={<Trans i18nKey={destination.type === "phone" ? "auth:recovery.receivedPhoneDetail" : "auth:recovery.receivedDetail"} values={{ email: destination.type === "email" ? destination.email : "" }} components={{ strong: <strong className="font-semibold text-[var(--t1)]" />, phone: <PhoneText value={destination.type === "phone" ? phoneE164FromDraft(destination.phone) : null} className="font-semibold text-[var(--t1)]" /> }} />}
      actions={<Button asChild size="lg" variant="outline"><Link to="/login">{t("recovery.backToLogin")}</Link></Button>} />
      : step === "code" ? <AuthCodeStep destination={destination.type === "email" ? destination.email : ""} phone={destination.type === "phone" ? destination.phone : undefined} code={code} onBack={() => backTo("new")}
        onCodeChange={(next) => { setCode(next); setError(null); }} onVerify={() => { void verifyAndSubmit(); }} onResend={() => { void sendCode(destination, true); }}
        invalid={wrongCode} locked={busy || request.isPending || codeSpent} message={message} verifyLabel={verifyRetry.label ?? undefined} verifyDisabled={verifyRetry.isRunning || codeSpent || request.isPending} verifyPending={busy}
        resendSeconds={resendTimer.seconds} resendRetryLabel={sendRetry.label} resendDisabled={busy} resendPending={request.isPending} />
      : <form noValidate className="flex flex-col gap-[22px]" onSubmit={(event) => { void form.handleSubmit((values) => step === "previous" ? nextStep(destinationFromFields(values.previous)) : sendCode(destinationFromFields(values.next)))(event); }}>
        {step === "new" ? <Button type="button" variant="link" onClick={() => backTo("previous")} className="gap-1 self-start leading-[normal]"><ChevronLeft aria-hidden="true" size={16} strokeWidth={2} />{t("recovery.back")}</Button> : null}
        <div><h1 className="text-[24px] leading-[1.2] font-bold tracking-[-0.02em]">{t(step === "previous" ? "recovery.title" : "recovery.newEmailTitle")}</h1>
          <p className="mt-1.5 text-sm leading-normal text-[var(--t2)]">{t(step === "previous" ? (hasWhatsApp ? "recovery.previousPhoneDetail" : "recovery.previousDetail") : (hasWhatsApp ? "recovery.newPhoneDetail" : "recovery.newEmailDetail"))}</p></div>
        <AuthDestinationField key={step} channel={currentFields.channel} email={currentFields.email} phone={currentFields.phone}
          onChannelChange={(next) => { revision.current++; form.setValue(`${field}.channel`, next); form.clearErrors(); setError(null); }}
          onEmailChange={(next) => { revision.current++; form.setValue(`${field}.email`, next); form.clearErrors(); setError(null); }}
          onPhoneChange={(next) => { revision.current++; form.setValue(`${field}.phone`, next); form.clearErrors(); setError(null); }}
          emailLabel={t(step === "previous" ? "recovery.previousEmail" : "recovery.newEmail")} phoneLabel={t(step === "previous" ? "recovery.previousPhone" : "recovery.newPhone")}
          error={form.formState.errors[field]?.email?.message ?? form.formState.errors[field]?.phone?.message} />
        <AuthMessage message={message} />
        <Button type="submit" size="lg" disabled={sendRetry.isRunning} pending={request.isPending || preview.isPending} pendingLabel={t("common:code.sending")}>{step === "previous" ? sendRetry.label ?? t("recovery.continue") : sendRetry.label ?? t("common:code.send")}</Button>
        <AuthLinkRow><AuthLink to="/login">{t("recovery.backToLogin")}</AuthLink></AuthLinkRow>
      </form>}
  </AuthLayout>;
}
