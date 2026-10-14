import { Trans, useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { EmptyValue, FormatLoading } from "@/shared/ui/format/EmptyValue";
import type { WhatsAppNumberResponse } from "../../api/types";

type Usage = Pick<WhatsAppNumberResponse, "status" | "serviceMessagesThisMonth" | "freeServiceMessages" | "chargedServiceMessagesThisMonth">;

/// D1: cada número dice siempre «640 de 1.000 gratis» y, pasado el tope, «1.240 · 240 se cobran» (WA-Admin, «Pasado el
/// tope»). Los tres números llegan del back tal cual: acá no se cuenta ni se resta nada. Un número desconectado, «—».
/// `month` agrega «este mes» (las Consultas de Plat-WA-Numero).
export function NumberUsage({ number, month = false, className }: { number: Usage; month?: boolean; className?: string }) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  if (format.isLoading) return <FormatLoading className={className} />;
  if (number.status === "Disconnected") return <EmptyValue className={className} />;
  if (number.chargedServiceMessagesThisMonth > 0) {
    return <span className={className}><Trans t={t} i18nKey={month ? "numbers.usage.chargedMonth" : "numbers.usage.charged"}
      values={{ total: format.formatInteger(number.serviceMessagesThisMonth), charged: format.formatInteger(number.chargedServiceMessagesThisMonth) }}
      components={{ charged: <span className="text-[var(--alerta-tx)]" /> }} /></span>;
  }
  return <span className={className}>{t(month ? "numbers.usage.freeMonth" : "numbers.usage.free", {
    used: format.formatInteger(number.serviceMessagesThisMonth), free: format.formatInteger(number.freeServiceMessages),
  })}</span>;
}
