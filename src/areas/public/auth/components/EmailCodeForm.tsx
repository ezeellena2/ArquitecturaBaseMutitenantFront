import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { ApiError } from "@/shared/api/ApiError";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRetryAfterCountdown } from "@/shared/api/useRetryAfterCountdown";
import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/FormField";
import { EmailField } from "@/shared/ui/fields/EmailField";
import { requestLoginCode } from "../api/loginCode";
import { AuthMessage, type AuthMessageContent } from "./AuthMessage";
import { loginCodeErrorKey } from "../errors";
import { beginCodeStep } from "../lib/loginCodeState";
import { AuthLink } from "./AuthLink";
import type { CodeStep } from "../lib/loginCodeState";

export interface EmailCodeFormProps {
  onCodeRequested: (step: CodeStep) => void;
  /** Lo que la pantalla tiene para decir antes de que se pida el código: que falló el ingreso con Google. */
  notice?: AuthMessageContent;
  onSubmitStart?: () => void;
  access?: "consumer" | "business";
  initialEmail?: string;
}

const schema = z.object({ email: z.email() });
type FormValues = z.infer<typeof schema>;

export function EmailCodeForm({ onCodeRequested, notice, onSubmitStart, access = "consumer", initialEmail = "" }: EmailCodeFormProps) {
  const { t } = useTranslation("auth");
  const [formError, setFormError] = useState<AuthMessageContent | null>(null);
  const [accountMissing, setAccountMissing] = useState(false);
  const { control, handleSubmit, setError, clearErrors, getValues, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: initialEmail },
  });
  const request = useIdempotentMutation((email: string, key) => requestLoginCode(email, key), { meta: { handlesError: true } });
  const retry = useRetryAfterCountdown();

  async function submit({ email }: FormValues) {
    setFormError(null);
    setAccountMissing(false);
    try {
      await request.mutateAsync(email);
      onCodeRequested(beginCodeStep(email, Date.now()));
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      setAccountMissing(caught.code === "Auth.LoginCode.AccountNotFound");
      if (!applyApiErrorToForm(caught, setError, { email: "email" })) {
        setFormError({ text: t(loginCodeErrorKey(caught)), tone: caught.code === "Auth.LoginCode.ResendTooSoon" ? "warning" : "danger" });
      }
      retry.startFromError(caught);
    }
  }

  return (
    <form noValidate className="flex flex-col gap-[22px]" onSubmit={(event) => {
      onSubmitStart?.();
      void handleSubmit(submit)(event);
    }}>
      <div className="flex flex-col gap-1.5">
      <Controller control={control} name="email" render={({ field }) => (
        <FormField label={t("login.emailLabel")} variant="auth" error={errors.email?.type === "server" ? errors.email.message : errors.email ? t("login.emailInvalid") : undefined}>
          <EmailField name={field.name} ref={field.ref} onBlur={field.onBlur} value={field.value} onChange={(value) => {
            field.onChange(value); clearErrors("email"); setAccountMissing(false); setFormError(null);
          }} />
        </FormField>
      )} />
      {accountMissing && errors.email ? <AuthLink className="self-start text-[14px]!" to={access === "business" ? "/registro/empresa" : "/registro"}
        state={{ email: getValues("email") }}>{t(access === "business" ? "login.registerBusiness" : "login.createMyAccount")}</AuthLink> : null}
      </div>
      <AuthMessage message={formError ?? notice} />
      <Button type="submit" size="lg" className="w-full" disabled={retry.isRunning} pending={request.isPending} pendingLabel={t("common:code.sending")}>
        {retry.label ?? t("common:code.send")}
      </Button>
    </form>
  );
}
