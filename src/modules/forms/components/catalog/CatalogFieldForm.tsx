import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";
import { CheckboxField } from "@/shared/ui/CheckboxField";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { LockIcon } from "@/shared/ui/icons";
import { Input } from "@/shared/ui/input";
import { Picker } from "@/shared/ui/Picker";
import type { FormCatalogFieldType } from "../../api/types";
import { useFieldName, type CatalogFieldEditing } from "../../hooks/useCatalogFieldsDialog";
import { catalogFieldLimits, catalogFieldTypes, fieldUsingKey, keyStartsWell, rangeValueType, type CatalogFieldDraft } from "../../lib/catalogFields";
import { readValue } from "../../lib/catalogValues";
import { CatalogCombo } from "./CatalogCombo";
import { OptionField } from "./OptionsDialog";

/** Debajo del tipo: el largo de un texto, el rango de un número o una fecha, o el catálogo de «De un catálogo». */
function FieldTypeDetail({ field, catalogId, edit }: { field: CatalogFieldDraft; catalogId: string | null; edit: CatalogFieldEditing["edit"] }) {
  const { t } = useTranslation("forms");
  const format = useFormat();
  const valueType = rangeValueType(field.type);
  if (field.type === "Text") {
    const length = Number(field.maxLength);
    const lengthError = field.maxLength && (length < catalogFieldLimits.minLength || length > catalogFieldLimits.maxLength)
      ? t("forms:catalog.fieldsDialog.lengthRange", { min: format.formatInteger(catalogFieldLimits.minLength), max: format.formatInteger(catalogFieldLimits.maxLength) }) : undefined;
    return <OptionField label={t("forms:catalog.fieldsDialog.labels.length")} error={lengthError} below>
      {(control) => <span className="flex min-h-9 items-center gap-2 text-[0.8125rem] text-[var(--t2)]">
        <span aria-hidden="true">{t("forms:catalog.fieldsDialog.upTo")}</span>
        <Input {...control} value={field.maxLength} inputMode="numeric" autoComplete="off" maxLength={String(catalogFieldLimits.maxLength).length}
          placeholder={t("forms:catalog.fieldsDialog.lengthPlaceholder")} className="w-18 flex-none text-right tabular-nums"
          onChange={(event) => edit(field, { maxLength: event.target.value.replace(/\D/g, "") })} />
        <span aria-hidden="true">{t("forms:catalog.fieldsDialog.characters")}</span>
      </span>}
    </OptionField>;
  }
  if (valueType) {
    const error = [field.min, field.max].map((input) => input.trim() ? readValue(input, valueType, format, t).error : undefined).find(Boolean);
    const date = valueType === "Date";
    return <OptionField label={t("forms:catalog.fieldsDialog.labels.range")} error={error} below>
      {(control) => <span className="flex min-h-9 flex-wrap items-center gap-2 text-[0.8125rem] text-[var(--t2)]">
        <span aria-hidden="true">{t("forms:catalog.fieldsDialog.from")}</span>
        <Input {...control} aria-label={t("forms:catalog.fieldsDialog.min")} value={field.min} autoComplete="off" inputMode={date ? undefined : "decimal"}
          className={cn("flex-none", date ? "w-32.5" : "w-18 text-right tabular-nums")} onChange={(event) => edit(field, { min: event.target.value })} />
        <span aria-hidden="true">{t("forms:catalog.fieldsDialog.to")}</span>
        <Input aria-label={t("forms:catalog.fieldsDialog.max")} aria-invalid={control["aria-invalid"]} aria-describedby={control["aria-describedby"]} value={field.max}
          autoComplete="off" inputMode={date ? undefined : "decimal"} className={cn("flex-none", date ? "w-32.5" : "w-18 text-right tabular-nums")}
          onChange={(event) => edit(field, { max: event.target.value })} />
      </span>}
    </OptionField>;
  }
  if (field.type === "Catalog") return <OptionField label={t("forms:catalog.fieldsDialog.labels.catalog")} required below>
    {(control) => <CatalogCombo id={control.id} describedBy={control["aria-describedby"]} value={field.sourceCatalogId} valueName={field.sourceCatalogName}
      except={catalogId ? { id: catalogId, reason: t("forms:catalog.fieldsDialog.sameCatalog") } : undefined}
      onChange={(catalog) => edit(field, { sourceCatalogId: catalog.id, sourceCatalogName: catalog.name })} />}
  </OptionField>;
  return null;
}

/**
 * Un campo en el modal, para editar: su nombre, su clave (que nace del nombre y, guardada, queda con su candado, 130), su tipo con
 * el largo, el rango o el catálogo debajo, y sus reglas. Lo que rechazó el servidor va en su parte.
 */
export function CatalogFieldForm({ field, list, catalogId, editing }: {
  field: CatalogFieldDraft;
  /** Los campos del modal: la clave no puede repetir la de otro. */
  list: readonly CatalogFieldDraft[];
  catalogId: string | null;
  editing: CatalogFieldEditing;
}) {
  const { t } = useTranslation("forms");
  const format = useFormat();
  const fieldName = useFieldName();
  const duplicate = fieldUsingKey(list, field);
  const keyError = field.errors?.key ?? (duplicate ? t("forms:catalog.fieldsDialog.keyDuplicate", { name: fieldName(duplicate) })
    : field.id === null && field.key && !keyStartsWell(field.key) ? t("forms:catalog.fieldsDialog.keyStart") : undefined);
  return <>
    {field.errors?.row ? <div className="md:px-5 md:pt-2.5"><p role="alert" className="text-[0.78125rem] text-[var(--peligro)]">{field.errors.row}</p></div> : null}
    <OptionField label={t("forms:catalog.fieldsDialog.labels.name")} required error={field.errors?.name}>
      {(control) => <Input {...control} data-field-name="" value={field.name} autoComplete="off" maxLength={catalogFieldLimits.name}
        placeholder={t("forms:catalog.fieldsDialog.namePlaceholder")} onChange={(event) => editing.editName(field, event.target.value)} />}
    </OptionField>
    <OptionField label={t("forms:catalog.fieldsDialog.labels.key")} required help={t("forms:catalog.fieldsDialog.keyHelp")} error={keyError}>
      {(control) => field.id === null
        ? <Input {...control} value={field.key} autoComplete="off" spellCheck={false} maxLength={catalogFieldLimits.key} className="font-mono"
          placeholder={t("forms:catalog.fieldsDialog.keyPlaceholder")} onChange={(event) => editing.editKey(field, event.target.value)} />
        // El campo del teléfono lleva 14 de relleno (Input): el candado va a 14 y la clave, después de él, como la lupa de «Buscar opción».
        : <span className="relative flex">
          <span role="img" aria-label={t("forms:catalog.fieldsDialog.keyLocked")} className="pointer-events-none absolute top-1/2 left-3 flex -translate-y-1/2 text-[var(--t3)] max-md:left-3.5">
            <LockIcon className="size-3.5" />
          </span>
          <Input {...control} value={field.key} readOnly className="bg-[var(--s2)] pl-8 font-mono text-[var(--t2)] max-md:pl-10" />
        </span>}
    </OptionField>
    <OptionField label={t("forms:catalog.fieldsDialog.labels.type")} required error={field.errors?.type}>
      {(control) => <Picker id={control.id} aria-describedby={control["aria-describedby"]} aria-invalid={control["aria-invalid"]}
        value={field.type} onChange={(type) => editing.editType(field, type as FormCatalogFieldType)}
        options={catalogFieldTypes.map((type) => ({ value: type, label: format.formatEnum("FormCatalogFieldType", type) }))} />}
    </OptionField>
    <FieldTypeDetail field={field} catalogId={catalogId} edit={editing.edit} />
    <OptionField label={t("forms:catalog.fieldsDialog.labels.rules")} error={field.errors?.required}>
      {(control) => <span role="group" aria-labelledby={`${control.id}-label`} className="flex flex-wrap items-center gap-x-3">
        <CheckboxField label={t("forms:catalog.fieldsDialog.required")} checked={field.required} onCheckedChange={(required) => editing.edit(field, { required })}
          disabled={field.id === null} disabledReason={field.id === null ? t("forms:catalog.fieldsDialog.requiredNew") : undefined} />
        <CheckboxField label={t("forms:catalog.fieldsDialog.unique")} checked={field.unique} onCheckedChange={(unique) => editing.edit(field, { unique })} />
      </span>}
    </OptionField>
  </>;
}

/** Quien solo lee: los mismos datos de un campo, en texto. */
export function CatalogFieldRead({ field }: { field: CatalogFieldDraft }) {
  const { t } = useTranslation("forms");
  const format = useFormat();
  const valueType = rangeValueType(field.type);
  const rules = [field.required ? t("forms:catalog.fieldsDialog.required") : null, field.unique ? t("forms:catalog.fieldsDialog.unique") : null].filter(Boolean).join(" · ");
  const read = (text: string | null | undefined, mono = false) => (control: { id: string }) =>
    <span id={control.id} className={cn("flex min-h-9 items-center text-[0.84375rem] text-[var(--t1)]", mono && "font-mono")}>{text ? text : <EmptyValue />}</span>;
  return <>
    <OptionField label={t("forms:catalog.fieldsDialog.labels.name")}>{read(field.name)}</OptionField>
    <OptionField label={t("forms:catalog.fieldsDialog.labels.key")}>{read(field.key, true)}</OptionField>
    <OptionField label={t("forms:catalog.fieldsDialog.labels.type")}>{read(format.formatEnum("FormCatalogFieldType", field.type))}</OptionField>
    {field.type === "Text" ? <OptionField label={t("forms:catalog.fieldsDialog.labels.length")} below>
      {read(field.maxLength ? t("forms:catalog.fieldsDialog.lengthRead", { n: field.maxLength }) : null)}
    </OptionField> : valueType ? <OptionField label={t("forms:catalog.fieldsDialog.labels.range")} below>
      {read(field.min || field.max ? t("forms:catalog.fieldsDialog.rangeRead", { min: field.min || "—", max: field.max || "—" }) : null)}
    </OptionField> : field.type === "Catalog" ? <OptionField label={t("forms:catalog.fieldsDialog.labels.catalog")} below>
      {read(field.sourceCatalogName)}
    </OptionField> : null}
    <OptionField label={t("forms:catalog.fieldsDialog.labels.rules")}>{read(rules)}</OptionField>
  </>;
}
