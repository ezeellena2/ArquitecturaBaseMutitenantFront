import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { ApiError } from "@/shared/api/ApiError";
import { linkGoogle } from "../api/loginMethods";

export function AccountGoogleButton() {
  const { t } = useTranslation("account");
  const [busy, setBusy] = useState(false);
  async function link() {
    setBusy(true);
    try { const result = await linkGoogle(); window.location.assign(result.redirectUrl); }
    catch (error) { toast.error(error instanceof ApiError && error.detail ? error.detail : t("googleFailed")); setBusy(false); }
  }
  return <Button type="button" variant="outline" onClick={() => { void link(); }} disabled={busy}>{t("linkGoogle")}</Button>;
}
