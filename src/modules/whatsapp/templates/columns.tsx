import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { ListCard } from "@/shared/ui/app/ListRow";
import type { Column } from "@/shared/ui/DataTable";
import { DateText } from "@/shared/ui/format/DateText";
import { EnumText } from "@/shared/ui/format/EnumText";
import type { WhatsAppTemplateResponse } from "../api/types";
import { TemplateLanguages } from "./components/TemplateLanguages";
import { TemplateStatus } from "./components/TemplateStatus";

/// El nombre visible: el `title` de una del sistema («Código de ingreso») o el nombre de las demás.
export const templateTitle = (template: WhatsAppTemplateResponse) => template.title ?? template.name;

/// Tableros WA-Plantillas y Plat-WA-Plantillas (base de la 12): el nombre, los idiomas, el tipo, el estado en Meta y la
/// última modificación, un dato por celda. La categoría es la que manda el back (`invitacion_organizacion` es Marketing en
/// español).
export function createTemplateColumns(t: TFunction, onWhyRejected: (template: WhatsAppTemplateResponse) => void = () => undefined): Column<WhatsAppTemplateResponse>[] {
  return [
    { id: "name", header: t("whatsapp:templates.columns.name"), type: "text", mobile: "primary", className: "w-[24%]", value: templateTitle },
    { id: "languages", header: t("whatsapp:templates.columns.languages"), type: "custom", cell: (template) => <TemplateLanguages languages={template.languages} /> },
    { id: "category", header: t("whatsapp:templates.columns.category"), type: "enum", enum: "WhatsAppTemplateCategory", value: (template) => template.category },
    { id: "status", header: t("whatsapp:templates.columns.status"), type: "custom", cell: (template) => <TemplateStatus template={template} t={t} onWhyRejected={onWhyRejected} /> },
    { id: "updatedAtUtc", header: t("whatsapp:templates.columns.updated"), type: "date", value: (template) => template.updatedAtUtc },
  ];
}

/// M-Filas-Base2 (M-WA-Plantillas, 263) y M-Plat-WA-Plantillas: una tarjeta con el estado en Meta, el tipo, los idiomas y la
/// última modificación, cada dato con su nombre, como las columnas de la compu.
export function templatePhoneRow(template: WhatsAppTemplateResponse, t: TFunction, onWhyRejected: (template: WhatsAppTemplateResponse) => void, trailing: ReactNode): ReactNode {
  return <ListCard key={template.id} title={templateTitle(template)} fields={[
    { label: t("whatsapp:templates.columns.status"), value: <TemplateStatus template={template} t={t} onWhyRejected={onWhyRejected} /> },
    { label: t("whatsapp:templates.columns.category"), value: <EnumText enum="WhatsAppTemplateCategory" value={template.category} /> },
    { label: t("whatsapp:templates.columns.languages"), value: <TemplateLanguages languages={template.languages} /> },
    { label: t("whatsapp:templates.columns.updated"), value: <DateText value={template.updatedAtUtc} kind="date" /> },
  ]} trailing={trailing} />;
}
