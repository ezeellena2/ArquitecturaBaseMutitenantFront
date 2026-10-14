import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { ListRow } from "@/shared/ui/app/ListRow";
import type { Column } from "@/shared/ui/DataTable";
import { CultureText } from "@/shared/ui/format/CultureText";
import { DateText } from "@/shared/ui/format/DateText";
import { EnumText } from "@/shared/ui/format/EnumText";
import type { WhatsAppTemplateResponse } from "../api/types";
import { TemplateStatus } from "./components/TemplateStatus";

/// Tableros WA-Plantillas y Plat-WA-Plantillas: el nombre con el idioma debajo, el tipo, el estado en Meta y la última
/// modificación. La categoría es la que manda el back (`invitacion_organizacion` es Marketing en español).
export function createTemplateColumns(t: TFunction, onWhyRejected: (template: WhatsAppTemplateResponse) => void = () => undefined): Column<WhatsAppTemplateResponse>[] {
  return [
    { id: "name", header: t("whatsapp:templates.columns.name"), type: "text", mobile: "primary", className: "w-[34%]", value: (template) => template.name,
      detail: (template) => <CultureText value={template.language} /> },
    { id: "category", header: t("whatsapp:templates.columns.category"), type: "enum", enum: "WhatsAppTemplateCategory", value: (template) => template.category },
    { id: "status", header: t("whatsapp:templates.columns.status"), type: "custom", cell: (template) => <TemplateStatus template={template} t={t} onWhyRejected={onWhyRejected} /> },
    { id: "updatedAtUtc", header: t("whatsapp:templates.columns.updated"), type: "date", value: (template) => template.updatedAtUtc },
  ];
}

/// M-WA-Plantillas y M-Plat-WA-Plantillas: el nombre con la fecha a la derecha; debajo, el tipo y el idioma, y el estado.
export function templatePhoneRow(template: WhatsAppTemplateResponse, t: TFunction, onWhyRejected: (template: WhatsAppTemplateResponse) => void, trailing: ReactNode): ReactNode {
  return <ListRow key={template.id} title={template.name} meta={<DateText value={template.updatedAtUtc} kind="date" />}
    lines={[<span key="kind"><EnumText enum="WhatsAppTemplateCategory" value={template.category} />{" · "}<CultureText value={template.language} /></span>,
      <TemplateStatus key="status" template={template} t={t} onWhyRejected={onWhyRejected} />]} trailing={trailing} />;
}
