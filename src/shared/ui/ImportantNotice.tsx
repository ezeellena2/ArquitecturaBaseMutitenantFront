import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./dialog";

interface ImportantNoticeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Qué pasa: «Página despublicada». */
  title: string;
  /** El motivo, destacado en la caja roja suave. */
  reason: ReactNode;
  /** Debajo del motivo, más chico: quién y cuándo. */
  detail?: ReactNode;
  /** «Qué podés hacer», en pasos numerados. */
  steps: readonly ReactNode[];
}

/// Tablero «Criterio · Dialogos», Aviso importante: explica algo que no se puede hacer o por qué algo está así. Se
/// abre desde el ⓘ o desde el botón apagado. 420 px, el motivo en una caja roja suave, «Qué podés hacer» en pasos
/// y un solo botón, «Entendido»: no hay nada que confirmar.
export function ImportantNotice({ open, onOpenChange, title, reason, detail, steps }: ImportantNoticeProps) {
  const { t } = useTranslation();
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="md:max-w-[420px]" showCloseButton>
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <DialogBody className="gap-3 text-[13px]">
        <div data-slot="notice-reason" className="flex items-start gap-3 rounded-[10px] bg-[var(--peligro-t)] px-4 py-3.5 text-[var(--peligro-tx)]">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <div className="flex flex-col">
            <strong className="text-[15px] font-semibold">{reason}</strong>
            {detail ? <span className="text-[12.5px]">{detail}</span> : null}
          </div>
        </div>
        <span className="text-[12.5px] font-semibold text-[var(--t3)]">{t("notice.whatCanYouDo")}</span>
        <ol className="flex flex-col gap-2.5">
          {steps.map((step, index) => <li key={index} className="flex items-center gap-2.5 text-[13.5px] text-[var(--t1)]">
            <span aria-hidden="true" data-step-number className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[var(--s3)] text-[12px] font-semibold text-[var(--t2)]">{index + 1}</span>{step}
          </li>)}
        </ol>
      </DialogBody>
      <DialogFooter><Button type="button" onClick={() => onOpenChange(false)}>{t("notice.understood")}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
