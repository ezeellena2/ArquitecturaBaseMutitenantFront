import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Picker } from "@/shared/ui/Picker";
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
  const company = (number: WhatsAppNumberResponse) => number.company?.name ?? t("numbers.wholeOrganization");
  const text = (number: WhatsAppNumberResponse) => t("bot.number.option", { number: format.formatPhone(number.displayNumber), company: company(number) });
  const several = numbers.length > 1;
  const label = phone ? t("bot.number.label", { value: text(selected) }) : t("bot.number.pill", { value: text(selected) });
  // 262: la lista de números es la pieza para elegir, con el número y, en gris, a quién atiende.
  const picker = <Picker trigger="button" label={t("bot.number.title")} triggerLabel={phone ? <><span className="sr-only">{label}</span><span aria-hidden="true">{text(selected)}</span></> : label} value={selected.id}
    onChange={(id) => { if (id !== selected.id) onSelect(id); }}
    options={numbers.map((number) => ({ value: number.id, label: format.formatPhone(number.displayNumber), description: company(number) }))}
    className={phone
      ? "mx-4 mb-2.5 h-auto min-h-11.5 w-[calc(100%-2rem)] justify-between rounded-[0.75rem] border-0 bg-[var(--s3)] px-3.5 py-2 text-left text-[0.90625rem] font-medium whitespace-normal text-[var(--t1)]"
      : "h-auto min-h-9 max-w-full rounded-full px-3.5 py-1.5 text-left whitespace-normal"} />;

  if (phone) return several ? picker
    : <span className="mx-4 mb-2.5 flex min-h-11.5 shrink-0 items-center rounded-[0.75rem] bg-[var(--s3)] px-3.5 py-2 text-left text-[0.90625rem] font-medium text-[var(--t1)]">
      <span className="min-w-0 wrap-break-word">{text(selected)}</span>
    </span>;

  // WA-Respuestas (.w-caja.o-fb y .w-pil): la píldora de 36 en una caja con 12 y 16 de margen.
  const pill = "inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full border border-[var(--borde)] bg-[var(--superficie)] px-3.5 py-1.5 text-left text-[0.8125rem] text-[var(--t2)]";
  return <Surface className="flex items-center gap-2.5 px-4 py-3">
    {several ? picker : <span className={pill}><span className="min-w-0 wrap-break-word">{label}</span></span>}
  </Surface>;
}
