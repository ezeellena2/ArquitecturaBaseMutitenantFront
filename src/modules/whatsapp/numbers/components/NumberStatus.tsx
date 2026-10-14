import { useTranslation } from "react-i18next";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import { InfoButton } from "@/shared/ui/InfoButton";
import type { WhatsAppNumberResponse } from "../../api/types";
import { numberStatusTones } from "../status";

/// El estado del número y, sin medio de pago, el ⓘ que abre el aviso con qué hacer (WA-Admin-Pago).
export function NumberStatus({ number, onPaymentInfo }: { number: WhatsAppNumberResponse; onPaymentInfo: (number: WhatsAppNumberResponse) => void }) {
  const { t } = useTranslation("whatsapp");
  return <span className="inline-flex items-center gap-1">
    <StatusBadge tones={numberStatusTones} value={number.status} />
    {number.status === "PaymentMissing" ? <InfoButton label={t("numbers.whatItMeans")} onClick={() => onPaymentInfo(number)} /> : null}
  </span>;
}
