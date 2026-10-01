import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { AccountLoginMethod } from "@/shared/api/types";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { OtpInput } from "@/shared/ui/OtpInput";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { makeLoginMethodPrimary, removeLoginMethod } from "../api/loginMethods";
import { useAccountReauth } from "./useAccountReauth";

export function ChangeLoginMethodDialog({ action, method, onClose, onComplete, onAuthorized }: {
  action: "remove" | "primary" | "addEmail" | "linkGoogle"; method?: AccountLoginMethod;
  onClose: () => void; onComplete?: () => void; onAuthorized?: (ticket: string) => void | Promise<void>;
}) {
  const { t } = useTranslation("account");
  const reauth = useAccountReauth({ action: action === "remove" ? "RemoveMethod" : action === "primary" ? "MakePrimary" : action === "addEmail" ? "AddEmail" : "LinkGoogle", targetMethodId: method?.id });
  const restoreFocus = useRestoreFocusOnClose();
  const [saving, setSaving] = useState(false);
  const adding = action === "addEmail" || action === "linkGoogle";
  const google = method?.type === "Google";
  const title = adding ? action === "addEmail" ? "add" : "linkGoogle" : action === "primary" ? google ? "primaryGoogleTitle" : "primaryEmailTitle" : google ? "removeGoogleTitle" : "removeEmailTitle";
  const label = adding ? "verify" : action === "primary" ? "makePrimary" : google ? "unlink" : "remove";
  async function confirm() {
    if (!reauth.proof) { await reauth.send(); return; }
    if (reauth.code.length !== 6) { reauth.setFailure(t("codeIncomplete")); return; }
    reauth.setFailure(null); setSaving(true);
    try {
      const request = { reauthTicket: await reauth.getTicket() };
      if (adding) { await onAuthorized?.(request.reauthTicket); return; }
      if (action === "primary") await makeLoginMethodPrimary(method!.id, request); else await removeLoginMethod(method!.id, request);
      toast.success(t(action === "primary" ? "primaryChanged" : google ? "googleUnlinked" : "removed", { value: method!.value }));
      onComplete?.(); onClose();
    } catch (error) { reauth.showError(error); }
    finally { setSaving(false); }
  }
  const busy = saving || reauth.isPending;
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="account-dialog md:max-w-[420px]" onCloseAutoFocus={restoreFocus}>
    <form className="flex flex-col gap-5" onSubmit={(event) => { event.preventDefault(); void confirm(); }}>
      <DialogHeader><DialogTitle>{t(title)}</DialogTitle><DialogDescription>{reauth.proof ? t(adding ? "reauthHint" : action === "primary" ? "primaryHint" : "removeHint", { value: method?.value, backup: reauth.proof.destination }) : null}</DialogDescription></DialogHeader>
      {reauth.proof ? <OtpInput length={6} value={reauth.code} onChange={(value) => { reauth.setCode(value); reauth.setFailure(null); }} label={t("code")} autoFocus disabled={busy} /> : null}
      <FormError message={reauth.failure} />
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>{t("cancel")}</Button><Button type="submit" variant={action === "remove" ? "destructive" : "default"} disabled={busy || reauth.retry.isRunning || (!reauth.proof && !reauth.failure)}>{reauth.retry.label ?? t(label)}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
