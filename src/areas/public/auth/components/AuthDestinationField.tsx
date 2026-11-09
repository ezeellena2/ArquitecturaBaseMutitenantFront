import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useLoginChannels } from "@/shared/account/useLoginChannels";
import type { PhoneDraft } from "@/shared/api/types";
import { FormField } from "@/shared/ui/FormField";
import { EmailField } from "@/shared/ui/fields/EmailField";
import { PhoneField } from "@/shared/ui/fields/PhoneField";
import { MailIcon } from "@/shared/ui/icons";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";

interface AuthDestinationFieldProps {
  channel: "email" | "phone";
  onChannelChange: (channel: "email" | "phone") => void;
  email: string;
  onEmailChange: (email: string) => void;
  phone: PhoneDraft | null;
  phoneUsage: "mobile" | "whatsapp";
  onPhoneChange: (phone: PhoneDraft | null) => void;
  error?: string;
  emailLabel?: string;
  phoneLabel?: string;
}

/** Selector de los tableros Ingreso y Registro; las capacidades las decide la API. */
export function AuthDestinationField({ channel, onChannelChange, email, onEmailChange, phone, phoneUsage, onPhoneChange, error, emailLabel, phoneLabel }: AuthDestinationFieldProps) {
  const { t } = useTranslation("auth");
  const channels = useLoginChannels();
  const hasWhatsApp = channels.data?.channels.some((item) => item.key === "whatsapp") === true;
  useEffect(() => {
    if (!channels.isPending && !hasWhatsApp && channel === "phone") onChannelChange("email");
  }, [channels.isPending, hasWhatsApp, channel, onChannelChange]);
  const showPhone = hasWhatsApp && channel === "phone";
  return <div className="flex flex-col gap-5.5">
    {/* Tablero Ingreso (.seg2): el segmentado común, con la elegida rellena (142). */}
    {hasWhatsApp ? <SegmentedControl fullWidth aria-label={t("login.channelLabel")} options={(["email", "phone"] as const).map((value) => ({
      key: value,
      pressed: (showPhone ? "phone" : "email") === value,
      onSelect: () => onChannelChange(value),
      icon: value === "email" ? <MailIcon className="size-4 shrink-0" aria-hidden="true" /> : <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z" /><path d="M9.5 9.5c.3 1.8 2.2 3.8 4 4.2l1.2-1.2 1.8.8c0 1-.8 1.8-1.8 1.8-3.3 0-6.5-3.2-6.5-6.5 0-1 .8-1.8 1.8-1.8l.8 1.8z" /></svg>,
      label: t(value === "phone" ? "login.whatsappChannel" : "login.emailChannel"),
    }))} /> : null}
    {showPhone ? <FormField label={phoneLabel ?? t("login.phoneLabel")} variant="auth" error={error}>
      <PhoneField usage={phoneUsage} value={phone} onChange={onPhoneChange} variant="auth" />
    </FormField> : <FormField label={emailLabel ?? t("login.emailLabel")} variant="auth" error={error}>
      <EmailField value={email} onChange={(value) => onEmailChange(value ?? "")} />
    </FormField>}
  </div>;
}
