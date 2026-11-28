import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import type { FormCatalogItemRow, FormCatalogValueType } from "../../api/types";
import type { CatalogConflict, CatalogRowView } from "../../hooks/useCatalogEditor";
import { useCatalogFieldSources } from "../../hooks/useCatalogFieldSources";
import { conflictChanges, type ConflictChange, type ConflictValue } from "../../lib/catalogConflict";
import { savedDraft } from "../../lib/catalogDraft";
import type { CatalogFieldDraft } from "../../lib/catalogFields";
import { fieldValueText, readFieldValue, type FieldValue } from "../../lib/catalogValues";

/**
 * «Otra persona guardó el catálogo» (FRM-Catalogo, 138 y O15): las dos versiones lado a lado, con «Qué cambió» (el dato una
 * sola vez, en gris), lo tuyo y lo guardado ahora, solo lo distinto: el nombre, cada opción de la página que cambió de un lado
 * o del otro y las cantidades. En el teléfono, el dato ocupa su renglón y las dos versiones van debajo. Tus cambios se
 * conservan hasta que elijas: «Seguir editando» o «Ver lo nuevo».
 */
export function CatalogConflictDialog({ conflict, name, rows, total, active, valueType, savedRow, fields = [], onContinue, onSeeNew }: {
  conflict: CatalogConflict | null;
  name: string;
  rows: readonly CatalogRowView[];
  total: number;
  active: number;
  valueType: FormCatalogValueType;
  savedRow: (key: string | undefined) => FormCatalogItemRow | undefined;
  /** Tus campos activos (E13): la revisión dice si la lista cambió, y el valor de cada campo en cada opción. */
  fields?: readonly CatalogFieldDraft[];
  onContinue: () => void;
  onSeeNew: () => void;
}) {
  const { t } = useTranslation("forms");
  const format = useFormat();
  // Se abre al guardar, desde la banda o desde el ⋮: al cerrar, el foco vuelve a donde estaba (formularios).
  const restoreFocus = useRestoreFocusOnClose(conflict !== null);
  // El texto de la opción fuente de un campo «De un catálogo», de los dos lados.
  const sourceItem = useCatalogFieldSources(conflict?.fresh.fields ?? [], [...rows, ...(conflict?.freshItems ?? []).map((item) => ({ draft: { fields: item.fields } }))]);
  if (!conflict) return null;
  const { fresh, freshItems } = conflict;
  const fieldText = (fieldId: string, value: FieldValue) => {
    if (value === null) return "";
    if (typeof value === "boolean") return format.formatBoolean(value);
    const field = fresh.fields.find((item) => item.id === fieldId);
    if (!field) return value;
    if (field.type === "Catalog") return sourceItem(value)?.text ?? "";
    // Lo escrito, como se lee: el número y la fecha con la región del idioma («1.500»); lo que no se lee, como está.
    const read = readFieldValue(value, field.type, format, t);
    return read.error ? value : fieldValueText(read.canonical, field.type, format);
  };
  const changes = conflictChanges({ name, rows, total, active, fresh, freshItems, savedRow, freshDraft: (row) => savedDraft(row, valueType, format, fresh.fields),
    fieldNames: fields.map((field) => field.name), fieldText });
  const description = fresh.modifiedBy ? t("forms:catalog.conflict.byPerson", { name: fresh.modifiedBy }) : t("forms:catalog.conflict.bySomeone");
  const yoursTitle = t("forms:catalog.conflict.yours"), savedTitle = t("forms:catalog.conflict.saved");

  const what = (change: ConflictChange): string => {
    const { what } = change;
    if (what.kind === "name") return t("forms:catalog.conflict.name");
    if (what.kind === "counts") return t("forms:catalog.conflict.options");
    if (what.kind === "fields") return t("forms:catalog.conflict.fields");
    if (what.number == null) return t("forms:catalog.newOption");
    if (what.fieldName !== undefined) return t("forms:catalog.conflict.optionField", { n: format.formatInteger(what.number), field: what.fieldName });
    return what.field
      ? t("forms:catalog.conflict.optionField", { n: format.formatInteger(what.number), field: t(`forms:catalog.columns.${what.field === "isActive" ? "status" : what.field}`) })
      : t("forms:catalog.conflict.option", { n: format.formatInteger(what.number) });
  };

  const value = (side: ConflictValue): ReactNode => {
    switch (side.kind) {
      case "text": return <span className={cn("break-words", side.mono && "font-mono text-[0.78125rem]")}>{side.text}</span>;
      case "status": return t(side.isActive ? "forms:catalog.status.active" : "forms:catalog.status.inactive");
      case "counts": return t("forms:catalog.conflict.counts", { count: side.active, total: format.formatInteger(side.total), active: format.formatInteger(side.active) });
      case "removed": return <span className="text-[var(--t3)]">{t("forms:catalog.conflict.removed")}</span>;
      case "none": return <span className="text-[var(--t3)]">{format.formatEmpty()}</span>;
    }
  };

  const head = "text-[0.78125rem] font-semibold text-[var(--t2)]";
  return <Dialog open onOpenChange={(open) => { if (!open) onContinue(); }}>
    <DialogContent className="md:max-w-160" onCloseAutoFocus={restoreFocus}>
      <DialogHeader><DialogTitle>{t("forms:catalog.conflict.title")}</DialogTitle></DialogHeader>
      <DialogBody className="grid gap-3">
        <DialogDescription>{description}</DialogDescription>
        <div className="overflow-hidden rounded-md border border-[var(--borde)] text-[0.8125rem]">
          <div aria-hidden="true" className="grid grid-cols-2 gap-x-3 border-b border-[var(--borde)] bg-[var(--cab)] px-3 py-2 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <span className={cn(head, "max-md:hidden")}>{t("forms:catalog.conflict.what")}</span>
            <span className={head}>{yoursTitle}</span>
            <span className={head}>{savedTitle}</span>
          </div>
          <ul>
            {changes.map((change) => <li key={change.key} className="grid grid-cols-2 gap-x-3 gap-y-1 border-b border-[var(--borde)] px-3 py-2 last:border-b-0 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <span className="text-[var(--t3)] max-md:col-span-2">{what(change)}</span>
              <span><span className="sr-only">{`${yoursTitle}: `}</span>{value(change.yours)}</span>
              <span><span className="sr-only">{`${savedTitle}: `}</span>{value(change.theirs)}</span>
            </li>)}
          </ul>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onContinue}>{t("forms:catalog.conflict.continue")}</Button>
        <Button type="button" onClick={onSeeNew}>{t("forms:catalog.conflict.seeNew")}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
