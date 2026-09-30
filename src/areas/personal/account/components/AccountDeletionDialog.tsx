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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { requestAccountDeletion } from "../api/deletion";
import { useAccountReauth } from "./useAccountReauth";

export function AccountDeletionDialog({ graceDays, onClose, onComplete }: { graceDays: number; onClose: () => void; onComplete: (scheduledForUtc: string) => void }) {
  const { t } = useTranslation("account");
  const reauth = useAccountReauth({ action: "DeleteAccount" });
  const restoreFocus = useRestoreFocusOnClose();
  const form = useForm<{ reason: string }>({ resolver: zodResolver(z.object({ reason: z.string().trim().min(1, t("reasonRequired")) })), defaultValues: { reason: "" } });
  const request = useIdempotentMutation((value: { reason: string; reauthTicket: string }, key) => requestAccountDeletion(value, key));
  const [confirming, setConfirming] = useState(false);
  const busy = confirming || reauth.isPending || request.isPending;
  async function confirm({ reason }: { reason: string }) {
    reauth.setFailure(null); setConfirming(true);
    try { const result = await request.mutateAsync({ reason, reauthTicket: await reauth.getTicket() }); onComplete(result.scheduledForUtc); }
    catch (error) { if (!(error instanceof ApiError) || !applyApiErrorToForm(error, form.setError, { reason: "reason" })) reauth.showError(error); }
    finally { setConfirming(false); }
  }
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="md:max-w-[420px]" onCloseAutoFocus={restoreFocus}>
    <form onSubmit={form.handleSubmit(confirm)} className="flex flex-col gap-5">
      <DialogHeader><DialogTitle>{t("deletionTitle")}</DialogTitle><DialogDescription>{t("deletionHint", { days: graceDays })}</DialogDescription></DialogHeader>
      <FormField label={t("reason")} required error={form.formState.errors.reason?.message}><Textarea {...form.register("reason")} disabled={busy} /></FormField>
      {reauth.proof ? <div className="flex flex-col gap-2"><p className="text-[13px] font-semibold text-[var(--t2)]">{t("deletionCode", { destination: reauth.proof.destination })}</p><OtpInput length={6} value={reauth.code} onChange={(value) => { reauth.setCode(value); reauth.setFailure(null); }} label={t("code")} disabled={busy} invalid={!!reauth.failure} /></div> : null}
      <FormError message={reauth.failure} />
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>{t("cancel")}</Button><Button type="submit" variant="destructive" disabled={busy || reauth.retry.isRunning || !reauth.proof || reauth.code.length !== 6}>{reauth.retry.label ?? t("deletion")}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
