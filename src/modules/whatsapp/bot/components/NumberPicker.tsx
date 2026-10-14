import { Check } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { ChevronDownIcon } from "@/shared/ui/icons";
import { Surface } from "@/shared/ui/Surface";
import type { WhatsAppNumberResponse } from "../../api/types";

/// El número cuyo bot se ve (WA-Respuestas, «Elegir el número», y M-WA-Respuestas): en la compu, la píldora en su caja con
/// la lista de números y a quién atiende cada uno; en el teléfono, la fila gris debajo de la barra, que abre una hoja.
/// Con un solo número no hay nada que elegir: se lee.
export function NumberPicker({ numbers, selected, onSelect }: {
  numbers: readonly WhatsAppNumberResponse[];
  selected: WhatsAppNumberResponse;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  const { phone } = useAppChrome();
  const [sheet, setSheet] = useState(false);
  const company = (number: WhatsAppNumberResponse) => number.company?.name ?? t("numbers.wholeOrganization");
  const text = (number: WhatsAppNumberResponse) => t("bot.number.option", { number: format.formatPhone(number.displayNumber), company: company(number) });
  const several = numbers.length > 1;

  if (phone) return <>
    <button type="button" disabled={!several} onClick={() => setSheet(true)} aria-label={t("bot.number.label", { value: text(selected) })}
      className="mx-4 mb-2.5 flex h-[46px] shrink-0 items-center justify-between gap-2 rounded-[12px] bg-[var(--s3)] px-3.5 text-left text-[14.5px] font-medium text-[var(--t1)] disabled:opacity-100">
      <span className="truncate">{text(selected)}</span>
      {several ? <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0 text-[var(--t2)]" /> : null}
    </button>
    <Dialog open={sheet} onOpenChange={setSheet}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader><DialogTitle>{t("bot.number.title")}</DialogTitle></DialogHeader>
        <ul className="m-0 flex list-none flex-col px-5 pb-4">
          {numbers.map((number) => <li key={number.id} className="border-b border-[var(--borde)] last:border-b-0">
            <button type="button" aria-current={number.id === selected.id ? "true" : undefined} onClick={() => { onSelect(number.id); setSheet(false); }}
              className="flex min-h-[52px] w-full items-center gap-3 text-left text-[16px] text-[var(--t1)] aria-[current=true]:font-medium aria-[current=true]:text-[var(--marca-tx)]">
              <span className="min-w-0 flex-1">{text(number)}</span>
              {number.id === selected.id ? <Check aria-hidden="true" className="size-5 shrink-0" /> : null}
            </button>
          </li>)}
        </ul>
      </DialogContent>
    </Dialog>
  </>;

  const label = t("bot.number.pill", { value: text(selected) });
  // WA-Respuestas (.w-caja.o-fb y .w-pil): la píldora de 36 en una caja con 12 y 16 de margen.
  const pill = "inline-flex h-9 max-w-full items-center gap-1.5 rounded-full border border-[var(--borde)] bg-[var(--lado-activo)] px-3.5 text-[13px] text-[var(--t2)]";
  return <Surface className="flex items-center gap-2.5 px-4 py-3">
    {several ? <DropdownMenu>
      <DropdownMenuTrigger className={`${pill} hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:outline-[var(--foco)] data-[state=open]:border-[var(--marca)] data-[state=open]:shadow-[0_0_0_3px_var(--marca-t)]`}>
        <span className="truncate">{label}</span>
        <ChevronDownIcon aria-hidden="true" strokeWidth={2} className="size-3.5 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" aria-label={t("bot.number.title")} className="min-w-[380px] p-1">
        <DropdownMenuRadioGroup value={selected.id} onValueChange={onSelect}>
          {numbers.map((number) => <DropdownMenuRadioItem key={number.id} value={number.id} className="flex-col items-start gap-0">
            <span>{format.formatPhone(number.displayNumber)}</span>
            <span className="text-[12px] text-[var(--t3)]">{company(number)}</span>
          </DropdownMenuRadioItem>)}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu> : <span className={pill}><span className="truncate">{label}</span></span>}
  </Surface>;
}
