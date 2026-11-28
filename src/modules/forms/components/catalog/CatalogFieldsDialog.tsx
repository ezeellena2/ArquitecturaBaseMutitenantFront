import { Plus } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { CheckboxField } from "@/shared/ui/CheckboxField";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { ChevronLeftIcon, TrashIcon } from "@/shared/ui/icons";
import type { FormCatalogPresentationDetail } from "../../api/types";
import { useCatalogFieldsDialog, useFieldName } from "../../hooks/useCatalogFieldsDialog";
import { catalogFieldLimits, fieldInPresentation, type CatalogFieldDraft, type CatalogFieldsDraft } from "../../lib/catalogFields";
import { CatalogFieldForm, CatalogFieldRead } from "./CatalogFieldForm";
import { DesktopFieldsList, PhoneFieldsList } from "./CatalogFieldsList";

/** Quitar un campo guardado, en el mismo diálogo (nunca uno sobre otro): con valores, pide marcar la confirmación. */
function RemoveFieldQuestion({ field, presentation, confirmed, descriptionId, onConfirmedChange, onAnswer }: {
  field: CatalogFieldDraft;
  presentation?: FormCatalogPresentationDetail | null;
  confirmed: boolean;
  descriptionId: string;
  onConfirmedChange: (confirmed: boolean) => void;
  onAnswer: (remove: boolean) => void;
}) {
  const { t } = useTranslation(["forms", "common"]);
  const format = useFormat();
  const fieldName = useFieldName();
  const inPresentation = fieldInPresentation(presentation, field.id) ? ` ${t("forms:catalog.fieldsDialog.removeDialog.inPresentation")}` : "";
  const confirmReason = field.valuesCount > 0 && !confirmed ? t("forms:catalog.fieldsDialog.removeDialog.confirmReason") : undefined;
  return <>
    <DialogHeader><DialogTitle>{t("forms:catalog.fieldsDialog.removeDialog.title", { name: fieldName(field) })}</DialogTitle></DialogHeader>
    <div className="flex flex-col gap-3 p-5 max-md:pt-2 max-md:pb-4">
      <DialogDescription id={descriptionId}>{`${t("forms:catalog.fieldsDialog.removeDialog.description")}${inPresentation}`}</DialogDescription>
      {field.valuesCount > 0 ? <CheckboxField checked={confirmed} onCheckedChange={onConfirmedChange}
        label={t("forms:catalog.fieldsDialog.removeDialog.confirmValues", { count: field.valuesCount, n: format.formatInteger(field.valuesCount) })} /> : null}
    </div>
    <DialogFooter>
      <Button type="button" variant="outline" autoFocus onClick={() => onAnswer(false)}>{t("common:actions.cancel")}</Button>
      <Button type="button" variant="destructive" disabledReason={confirmReason} onClick={() => onAnswer(true)}>{t("forms:catalog.fieldsDialog.removeDialog.confirm")}</Button>
    </DialogFooter>
  </>;
}

/**
 * El modal «Campos de …» de un catálogo a mano (FRM-Catalogo-Campos y M-FRM-Catalogo-Campos, 125), igual al de opciones: a la
 * izquierda la lista (`CatalogFieldsList`), con ↑ ↓ en el elegido; a la derecha el campo (`CatalogFieldForm`). Escribe en una
 * copia (`useCatalogFieldsDialog`): «Listo» la deja en el catálogo (`onDone`) y, si hay un campo nuevo, avisa que se guarde el
 * catálogo para cargarle valores; «Cancelar», Esc o la ✕ la descartan. Quitar uno guardado pregunta en el mismo diálogo. En el
 * teléfono ocupa la pantalla: la lista y, al tocar un campo, el campo con «Volver a la lista». Quien solo lee ve los mismos
 * datos, sin editar.
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
  const dialog = useCatalogFieldsDialog({ value, removedKeys, readOnly, initialKey, onDone, onClose });
  const { list, selected, removing } = dialog;
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (dialog.focusRequest) content.current?.querySelector<HTMLInputElement>("[data-field-name]")?.focus();
  }, [dialog.focusRequest]);

  const name = catalogName.trim();
  const max = format.formatInteger(catalogFieldLimits.active);
  const title = name ? t("forms:catalog.fieldsDialog.title", { name }) : t("forms:catalog.fieldsDialog.list");
  const position = (field: CatalogFieldDraft) => field.id === null
    ? t("forms:catalog.fieldsDialog.newField")
    : t("forms:catalog.fieldsDialog.position", { n: format.formatInteger(list.indexOf(field) + 1), total: format.formatInteger(list.length) });
  const listCount = t("forms:catalog.fieldsDialog.count", { n: format.formatInteger(list.length), max });
  const fullReason = dialog.full ? t("forms:catalog.fieldsDialog.full", { max }) : undefined;

  // Al abrir, el foco va al nombre del campo que se ve, no a la lista de la izquierda.
  const focusName = (event: Event) => {
    const input = event.currentTarget instanceof HTMLElement ? event.currentTarget.querySelector<HTMLInputElement>("[data-field-name]") : null;
    if (!input) return;
    event.preventDefault();
    input.focus();
  };

  const view = (field: CatalogFieldDraft) => readOnly ? <CatalogFieldRead field={field} />
    : <CatalogFieldForm field={field} list={list} catalogId={catalogId} editing={dialog.editing} />;
  const footer = readOnly
    ? <Button type="button" variant="outline" onClick={onClose}>{t("common:actions.close")}</Button>
    : <><Button type="button" variant="outline" onClick={onClose}>{t("common:actions.cancel")}</Button><Button type="button" onClick={dialog.done}>{t("common:actions.done")}</Button></>;

  const desktop = <>
    <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
    <div className="grid h-[29.375rem] grid-cols-[23.75rem_minmax(0,1fr)]">
      <div className="flex min-h-0 flex-col border-r border-[var(--borde)] bg-[var(--s2)]">
        <div className="flex min-h-11 shrink-0 items-center justify-between gap-3 border-b border-[var(--borde)] bg-[var(--cab)] px-3 text-[0.8125rem] font-semibold text-[var(--t2)]">
          <span id={listId}>{t("forms:catalog.fieldsDialog.list")}</span>
          {readOnly ? null : <small className="text-[0.78125rem] font-medium text-[var(--t3)]">{listCount}</small>}
        </div>
        <DesktopFieldsList list={list} selectedKey={selected?.localKey ?? null} readOnly={readOnly} labelledBy={listId} onSelect={dialog.select} onMove={dialog.moveSelected} />
        {readOnly ? null : <div className="shrink-0 border-t border-[var(--borde)] px-3 py-2.5">
          <Button type="button" size="sm" variant="outline" disabledReason={fullReason} onClick={dialog.addField}>
            <Plus aria-hidden="true" className="size-4" />{t("forms:catalog.fieldsDialog.add")}
          </Button>
        </div>}
      </div>
      {selected ? <section aria-label={position(selected)} className="flex min-h-0 min-w-0 flex-col overflow-y-auto pb-2.5">
        <div className="flex min-h-11 shrink-0 items-center justify-between gap-3 bg-[var(--cab)] px-5 text-[0.8125rem] font-semibold text-[var(--t2)]">
          <span>{position(selected)}</span>
          {readOnly ? null : <Button type="button" size="sm" variant="danger" onClick={dialog.removeSelected}>
            <TrashIcon aria-hidden="true" className="size-3.5" />{t("forms:catalog.fieldsDialog.remove")}
          </Button>}
        </div>
        {view(selected)}
      </section> : <div />}
    </div>
    <DialogFooter>{footer}</DialogFooter>
  </>;

  const shown = dialog.phoneView === "field" ? selected : null;
  const onList = !shown;
  const phoneScreen = <>
    <header className="flex min-h-15 shrink-0 items-center gap-1 pt-[env(safe-area-inset-top)] pr-4 pl-1">
      <button type="button" onClick={onList ? onClose : () => dialog.setPhoneView("list")}
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
          {readOnly ? null : <Button type="button" size="sm" variant="link" disabledReason={fullReason} onClick={dialog.addField}>{t("forms:catalog.fieldsDialog.add")}</Button>}
        </div>
        <PhoneFieldsList list={list} labelledBy={listId} onSelect={dialog.select} />
      </> : <div className="flex flex-col gap-3.5 px-4 py-3">
        {view(shown)}
        {readOnly ? null : <Button type="button" variant="link" className="self-start text-[var(--peligro)]" onClick={dialog.removeSelected}>{t("forms:catalog.fieldsDialog.remove")}</Button>}
      </div>}
    </div>
    {onList ? <div className="flex shrink-0 gap-2.5 border-t border-[var(--borde)] px-4 pt-3 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
      {readOnly ? <Button type="button" variant="outline" className="h-12 flex-1" onClick={onClose}>{t("common:actions.close")}</Button> : <>
        <Button type="button" variant="outline" className="h-12 flex-1" onClick={onClose}>{t("common:actions.cancel")}</Button>
        <Button type="button" className="h-12 flex-1" onClick={dialog.done}>{t("common:actions.done")}</Button>
      </>}
    </div> : null}
  </>;

  const asking = removing !== null;
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent ref={content} size={asking ? "sm" : "default"} role={asking ? "alertdialog" : "dialog"} showCloseButton={!asking && !phone}
      aria-describedby={asking ? questionId : undefined} onCloseAutoFocus={restoreFocus} onOpenAutoFocus={readOnly ? undefined : focusName}
      onEscapeKeyDown={(event) => { if (asking) { event.preventDefault(); dialog.answer(false); } }}
      className={asking ? undefined : phone
        ? "max-md:inset-0 max-md:flex max-md:h-dvh max-md:max-h-none max-md:flex-col max-md:rounded-none [&>[data-slot=dialog-handle]]:hidden"
        : "md:max-w-220"}>
      {removing ? <RemoveFieldQuestion field={removing} presentation={presentation} confirmed={dialog.confirmed} descriptionId={questionId}
        onConfirmedChange={dialog.setConfirmed} onAnswer={dialog.answer} /> : phone ? phoneScreen : desktop}
    </DialogContent>
  </Dialog>;
}
