import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { FormField } from "@/shared/ui/FormField";
import { Picker } from "@/shared/ui/Picker";
import type { FormCatalogSource, FormCatalogValueType } from "../../api/types";
import { useCatalogSources } from "../../hooks/useCatalogSources";

const valueTypes: readonly FormCatalogValueType[] = ["Text", "WholeNumber", "DecimalNumber", "Date"];

export interface CatalogOrigin {
  readonly source: FormCatalogSource;
  readonly valueType: FormCatalogValueType;
}

/// «El catálogo» de uno nuevo (FRM-Catalogo, «Nuevo: de dónde salen», «Nuevo: sin el módulo de WhatsApp» y «Nuevo: tipo de
/// valor»): primero el origen y, para los escritos a mano, el tipo de valor, los dos en la pieza para elegir (262), sin un
/// diálogo que solo sirve para elegir. Cada origen lleva su descripción en gris. Uno con filtros es siempre de texto.
export function CatalogOriginFields({ value, onChange }: { value: CatalogOrigin; onChange: (value: CatalogOrigin) => void }) {
  const { t } = useTranslation("forms");
  const format = useFormat();
  const available = useCatalogSources();
  return <>
    <FormField label={t("forms:catalog.fields.source")}>
      <Picker value={value.source} onChange={(source) => {
        if (source === value.source) return;
        const next = source as FormCatalogSource;
        onChange({ source: next, valueType: next === "Manual" ? value.valueType : "Text" });
      }} options={available.map((source) => ({ value: source, label: format.formatEnum("FormCatalogSource", source), description: t(`forms:catalog.sourceDescriptions.${source}`) }))} />
    </FormField>
    {value.source === "Manual" ? <FormField label={t("forms:catalog.fields.valueType")}>
      <Picker value={value.valueType} onChange={(valueType) => { if (valueType !== value.valueType) onChange({ ...value, valueType: valueType as FormCatalogValueType }); }}
        options={valueTypes.map((valueType) => ({ value: valueType, label: format.formatEnum("FormCatalogValueType", valueType) }))} />
    </FormField> : null}
  </>;
}
