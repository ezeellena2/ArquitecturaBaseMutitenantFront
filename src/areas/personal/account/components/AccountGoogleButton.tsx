import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { linkGoogle } from "../api/loginMethods";
import { ChangeLoginMethodDialog } from "./ChangeLoginMethodDialog";

export function AccountGoogleButton() {
  const { t } = useTranslation("account");
  const [open, setOpen] = useState(false);
  async function link(reauthTicket: string) {
    const result = await linkGoogle({ reauthTicket });
    window.location.assign(result.redirectUrl);
  }
  return <><Button type="button" variant="outline" onClick={() => setOpen(true)} disabled={open}>{t("linkGoogle")}</Button>
    {open ? <ChangeLoginMethodDialog action="linkGoogle" onClose={() => setOpen(false)} onAuthorized={link} /> : null}</>;
}
