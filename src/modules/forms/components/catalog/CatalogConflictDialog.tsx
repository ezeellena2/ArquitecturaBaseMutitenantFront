import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import type { FormCatalogItemRow, FormCatalogValueType } from "../../api/types";
import type { CatalogConflict, CatalogRowView } from "../../hooks/useCatalogEditor";
import { conflictChanges, type ConflictChange, type ConflictValue } from "../../lib/catalogConflict";
import { savedDraft } from "../../lib/catalogDraft";

/**
 * «Otra persona guardó el catálogo» (FRM-Catalogo, 138 y O15): las dos versiones lado a lado, con «Qué cambió» (el dato una
 * sola vez, en gris), lo tuyo y lo guardado ahora, solo lo distinto: el nombre, cada opción de la página que cambió de un lado
 * o del otro y las cantidades. En el teléfono, el dato ocupa su renglón y las dos versiones van debajo. Tus cambios se
 * conservan hasta que elijas: «Seguir editando» o «Ver lo nuevo».
 */
export function CatalogConflictDialog({ conflict, name, rows, total, active, valueType, savedRow, onContinue, onSeeNew }: {
  conflict: CatalogConflict | null;
  name: string;
  rows: readonly CatalogRowView[];
  total: number;
  active: number;
  valueType: FormCatalogValueType;
  savedRow: (key: string | undefined) => FormCatalogItemRow | undefined;
  onContinue: () => void;
  onSeeNew: () => void;
}) {
  const { t } = useTranslation("forms");
  const format = useFormat();
  if (!conflict) return null;
  const { fresh, freshItems } = conflict;
  const changes = conflictChanges({ name, rows, total, active, fresh, freshItems, savedRow, freshDraft: (row) => savedDraft(row, valueType, format) });
  const description = fresh.modifiedBy ? t("forms:catalog.conflict.byPerson", { name: fresh.modifiedBy }) : t("forms:catalog.conflict.bySomeone");
  const yoursTitle = t("forms:catalog.conflict.yours"), savedTitle = t("forms:catalog.conflict.saved");

  const what = (change: ConflictChange): string => {
    const { what } = change;
    if (what.kind === "name") return t("forms:catalog.conflict.name");
    if (what.kind === "counts") return t("forms:catalog.conflict.options");
    if (what.number == null) return t("forms:catalog.newOption");
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
    <DialogContent className="md:max-w-160">
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
