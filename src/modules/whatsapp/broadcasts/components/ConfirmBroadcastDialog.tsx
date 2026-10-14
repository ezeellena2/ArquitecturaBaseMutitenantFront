import { useTranslation } from "react-i18next";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { useFormat } from "@/shared/format/useFormat";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { DetailGrid } from "@/shared/ui/DetailGrid";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { MoneyText } from "@/shared/ui/format/MoneyText";
import { FormError } from "@/shared/ui/FormError";
import type { CreateWhatsAppBroadcastRequest, WhatsAppBroadcastEstimateResponse, WhatsAppTemplateOptionResponse } from "../../api/types";
import { asMoney, countOf } from "../../lib/values";

/**
 * «¿Programar «Horario de fiestas»?» (tableros WA-Difusion-Nueva y su M-*, «Confirmar la programación»): la plantilla, a
 * quiénes, cuándo (en la zona de la cuenta) y el costo estimado, antes de mandar. Lo que el back rechaza y no es de un
 * dato (sin medio de pago) queda en la franja, arriba de los botones.
 */
export function ConfirmBroadcastDialog({ request, template, estimate, pending, failure, onConfirm, onClose }: {
  request: CreateWhatsAppBroadcastRequest;
  template: WhatsAppTemplateOptionResponse | undefined;
  estimate: WhatsAppBroadcastEstimateResponse | undefined;
  pending: boolean;
  failure: unknown;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const format = useFormat();
  const { phone } = useAppChrome();
  const restoreFocus = useRestoreFocusOnClose(true);
  const scheduled = Boolean(request.scheduledAtUtc);
  const tag = request.audience?.kind === "Tag" ? request.audience.tag ?? "" : null;
  const recipients = estimate ? tag !== null
    ? t("whatsapp:broadcasts.confirm.recipientsWithTag", { ...countOf(format, estimate.recipients), tag })
    : t("whatsapp:broadcasts.confirm.recipientsAll", countOf(format, estimate.recipients)) : <EmptyValue />;
  const when = request.scheduledAtUtc && !format.isLoading
    ? t("whatsapp:broadcasts.confirm.whenScheduled", { date: format.formatDate(request.scheduledAtUtc), time: format.formatTime(request.scheduledAtUtc), zone: format.formatTimeZone(format.timeZone) })
    : t("whatsapp:broadcasts.confirm.whenNow");
  const templateLabel = template && !format.isLoading ? `${template.name} · ${format.formatEnum("WhatsAppTemplateCategory", template.category)}` : <EmptyValue />;

  return <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
    <DialogContent aria-describedby={undefined} onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t(scheduled ? "whatsapp:broadcasts.confirm.scheduleTitle" : "whatsapp:broadcasts.confirm.sendTitle", { name: request.name ?? "" })}</DialogTitle></DialogHeader>
      <DetailGrid phone={phone} items={[
        { key: "template", label: t("whatsapp:broadcasts.form.template"), value: templateLabel },
        { key: "recipients", label: t("whatsapp:broadcasts.form.audience"), value: recipients },
        { key: "when", label: t("whatsapp:broadcasts.form.when"), value: when },
        { key: "cost", label: t("whatsapp:broadcasts.confirm.cost"), value: estimate ? <MoneyText value={asMoney(estimate.estimatedCost)} className="text-left" /> : <EmptyValue /> },
      ]} />
      {failure ? <div className="px-5 pb-4"><FormError message={actionErrorMessage(failure, t)} /></div> : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={pending}>{t("common:actions.cancel")}</Button>
        <Button type="button" onClick={onConfirm} pending={pending} pendingLabel={t(scheduled ? "whatsapp:broadcasts.form.scheduling" : "whatsapp:broadcasts.form.sending")}>
          {t(scheduled ? "whatsapp:broadcasts.form.schedule" : "whatsapp:broadcasts.form.send")}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
