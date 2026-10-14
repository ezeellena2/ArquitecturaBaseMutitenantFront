import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { ListRow } from "@/shared/ui/app/ListRow";
import type { Column } from "@/shared/ui/DataTable";
import { DateText } from "@/shared/ui/format/DateText";
import { EnumText } from "@/shared/ui/format/EnumText";
import type { WhatsAppTemplateResponse } from "../api/types";
import { OtherCategories, TemplateLanguages } from "./components/TemplateLanguages";
import { TemplateStatus } from "./components/TemplateStatus";

/// El nombre visible: el `title` de una del sistema («Código de ingreso») o el nombre de las demás.
export const templateTitle = (template: WhatsAppTemplateResponse) => template.title ?? template.name;

/// Tableros WA-Plantillas y Plat-WA-Plantillas: el nombre con sus idiomas debajo (una del sistema, con su título arriba y
/// su nombre técnico delante de los idiomas), el tipo, el estado en Meta y la última modificación. La categoría es la
/// que manda el back (`invitacion_organizacion` es Marketing en español).
export function createTemplateColumns(t: TFunction, onWhyRejected: (template: WhatsAppTemplateResponse) => void = () => undefined): Column<WhatsAppTemplateResponse>[] {
  return [
    { id: "name", header: t("whatsapp:templates.columns.name"), type: "text", mobile: "primary", className: "w-[34%]", value: templateTitle,
      detail: (template) => template.isSystem
        ? <span>{template.name}{" · "}<TemplateLanguages languages={template.languages} /></span>
        : <TemplateLanguages languages={template.languages} /> },
    { id: "category", header: t("whatsapp:templates.columns.category"), type: "enum", enum: "WhatsAppTemplateCategory", value: (template) => template.category,
      detail: (template) => template.languages.slice(1).some((language) => language.category !== template.category) ? <OtherCategories template={template} /> : null },
    { id: "status", header: t("whatsapp:templates.columns.status"), type: "custom", cell: (template) => <TemplateStatus template={template} t={t} onWhyRejected={onWhyRejected} /> },
    { id: "updatedAtUtc", header: t("whatsapp:templates.columns.updated"), type: "date", value: (template) => template.updatedAtUtc },
  ];
}

/// M-WA-Plantillas y M-Plat-WA-Plantillas: el nombre con la fecha a la derecha; debajo, el tipo y los idiomas (una del
/// sistema, su nombre técnico y el tipo), y el estado.
export function templatePhoneRow(template: WhatsAppTemplateResponse, t: TFunction, onWhyRejected: (template: WhatsAppTemplateResponse) => void, trailing: ReactNode): ReactNode {
  const category = <EnumText enum="WhatsAppTemplateCategory" value={template.category} />;
  return <ListRow key={template.id} title={templateTitle(template)} meta={<DateText value={template.updatedAtUtc} kind="date" />}
    lines={[<span key="kind">{template.isSystem ? <>{template.name}{" · "}{category}</> : <>{category}{" · "}<TemplateLanguages languages={template.languages} /></>}</span>,
      <span key="status" className="inline-flex flex-wrap items-center gap-x-1"><TemplateStatus template={template} t={t} onWhyRejected={onWhyRejected} />
        {template.languages.slice(1).some((language) => language.category !== template.category) ? <>{"· "}<OtherCategories template={template} /></> : null}</span>]} trailing={trailing} />;
}
