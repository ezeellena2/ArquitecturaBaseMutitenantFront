import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import type { CatalogConflict, CatalogRowView } from "../../hooks/useCatalogEditor";

interface Side { readonly name: string; readonly option?: { number: number; text: string }; readonly total: number; readonly active: number }

/**
 * «Otra persona guardó el catálogo» (FRM-Catalogo, 138): lo tuyo y lo guardado ahora, lado a lado, con el nombre, la primera
 * opción que cambiaste y las opciones. Tus cambios se conservan hasta que elijas: «Seguir editando» o «Ver lo nuevo».
 */
export function CatalogConflictDialog({ conflict, name, rows, total, active, onContinue, onSeeNew }: {
  conflict: CatalogConflict | null;
  name: string;
  rows: readonly CatalogRowView[];
  total: number;
  active: number;
  onContinue: () => void;
  onSeeNew: () => void;
}) {
  const { t } = useTranslation("forms");
  const format = useFormat();
  if (!conflict) return null;
  const { fresh, freshItems } = conflict;
  const changed = rows.find((row) => row.itemId && freshItems.some((item) => item.id === row.itemId && item.text !== row.draft.text));
  const theirs = changed ? freshItems.find((item) => item.id === changed.itemId) : undefined;
  const yours: Side = { name, total, active, option: changed?.number != null ? { number: changed.number, text: changed.draft.text } : undefined };
  const saved: Side = { name: fresh.name, total: fresh.itemCounts.total, active: fresh.itemCounts.active, option: theirs ? { number: theirs.position, text: theirs.text } : undefined };
  const description = fresh.modifiedBy
    ? t("forms:catalog.conflict.byPerson", { name: fresh.modifiedBy })
    : t("forms:catalog.conflict.bySomeone");

  const column = (title: string, side: Side) => <section aria-label={title} className="min-w-0 rounded-md border border-[var(--borde)]">
    <h3 className="border-b border-[var(--borde)] bg-[var(--s2)] px-3 py-2 text-[0.78125rem] font-semibold text-[var(--t2)]">{title}</h3>
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 px-3 py-2.5 text-[0.8125rem]">
      {side.name !== (side === yours ? saved.name : yours.name) ? <><dt className="text-[var(--t3)]">{t("forms:catalog.conflict.name")}</dt><dd className="break-words">{side.name}</dd></> : null}
      {side.option ? <><dt className="text-[var(--t3)]">{t("forms:catalog.conflict.option", { n: format.formatInteger(side.option.number) })}</dt><dd className="break-words">{side.option.text}</dd></> : null}
      <dt className="text-[var(--t3)]">{t("forms:catalog.conflict.options")}</dt>
      <dd>{t("forms:catalog.conflict.counts", { total: format.formatInteger(side.total), active: format.formatInteger(side.active) })}</dd>
    </dl>
  </section>;

  return <Dialog open onOpenChange={(open) => { if (!open) onContinue(); }}>
    <DialogContent>
      <DialogHeader><DialogTitle>{t("forms:catalog.conflict.title")}</DialogTitle></DialogHeader>
      <DialogBody className="grid gap-3">
        <DialogDescription>{description}</DialogDescription>
        <div className="grid gap-3 md:grid-cols-2">
          {column(t("forms:catalog.conflict.yours"), yours)}
          {column(t("forms:catalog.conflict.saved"), saved)}
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onContinue}>{t("forms:catalog.conflict.continue")}</Button>
        <Button type="button" onClick={onSeeNew}>{t("forms:catalog.conflict.seeNew")}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
