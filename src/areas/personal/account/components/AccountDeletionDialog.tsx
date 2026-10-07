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
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { requestAccountDeletion } from "../api/deletion";
import { apiErrorMessage } from "@/shared/api/errorMessage";

export function AccountDeletionDialog({ graceDays, onClose, onComplete }: { graceDays: number; onClose: () => void; onComplete: (scheduledForUtc: string) => void }) {
  const { t } = useTranslation("account");
  const restoreFocus = useRestoreFocusOnClose();
  const form = useForm<{ reason: string }>({ resolver: zodResolver(z.object({ reason: z.string().trim().min(1, t("reasonRequired")) })), defaultValues: { reason: "" } });
  const request = useIdempotentMutation((value: { reason: string }, key) => requestAccountDeletion(value, key), { meta: { handlesError: true } });
  const [failure, setFailure] = useState<string | null>(null);
  const busy = request.isPending;
  async function confirm({ reason }: { reason: string }) {
    setFailure(null);
    try { const result = await request.mutateAsync({ reason }); onComplete(result.scheduledForUtc); }
    catch (error) { if (!(error instanceof ApiError) || !applyApiErrorToForm(error, form.setError, { reason: "reason" })) setFailure(apiErrorMessage(error, t)); }
  }
  // Tablero Cuenta-Baja: el diálogo lleva su ✕. En el teléfono (M-Cuenta-Baja) es la hoja de una confirmación, sin ✕.
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent showCloseButton="desktop" onCloseAutoFocus={restoreFocus}>
    <form onSubmit={(event) => { void form.handleSubmit(confirm)(event); }}>
      <DialogHeader><DialogTitle>{t("deletionTitle")}</DialogTitle></DialogHeader>
      <DialogBody>
      <DialogDescription>{t("deletionHint", { days: graceDays })}</DialogDescription>
      {/* M-Cuenta-Baja: el motivo arranca con el alto de un campo de una línea y crece con lo escrito. */}
      <FormField label={t("reason")} required error={form.formState.errors.reason?.message}><Textarea {...form.register("reason")} disabled={busy} className="max-md:min-h-12" /></FormField>
      <FormError message={failure} />
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>{t("cancel")}</Button><Button type="submit" variant="destructive" pending={busy}
        pendingLabel={t("requestingDeletion")}>{t("requestDeletion")}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
