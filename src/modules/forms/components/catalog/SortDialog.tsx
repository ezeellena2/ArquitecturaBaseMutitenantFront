import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormField } from "@/shared/ui/FormField";
import { Picker } from "@/shared/ui/Picker";
import type { FormCatalogFieldDetail, FormCatalogItemSortColumn, FormCatalogItemSortInput } from "../../api/types";
import { sortKindOf, sortOrderKey } from "../../lib/catalogFields";

const columns: readonly FormCatalogItemSortColumn[] = ["Text", "Code"];
const noFields: readonly FormCatalogFieldDetail[] = [];

/**
 * «Ordenar las opciones» (FRM-Catalogo-Ordenar y FRM-Catalogo-Ordenar-13, 224): la columna y el orden, los dos en la pieza
 * (262), con el sentido dicho con palabras según lo que se compara: un texto o un campo de otro catálogo, de la A a la Z; un
 * número, de menor a mayor; una fecha, de la más antigua a la más reciente, y sí o no, primero «No». Ofrece «Texto»,
 * «Código» y cada campo activo ya guardado. No ordena al momento: el orden queda pendiente y se aplica al guardar, a todas
 * las opciones.
 */
export function SortDialog({ open, initial, fields = noFields, returnFocusTo, onOpenChange, onSort }: {
  open: boolean;
  /** El ⋮ de «Opciones»: la opción del menú que lo abrió se va con el menú, así que el foco vuelve a ese botón. */
  returnFocusTo?: HTMLElement | null;
  initial: FormCatalogItemSortInput | null;
  /** Los campos guardados del catálogo: se ordena por los activos (uno nuevo, recién después de guardar). */
  fields?: readonly FormCatalogFieldDetail[];
  onOpenChange: (open: boolean) => void;
  onSort: (sort: FormCatalogItemSortInput) => void;
}) {
  const { t } = useTranslation("forms");
  return <Dialog open={open} onOpenChange={onOpenChange}>
    {open ? <SortDialogContent initial={initial} fields={fields.filter((field) => field.isActive)} returnFocusTo={returnFocusTo}
      onCancel={() => onOpenChange(false)} onSort={(sort) => { onSort(sort); onOpenChange(false); }} title={t("forms:catalog.sort.title")} /> : null}
  </Dialog>;
}

function SortDialogContent({ initial, fields, returnFocusTo, title, onCancel, onSort }: {
  initial: FormCatalogItemSortInput | null; fields: readonly FormCatalogFieldDetail[]; returnFocusTo?: HTMLElement | null; title: string;
  onCancel: () => void; onSort: (sort: FormCatalogItemSortInput) => void;
}) {
  const { t } = useTranslation("forms");
  const options = [...columns.map((value) => ({ value, label: t(`forms:catalog.sort.columns.${value}`) })), ...fields.map((field) => ({ value: field.id, label: field.name }))];
  const start = initial?.column && options.some((option) => option.value === initial.column) ? initial.column : "Text";
  const [column, setColumn] = useState<FormCatalogItemSortColumn>(start);
  const [descending, setDescending] = useState(initial?.descending ?? false);
  const kind = sortKindOf(column, fields);
  // Abierto desde el ⋮ de «Opciones», al cerrar el foco vuelve a ese botón y no cae en <body> (formularios).
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  return <DialogContent size="sm" aria-describedby={undefined} onCloseAutoFocus={restoreFocus}>
    <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
    <DialogBody className="grid gap-3.5">
      <FormField label={t("forms:catalog.sort.column")}>
        <Picker value={column} onChange={setColumn} options={options} />
      </FormField>
      <FormField label={t("forms:catalog.sort.order")} help={t("forms:catalog.sort.orderHelp")}>
        <Picker value={descending ? "desc" : "asc"} onChange={(value) => setDescending(value === "desc")}
          options={[{ value: "asc", label: t(sortOrderKey(kind, false)) }, { value: "desc", label: t(sortOrderKey(kind, true)) }]} />
      </FormField>
    </DialogBody>
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel}>{t("common:actions.cancel")}</Button>
      <Button type="button" onClick={() => onSort({ column, descending })}>{t("forms:catalog.sort.apply")}</Button>
    </DialogFooter>
  </DialogContent>;
}
