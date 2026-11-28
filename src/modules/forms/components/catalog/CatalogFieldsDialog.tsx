import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useFormat } from "@/shared/format/useFormat";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { cn } from "@/shared/lib/utils";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { CheckboxField } from "@/shared/ui/CheckboxField";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { IconButton } from "@/shared/ui/IconButton";
import { AlertTriangleIcon, ChevronLeftIcon, LockIcon, TrashIcon } from "@/shared/ui/icons";
import { Input } from "@/shared/ui/input";
import { Picker } from "@/shared/ui/Picker";
import type { FormCatalogFieldType, FormCatalogPresentationDetail } from "../../api/types";
import {
  catalogFieldLimits, catalogFieldTypes, fieldInPresentation, fieldUsingKey, freeKey, keyFromName, keyStartsWell, newFieldDraft,
  rangeValueType, typedKey, type CatalogFieldDraft, type CatalogFieldErrors, type CatalogFieldsDraft,
} from "../../lib/catalogFields";
import { readValue } from "../../lib/catalogValues";
import { CatalogCombo } from "./CatalogCombo";
import { OptionField } from "./OptionsDialog";

type FieldPatch = Partial<Omit<CatalogFieldDraft, "localKey" | "id" | "valuesCount" | "errors">>;

/** Lo que borra de los errores del servidor cambiar cada dato: el campo vuelve a mandarse y el servidor decide. */
const clearedBy: Partial<Record<keyof FieldPatch, (keyof CatalogFieldErrors)[]>> = {
  name: ["name", "row"], key: ["key"], type: ["type", "row"], sourceCatalogId: ["row"], maxLength: ["row"], min: ["row"], max: ["row"], required: ["required"],
};

/**
 * El modal «Campos de …» de un catálogo a mano (FRM-Catalogo-Campos y M-FRM-Catalogo-Campos, 125), igual al de opciones: a la
 * izquierda la lista (número, nombre y tipo, cada uno en su columna, 263), con ↑ ↓ en el elegido; a la derecha el campo, con
 * su nombre, su clave (con su candado una vez guardado, 130), su tipo con el largo, el rango o el catálogo debajo, y sus reglas.
 * Escribe en una copia: «Listo» la deja en el catálogo (`onDone`) y, si hay un campo nuevo, avisa que se guarde el catálogo
 * para cargarle valores; «Cancelar», Esc o la ✕ la descartan. Quitar uno guardado pregunta en el mismo diálogo (nunca un
 * diálogo sobre otro), y con valores pide marcar la confirmación. En el teléfono ocupa la pantalla: la lista y, al tocar un
 * campo, el campo con «Volver a la lista». Quien solo lee ve los mismos datos, sin editar.
 */
export function CatalogFieldsDialog({ catalogId, catalogName, value, removedKeys, presentation, readOnly = false, initialKey, onDone, onClose }: {
  /** El catálogo que se edita: no se ofrece como fuente de sus propios campos. Uno nuevo, todavía sin id. */
  catalogId: string | null;
  catalogName: string;
  value: CatalogFieldsDraft;
  /** Las claves de los campos quitados: una nueva que choca con ellas suma un número, como en el servidor. */
  removedKeys: readonly string[];
  /** «En WhatsApp» del catálogo: quitar un campo que está ahí lo dice. */
  presentation?: FormCatalogPresentationDetail | null;
  readOnly?: boolean;
  /** El campo que se ve al abrir, como el que rechazó el servidor («Revisar»). */
  initialKey?: string | null;
  onDone: (next: CatalogFieldsDraft) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation(["forms", "common"]);
  const format = useFormat();
  const { phone } = useAppChrome();
  const restoreFocus = useRestoreFocusOnClose();
  const listId = useId(), questionId = useId();
  // Sin campos, abre en uno nuevo («Agregar campos · 0»).
  const [draft, setDraft] = useState<CatalogFieldsDraft>(() => value.fields.length || readOnly ? value : { ...value, fields: [newFieldDraft()] });
  const [selectedKey, setSelectedKey] = useState<string | null>(() => initialKey ?? draft.fields[0]?.localKey ?? null);
  const [phoneView, setPhoneView] = useState<"list" | "field">(initialKey || (!value.fields.length && !readOnly) ? "field" : "list");
  const [removing, setRemoving] = useState<CatalogFieldDraft | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  // «Agregar campo» lleva el foco al nombre del nuevo, como al abrir.
  const content = useRef<HTMLDivElement>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  useEffect(() => {
    if (focusRequest) content.current?.querySelector<HTMLInputElement>("[data-field-name]")?.focus();
  }, [focusRequest]);

  const list = draft.fields;
  const selected = list.find((field) => field.localKey === selectedKey) ?? null;
  const name = catalogName.trim();
  const full = list.length >= catalogFieldLimits.active;
  const max = format.formatInteger(catalogFieldLimits.active);

  const title = name ? t("forms:catalog.fieldsDialog.title", { name }) : t("forms:catalog.fieldsDialog.list");
  const typeLabel = (type: FormCatalogFieldType) => format.formatEnum("FormCatalogFieldType", type);
  const fieldName = (field: CatalogFieldDraft) => field.name.trim() || t("forms:catalog.fieldsDialog.noName");
  const number = (field: CatalogFieldDraft) => field.id === null ? <EmptyValue /> : format.formatInteger(list.indexOf(field) + 1);
  const position = (field: CatalogFieldDraft) => field.id === null
    ? t("forms:catalog.fieldsDialog.newField")
    : t("forms:catalog.fieldsDialog.position", { n: format.formatInteger(list.indexOf(field) + 1), total: format.formatInteger(list.length) });

  const setFields = (update: (fields: readonly CatalogFieldDraft[]) => readonly CatalogFieldDraft[]) =>
    setDraft((current) => ({ ...current, fields: update(current.fields) }));

  function select(key: string) {
    setSelectedKey(key);
    setPhoneView("field");
  }

  function edit(field: CatalogFieldDraft, patch: FieldPatch) {
    const cleared = Object.keys(patch).flatMap((part) => clearedBy[part as keyof FieldPatch] ?? []);
    const errors = field.errors ? Object.fromEntries(Object.entries(field.errors).filter(([part]) => !cleared.includes(part as keyof CatalogFieldErrors))) : undefined;
    setFields((fields) => fields.map((item) => item.localKey === field.localKey ? { ...item, ...patch, errors } : item));
  }

  /** El nombre lleva a la clave mientras nadie la escribió y el campo no está guardado (130). */
  function editName(field: CatalogFieldDraft, next: string) {
    const key = field.id === null && !field.keyEdited ? (next.trim() ? freeKey(keyFromName(next), removedKeys) : "") : field.key;
    edit(field, { name: next, key });
  }

  function editKey(field: CatalogFieldDraft, input: string) {
    const key = typedKey(input);
    edit(field, key ? { key, keyEdited: true } : { key: field.name.trim() ? freeKey(keyFromName(field.name), removedKeys) : "", keyEdited: false });
  }

  /** Otro tipo deja solo lo que le sirve: el largo, el texto; el rango, un número o una fecha; el catálogo, «De un catálogo». */
  function editType(field: CatalogFieldDraft, type: FormCatalogFieldType) {
    if (type === field.type) return;
    const sameRange = rangeValueType(type) !== null && (rangeValueType(type) === "Date") === (field.type === "Date") && rangeValueType(field.type) !== null;
    edit(field, {
      type, maxLength: type === "Text" ? field.maxLength : "", min: sameRange ? field.min : "", max: sameRange ? field.max : "",
      sourceCatalogId: type === "Catalog" ? field.sourceCatalogId : null, sourceCatalogName: type === "Catalog" ? field.sourceCatalogName : null,
    });
  }

  function addField() {
    const field = newFieldDraft();
    setFields((fields) => [...fields, field]);
    select(field.localKey);
    setFocusRequest((request) => request + 1);
  }

  function moveSelected(step: -1 | 1) {
    if (!selected) return;
    setFields((fields) => {
      const index = fields.indexOf(selected), other = index + step;
      if (index < 0 || other < 0 || other >= fields.length) return fields;
      const next = [...fields];
      [next[index], next[other]] = [next[other]!, next[index]!];
      return next;
    });
  }

  function dropField(field: CatalogFieldDraft, confirmedValues: boolean) {
    const index = list.indexOf(field);
    const rest = list.filter((item) => item.localKey !== field.localKey);
    setDraft((current) => ({
      fields: current.fields.filter((item) => item.localKey !== field.localKey),
      confirmedRemovals: confirmedValues && field.id ? [...current.confirmedRemovals, field.id] : current.confirmedRemovals,
    }));
    setSelectedKey(rest[Math.min(index, rest.length - 1)]?.localKey ?? null);
    setPhoneView("list");
  }

  /** Uno nuevo se quita sin preguntar; uno guardado pregunta, y con valores pide marcar la confirmación. */
  function removeSelected() {
    if (!selected) return;
    if (selected.id === null) { dropField(selected, false); return; }
    setConfirmed(false);
    setRemoving(selected);
  }

  function answer(remove: boolean) {
    if (remove && removing) dropField(removing, removing.valuesCount > 0);
    setRemoving(null);
  }

  /** «Listo»: un campo nuevo sin nada escrito no queda; con uno nuevo, avisa que se guarde para cargarle valores. */
  function done() {
    const fields = draft.fields.filter((field) => field.id !== null || field.name.trim() !== "" || field.key !== "");
    onDone({ ...draft, fields });
    if (fields.some((field) => field.id === null)) toast.warning(t("forms:catalog.fieldsDialog.saveToLoadValues"));
    onClose();
  }

  // Al abrir, el foco va al nombre del campo que se ve, no a la lista de la izquierda.
  const focusName = (event: Event) => {
    const input = event.currentTarget instanceof HTMLElement ? event.currentTarget.querySelector<HTMLInputElement>("[data-field-name]") : null;
    if (!input) return;
    event.preventDefault();
    input.focus();
  };

  const triangle = <span title={t("forms:catalog.optionsDialog.hasError")} className="inline-flex shrink-0 text-[var(--peligro)]">
    <AlertTriangleIcon aria-hidden="true" className="size-3.5" />
    <span className="sr-only">{t("forms:catalog.optionsDialog.hasError")}</span>
  </span>;
  const hasErrors = (field: CatalogFieldDraft) => Object.values(field.errors ?? {}).some(Boolean);
  const nameText = (field: CatalogFieldDraft) => <span className={cn("min-w-0 break-words font-semibold", field.name.trim() ? "text-[var(--t1)]" : "text-[var(--t3)]")}>
    {fieldName(field)}
  </span>;
  const newBadge = <span className="rounded-[0.375rem] bg-[var(--alerta-t)] px-1.5 text-[0.71875rem] font-semibold text-[var(--alerta-tx)]">{t("forms:catalog.fieldsDialog.newBadge")}</span>;

  const desktopItem = (field: CatalogFieldDraft) => {
    const on = field.localKey === selected?.localKey;
    const index = list.indexOf(field);
    return <li key={field.localKey} className={cn("grid grid-cols-[minmax(0,1fr)_2.625rem] items-center border-b border-[var(--borde)] pr-2", on && "bg-[var(--marca-t)] shadow-[inset_3px_0_0_var(--marca)]")}>
      <button type="button" aria-current={on ? "true" : undefined} onClick={() => select(field.localKey)}
        className="grid min-h-13 w-full grid-cols-[1.25rem_minmax(0,1fr)_2.75rem_7.25rem] items-center gap-x-2.5 py-2 pl-3 text-left text-[0.84375rem] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--foco)]">
        <span className="text-center text-[0.8125rem] text-[var(--t3)] tabular-nums">{number(field)}</span>
        <span className="flex min-w-0 items-center gap-1.5">{nameText(field)}{hasErrors(field) ? triangle : null}</span>
        <span>{field.id === null ? newBadge : null}</span>
        <span className="text-[0.78125rem] leading-[1.3] text-[var(--t2)]">{typeLabel(field.type)}</span>
      </button>
      {on && !readOnly ? <span className="inline-flex justify-self-end">
        <IconButton label={t("forms:catalog.fieldsDialog.up", { name: fieldName(field) })} disabled={index === 0} className="size-7" onClick={() => moveSelected(-1)}>
          <ArrowUp aria-hidden="true" className="size-4" />
        </IconButton>
        <IconButton label={t("forms:catalog.fieldsDialog.down", { name: fieldName(field) })} disabled={index === list.length - 1} className="size-7" onClick={() => moveSelected(1)}>
          <ArrowDown aria-hidden="true" className="size-4" />
        </IconButton>
      </span> : null}
    </li>;
  };

  const phoneItem = (field: CatalogFieldDraft) => <li key={field.localKey} className="border-b border-[var(--borde)]">
    <button type="button" onClick={() => select(field.localKey)} className="flex w-full items-start gap-2 px-4 py-3 text-left text-[0.90625rem] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--foco)]">
      <span className="w-6 shrink-0 text-[var(--t3)] tabular-nums">{number(field)}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-1.5">{nameText(field)}{field.id === null ? newBadge : null}{hasErrors(field) ? triangle : null}</span>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 text-[0.8125rem]">
          <div className="contents"><dt className="text-[var(--t3)]">{t("forms:catalog.fieldsDialog.labels.type")}</dt><dd>{typeLabel(field.type)}</dd></div>
        </dl>
      </span>
    </button>
  </li>;

  const listCount = t("forms:catalog.fieldsDialog.count", { n: format.formatInteger(list.length), max });
  const fullReason = full ? t("forms:catalog.fieldsDialog.full", { max }) : undefined;

  const message = (text: string | undefined) => text ? <p role="alert" className="text-[0.78125rem] text-[var(--peligro)]">{text}</p> : null;

  /** Debajo del tipo: el largo de un texto, el rango de un número o una fecha, o el catálogo de «De un catálogo». */
  const typeDetail = (field: CatalogFieldDraft) => {
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
  };

  const keyHelp = t("forms:catalog.fieldsDialog.keyHelp");
  const fieldView = (field: CatalogFieldDraft) => {
    const duplicate = fieldUsingKey(list, field);
    const keyError = field.errors?.key ?? (duplicate ? t("forms:catalog.fieldsDialog.keyDuplicate", { name: fieldName(duplicate) })
      : field.id === null && field.key && !keyStartsWell(field.key) ? t("forms:catalog.fieldsDialog.keyStart") : undefined);
    return <>
      {field.errors?.row ? <div className="md:px-5 md:pt-2.5">{message(field.errors.row)}</div> : null}
      <OptionField label={t("forms:catalog.fieldsDialog.labels.name")} required error={field.errors?.name}>
        {(control) => <Input {...control} data-field-name="" value={field.name} autoComplete="off" maxLength={catalogFieldLimits.name}
          placeholder={t("forms:catalog.fieldsDialog.namePlaceholder")} onChange={(event) => editName(field, event.target.value)} />}
      </OptionField>
      <OptionField label={t("forms:catalog.fieldsDialog.labels.key")} required help={keyHelp} error={keyError}>
        {(control) => field.id === null
          ? <Input {...control} value={field.key} autoComplete="off" spellCheck={false} maxLength={catalogFieldLimits.key} className="font-mono"
            placeholder={t("forms:catalog.fieldsDialog.keyPlaceholder")} onChange={(event) => editKey(field, event.target.value)} />
          : <span className="relative flex">
            <span role="img" aria-label={t("forms:catalog.fieldsDialog.keyLocked")} className="pointer-events-none absolute top-1/2 left-3 flex -translate-y-1/2 text-[var(--t3)]">
              <LockIcon className="size-3.5" />
            </span>
            <Input {...control} value={field.key} readOnly className="bg-[var(--s2)] pl-8 font-mono text-[var(--t2)]" />
          </span>}
      </OptionField>
      <OptionField label={t("forms:catalog.fieldsDialog.labels.type")} required error={field.errors?.type}>
        {(control) => <Picker id={control.id} aria-describedby={control["aria-describedby"]} aria-invalid={control["aria-invalid"]} className="md:max-w-60"
          value={field.type} onChange={(type) => editType(field, type as FormCatalogFieldType)}
          options={catalogFieldTypes.map((type) => ({ value: type, label: typeLabel(type) }))} />}
      </OptionField>
      {typeDetail(field)}
      <OptionField label={t("forms:catalog.fieldsDialog.labels.rules")} error={field.errors?.required}>
        {(control) => <span role="group" aria-labelledby={`${control.id}-label`} className="flex flex-wrap items-center gap-x-3">
          <CheckboxField label={t("forms:catalog.fieldsDialog.required")} checked={field.required} onCheckedChange={(required) => edit(field, { required })}
            disabled={field.id === null} disabledReason={field.id === null ? t("forms:catalog.fieldsDialog.requiredNew") : undefined} />
          <CheckboxField label={t("forms:catalog.fieldsDialog.unique")} checked={field.unique} onCheckedChange={(unique) => edit(field, { unique })} />
        </span>}
      </OptionField>
    </>;
  };

  /** Quien solo lee: los mismos datos, en texto. */
  const readView = (field: CatalogFieldDraft) => {
    const valueType = rangeValueType(field.type);
    const rules = [field.required ? t("forms:catalog.fieldsDialog.required") : null, field.unique ? t("forms:catalog.fieldsDialog.unique") : null].filter(Boolean).join(" · ");
    const read = (text: string | null | undefined, mono = false) => (control: { id: string }) =>
      <span id={control.id} className={cn("flex min-h-9 items-center text-[0.84375rem] text-[var(--t1)]", mono && "font-mono")}>{text ? text : <EmptyValue />}</span>;
    return <>
      <OptionField label={t("forms:catalog.fieldsDialog.labels.name")}>{read(field.name)}</OptionField>
      <OptionField label={t("forms:catalog.fieldsDialog.labels.key")}>{read(field.key, true)}</OptionField>
      <OptionField label={t("forms:catalog.fieldsDialog.labels.type")}>{read(typeLabel(field.type))}</OptionField>
      {field.type === "Text" ? <OptionField label={t("forms:catalog.fieldsDialog.labels.length")} below>
        {read(field.maxLength ? t("forms:catalog.fieldsDialog.lengthRead", { n: field.maxLength }) : null)}
      </OptionField> : valueType ? <OptionField label={t("forms:catalog.fieldsDialog.labels.range")} below>
        {read(field.min || field.max ? t("forms:catalog.fieldsDialog.rangeRead", { min: field.min || "—", max: field.max || "—" }) : null)}
      </OptionField> : field.type === "Catalog" ? <OptionField label={t("forms:catalog.fieldsDialog.labels.catalog")} below>
        {read(field.sourceCatalogName)}
      </OptionField> : null}
      <OptionField label={t("forms:catalog.fieldsDialog.labels.rules")}>{read(rules)}</OptionField>
    </>;
  };

  const view = (field: CatalogFieldDraft) => readOnly ? readView(field) : fieldView(field);
  const addButton = <Button type="button" size="sm" variant="outline" disabledReason={fullReason} onClick={addField}>
    <Plus aria-hidden="true" className="size-4" />{t("forms:catalog.fieldsDialog.add")}
  </Button>;

  const removeDescription = removing ? `${t("forms:catalog.fieldsDialog.removeDialog.description")}${fieldInPresentation(presentation, removing.id) ? ` ${t("forms:catalog.fieldsDialog.removeDialog.inPresentation")}` : ""}` : "";
  const confirmReason = removing && removing.valuesCount > 0 && !confirmed ? t("forms:catalog.fieldsDialog.removeDialog.confirmReason") : undefined;
  const question = removing ? <>
    <DialogHeader><DialogTitle>{t("forms:catalog.fieldsDialog.removeDialog.title", { name: fieldName(removing) })}</DialogTitle></DialogHeader>
    <div className="flex flex-col gap-3 p-5 max-md:pt-2 max-md:pb-4">
      <DialogDescription id={questionId}>{removeDescription}</DialogDescription>
      {removing.valuesCount > 0 ? <CheckboxField checked={confirmed} onCheckedChange={setConfirmed}
        label={t("forms:catalog.fieldsDialog.removeDialog.confirmValues", { count: removing.valuesCount, n: format.formatInteger(removing.valuesCount) })} /> : null}
    </div>
    <DialogFooter>
      <Button type="button" variant="outline" autoFocus onClick={() => answer(false)}>{t("common:actions.cancel")}</Button>
      <Button type="button" variant="destructive" disabledReason={confirmReason} onClick={() => answer(true)}>{t("forms:catalog.fieldsDialog.removeDialog.confirm")}</Button>
    </DialogFooter>
  </> : null;

  const footer = readOnly
    ? <Button type="button" variant="outline" onClick={onClose}>{t("common:actions.close")}</Button>
    : <><Button type="button" variant="outline" onClick={onClose}>{t("common:actions.cancel")}</Button><Button type="button" onClick={done}>{t("common:actions.done")}</Button></>;

  const desktop = <>
    <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
    <div className="grid h-[29.375rem] grid-cols-[23.75rem_minmax(0,1fr)]">
      <div className="flex min-h-0 flex-col border-r border-[var(--borde)] bg-[var(--s2)]">
        <div className="flex min-h-11 shrink-0 items-center justify-between gap-3 border-b border-[var(--borde)] bg-[var(--cab)] px-3 text-[0.8125rem] font-semibold text-[var(--t2)]">
          <span id={listId}>{t("forms:catalog.fieldsDialog.list")}</span>
          {readOnly ? null : <small className="text-[0.78125rem] font-medium text-[var(--t3)]">{listCount}</small>}
        </div>
        <ul aria-labelledby={listId} className="min-h-0 flex-1 overflow-y-auto">{list.map(desktopItem)}</ul>
        {readOnly ? null : <div className="shrink-0 border-t border-[var(--borde)] px-3 py-2.5">{addButton}</div>}
      </div>
      {selected ? <section aria-label={position(selected)} className="flex min-h-0 min-w-0 flex-col overflow-y-auto pb-2.5">
        <div className="flex min-h-11 shrink-0 items-center justify-between gap-3 bg-[var(--cab)] px-5 text-[0.8125rem] font-semibold text-[var(--t2)]">
          <span>{position(selected)}</span>
          {readOnly ? null : <Button type="button" size="sm" variant="danger" onClick={removeSelected}>
            <TrashIcon aria-hidden="true" className="size-3.5" />{t("forms:catalog.fieldsDialog.remove")}
          </Button>}
        </div>
        {view(selected)}
      </section> : <div />}
    </div>
    <DialogFooter>{footer}</DialogFooter>
  </>;

  const shown = phoneView === "field" ? selected : null;
  const onList = !shown;
  const phoneScreen = <>
    <header className="flex min-h-15 shrink-0 items-center gap-1 pt-[env(safe-area-inset-top)] pr-4 pl-1">
      <button type="button" onClick={onList ? onClose : () => setPhoneView("list")}
        aria-label={onList ? t("common:actions.back") : t("forms:catalog.optionsDialog.backToList")} title={onList ? t("common:actions.back") : t("forms:catalog.optionsDialog.backToList")}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--t1)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
        <ChevronLeftIcon className="size-6.5" strokeWidth={1.9} />
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <DialogTitle className="text-[1.25rem] leading-[1.15] font-bold tracking-[-0.02em] text-[var(--t1)]">{shown ? position(shown) : t("forms:catalog.fieldsDialog.list")}</DialogTitle>
        {name ? <span className="break-words text-[0.8125rem] text-[var(--t2)]">{name}</span> : null}
      </div>
    </header>
    <div className="min-h-0 flex-1 overflow-y-auto pb-5">
      {!shown ? <>
        <div className="flex items-center justify-between gap-3 px-4 pt-2 pb-1.5 text-[0.8125rem] font-semibold text-[var(--t2)]">
          <span id={listId}>{readOnly ? t("forms:catalog.fieldsDialog.list") : t("forms:catalog.fieldsDialog.phoneList", { summary: listCount })}</span>
          {readOnly ? null : <Button type="button" size="sm" variant="link" disabledReason={fullReason} onClick={addField}>{t("forms:catalog.fieldsDialog.add")}</Button>}
        </div>
        <ul aria-labelledby={listId} className="border-t border-[var(--borde)]">{list.map(phoneItem)}</ul>
      </> : <div className="flex flex-col gap-3.5 px-4 py-3">
        {view(shown)}
        {readOnly ? null : <Button type="button" variant="link" className="self-start text-[var(--peligro)]" onClick={removeSelected}>{t("forms:catalog.fieldsDialog.remove")}</Button>}
      </div>}
    </div>
    {onList ? <div className="flex shrink-0 gap-2.5 border-t border-[var(--borde)] px-4 pt-3 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
      {readOnly ? <Button type="button" variant="outline" className="h-12 flex-1" onClick={onClose}>{t("common:actions.close")}</Button> : <>
        <Button type="button" variant="outline" className="h-12 flex-1" onClick={onClose}>{t("common:actions.cancel")}</Button>
        <Button type="button" className="h-12 flex-1" onClick={done}>{t("common:actions.done")}</Button>
      </>}
    </div> : null}
  </>;

  const asking = removing !== null;
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent ref={content} size={asking ? "sm" : "default"} role={asking ? "alertdialog" : "dialog"} showCloseButton={!asking && !phone}
      aria-describedby={asking ? questionId : undefined} onCloseAutoFocus={restoreFocus} onOpenAutoFocus={readOnly ? undefined : focusName}
      onEscapeKeyDown={(event) => { if (asking) { event.preventDefault(); answer(false); } }}
      className={asking ? undefined : phone
        ? "max-md:inset-0 max-md:flex max-md:h-dvh max-md:max-h-none max-md:flex-col max-md:rounded-none [&>[data-slot=dialog-handle]]:hidden"
        : "md:max-w-220"}>
      {asking ? question : phone ? phoneScreen : desktop}
    </DialogContent>
  </Dialog>;
}
