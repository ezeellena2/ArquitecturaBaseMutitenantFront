import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { EmptyValue, FormatLoading } from "@/shared/ui/format/EmptyValue";
import type { WhatsAppTemplateLanguageResponse, WhatsAppTemplateResponse } from "../../api/types";

/// Los idiomas de una plantilla (CC24, `languages`): las culturas del catálogo por su nombre, separadas por coma, el
/// principal primero. Una del sistema va en español y en inglés; una nueva, en la cultura de quien la escribió.
export function TemplateLanguages({ languages }: { languages: readonly WhatsAppTemplateLanguageResponse[] }) {
  const format = useFormat();
  if (format.isLoading) return <FormatLoading />;
  if (languages.length === 0) return <EmptyValue />;
  return <span>{languages.map((language) => format.formatCulture(language.culture)).join(", ")}</span>;
}

/// Plat-WA-Plantillas («Utilidad en inglés»): la categoría de los otros idiomas, si no es la del principal (`category`).
/// La invitación es Marketing en español y Utility en inglés. Sin otra categoría, nada.
export function OtherCategories({ template }: { template: WhatsAppTemplateResponse }) {
  const { t } = useTranslation("whatsapp");
  const format = useFormat();
  const others = template.languages.slice(1).filter((language) => language.category !== template.category);
  if (format.isLoading || others.length === 0) return null;
  return <span>{others.map((language) => t("templates.categoryIn", {
    category: format.formatEnum("WhatsAppTemplateCategory", language.category), language: format.formatCulture(language.culture),
  })).join(" · ")}</span>;
}
