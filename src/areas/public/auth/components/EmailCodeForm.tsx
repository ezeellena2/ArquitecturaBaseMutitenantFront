import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/shared/api/ApiError";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRetryAfterCountdown } from "@/shared/api/useRetryAfterCountdown";
import { Button } from "@/shared/ui/button";
import { AuthDestinationField } from "./AuthDestinationField";
import { authDestinationSchema, destinationFromFields, destinationNavigationState, type AuthDestinationFields } from "../lib/authDestinationForm";
import type { LoginDestination, PhoneDraft } from "@/shared/api/types";
import { loginDestinationErrorField, sameLoginDestination, toLoginDestinationRequest } from "../lib/loginDestination";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { accountErrorCodes } from "@/shared/api/accountContract";
import { useHasLoginChannel } from "@/shared/account/useLoginChannels";
import { requestLoginCode } from "../api/loginCode";
import { AuthMessage, type AuthMessageContent } from "./AuthMessage";
import { loginCodeErrorMessage } from "../errors";
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
  signupHref?: string;
  initialPhone?: PhoneDraft | null;
}


export function EmailCodeForm({ onCodeRequested, notice, onSubmitStart, access = "consumer", initialEmail = "", initialPhone = null, signupHref }: EmailCodeFormProps) {
  const { t } = useTranslation("auth");
  const hasWhatsApp = useHasLoginChannel("whatsapp");
  const schema = useMemo(() => authDestinationSchema(t), [t]);
  const [formError, setFormError] = useState<AuthMessageContent | null>(null);
  const [accountMissing, setAccountMissing] = useState(false);
  const { control, handleSubmit, setError, clearErrors, getValues, setValue, formState: { errors } } = useForm<AuthDestinationFields>({
    resolver: zodResolver(schema),
    defaultValues: { channel: initialPhone ? "phone" : "email", email: initialEmail, phone: initialPhone },
  });
  const channel = useWatch({ control, name: "channel" });
  const email = useWatch({ control, name: "email" });
  const phone = useWatch({ control, name: "phone" });
  const request = useIdempotentMutation((destination: LoginDestination, key) => requestLoginCode(toLoginDestinationRequest(destination), key), { meta: { handlesError: true }, sameOperation: sameLoginDestination });
  const retry = useRetryAfterCountdown();

  async function submit(values: AuthDestinationFields) {
    setFormError(null);
    setAccountMissing(false);
    if (values.channel === "phone" && !hasWhatsApp) return;
    const destination = destinationFromFields(values);
    try {
      const response = await request.mutateAsync(destination);
      onCodeRequested(beginCodeStep(destination.type === "email" ? destination.email : "", Date.now(), destination, response.resendAfterSeconds));
    } catch (caught) {
      if (!(caught instanceof ApiError)) throw caught;
      setAccountMissing(caught.code === "Auth.LoginCode.AccountNotFound" || caught.code === accountErrorCodes.phoneAccountNotFound);
      if (loginDestinationErrorField(caught)) setError("phone", { type: "server", message: apiErrorMessage(caught, t) });
      else if (!applyApiErrorToForm(caught, setError, { email: "email", phone: "phone" })) {
        setFormError({ text: loginCodeErrorMessage(caught, t), tone: caught.code === "Auth.LoginCode.ResendTooSoon" ? "warning" : "danger" });
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
      <AuthDestinationField channel={channel} email={email} phone={phone}
        onChannelChange={(value) => { setValue("channel", value); clearErrors(); setAccountMissing(false); setFormError(null); }}
        onEmailChange={(value) => { setValue("email", value); clearErrors("email"); setAccountMissing(false); setFormError(null); }}
        onPhoneChange={(value) => { setValue("phone", value); clearErrors("phone"); setAccountMissing(false); setFormError(null); }}
        error={channel === "phone" && hasWhatsApp ? errors.phone?.message : errors.email?.message} />
      {accountMissing ? <AuthLink className="self-start text-[14px]!" to={signupHref ?? (access === "business" ? "/registro/empresa" : "/registro")}
        state={destinationNavigationState(destinationFromFields(getValues()))}>{t(access === "business" ? "login.registerBusiness" : "login.createMyAccount")}</AuthLink> : null}
      </div>
      <AuthMessage message={formError ?? notice} />
      <Button type="submit" size="lg" className="w-full" disabled={retry.isRunning} pending={request.isPending} pendingLabel={t("common:code.sending")}>
        {retry.label ?? t("common:code.send")}
      </Button>
    </form>
  );
}
