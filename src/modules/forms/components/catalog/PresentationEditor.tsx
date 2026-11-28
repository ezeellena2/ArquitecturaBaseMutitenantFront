import { useId } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";
import { FormField } from "@/shared/ui/FormField";
import { Picker, type PickerOption } from "@/shared/ui/Picker";
import { Section, SectionFields } from "@/shared/ui/Section";
import type { FormCatalogPresentationDetail, FormCatalogPresentationIssues, FormCatalogValueType } from "../../api/types";
import { catalogLimits } from "../../lib/catalogLimits";
import { buildPresentation, fieldIdOfPlace, normalizePresentation, orderedPlaces, placeKeys, type PlaceText } from "../../lib/catalogPresentation";

/** Un campo que puede ir a WhatsApp: activo y guardado (uno nuevo todavía no tiene identidad). */
export interface PresentationField { readonly id: string; readonly name: string }

/**
 * «En WhatsApp» (FRM-Catalogo-13 y su teléfono, E13): qué arma el título («Título · hasta 30 caracteres») y la descripción
 * («Descripción · hasta 300») de cada opción. Cada uno se elige en la pieza múltiple (262), con los lugares en el orden del
 * catálogo y sin chips (285); el título no se queda sin ninguno, así que su único lugar va apagado con el motivo. «Por ejemplo»
 * arma la primera opción activa como el servidor (`buildPresentation`), con lo que no entra en rojo, y debajo va lo que avisó
 * el servidor al guardar (`presentationIssues`): cuántas opciones no entran y hasta tres de ejemplo. Solo lectura, apagado.
 */
export function PresentationEditor({ value, onChange, valueType, fields, example, issues, editable, error }: {
  value: FormCatalogPresentationDetail;
  onChange: (value: FormCatalogPresentationDetail) => void;
  valueType: FormCatalogValueType;
  /** Los campos activos guardados, en el orden del catálogo. */
  fields: readonly PresentationField[];
  /** Lo que dice cada lugar en la primera opción activa (`draftPlaceText`); sin opciones activas, no hay «Por ejemplo». */
  example: PlaceText | null;
  issues: FormCatalogPresentationIssues;
  editable: boolean;
  /** `Forms.Catalog.PresentationInvalid`, en el título. */
  error?: string;
}) {
  const { t } = useTranslation("forms");
  const format = useFormat();
  const exampleId = useId();
  const keys = placeKeys({ valueType, fields });
  const current = normalizePresentation(value, keys);
  const labelOf = (place: string) => {
    const fieldId = fieldIdOfPlace(place);
    return fieldId ? fields.find((field) => field.id === fieldId)?.name ?? "" : t(`forms:catalog.columns.${place}`);
  };
  const onlyTitle = current.title.length === 1 ? current.title[0] : null;
  const titleOptions: PickerOption[] = keys.map((place) => ({ value: place, label: labelOf(place),
    disabledReason: place === onlyTitle ? t("forms:catalog.presentation.titleNeedsOne") : undefined }));
  const descriptionOptions: PickerOption[] = keys.map((place) => ({ value: place, label: labelOf(place) }));
  const built = example ? buildPresentation(current, example) : null;

  function changeTitle(next: readonly string[]) {
    const title = orderedPlaces(next, keys);
    if (title.length) onChange({ ...current, title });
  }

  return <Section title={t("forms:catalog.presentation.section")} phone="loose">
    <SectionFields className="grid gap-3.5">
      <FormField label={t("forms:catalog.presentation.title", { n: format.formatInteger(catalogLimits.itemText) })} error={error}>
        <Picker multiple value={current.title} options={titleOptions} disabled={!editable} onChange={changeTitle} />
      </FormField>
      <FormField label={t("forms:catalog.presentation.description", { n: format.formatInteger(catalogLimits.itemDetail) })}>
        <Picker multiple value={current.description} options={descriptionOptions} disabled={!editable}
          placeholder={t("forms:catalog.presentation.noDescription")} onChange={(next) => onChange({ ...current, description: orderedPlaces(next, keys) })} />
      </FormField>
      {built ? <div className="flex flex-col gap-1.5">
        <span id={exampleId} className="text-[0.75rem] font-semibold text-[var(--t3)] max-md:text-[0.84375rem] max-md:text-[var(--t2)]">{t("forms:catalog.presentation.example")}</span>
        <div role="group" aria-labelledby={exampleId}
          className="flex flex-col gap-0.5 rounded-[0.5rem] border border-[var(--borde)] px-3 py-2.5 text-[0.84375rem] text-[var(--t1)]">
          <span className={cn("break-words", built.issue === "TitleTooLong" && "text-[var(--peligro)]")}>{built.title}</span>
          {built.description ? <small className={cn("break-words text-[0.78125rem]", built.issue === "DescriptionTooLong" ? "text-[var(--peligro)]" : "text-[var(--t3)]")}>
            {built.description}</small> : null}
        </div>
      </div> : null}
      <PresentationIssuesNotice issues={issues} />
    </SectionFields>
  </Section>;
}

/** Lo que no entra en WhatsApp, como lo avisó el servidor: cuántas opciones y hasta tres de ejemplo, en orden de posición. */
function PresentationIssuesNotice({ issues }: { issues: FormCatalogPresentationIssues }) {
  const { t } = useTranslation("forms");
  const format = useFormat();
  if (issues.count <= 0) return null;
  // El motivo, si todos los ejemplos dicen el mismo; si no, que no entran, sin elegir uno.
  const kinds = new Set(issues.examples.map((example) => example.issue));
  const kind = kinds.size === 1 ? [...kinds][0]! : "mixed";
  const max = kind === "DescriptionTooLong" ? catalogLimits.itemDetail : catalogLimits.itemText;
  return <div role="status" className="flex flex-col gap-0.5 text-[0.8125rem] text-[var(--alerta-tx)]">
    <span>{t(`forms:catalog.presentation.issues.${kind}`, { count: issues.count, n: format.formatInteger(issues.count), max: format.formatInteger(max) })}</span>
    {issues.examples.length ? <ul className="m-0 list-disc pl-[1.125rem] text-[var(--t2)]">
      {issues.examples.slice(0, 3).map((example) => <li key={example.itemId} className="break-words">{example.text}</li>)}
    </ul> : null}
  </div>;
}
