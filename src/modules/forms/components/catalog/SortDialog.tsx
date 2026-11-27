import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormField } from "@/shared/ui/FormField";
import { Picker } from "@/shared/ui/Picker";
import type { FormCatalogItemSortColumn, FormCatalogItemSortInput } from "../../api/types";

const columns: readonly NonNullable<FormCatalogItemSortColumn>[] = ["Text", "Code"];

/**
 * «Ordenar las opciones» (FRM-Catalogo-Ordenar, 224): la columna y el orden, los dos en la pieza (262), con el sentido dicho
 * con palabras. No ordena al momento: el orden queda pendiente y se aplica al guardar, a todas las opciones.
 */
export function SortDialog({ open, initial, returnFocusTo, onOpenChange, onSort }: {
  open: boolean;
  /** El ⋮ de «Opciones»: la opción del menú que lo abrió se va con el menú, así que el foco vuelve a ese botón. */
  returnFocusTo?: HTMLElement | null;
  initial: FormCatalogItemSortInput | null;
  onOpenChange: (open: boolean) => void;
  onSort: (sort: FormCatalogItemSortInput) => void;
}) {
  const { t } = useTranslation("forms");
  return <Dialog open={open} onOpenChange={onOpenChange}>
    {open ? <SortDialogContent initial={initial} returnFocusTo={returnFocusTo} onCancel={() => onOpenChange(false)} onSort={(sort) => { onSort(sort); onOpenChange(false); }} title={t("forms:catalog.sort.title")} /> : null}
  </Dialog>;
}

function SortDialogContent({ initial, returnFocusTo, title, onCancel, onSort }: {
  initial: FormCatalogItemSortInput | null; returnFocusTo?: HTMLElement | null; title: string; onCancel: () => void; onSort: (sort: FormCatalogItemSortInput) => void;
}) {
  const { t } = useTranslation("forms");
  const [column, setColumn] = useState<NonNullable<FormCatalogItemSortColumn>>(initial?.column ?? "Text");
  const [descending, setDescending] = useState(initial?.descending ?? false);
  // Abierto desde el ⋮ de «Opciones», al cerrar el foco vuelve a ese botón y no cae en <body> (formularios).
  const restoreFocus = useRestoreFocusOnClose(true, returnFocusTo);
  return <DialogContent size="sm" aria-describedby={undefined} onCloseAutoFocus={restoreFocus}>
    <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
    <DialogBody className="grid gap-3.5">
      <FormField label={t("forms:catalog.sort.column")}>
        <Picker value={column} onChange={(value) => setColumn(value as NonNullable<FormCatalogItemSortColumn>)}
          options={columns.map((value) => ({ value, label: t(`forms:catalog.sort.columns.${value}`) }))} />
      </FormField>
      <FormField label={t("forms:catalog.sort.order")} help={t("forms:catalog.sort.orderHelp")}>
        <Picker value={descending ? "desc" : "asc"} onChange={(value) => setDescending(value === "desc")}
          options={[{ value: "asc", label: t("forms:catalog.sort.ascending") }, { value: "desc", label: t("forms:catalog.sort.descending") }]} />
      </FormField>
    </DialogBody>
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel}>{t("common:actions.cancel")}</Button>
      <Button type="button" onClick={() => onSort({ column, descending })}>{t("forms:catalog.sort.apply")}</Button>
    </DialogFooter>
  </DialogContent>;
}
