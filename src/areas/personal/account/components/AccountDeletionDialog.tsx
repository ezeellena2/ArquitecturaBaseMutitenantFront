import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/shared/api/ApiError";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Textarea } from "@/shared/ui/textarea";
import { OtpInput } from "@/shared/ui/OtpInput";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { requestAccountDeletion } from "../api/deletion";
import { useAccountReauth } from "@/shared/account/useAccountReauth";

export function AccountDeletionDialog({ graceDays, onClose, onComplete }: { graceDays: number; onClose: () => void; onComplete: (scheduledForUtc: string) => void }) {
  const { t } = useTranslation("account");
  const reauth = useAccountReauth({ action: "DeleteAccount" });
  const restoreFocus = useRestoreFocusOnClose();
  const form = useForm<{ reason: string }>({ resolver: zodResolver(z.object({ reason: z.string().trim().min(1, t("reasonRequired")) })), defaultValues: { reason: "" } });
  const request = useIdempotentMutation((value: { reason: string; reauthTicket: string }, key) => requestAccountDeletion(value, key), { meta: { handlesError: true } });
  const [confirming, setConfirming] = useState(false);
  const busy = confirming || reauth.isPending || request.isPending;
  async function confirm({ reason }: { reason: string }) {
    if (!reauth.codeComplete()) return;
    reauth.setFailure(null); setConfirming(true);
    try { const result = await request.mutateAsync({ reason, reauthTicket: await reauth.getTicket() }); onComplete(result.scheduledForUtc); }
    catch (error) { if (!(error instanceof ApiError) || !applyApiErrorToForm(error, form.setError, { reason: "reason" })) reauth.showError(error); }
    finally { setConfirming(false); }
  }
  // Tablero Cuenta-Baja: el diálogo lleva su ✕. En el teléfono (M-Cuenta-Baja) es la hoja de una confirmación, sin ✕.
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent showCloseButton="desktop" onCloseAutoFocus={restoreFocus}>
    <form onSubmit={(event) => { if (!reauth.proof) { event.preventDefault(); void reauth.send(); } else { reauth.codeComplete(); void form.handleSubmit(confirm)(event); } }} >
      <DialogHeader><DialogTitle>{t("deletionTitle")}</DialogTitle></DialogHeader>
      <DialogBody>
      <DialogDescription>{t("deletionHint", { days: graceDays })}</DialogDescription>
      {/* M-Cuenta-Baja: en el teléfono, el motivo arranca con el alto de un campo de una línea (48) y crece con lo escrito. */}
      <FormField label={t("reason")} required error={form.formState.errors.reason?.message}><Textarea {...form.register("reason")} disabled={busy} className="max-md:min-h-12" /></FormField>
      {reauth.proof ? <div className="flex flex-col gap-2"><p className="text-[13px] font-semibold text-[var(--t2)]">{t("deletionCode", { destination: reauth.proof.destination })}</p><OtpInput length={6} value={reauth.code} onChange={reauth.changeCode} label={t("common:code.label")} disabled={busy} error={reauth.codeFailure} /></div> : null}
      <FormError message={reauth.failure} />
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>{t("cancel")}</Button><Button type="submit" variant="destructive" disabled={reauth.retry.isRunning || (!reauth.proof && !reauth.failure)} pending={busy}
        pendingLabel={reauth.proof ? t("requestingDeletion") : t("common:code.sending")}>{reauth.retry.label ?? t("requestDeletion")}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
