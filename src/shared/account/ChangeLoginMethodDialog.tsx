import { useEffect, useRef, useState } from "react";
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
import { useFormat } from "@/shared/format/useFormat";

export function ChangeLoginMethodDialog({ action, method, onClose, onComplete, returnFocus }: {
  action: "remove" | "primary"; method: AccountLoginMethod;
  onClose: () => void; onComplete?: () => void; returnFocus?: HTMLElement | null;
}) {
  const { t } = useTranslation("account");
  const restoreFocus = useRestoreFocusOnClose(true, returnFocus);
  const format = useFormat();
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const retry = useRetryAfterCountdown();
  const google = method.type === "Google";
  const phone = method.type === "Phone";
  const value = phone ? format.formatPhone(method.value ?? "") : method.value;
  const title = action === "primary" ? google ? "primaryGoogleTitle" : phone ? "primaryPhoneTitle" : "primaryEmailTitle" : google ? "removeGoogleTitle" : phone ? "removePhoneTitle" : "removeEmailTitle";
  const label = action === "primary" ? "makePrimary" : google ? "unlink" : "remove";
  function close() { alive.current = false; onClose(); }
  async function confirm() {
    if (saving || !(action === "primary" ? method.canMakePrimary : method.canRemove)) return;
    setFailure(null); setSaving(true);
    try {
      if (action === "primary") await makeLoginMethodPrimary(method.id); else await removeLoginMethod(method.id);
      if (!alive.current) return;
      toast.success(t(action === "primary" ? "primaryChanged" : google ? "googleUnlinked" : "removed", { value }));
      onComplete?.(); close();
    } catch (error) { if (alive.current) { retry.startFromError(error); setFailure(apiErrorMessage(error, t)); } }
    finally { if (alive.current) setSaving(false); }
  }
  const busy = saving;
  // «Criterio · Botones»: al hacerlo principal, «Guardando…»; al quitar, «Quitando…»; al desvincular, «Desvinculando…».
  const pendingLabel = action === "primary" ? undefined
    : t(google ? "unlinking" : "removing");
  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}><DialogContent showCloseButton={action !== "remove"} size="sm" onCloseAutoFocus={restoreFocus}>
    <form onSubmit={(event) => { event.preventDefault(); void confirm(); }}>
      <DialogHeader><DialogTitle>{t(title)}</DialogTitle></DialogHeader>
      <DialogBody>
      <DialogDescription>{t(action === "primary" ? "primaryHint" : "removeHint", { value })}</DialogDescription>
      <FormError message={failure} />
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" onClick={close}>{t("cancel")}</Button><Button type="submit" variant={action === "remove" ? "destructive" : "default"} disabled={retry.isRunning || !(action === "primary" ? method.canMakePrimary : method.canRemove)} pending={busy} pendingLabel={pendingLabel}>{retry.label ?? t(label)}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
