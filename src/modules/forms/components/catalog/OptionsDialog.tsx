import { Plus } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { cn } from "@/shared/lib/utils";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { AlertTriangleIcon, ChevronLeftIcon, TrashIcon } from "@/shared/ui/icons";
import { InfoTip } from "@/shared/ui/InfoTip";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Picker } from "@/shared/ui/Picker";
import type { CatalogSourceItem } from "../../hooks/useCatalogFieldSources";
import { rowHasErrors, type CatalogDraftSnapshot, type CatalogEditor, type CatalogRowView } from "../../hooks/useCatalogEditor";
import { fieldErrorKey } from "../../lib/catalogDraft";
import { fieldColumnsOf } from "../../lib/catalogFields";
import { catalogLimits } from "../../lib/catalogLimits";
import { FieldValueControl, LockedFieldValue } from "./CatalogCells";

/** Cómo se abre el modal de opciones (117). */
export interface OptionsDialogOpening {
  /** «Agregar opción» abre con las opciones agregadas en él; ✎ y los errores de guardar, con las de la página. */
  readonly mode: "add" | "edit";
  /** La opción que se ve a la derecha (en el teléfono, la que se abre). */
  readonly key: string | null;
  /** El borrador al abrir: «Cancelar», Esc o la ✕ lo devuelven así. */
  readonly snapshot: CatalogDraftSnapshot;
  /** En el teléfono arranca en la lista, con los triángulos: así se abre cuando guardar encontró errores. */
  readonly startOnList?: boolean;
}

export type FieldControl = { id: string; "aria-invalid"?: true; "aria-describedby"?: string; "aria-required"?: true };

/**
 * Un renglón de la opción (FRM-Catalogo-Opciones, .md-f): en la compu, el rótulo a la izquierda y el campo a la derecha;
 * en el teléfono (M-FRM-Catalogo-Opciones, .ap-cmp), uno debajo del otro. La ayuda va en la (i) y debajo, solo el error o
 * el aviso. Atado como `FormField`: la etiqueta nombra al campo (y a la pieza, por `<id>-label`) y el mensaje lo describe.
 * Lo usa también el modal de los campos (FRM-Catalogo-Campos), igual al de opciones.
 */
export function OptionField({ label, required, help, error, warning, below, children }: {
  label: string; required?: boolean; help?: string; error?: string; warning?: string;
  /** El renglón que sigue al de arriba sin la línea entre los dos, como el largo debajo del tipo (FRM-Catalogo-Campos, .md-f.junto). */
  below?: boolean;
  children: (control: FieldControl) => ReactNode;
}) {
  const id = useId();
  const messageId = `${id}-message`, helpId = `${id}-help`;
  const message = error ?? warning;
  const describedBy = [help ? helpId : undefined, message ? messageId : undefined].filter(Boolean).join(" ") || undefined;
  return <div className={cn("flex flex-col gap-1.5 md:grid md:grid-cols-[6.875rem_minmax(0,1fr)] md:gap-3 md:px-5 md:py-2.5", below ? "md:pt-0" : "md:border-t md:border-[var(--borde)]")}>
    <span className="flex items-center gap-1 md:min-h-9">
      <Label id={`${id}-label`} htmlFor={id} className="gap-1! text-[0.78125rem] font-semibold text-[var(--t2)] max-md:text-[0.84375rem] max-md:leading-[normal]">
        {label}
        {required ? <span aria-hidden="true" className="text-[var(--peligro)]">{" *"}</span> : null}
      </Label>
      {help ? <InfoTip id={helpId} text={help} title={label} /> : null}
    </span>
    <div className="flex min-w-0 flex-col gap-1">
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy, "aria-required": required ? true : undefined })}
      {error ? <p id={messageId} role="alert" className="text-[0.78125rem] text-[var(--peligro)]">{error}</p>
        : warning ? <p id={messageId} className="text-[0.78125rem] text-[var(--alerta-tx)]">{warning}</p> : null}
    </div>
  </div>;
}

/**
 * El modal de opciones de un catálogo a mano (FRM-Catalogo-Opciones y M-FRM-Catalogo-Opciones, 117). A la izquierda, la
 * lista (número o «—», texto, «Nueva» o «Se borra al guardar» y código, cada dato en su columna, 263), con un triángulo en
 * las que tienen un error; a la derecha, la opción elegida con su posición y «Quitar opción». Escribe en el borrador del
 * editor, que se guarda con «Guardar cambios»: «Cancelar», Esc o la ✕ lo devuelven como estaba al abrir, y «Listo» lo
 * conserva, menos una opción nueva sin nada escrito. En el teléfono ocupa la pantalla: la lista y, al tocar una, la opción
 * con «Volver a la lista». Quitar una guardada pregunta en el mismo diálogo (nunca un diálogo sobre otro).
 *
 * Desde la E13 (FRM-Catalogo-Opciones-13 y su teléfono), un renglón por campo después del código y antes del detalle, con el
 * control de su tipo; el de un campo nuevo, grisado hasta guardar el catálogo, con su motivo. `sourceItem` dice el texto de
 * la opción de otro catálogo que es valor de un campo, también si está dada de baja.
 */
export function OptionsDialog({ editor, opening, sourceItem, onClose }: {
  editor: CatalogEditor; opening: OptionsDialogOpening; sourceItem?: CatalogSourceItem; onClose: () => void;
}) {
  const { t } = useTranslation(["forms", "common"]);
  const format = useFormat();
  const { phone } = useAppChrome();
  const restoreFocus = useRestoreFocusOnClose();
  const listId = useId(), questionId = useId();
  const [selectedKey, setSelectedKey] = useState(opening.key);
  const [addedKeys, setAddedKeys] = useState<readonly string[]>(opening.mode === "add" && opening.key ? [opening.key] : []);
  const [phoneView, setPhoneView] = useState<"list" | "option">(opening.startOnList || !opening.key ? "list" : "option");
  const [asking, setAsking] = useState(false);

  const adding = opening.mode === "add";
  const list = adding ? addedKeys.flatMap((key) => editor.rows.filter((row) => row.key === key)) : editor.rows;
  const selected = list.find((row) => row.key === selectedKey) ?? null;
  const name = editor.name.trim();
  const typed = editor.valueType !== "Text";
  const fieldColumns = fieldColumnsOf(editor.fields, editor.saved?.fields ?? []);

  const textOf = (row: CatalogRowView) => row.draft.text.trim();
  // Una nueva todavía no tiene número: «—» con EmptyValue, tenue y «Sin dato» para el lector (formatos).
  const number = (row: CatalogRowView) => row.number == null ? <EmptyValue /> : format.formatInteger(row.number);
  const position = (row: CatalogRowView) => row.isNew || row.number == null
    ? t("forms:catalog.optionsDialog.newOption")
    : t("forms:catalog.optionsDialog.position", { n: format.formatInteger(row.number), total: format.formatInteger(editor.saved?.itemCounts.total ?? 0) });

  const title = name
    ? t(adding ? "forms:catalog.optionsDialog.titleNew" : "forms:catalog.optionsDialog.title", { name })
    : t(adding ? "forms:catalog.optionsDialog.listNew" : "forms:catalog.optionsDialog.list");
  const listTitle = t(adding ? "forms:catalog.optionsDialog.listNew" : "forms:catalog.optionsDialog.list");
  const pageData = editor.items.data;
  // El rango es el de la página; las de otras páginas que el borrador toca se suman a la lista, no al rango.
  const pageCount = pageData?.items.length ?? 0;
  const firstNumber = pageData ? (pageData.page - 1) * pageData.pageSize + 1 : 1;
  const listCount = adding || !pageData || pageCount === 0
    ? format.formatInteger(list.length)
    : t("forms:catalog.optionsDialog.range", { from: format.formatInteger(firstNumber), to: format.formatInteger(firstNumber + pageCount - 1), total: format.formatInteger(pageData.totalCount) });
  const removeReason = selected && !selected.isNew && (editor.moves.length || editor.sort) ? t("forms:catalog.reasons.orderPending") : undefined;

  function select(key: string) {
    setSelectedKey(key);
    setPhoneView("option");
  }

  function addOption() {
    const key = editor.add();
    if (adding) setAddedKeys((keys) => [...keys, key]);
    select(key);
  }

  /** Una nueva se quita sin preguntar; una guardada pregunta, y queda «Se borra al guardar» con «Restaurar» (129). */
  function removeSelected() {
    if (!selected) return;
    if (!selected.isNew) {
      setAsking(true);
      return;
    }
    const index = list.findIndex((row) => row.key === selected.key);
    const rest = list.filter((row) => row.key !== selected.key);
    editor.remove(selected.key);
    setAddedKeys((keys) => keys.filter((key) => key !== selected.key));
    setSelectedKey(rest[Math.min(index, rest.length - 1)]?.key ?? null);
    setPhoneView("list");
  }

  function answer(remove: boolean) {
    if (remove && selected) editor.remove(selected.key);
    setAsking(false);
  }

  function cancel() {
    editor.restoreSnapshot(opening.snapshot);
    onClose();
  }

  function done() {
    for (const row of list) {
      const blank = [row.draft.text, row.draft.code, row.draft.detail, row.draft.value].every((value) => value.trim() === "")
        && Object.values(row.draft.fields ?? {}).every((value) => value === null);
      if (row.isNew && blank) editor.remove(row.key);
    }
    onClose();
  }

  // Al abrir, el foco va al texto de la opción que se ve, no a la lista de la izquierda.
  const focusText = (event: Event) => {
    const input = event.currentTarget instanceof HTMLElement ? event.currentTarget.querySelector<HTMLInputElement>("[data-option-text]") : null;
    if (!input) return;
    event.preventDefault();
    input.focus();
  };

  const triangle = <span title={t("forms:catalog.optionsDialog.hasError")} className="inline-flex shrink-0 text-[var(--peligro)]">
    <AlertTriangleIcon aria-hidden="true" className="size-3.5" />
    <span className="sr-only">{t("forms:catalog.optionsDialog.hasError")}</span>
  </span>;

  const itemText = (row: CatalogRowView) => <span className={cn("min-w-0 break-words font-semibold", textOf(row) && row.draft.isActive ? "text-[var(--t1)]" : "text-[var(--t3)]")}>
    {textOf(row) ? row.draft.text : t("forms:catalog.optionsDialog.noText")}
  </span>;

  const desktopItem = (row: CatalogRowView) => {
    const on = row.key === selected?.key;
    return <li key={row.key}>
      <button type="button" aria-current={on ? "true" : undefined} onClick={() => select(row.key)}
        className={cn("grid min-h-13 w-full grid-cols-[1.25rem_minmax(0,1fr)_4.5rem_4rem] items-center gap-x-2.5 border-b border-[var(--borde)] px-3 py-2 text-left text-[0.84375rem] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--foco)]",
          on && "bg-[var(--marca-t)] shadow-[inset_3px_0_0_var(--marca)]")}>
        <span className="text-center text-[0.8125rem] text-[var(--t3)] tabular-nums">{number(row)}</span>
        <span className="flex min-w-0 items-center gap-1.5">{itemText(row)}{rowHasErrors(row) ? triangle : null}</span>
        <span className={cn("text-[0.78125rem] leading-[1.3]", row.pendingDelete ? "text-[var(--peligro)]" : "text-[var(--t2)]")}>
          {row.pendingDelete ? t("forms:catalog.deleteOnSave")
            : row.isNew ? <span className="rounded-[0.375rem] bg-[var(--alerta-t)] px-1.5 text-[0.71875rem] font-semibold text-[var(--alerta-tx)]">{t("forms:catalog.optionsDialog.newBadge")}</span>
              // Una de baja no se dice solo con el gris de su texto (accesibilidad): lo dice su estado.
              : row.draft.isActive ? null : t("forms:catalog.status.inactive")}
        </span>
        <span className={cn("text-[0.78125rem] break-all", row.draft.code.trim() ? "font-mono text-[var(--t2)]" : "text-[var(--t3)]")}>
          {row.draft.code.trim() ? row.draft.code : t("forms:catalog.noCode")}
        </span>
      </button>
    </li>;
  };

  const phoneItem = (row: CatalogRowView) => <li key={row.key} className="border-b border-[var(--borde)]">
    <button type="button" onClick={() => select(row.key)} className="flex w-full items-start gap-2 px-4 py-3 text-left text-[0.90625rem] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--foco)]">
      <span className="w-6 shrink-0 text-[var(--t3)] tabular-nums">{number(row)}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-1.5">{itemText(row)}{rowHasErrors(row) ? triangle : null}</span>
        <span className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 text-[0.8125rem]">
          <span className="text-[var(--t3)]">{t("forms:catalog.columns.code")}</span>
          <span className={row.draft.code.trim() ? "font-mono" : "text-[var(--t3)]"}>{row.draft.code.trim() ? row.draft.code : t("forms:catalog.noCode")}</span>
          {typed && row.draft.value ? <><span className="text-[var(--t3)]">{t("forms:catalog.columns.value")}</span><span>{row.draft.value}</span></> : null}
          {row.draft.detail.trim() ? <><span className="text-[var(--t3)]">{t("forms:catalog.columns.detail")}</span><span className="break-words">{row.draft.detail}</span></> : null}
          {row.pendingDelete ? <><span className="text-[var(--t3)]">{t("forms:catalog.columns.status")}</span><span className="text-[var(--peligro)]">{t("forms:catalog.deleteOnSave")}</span></>
            : !row.draft.isActive ? <><span className="text-[var(--t3)]">{t("forms:catalog.columns.status")}</span><span>{t("forms:catalog.status.inactive")}</span></> : null}
        </span>
      </span>
    </button>
  </li>;

  const addButton = <Button type="button" size="sm" variant="outline" disabledReason={editor.full ? t("forms:catalog.reasons.full") : undefined} onClick={addOption}>
    <Plus aria-hidden="true" className="size-4" />{t("forms:catalog.actions.add")}
  </Button>;

  const rowError = (row: CatalogRowView) => row.errors.row
    ? <p role="alert" className="text-[0.78125rem] text-[var(--peligro)] max-md:px-0 md:px-5 md:pt-2.5">{row.errors.row}</p> : null;

  /** La opción por borrar (.md-por): su texto, «Se borra al guardar» y «Restaurar»; si algo la usa, lo dice (ItemInUse). */
  const pendingView = (row: CatalogRowView) => <div className="flex flex-col items-start gap-2.5 text-[0.875rem] max-md:px-4 max-md:py-3 md:p-5">
    <b className="break-words font-semibold text-[var(--t1)]">{row.draft.text}</b>
    <span className="text-[0.84375rem] text-[var(--peligro)]">{t("forms:catalog.deleteOnSave")}</span>
    {row.errors.row ? <p role="alert" className="text-[0.78125rem] text-[var(--peligro)]">{row.errors.row}</p> : null}
    <Button type="button" size="sm" variant="outline" onClick={() => editor.restore(row.key)}>{t("forms:catalog.actions.restore")}</Button>
  </div>;

  const fields = (row: CatalogRowView) => {
    const set = (patch: Partial<CatalogRowView["draft"]>) => editor.edit(row.key, patch);
    return <>
      {rowError(row)}
      <OptionField label={t("forms:catalog.columns.text")} required help={t("forms:catalog.optionsDialog.help.text")} error={row.errors.text}
        warning={row.textRepeated ? t("forms:catalog.warnings.textRepeated") : undefined}>
        {(control) => <div className="relative">
          <Input {...control} data-option-text="" value={row.draft.text} autoComplete="off" className="pr-14"
            onChange={(event) => set({ text: event.target.value })} />
          <small className={cn("pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[0.71875rem] tabular-nums", row.draft.text.length > catalogLimits.itemText ? "text-[var(--peligro)]" : "text-[var(--t3)]")}>
            {`${format.formatInteger(row.draft.text.length)}/${format.formatInteger(catalogLimits.itemText)}`}
          </small>
        </div>}
      </OptionField>
      <OptionField label={t("forms:catalog.columns.code")} required help={t("forms:catalog.optionsDialog.help.code")} error={row.errors.code}>
        {(control) => <div className="flex items-center gap-3">
          <Input {...control} value={row.draft.code} autoComplete="off" maxLength={catalogLimits.itemCode} className="min-w-0 flex-1 font-mono"
            onChange={(event) => set({ code: event.target.value })} />
          <Button type="button" size="sm" variant="link" disabledReason={textOf(row) ? undefined : t("forms:catalog.optionsDialog.writeTextFirst")}
            onClick={() => editor.generateCode(row.key)}>{t("forms:catalog.optionsDialog.generateCode")}</Button>
        </div>}
      </OptionField>
      {typed ? <OptionField label={t(`forms:catalog.optionsDialog.value.${editor.valueType}`)} required error={row.errors.value}>
        {(control) => <Input {...control} value={row.draft.value} autoComplete="off" inputMode={editor.valueType === "Date" ? undefined : "decimal"}
          className={editor.valueType === "Date" ? undefined : "text-right tabular-nums"} onChange={(event) => set({ value: event.target.value })} />}
      </OptionField> : null}
      {fieldColumns.map(({ field, detail, editable }) => {
        const errorKey = field.id ? fieldErrorKey(field.id) : null;
        return <OptionField key={field.localKey} label={field.name || t("forms:catalog.fieldsDialog.noName")} required={editable && detail?.required}
          error={errorKey ? row.errors[errorKey] : undefined}>
          {(control) => editable && detail
            ? <FieldValueControl field={detail} value={row.draft.fields?.[detail.id] ?? null} sourceItem={sourceItem} id={control.id}
              invalid={control["aria-invalid"]} describedBy={control["aria-describedby"]} onChange={(value) => set({ fields: { [detail.id]: value } })} />
            : <LockedFieldValue id={control.id} reason={t("forms:catalog.fieldValues.saveFirst")} describedBy={control["aria-describedby"]} />}
        </OptionField>;
      })}
      <OptionField label={t("forms:catalog.columns.detail")} help={t("forms:catalog.optionsDialog.help.detail")} error={row.errors.detail}>
        {(control) => <Input {...control} value={row.draft.detail} autoComplete="off" maxLength={catalogLimits.itemDetail}
          onChange={(event) => set({ detail: event.target.value })} />}
      </OptionField>
      {row.isNew ? null : <OptionField label={t("forms:catalog.columns.status")} help={t("forms:catalog.optionsDialog.help.status")}>
        {(control) => <Picker id={control.id} aria-describedby={control["aria-describedby"]} className="md:max-w-60"
          value={row.draft.isActive ? "active" : "inactive"} onChange={(value) => set({ isActive: value === "active" })}
          options={[{ value: "active", label: t("forms:catalog.status.active") }, { value: "inactive", label: t("forms:catalog.status.inactive") }]} />}
      </OptionField>}
    </>;
  };

  const question = selected ? <>
    <DialogHeader><DialogTitle>{t("forms:catalog.deleteDialog.title", { option: textOf(selected) || t("forms:catalog.newOption") })}</DialogTitle></DialogHeader>
    <DialogDescription id={questionId} className="p-5 max-md:pt-2 max-md:pb-4">{t("forms:catalog.deleteDialog.description")}</DialogDescription>
    <DialogFooter>
      <Button type="button" variant="outline" autoFocus onClick={() => answer(false)}>{t("common:actions.cancel")}</Button>
      <Button type="button" variant="destructive" onClick={() => answer(true)}>{t("forms:catalog.deleteDialog.confirm")}</Button>
    </DialogFooter>
  </> : null;

  const desktop = <>
    <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
    <div className="grid h-[28.125rem] grid-cols-[21.875rem_minmax(0,1fr)]">
      <div className="flex min-h-0 flex-col border-r border-[var(--borde)] bg-[var(--s2)]">
        <div className="flex min-h-11 shrink-0 items-center justify-between gap-3 border-b border-[var(--borde)] bg-[var(--cab)] px-3 text-[0.8125rem] font-semibold text-[var(--t2)]">
          <span id={listId}>{listTitle}</span>
          <small className="text-[0.78125rem] font-medium text-[var(--t3)]">{listCount}</small>
        </div>
        <ul aria-labelledby={listId} className="min-h-0 flex-1 overflow-y-auto">{list.map(desktopItem)}</ul>
        <div className="shrink-0 border-t border-[var(--borde)] px-3 py-2.5">{addButton}</div>
      </div>
      {selected ? <section aria-label={position(selected)} className="flex min-h-0 min-w-0 flex-col overflow-y-auto pb-2.5">
        <div className="flex min-h-11 shrink-0 items-center justify-between gap-3 bg-[var(--cab)] px-5 text-[0.8125rem] font-semibold text-[var(--t2)]">
          <span>{position(selected)}</span>
          {selected.pendingDelete ? null : <Button type="button" size="sm" variant="danger" disabledReason={removeReason} onClick={removeSelected}>
            <TrashIcon aria-hidden="true" className="size-3.5" />{t("forms:catalog.optionsDialog.remove")}
          </Button>}
        </div>
        {selected.pendingDelete ? pendingView(selected) : fields(selected)}
      </section> : <div />}
    </div>
    <DialogFooter>
      <Button type="button" variant="outline" onClick={cancel}>{t("common:actions.cancel")}</Button>
      <Button type="button" onClick={done}>{t("common:actions.done")}</Button>
    </DialogFooter>
  </>;

  const shown = phoneView === "option" ? selected : null;
  const onList = !shown;
  const phoneScreen = <>
    <header className="flex min-h-15 shrink-0 items-center gap-1 pt-[env(safe-area-inset-top)] pr-4 pl-1">
      <button type="button" onClick={onList ? cancel : () => setPhoneView("list")}
        aria-label={onList ? t("common:actions.back") : t("forms:catalog.optionsDialog.backToList")} title={onList ? t("common:actions.back") : t("forms:catalog.optionsDialog.backToList")}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--t1)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
        <ChevronLeftIcon className="size-6.5" strokeWidth={1.9} />
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <DialogTitle className="text-[1.25rem] leading-[1.15] font-bold tracking-[-0.02em] text-[var(--t1)]">{shown ? position(shown) : listTitle}</DialogTitle>
        {name ? <span className="break-words text-[0.8125rem] text-[var(--t2)]">{name}</span> : null}
      </div>
    </header>
    <div className="min-h-0 flex-1 overflow-y-auto pb-5">
      {!shown ? <>
        <div className="flex items-center justify-between gap-3 px-4 pt-2 pb-1.5 text-[0.8125rem] font-semibold text-[var(--t2)]">
          <span id={listId}>{listTitle}</span>
          <Button type="button" size="sm" variant="link" disabledReason={editor.full ? t("forms:catalog.reasons.full") : undefined} onClick={addOption}>{t("forms:catalog.actions.add")}</Button>
        </div>
        <ul aria-labelledby={listId} className="border-t border-[var(--borde)]">{list.map(phoneItem)}</ul>
      </> : shown.pendingDelete ? pendingView(shown) : <div className="flex flex-col gap-3.5 px-4 py-3">
        {fields(shown)}
        <Button type="button" variant="link" className="self-start text-[var(--peligro)]" disabledReason={removeReason} onClick={removeSelected}>{t("forms:catalog.optionsDialog.remove")}</Button>
      </div>}
    </div>
    {onList ? <div className="flex shrink-0 gap-2.5 border-t border-[var(--borde)] px-4 pt-3 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
      <Button type="button" variant="outline" className="h-12 flex-1" onClick={cancel}>{t("common:actions.cancel")}</Button>
      <Button type="button" className="h-12 flex-1" onClick={done}>{t("common:actions.done")}</Button>
    </div> : null}
  </>;

  return <Dialog open onOpenChange={(open) => { if (!open) cancel(); }}>
    <DialogContent size={asking ? "sm" : "default"} role={asking ? "alertdialog" : "dialog"} showCloseButton={!asking && !phone}
      aria-describedby={asking ? questionId : undefined} onCloseAutoFocus={restoreFocus} onOpenAutoFocus={focusText}
      onEscapeKeyDown={(event) => { if (asking) { event.preventDefault(); answer(false); } }}
      className={asking ? undefined : phone
        ? "max-md:inset-0 max-md:flex max-md:h-dvh max-md:max-h-none max-md:flex-col max-md:rounded-none [&>[data-slot=dialog-handle]]:hidden"
        : "md:max-w-220"}>
      {asking ? question : phone ? phoneScreen : desktop}
    </DialogContent>
  </Dialog>;
}
