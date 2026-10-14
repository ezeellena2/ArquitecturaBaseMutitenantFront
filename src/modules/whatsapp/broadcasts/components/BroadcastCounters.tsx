import { useTranslation } from "react-i18next";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { NumberText } from "@/shared/ui/format/NumberText";
import { Section } from "@/shared/ui/Section";
import type { WhatsAppBroadcastResponse } from "../../api/types";

type Counter = { key: string; value: number };

/// «Resultados» de una difusión (tableros WA-Difusion-Resultados y su M-*): en la compu, cinco cifras en una caja; en el
/// teléfono, seis tarjetas debajo de la barra, también «No llegaron». Solo cuentan: el filtro va en «Filtros» (v123).
export function BroadcastCounters({ broadcast }: { broadcast: WhatsAppBroadcastResponse }) {
  const { t } = useTranslation("whatsapp");
  const { phone } = useAppChrome();
  const counters: Counter[] = [
    { key: "sent", value: broadcast.recipients },
    { key: "delivered", value: broadcast.delivered },
    { key: "read", value: broadcast.read },
    { key: "replied", value: broadcast.replied },
    { key: "unsubscribed", value: broadcast.unsubscribed },
  ];
  if (phone) return <ul aria-label={t("broadcasts.counters.title")} className="m-0 flex list-none flex-wrap gap-2 px-4 pt-1 pb-3">
    {[...counters, { key: "failed", value: broadcast.failed }].map((counter) => <li key={counter.key}
      className="flex h-[58px] min-w-[84px] flex-col justify-center rounded-[14px] border border-[var(--borde)] bg-[var(--lado-activo)] px-3.5 leading-[1.25]">
      <NumberText value={counter.value} className="text-left text-[17px] font-semibold text-[var(--t1)]" />
      <span className="text-[12.5px] text-[var(--t3)]">{t(`broadcasts.counters.${counter.key}`)}</span>
    </li>)}
  </ul>;
  return <Section title={t("broadcasts.counters.title")}>
    <dl className="grid grid-cols-2 md:grid-cols-5">
      {counters.map((counter) => <div key={counter.key} className="flex min-h-14 flex-col-reverse justify-center border-[var(--borde)] py-1.5 pr-2 pl-4 leading-[1.35] md:border-r md:last:border-r-0">
        <dt className="text-[12px] text-[var(--t3)]">{t(`broadcasts.counters.${counter.key}`)}</dt>
        <dd><NumberText value={counter.value} className="text-left text-[18px] font-semibold text-[var(--t1)]" /></dd>
      </div>)}
    </dl>
  </Section>;
}
