import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useLoginChannels } from "@/shared/account/useLoginChannels";
import type { PhoneDraft } from "@/shared/api/types";
import { FormField } from "@/shared/ui/FormField";
import { EmailField } from "@/shared/ui/fields/EmailField";
import { PhoneField } from "@/shared/ui/fields/PhoneField";
import { MailIcon } from "@/shared/ui/icons";

interface AuthDestinationFieldProps {
  channel: "email" | "phone";
  onChannelChange: (channel: "email" | "phone") => void;
  email: string;
  onEmailChange: (email: string) => void;
  phone: PhoneDraft | null;
  onPhoneChange: (phone: PhoneDraft | null) => void;
  error?: string;
  emailLabel?: string;
  phoneLabel?: string;
}

/** Selector de los tableros Ingreso y Registro; las capacidades las decide la API. */
export function AuthDestinationField({ channel, onChannelChange, email, onEmailChange, phone, onPhoneChange, error, emailLabel, phoneLabel }: AuthDestinationFieldProps) {
  const { t } = useTranslation("auth");
  const channels = useLoginChannels();
  const hasWhatsApp = channels.data?.channels.some((item) => item.key === "whatsapp") === true;
  useEffect(() => {
    if (!channels.isPending && !hasWhatsApp && channel === "phone") onChannelChange("email");
  }, [channels.isPending, hasWhatsApp, channel, onChannelChange]);
  const showPhone = hasWhatsApp && channel === "phone";
  return <div className="flex flex-col gap-[22px]">
    {hasWhatsApp ? <div role="group" aria-label={t("login.channelLabel")} className="flex gap-1 rounded-[12px] bg-[var(--s3)] p-1 max-md:rounded-[10px] max-md:p-[3px]">
      {(["email", "phone"] as const).map((value) => <button key={value} type="button" aria-pressed={(showPhone ? "phone" : "email") === value}
        onClick={() => onChannelChange(value)} className={`inline-flex h-[38px] flex-1 items-center justify-center gap-2 rounded-[9px] text-[14px] font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--foco-halo)] ${((showPhone ? "phone" : "email") === value) ? "bg-[var(--lado-activo)] text-[var(--t1)] shadow-sm" : "text-[var(--t2)]"}`}>
        {value === "email" ? <MailIcon className="size-4" aria-hidden="true" /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z" /><path d="M9.5 9.5c.3 1.8 2.2 3.8 4 4.2l1.2-1.2 1.8.8c0 1-.8 1.8-1.8 1.8-3.3 0-6.5-3.2-6.5-6.5 0-1 .8-1.8 1.8-1.8l.8 1.8z" /></svg>}
        {t(value === "phone" ? "login.whatsappChannel" : "login.emailChannel")}
      </button>)}
    </div> : null}
    {showPhone ? <FormField label={phoneLabel ?? t("login.phoneLabel")} variant="auth" error={error}>
      <PhoneField usage="whatsapp" value={phone} onChange={onPhoneChange} variant="auth" />
    </FormField> : <FormField label={emailLabel ?? t("login.emailLabel")} variant="auth" error={error}>
      <EmailField value={email} onChange={(value) => onEmailChange(value ?? "")} />
    </FormField>}
  </div>;
}
