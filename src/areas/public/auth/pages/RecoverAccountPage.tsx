import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { RequestRecoveryCodeRequest, SubmitAccountRecoveryRequest, VerifyRecoveryCodeRequest } from "@/shared/api/types";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRetryAfterCountdown } from "@/shared/api/useRetryAfterCountdown";
import { useCountdown } from "@/shared/hooks/useCountdown";
import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/FormField";
import { EmailField } from "@/shared/ui/fields/EmailField";
import { CheckIcon } from "@/shared/ui/icons";
import { requestRecoveryCode, submitAccountRecovery, verifyRecoveryCode } from "../api/recovery";
import { AuthCodeStep } from "../components/AuthCodeStep";
import { AuthLink, AuthLinkRow } from "../components/AuthLink";
import { AuthMessage } from "../components/AuthMessage";
import { AuthStatus } from "../components/AuthStatus";
import { loginCodeMessage } from "../errors";

type Step = "previous" | "new" | "code" | "received";
type FormValues = { previousEmail: string; email: string };
type RecoveryOperation<TBody> = { body: TBody; revision: number };

// Una prueba por recorrido, solo en memoria: 32 bytes criptográficos codificados como 43 caracteres base64url.
function recoveryNonce(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "");
}

export function RecoverAccountPage() {
  const { t } = useTranslation(["auth", "errors"]);
  const [step, setStep] = useState<Step>("previous");
  const [nonce] = useState(recoveryNonce);
  const [code, setCode] = useState("");
  const [destination, setDestination] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  // Los enlaces pueden volver durante un envío: una respuesta del paso abandonado no lo vuelve a abrir.
  const revision = useRef(0);
  const resendTimer = useCountdown(0);
  const sendRetry = useRetryAfterCountdown();
  const verifyRetry = useRetryAfterCountdown();
  const request = useIdempotentMutation((operation: RecoveryOperation<RequestRecoveryCodeRequest>, key) => requestRecoveryCode(operation.body, key), {
    meta: { handlesError: true },
    sameOperation: (previous, next) => previous.revision === next.revision && previous.body.email === next.body.email && previous.body.nonce === next.body.nonce,
  });
  const verify = useIdempotentMutation((operation: RecoveryOperation<VerifyRecoveryCodeRequest>, key) => verifyRecoveryCode(operation.body, key), {
    meta: { handlesError: true },
    sameOperation: (previous, next) => previous.revision === next.revision && previous.body.email === next.body.email
      && previous.body.nonce === next.body.nonce && previous.body.code === next.body.code,
  });
  const submit = useIdempotentMutation((operation: RecoveryOperation<SubmitAccountRecoveryRequest>, key) => submitAccountRecovery(operation.body, key), {
    meta: { handlesError: true },
    sameOperation: (previous, next) => previous.revision === next.revision && previous.body.email === next.body.email
      && previous.body.nonce === next.body.nonce && previous.body.previousEmail === next.body.previousEmail,
  });
  const form = useForm<FormValues>({
    resolver: zodResolver(z.object({
      previousEmail: z.email({ error: t("recovery.emailInvalid") }),
      email: step === "previous" ? z.string() : z.email({ error: t("recovery.emailInvalid") }),
    }).refine((values) => step === "previous" || values.email !== values.previousEmail, { path: ["email"], error: t("recovery.emailRepeated") })),
    defaultValues: { previousEmail: "", email: "" },
  });

  function backTo(next: "previous" | "new") {
    revision.current++;
    setStep(next);
    setCode("");
    setVerified(false);
    setError(null);
    form.clearErrors();
    resendTimer.restart(0);
  }

  async function sendCode(email: string, resend = false) {
    const current = revision.current;
    setError(null);
    try {
      const response = await request.mutateAsync({ body: { email, nonce }, revision: current });
      if (current !== revision.current) return;
      // Un código recién emitido inicia otra operación de verificación, aunque se repitan sus seis números.
      revision.current++;
      setDestination(email);
      setCode("");
      setVerified(false);
      resendTimer.restart(response.resendAfterSeconds);
      setStep("code");
      if (resend) toast.success(t("recovery.codeResent"));
    } catch (caught) {
      if (typeof caught === "object" && caught !== null && "name" in caught && caught.name === "AbortError") return;
      if (!(caught instanceof ApiError)) throw caught;
      if (current !== revision.current) return;
      if (!resend && applyApiErrorToForm(caught, form.setError, { email: "email" })) return;
      setError(caught);
      sendRetry.startFromError(caught);
    }
  }

  async function verifyAndSubmit() {
    const current = revision.current;
    setError(null);
    try {
      if (!verified) {
        await verify.mutateAsync({ body: { email: destination, nonce, code }, revision: current });
        if (current !== revision.current) return;
        setVerified(true);
      }
      // Red/5xx conserva tanto la prueba ya verificada como la clave de este pedido; no se gasta de nuevo el código.
      await submit.mutateAsync({ body: { previousEmail: form.getValues("previousEmail"), email: destination, nonce }, revision: current });
      if (current === revision.current) setStep("received");
    } catch (caught) {
      if (typeof caught === "object" && caught !== null && "name" in caught && caught.name === "AbortError") return;
      if (!(caught instanceof ApiError)) throw caught;
      if (current !== revision.current) return;
      verifyRetry.startFromError(caught);
      if (caught.code === "Validation.Failed" && (caught.errors?.email || caught.errors?.previousEmail)) {
        backTo("new");
        // El back valida la comparación sobre previousEmail; en el tablero se corrige el correo nuevo.
        applyApiErrorToForm(caught, form.setError, { email: "email", previousEmail: "email" });
        return;
      }
      if (caught.code === "Platform.AccountRecovery.VerificationRequired") {
        setVerified(false);
        setCode("");
      }
      if (["Auth.LoginCode.Expired", "Auth.LoginCode.AlreadyUsed", "Auth.LoginCode.TooManyAttempts", "Platform.AccountRecovery.VerificationRequired"].includes(caught.code ?? "")) resendTimer.restart(0);
      setError(caught);
    }
  }

  const wrongCode = error?.code === "Auth.LoginCode.Invalid" || error?.code === "Auth.LoginCode.TooManyAttempts";
  const codeSpent = error?.code === "Auth.LoginCode.TooManyAttempts" || error?.code === "Auth.LoginCode.AlreadyUsed";
  const busy = verify.isPending || submit.isPending;
  const message = error ? {
    text: apiErrorMessage(error, t),
    details: error.code === "Auth.LoginCode.Invalid" ? loginCodeMessage(error, t).details : undefined,
  } : null;

  return <AuthLayout access="consumer">
    {step === "received" ? <AuthStatus icon={CheckIcon} tone="ok" largeIcon title={t("recovery.receivedTitle")}
      detail={<Trans i18nKey="auth:recovery.receivedDetail" values={{ email: destination }} components={{ strong: <strong className="font-semibold text-[var(--t1)]" /> }} />}
      actions={<Button asChild size="lg" variant="outline"><Link to="/login">{t("recovery.backToLogin")}</Link></Button>} />
      : step === "code" ? <AuthCodeStep destination={destination} code={code} onBack={() => backTo("new")}
        onCodeChange={(next) => { setCode(next); setError(null); }} onVerify={() => { void verifyAndSubmit(); }} onResend={() => { void sendCode(destination, true); }}
        invalid={wrongCode} locked={busy || request.isPending || codeSpent} message={message}
        verifyLabel={verifyRetry.label ?? undefined} verifyDisabled={verifyRetry.isRunning || codeSpent || request.isPending} verifyPending={busy}
        resendSeconds={resendTimer.seconds} resendRetryLabel={sendRetry.label} resendDisabled={busy} resendPending={request.isPending} />
      : <form noValidate className="flex flex-col gap-[22px]" onSubmit={(event) => {
        void form.handleSubmit((values) => {
          if (step === "previous") { setStep("new"); return; }
          return sendCode(values.email);
        })(event);
      }}>
        {step === "new" ? <Button type="button" variant="link" onClick={() => backTo("previous")} className="gap-1 self-start leading-[normal]">
          <ChevronLeft aria-hidden="true" size={16} strokeWidth={2} />{t("recovery.back")}
        </Button> : null}
        <div>
          <h1 className="text-[24px] leading-[1.2] font-bold tracking-[-0.02em]">{t(step === "previous" ? "recovery.title" : "recovery.newEmailTitle")}</h1>
          <p className="mt-1.5 text-sm leading-normal text-[var(--t2)]">{t(step === "previous" ? "recovery.previousDetail" : "recovery.newEmailDetail")}</p>
        </div>
        <Controller key={step} control={form.control} name={step === "previous" ? "previousEmail" : "email"} render={({ field, fieldState }) =>
          <FormField label={t(step === "previous" ? "recovery.previousEmail" : "recovery.newEmail")} variant="auth" error={fieldState.error?.message}>
            <EmailField name={field.name} ref={field.ref} onBlur={field.onBlur} value={field.value} onChange={(value) => { field.onChange(value ?? ""); setError(null); }} />
          </FormField>} />
        <AuthMessage message={message} />
        <Button type="submit" size="lg" disabled={step === "new" && sendRetry.isRunning} pending={request.isPending} pendingLabel={t("common:code.sending")}>
          {step === "previous" ? t("recovery.continue") : sendRetry.label ?? t("common:code.send")}
        </Button>
        <AuthLinkRow><AuthLink to="/login">{t("recovery.backToLogin")}</AuthLink></AuthLinkRow>
      </form>}
  </AuthLayout>;
}
