import { useTranslation } from "react-i18next";
import { countOf } from "@/shared/format/countOf";
import { useFormat } from "@/shared/format/useFormat";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { IconButton } from "@/shared/ui/IconButton";
import { CloseIcon } from "@/shared/ui/icons";
import type { FormCatalogResponse } from "../../api/types";
import { useCatalogImport } from "../../hooks/useCatalogImport";
import type { CatalogImportColumn } from "../../lib/catalogImport";
import { ImportConfirmations } from "./ImportConfirmations";
import { ImportOrigin } from "./ImportOrigin";
import { ImportReview } from "./ImportReview";

/**
 * «Importar opciones» de un catálogo a mano (FRM-Catalogo-Importar, 120): un solo diálogo, de arriba abajo, con sus tres
 * partes: el «Origen» (`ImportOrigin`), la «Revisión» sin guardar (`ImportReview`) y «Antes de aplicar»
 * (`ImportConfirmations`); lo que hace cada botón está en `useCatalogImport`. Si otra persona guardó, «Revisar de nuevo», y
 * con otra importación en curso, solo «Cerrar». No va en el teléfono.
 */
export function ImportDialog({ catalog, onClose, onCatalogChanged }: {
  catalog: FormCatalogResponse;
  onClose: () => void;
  /** El catálogo cambió (se importó, u otra persona lo guardó): el editor vuelve a leerlo, con su versión. */
  onCatalogChanged: () => void;
}) {
  const { t } = useTranslation(["forms", "common"]);
  const format = useFormat();
  const restoreFocus = useRestoreFocusOnClose();
  const imp = useCatalogImport(catalog, { onClose, onCatalogChanged });
  const { review, applying } = imp;
  const columnLabel = (column: CatalogImportColumn) => column === "value" && catalog.valueType !== "Text"
    ? t(`forms:catalog.optionsDialog.value.${catalog.valueType}`) : t(`forms:catalog.columns.${column}`);

  const applyReason = review?.confirmDeactivations && !imp.confirmDeactivations ? t("forms:catalog.import.confirmDeactivationsFirst")
    : review?.confirmErrors && !imp.confirmErrors ? t("forms:catalog.import.confirmErrorsFirst") : undefined;
  const waitReason = applying ? t("forms:catalog.import.waitApplying") : undefined;
  const footer = imp.busy
    ? <Button type="button" variant="outline" onClick={imp.close}>{t("common:actions.close")}</Button>
    : <>
      <Button type="button" variant="outline" disabledReason={waitReason} onClick={imp.close}>{t("common:actions.cancel")}</Button>
      {imp.conflict ? <Button type="button" pending={imp.previewPending} pendingLabel={t("forms:catalog.import.reviewing")} onClick={() => { void imp.reviewAgain(); }}>{t("forms:catalog.import.reviewAgain")}</Button>
        : review ? <Button type="button" pending={applying} pendingLabel={t("forms:catalog.import.applying")} disabledReason={imp.refreshing ? undefined : applyReason}
          disabled={imp.refreshing} onClick={imp.submitApply}>
          {review.errors.totalCount > 0 ? t("forms:catalog.import.applySkipping", countOf(format, review.errors.totalCount)) : t("forms:catalog.import.apply")}
        </Button>
          : <Button type="button" pending={imp.previewPending} pendingLabel={t("forms:catalog.import.reviewing")} onClick={imp.submitReview}>{t("forms:catalog.import.review")}</Button>}
    </>;

  return <Dialog open onOpenChange={(open) => { if (!open) imp.close(); }}>
    <DialogContent aria-describedby={undefined} showCloseButton={!applying} className="md:max-w-190" onCloseAutoFocus={restoreFocus}
      onEscapeKeyDown={(event) => { if (applying) event.preventDefault(); }}>
      <DialogHeader><DialogTitle>{t("forms:catalog.import.title", { name: catalog.name })}</DialogTitle></DialogHeader>
      {applying ? <IconButton label={t("common:actions.close")} disabledReason={waitReason} className="absolute top-2 right-2"><CloseIcon strokeWidth={2} className="size-4" /></IconButton> : null}
      <div className="max-h-[37.5rem] min-h-0 overflow-y-auto">
        <ImportOrigin imp={imp} valueType={catalog.valueType} columnLabel={columnLabel} />
        <ImportReview imp={imp} valueType={catalog.valueType} />
        <ImportConfirmations imp={imp} />
      </div>
      <DialogFooter>{footer}</DialogFooter>
    </DialogContent>
  </Dialog>;
}
