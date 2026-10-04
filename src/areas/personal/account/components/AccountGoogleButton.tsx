import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { linkGoogle } from "@/shared/account/api/loginMethods";
import { ChangeLoginMethodDialog } from "@/shared/account/ChangeLoginMethodDialog";

export function AccountGoogleButton({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation("account");
  const [open, setOpen] = useState(false);
  async function link(reauthTicket: string) {
    const result = await linkGoogle({ reauthTicket });
    window.location.assign(result.redirectUrl);
  }
  return <><Button type="button" aria-label={compact ? t("linkGoogle") : undefined} variant="outline" size={compact ? "sm" : "default"} onClick={() => setOpen(true)} disabled={open}>{t(compact ? "linkGoogleShort" : "linkGoogle")}</Button>
    {open ? <ChangeLoginMethodDialog action="linkGoogle" onClose={() => setOpen(false)} onAuthorized={link} /> : null}</>;
}
