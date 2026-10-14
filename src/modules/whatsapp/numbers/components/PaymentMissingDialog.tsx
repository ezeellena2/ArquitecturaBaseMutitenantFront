import { CircleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { whatsappManagerUrl } from "../status";

/// WA-Admin-Pago y Plat-WA-Numero («Falta medio de pago»): el aviso importante de «Criterio · Diálogos» con el motivo en la
/// caja roja y los pasos, pero con sus dos acciones: «Comprobar» vuelve a preguntarle a Meta e «Ir a Meta» abre el
/// WhatsApp Manager. Se monta solo abierto.
export function PaymentMissingDialog({ title, detail, checking, onCheck, onClose, returnFocusTo }: {
  title: string;
  /** Lo que sigue pasando sin medio de pago (D1 en la organización; en Plataforma, los códigos por correo). */
  detail: string;
  checking: boolean;
  onCheck: () => void;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
}) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  const steps = [t("whatsapp:numbers.payment.steps.manager"), t("whatsapp:numbers.payment.steps.add"), t("whatsapp:numbers.payment.steps.back")];
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent size="sm" aria-describedby={undefined} onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <DialogBody className="gap-3 text-[13px]">
        <div className="flex items-start gap-3 rounded-[10px] bg-[var(--peligro-t)] px-4 py-3.5 text-[var(--peligro-tx)]">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <div className="flex flex-col">
            <strong className="text-[15px] font-semibold">{t("whatsapp:numbers.payment.reason")}</strong>
            <span className="text-[12.5px]">{detail}</span>
          </div>
        </div>
        <span className="text-[12.5px] font-semibold text-[var(--t3)] max-md:text-[13.5px] max-md:leading-[normal]">{t("common:notice.whatCanYouDo")}</span>
        <ol className="flex flex-col gap-2.5">
          {steps.map((step, index) => <li key={step} className="flex items-center gap-2.5 text-[13.5px] text-[var(--t1)] max-md:text-[15px] max-md:leading-[normal]">
            <span aria-hidden="true" className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[var(--s3)] text-[12px] font-semibold text-[var(--t2)] max-md:text-[13px]">{index + 1}</span>{step}
          </li>)}
        </ol>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" pending={checking} pendingLabel={t("whatsapp:numbers.payment.checking")} onClick={onCheck}>{t("whatsapp:numbers.payment.check")}</Button>
        <Button asChild><a href={whatsappManagerUrl} target="_blank" rel="noreferrer">{t("whatsapp:numbers.payment.goToMeta")}</a></Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
