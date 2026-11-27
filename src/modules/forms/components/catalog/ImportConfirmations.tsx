import { useId } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";
import type { CatalogImport } from "../../hooks/useCatalogImport";
import { ImportBand, ImportZone } from "./ImportParts";

/**
 * «Antes de aplicar» (C7): cuando el back lo pide, confirmar las bajas (más del 25 %) o aplicar sin las filas con errores.
 * Cada confirmación es una sola frase traducida, con la cantidad y la parte del total, así cada idioma la ordena.
 */
export function ImportConfirmations({ imp }: { imp: CatalogImport }) {
  const { t } = useTranslation(["forms", "common"]);
  const format = useFormat();
  const id = useId();
  const { review } = imp;
  if (!review || imp.conflict || imp.busy || !(review.confirmDeactivations || review.confirmErrors)) return null;
  const percent = (share: number) => format.formatPercent(Math.round(share * 100) / 100);

  const confirmation = (key: "deactivations" | "errors", checked: boolean, onChange: (checked: boolean) => void, count: number, share: number) =>
    <div className="flex items-start gap-2.5 text-[0.84375rem]">
      <Checkbox id={`${id}-${key}`} checked={checked} disabled={imp.applying} className="mt-0.5" onCheckedChange={(value) => onChange(value === true)} />
      <Label htmlFor={`${id}-${key}`} className="inline font-normal leading-normal">
        <Trans t={t} i18nKey={key === "deactivations" ? "forms:catalog.import.confirmDeactivations" : "forms:catalog.import.confirmErrors"}
          count={count} values={{ n: format.formatInteger(count), percent: percent(share) }} components={{ b: <b className="font-semibold" /> }} />
      </Label>
    </div>;

  return <>
    <ImportBand>{t("forms:catalog.import.beforeApplying")}</ImportBand>
    <ImportZone dimmed={imp.applying}>
      {review.confirmDeactivations ? confirmation("deactivations", imp.confirmDeactivations, imp.setConfirmDeactivations, review.deactivated.totalCount, review.deactivationShare) : null}
      {review.confirmErrors ? confirmation("errors", imp.confirmErrors, imp.setConfirmErrors, review.errors.totalCount, review.errorShare) : null}
    </ImportZone>
  </>;
}
