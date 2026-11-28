import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ResourceOptions } from "@/shared/api/resourceOptions";
import type { StatusTones } from "@/shared/format/statusTones";
import { useFormat } from "@/shared/format/useFormat";
import { useResourceOptions } from "@/shared/hooks/useResourceOptions";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { cn } from "@/shared/lib/utils";
import { StatusBadge, StatusMark } from "@/shared/ui/format/StatusBadge";
import { InfoTip } from "@/shared/ui/InfoTip";
import { InformativeTooltip } from "@/shared/ui/InformativeTooltip";
import { Input } from "@/shared/ui/input";
import { Picker } from "@/shared/ui/Picker";
import { catalogItemsQueryRoot, fetchCatalogItems } from "../../api/catalogs";
import type { FormCatalogFieldDetail, FormCatalogItemRow, FormCatalogRow } from "../../api/types";
import type { CatalogSourceItem } from "../../hooks/useCatalogFieldSources";
import { catalogStatus, type CatalogStatus } from "../../lib/catalogStatus";
import { fieldValueText, type FieldValue } from "../../lib/catalogValues";

/// Tableros FRM-Catalogos y M-FRM-Catalogos: activo en verde, de baja en gris y «No se puede usar» en rojo, con su motivo
/// en la (i). La palabra sale de `enums.FormCatalogStatus`, que no es un enum del contrato: lo arma `catalogStatus`.
const catalogStatusTones: StatusTones<CatalogStatus> = { enum: "FormCatalogStatus", tones: { Active: "success", Inactive: "neutral", Unusable: "danger" } };

export function CatalogStatusText({ catalog }: { catalog: FormCatalogRow }) {
  const format = useFormat();
  const status = catalogStatus(catalog);
  const reason = status === "Unusable" && catalog.unusableReason && !format.isLoading ? format.formatEnum("FormCatalogUnusableReason", catalog.unusableReason) : undefined;
  return <span className="inline-flex items-center gap-1.5">
    <StatusBadge tones={catalogStatusTones} value={status} />
    {reason ? <InfoTip standalone text={reason} title={reason} /> : null}
  </span>;
}

/// El estado en la banda del editor (FRM-Catalogo, .bnd .res): en la compu, el punto y la palabra, «● No se puede usar» en
/// rojo con su motivo en la (i); en la barra del teléfono (M-FRM-Catalogo), la palabra gris de la línea de abajo, sin punto.
export function CatalogBandStatus({ catalog, phone }: { catalog: Pick<FormCatalogRow, "isActive" | "usable" | "unusableReason">; phone: boolean }) {
  const format = useFormat();
  const status = catalogStatus(catalog);
  const text = format.formatEnum("FormCatalogStatus", status);
  const reason = status === "Unusable" && catalog.unusableReason ? format.formatEnum("FormCatalogUnusableReason", catalog.unusableReason) : undefined;
  return <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", !phone && status === "Unusable" && "text-[var(--peligro)]")}>
    {phone ? null : <StatusMark tones={catalogStatusTones} value={status} />}
    {text}
    {reason ? <InfoTip text={reason} title={text} /> : null}
  </span>;
}

/// El tipo de valor es de los escritos a mano: uno con filtros es siempre de texto y dice «—» (FRM-Catalogos).
export function ValueTypeText({ catalog }: { catalog: FormCatalogRow }) {
  const format = useFormat();
  if (catalog.source !== "Manual") return <EmptyValue />;
  return <span>{format.formatEnum("FormCatalogValueType", catalog.valueType)}</span>;
}

export function SourceText({ catalog }: { catalog: FormCatalogRow }) {
  const format = useFormat();
  return <span>{format.formatEnum("FormCatalogSource", catalog.source)}</span>;
}

/// Las opciones activas del catálogo fuente de un campo, de a páginas y con la búsqueda en el servidor (111): un valor nuevo
/// exige una opción activa.
function sourceItemOptions(sourceCatalogId: string): ResourceOptions<FormCatalogItemRow> {
  return {
    queryKeyRoot: [...catalogItemsQueryRoot(sourceCatalogId), "options"], id: (item) => item.id,
    queryFn: ({ page, pageSize, search }, signal) => fetchCatalogItems(sourceCatalogId, { page, pageSize, search, status: "Active" }, signal),
  };
}

interface FieldControlProps {
  /** El campo guardado: su tipo, su largo y su catálogo fuente. */
  field: FormCatalogFieldDetail;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  sourceItem?: CatalogSourceItem;
  /** En la tabla, el nombre de la celda («Zona de Abrasivos del Sur»); en el modal la nombra su renglón, por `id`. */
  label?: string;
  id?: string;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
}

/// «De un catálogo»: la pieza (262) con las opciones activas de la fuente. La guardada que está dada de baja va primera, con
/// «De baja» en gris, y se conserva mientras no se elija otra (lección 1).
function SourceOptionPicker({ field, value, onChange, sourceItem, label, id, invalid, describedBy, disabled }: FieldControlProps) {
  const { t } = useTranslation("forms");
  const [opened, setOpened] = useState(false);
  const query = useResourceOptions(sourceItemOptions(field.sourceCatalogId ?? ""), opened && Boolean(field.sourceCatalogId));
  const chosenId = typeof value === "string" && value !== "" ? value : null;
  const chosen = chosenId ? sourceItem?.(chosenId) ?? query.knownItems.find((item) => item.id === chosenId) : undefined;
  return <Picker id={id} label={label} remote={query.remote} value={chosenId} disabled={disabled}
    options={query.items.map((item) => ({ value: item.id, label: item.text }))}
    selectedOptions={chosenId ? [{ value: chosenId, label: chosen?.text ?? "", description: chosen && !chosen.isActive ? t("catalog.status.inactive") : undefined }] : []}
    first={field.required ? undefined : { value: "", label: t("catalog.fieldValues.none") }}
    placeholder={t("catalog.fieldValues.choose")} aria-invalid={invalid || undefined} aria-describedby={describedBy}
    onOpenChange={(open) => { if (open) setOpened(true); }}
    onChange={(next) => { if (next !== (chosenId ?? "")) onChange(next === "" ? null : next); }} />;
}

/// El control del valor de un campo en su celda o en su renglón del modal (F3): un texto con su tope (269), un número o una
/// fecha como se escriben en la región del idioma, Sí/No y una opción de otro catálogo en la pieza (262). Vacío es «sin valor».
export function FieldValueControl(props: FieldControlProps) {
  const { t } = useTranslation("forms");
  const format = useFormat();
  const { field, value, onChange, label, id, invalid, describedBy, disabled } = props;
  if (field.type === "Catalog") return <SourceOptionPicker {...props} />;
  if (field.type === "YesNo") {
    const current = value === true ? "yes" : value === false ? "no" : null;
    return <Picker id={id} label={label} value={current} disabled={disabled} aria-invalid={invalid || undefined} aria-describedby={describedBy}
      options={[{ value: "yes", label: format.formatBoolean(true) }, { value: "no", label: format.formatBoolean(false) }]}
      first={field.required ? undefined : { value: "", label: t("catalog.fieldValues.none") }} placeholder={t("catalog.fieldValues.choose")}
      onChange={(next) => onChange(next === "yes" ? true : next === "no" ? false : null)} />;
  }
  const numeric = field.type === "WholeNumber" || field.type === "DecimalNumber";
  return <Input id={id} aria-label={label} value={typeof value === "string" ? value : ""} disabled={disabled} autoComplete="off"
    aria-invalid={invalid || undefined} aria-describedby={describedBy} inputMode={numeric ? "decimal" : undefined}
    maxLength={field.type === "Text" ? field.maxLength ?? undefined : undefined} className={cn(numeric && "text-right tabular-nums")}
    onChange={(event) => onChange(event.target.value === "" ? null : event.target.value)} />;
}

/// La celda o el renglón de un campo nuevo, o de uno al que el borrador le cambió el tipo: grisado hasta guardar el catálogo,
/// con su motivo en el tooltip y en su descripción (decisiones de la spec).
export function LockedFieldValue({ reason, label, id, describedBy }: { reason: string; label?: string; id?: string; describedBy?: string }) {
  const reasonId = useId();
  return <>
    <InformativeTooltip text={reason}>
      <Input id={id} aria-label={label} value="" readOnly aria-disabled="true" aria-describedby={[reasonId, describedBy].filter(Boolean).join(" ")}
        className="cursor-not-allowed border-[var(--borde)] bg-[var(--s2)]" />
    </InformativeTooltip>
    <span id={reasonId} hidden>{reason}</span>
  </>;
}

/// El valor guardado de un campo, como se lee en la tabla de lectura y en el teléfono; sin valor, «—» (formatos).
export function FieldValueText({ field, value, sourceItem }: { field: FormCatalogFieldDetail; value: FieldValue; sourceItem?: CatalogSourceItem }) {
  const format = useFormat();
  const text = fieldValueText(value, field.type, format, typeof value === "string" ? sourceItem?.(value)?.text : undefined);
  return text ? <span className="break-words">{text}</span> : <EmptyValue />;
}
