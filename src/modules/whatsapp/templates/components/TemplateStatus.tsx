import type { TFunction } from "i18next";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import { InfoButton } from "@/shared/ui/InfoButton";
import type { WhatsAppTemplateResponse } from "../../api/types";
import { templateStatusTones } from "../tones";

/// El estado en Meta y, si la rechazó, el ⓘ con el motivo («Por qué la rechazó Meta»).
export function TemplateStatus({ template, t, onWhyRejected }: { template: WhatsAppTemplateResponse; t: TFunction; onWhyRejected: (template: WhatsAppTemplateResponse) => void }) {
  return <span className="inline-flex items-center gap-1">
    <StatusBadge tones={templateStatusTones} value={template.status} />
    {template.status === "Rejected" ? <InfoButton label={t("whatsapp:templates.whyRejected")} onClick={() => onWhyRejected(template)} /> : null}
  </span>;
}
