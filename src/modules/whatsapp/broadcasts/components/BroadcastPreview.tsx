import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { MoneyText } from "@/shared/ui/format/MoneyText";
import type { WhatsAppAudienceKind, WhatsAppBroadcastEstimateResponse } from "../../api/types";
import { countOf } from "../../lib/values";

/// La burbuja del mensaje tal como le llega a cada contacto, con el botón «No recibir más» de toda difusión (tableros
/// WA-Difusion-Nueva y su M-*, .o-burb y .ap-burb).
export function MessageBubble({ text }: { text: string }) {
  const { t } = useTranslation("whatsapp");
  return <div className="max-w-[420px] justify-self-start rounded-[12px] rounded-tl-[4px] bg-[var(--marca-t)] px-3.5 py-2.5 text-[13.5px] leading-[1.5] whitespace-pre-wrap text-[var(--marca-tx)] max-md:text-[15px]">
    {text}
    <span className="mt-2 block border-t border-[var(--borde)] pt-2 text-center font-semibold">{t("broadcasts.preview.unsubscribe")}</span>
  </div>;
}

/// «48 contactos» con a quiénes y el costo estimado (.o-costo): los dos tal como los manda el back, sin cuentas en el front.
export function EstimateSummary({ estimate, kind, tag }: { estimate: WhatsAppBroadcastEstimateResponse; kind: WhatsAppAudienceKind; tag: string }) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  return <div className="flex flex-col gap-2.5" aria-live="polite">
    <div className="flex flex-col leading-[1.35]">
      <strong className="text-[15px] font-semibold text-[var(--t1)]">{t("broadcasts.contacts", countOf(format, estimate.recipients))}</strong>
      <span className="text-[12px] text-[var(--t3)]">{kind === "Tag" ? t("broadcasts.preview.withTag", { tag }) : t("broadcasts.preview.allAccepting")}</span>
    </div>
    <div className="flex flex-col leading-[1.35]">
      <MoneyText value={estimate.estimatedCost} className="text-left text-[15px] font-semibold text-[var(--t1)]" />
      <span className="text-[12px] text-[var(--t3)]">{t("broadcasts.preview.cost")}</span>
    </div>
  </div>;
}

/// M-WA-Difusion-Nueva (.ap-fijo .costo): abajo, junto a «Programar», cuántos y cuánto.
export function EstimateLine({ estimate }: { estimate: WhatsAppBroadcastEstimateResponse | undefined }) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  return <span className="flex flex-col justify-center leading-[1.3]">
    {estimate ? <strong className="truncate text-[15px] font-semibold text-[var(--t1)]">
      {t("broadcasts.contacts", countOf(format, estimate.recipients))}{" · "}<MoneyText value={estimate.estimatedCost} className="text-left" />
    </strong> : null}
    <span className="text-[12.5px] text-[var(--t3)]">{t("broadcasts.preview.costShort")}</span>
  </span>;
}
