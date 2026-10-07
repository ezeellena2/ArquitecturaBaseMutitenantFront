import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { AccountLoginMethod } from "@/shared/api/types";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { makeLoginMethodPrimary, removeLoginMethod } from "./api/loginMethods";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { useRetryAfterCountdown } from "@/shared/api/useRetryAfterCountdown";

export function ChangeLoginMethodDialog({ action, method, onClose, onComplete }: {
  action: "remove" | "primary"; method: AccountLoginMethod;
  onClose: () => void; onComplete?: () => void;
}) {
  const { t } = useTranslation("account");
  const restoreFocus = useRestoreFocusOnClose();
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const retry = useRetryAfterCountdown();
  const google = method.type === "Google";
  const title = action === "primary" ? google ? "primaryGoogleTitle" : "primaryEmailTitle" : google ? "removeGoogleTitle" : "removeEmailTitle";
  const label = action === "primary" ? "makePrimary" : google ? "unlink" : "remove";
  async function confirm() {
    setFailure(null); setSaving(true);
    try {
      if (action === "primary") await makeLoginMethodPrimary(method.id); else await removeLoginMethod(method.id);
      toast.success(t(action === "primary" ? "primaryChanged" : google ? "googleUnlinked" : "removed", { value: method.value }));
      onComplete?.(); onClose();
    } catch (error) { retry.startFromError(error); setFailure(apiErrorMessage(error, t)); }
    finally { setSaving(false); }
  }
  const busy = saving;
  // «Criterio · Botones»: al hacerlo principal, «Guardando…»; al quitar, «Quitando…»; al desvincular, «Desvinculando…».
  const pendingLabel = action === "primary" ? undefined
    : t(google ? "unlinking" : "removing");
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent showCloseButton={action !== "remove"} size="sm" onCloseAutoFocus={restoreFocus}>
    <form onSubmit={(event) => { event.preventDefault(); void confirm(); }}>
      <DialogHeader><DialogTitle>{t(title)}</DialogTitle></DialogHeader>
      <DialogBody>
      <DialogDescription>{t(action === "primary" ? "primaryHint" : "removeHint", { value: method.value })}</DialogDescription>
      <FormError message={failure} />
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>{t("cancel")}</Button><Button type="submit" variant={action === "remove" ? "destructive" : "default"} disabled={retry.isRunning} pending={busy} pendingLabel={pendingLabel}>{retry.label ?? t(label)}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
