import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { ApiError } from "@/shared/api/ApiError";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRetryAfterCountdown } from "@/shared/api/useRetryAfterCountdown";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { EmailField } from "@/shared/ui/fields/EmailField";
import { requestLoginCode } from "../api/loginCode";
import { loginCodeErrorKey } from "../errors";
import { beginCodeStep } from "../lib/loginCodeState";
import type { CodeStep } from "../lib/loginCodeState";

export interface EmailCodeFormProps {
  onCodeRequested: (step: CodeStep) => void;
  notice?: ReactNode;
  onSubmitStart?: () => void;
}

const schema = z.object({ email: z.email() });
type FormValues = z.infer<typeof schema>;

export function EmailCodeForm({ onCodeRequested, notice, onSubmitStart }: EmailCodeFormProps) {
  const { t } = useTranslation("auth");
  const [formError, setFormError] = useState<{ message: string; tone: "danger" | "warning" } | null>(null);
  const { control, handleSubmit, setError, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });
  const request = useIdempotentMutation((email: string, key) => requestLoginCode(email, key));
  const retry = useRetryAfterCountdown();

  async function submit({ email }: FormValues) {
    setFormError(null);
    try {
      await request.mutateAsync(email);
      onCodeRequested(beginCodeStep(email, Date.now()));
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      if (!applyApiErrorToForm(caught, setError, { email: "email" })) {
        setFormError({ message: t(loginCodeErrorKey(caught)), tone: caught.code === "Auth.LoginCode.ResendTooSoon" ? "warning" : "danger" });
      }
      retry.startFromError(caught);
    }
  }

  return (
    <form noValidate className="flex flex-col gap-[22px]" onSubmit={(event) => {
      onSubmitStart?.();
      void handleSubmit(submit)(event);
    }}>
      <Controller control={control} name="email" render={({ field }) => (
        <FormField label={t("login.emailLabel")} error={errors.email?.type === "server" ? errors.email.message : errors.email ? t("login.emailInvalid") : undefined}>
          <EmailField name={field.name} ref={field.ref} onBlur={field.onBlur} value={field.value} onChange={field.onChange} />
        </FormField>
      )} />
      <FormError message={formError?.message ?? notice} tone={formError?.tone} />
      <Button type="submit" size="lg" className="w-full" disabled={request.isPending || retry.isRunning}>
        {retry.label ?? t("login.sendCode")}
      </Button>
    </form>
  );
}
