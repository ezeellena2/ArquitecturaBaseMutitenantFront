import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { AccountLoginMethod } from "@/shared/api/types";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { OtpInput } from "@/shared/ui/OtpInput";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { makeLoginMethodPrimary, removeLoginMethod } from "./api/loginMethods";
import { useAccountReauth } from "./useAccountReauth";
import { useHasLoginChannel } from "./useLoginChannels";

export function ChangeLoginMethodDialog({ action, method, onClose, onComplete, onAuthorized }: {
  action: "remove" | "primary" | "addEmail" | "linkGoogle"; method?: AccountLoginMethod;
  onClose: () => void; onComplete?: () => void; onAuthorized?: (ticket: string) => void | Promise<void>;
}) {
  const { t } = useTranslation("account");
  const reauth = useAccountReauth({ action: action === "remove" ? "RemoveMethod" : action === "primary" ? "MakePrimary" : action === "addEmail" ? "AddEmail" : "LinkGoogle", targetMethodId: method?.id });
  const restoreFocus = useRestoreFocusOnClose();
  const [saving, setSaving] = useState(false);
  const adding = action === "addEmail" || action === "linkGoogle";
  const whatsApp = useHasLoginChannel("whatsapp");
  const google = method?.type === "Google";
  const title = adding ? action === "addEmail" ? whatsApp ? "add" : "addEmail" : "linkGoogle" : action === "primary" ? google ? "primaryGoogleTitle" : "primaryEmailTitle" : google ? "removeGoogleTitle" : "removeEmailTitle";
  const label = adding ? "common:code.verify" : action === "primary" ? "makePrimary" : google ? "unlink" : "remove";
  async function confirm() {
    if (!reauth.proof) { await reauth.send(); return; }
    if (!reauth.codeComplete()) return;
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
  // «Criterio · Botones», Guardando: mientras manda el código, «Enviando…»; al verificarlo para sumar un medio, «Verificando…»;
  // al hacerlo principal, «Guardando…»; al quitar, «Quitando…», y al desvincular, «Desvinculando…» (decisión del usuario
  // del 2026-10-05).
  const pendingLabel = !reauth.proof ? t("common:code.sending") : adding ? t("common:code.verifying") : action === "primary" ? undefined
    : t(google ? "unlinking" : "removing");
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent showCloseButton={action !== "remove"} size="sm" onCloseAutoFocus={restoreFocus}>
    <form onSubmit={(event) => { event.preventDefault(); void confirm(); }}>
      <DialogHeader><DialogTitle>{t(title)}</DialogTitle></DialogHeader>
      <DialogBody>
      <DialogDescription>{reauth.proof ? t(adding ? "reauthHint" : action === "primary" ? "primaryHint" : "removeHint", { value: method?.value, backup: reauth.proof.destination }) : null}</DialogDescription>
      {/* Como en Cuenta-Verificar: el código a medias o incorrecto va debajo de los casilleros; lo demás, en la franja. */}
      {reauth.proof ? <OtpInput length={6} value={reauth.code} onChange={reauth.changeCode} label={t("common:code.label")} autoFocus disabled={busy} error={reauth.codeFailure} /> : null}
      <FormError message={reauth.failure} />
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>{t("cancel")}</Button><Button type="submit" variant={action === "remove" ? "destructive" : "default"} disabled={reauth.retry.isRunning || (!reauth.proof && !reauth.failure)} pending={busy} pendingLabel={pendingLabel}>{reauth.retry.label ?? t(label)}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
