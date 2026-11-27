import type { StatusTones } from "@/shared/format/statusTones";
import { useFormat } from "@/shared/format/useFormat";
import { EmptyValue } from "@/shared/ui/format/EmptyValue";
import { StatusBadge } from "@/shared/ui/format/StatusBadge";
import { InfoTip } from "@/shared/ui/InfoTip";
import type { FormCatalogRow } from "../../api/types";
import { catalogStatus, type CatalogStatus } from "../../lib/catalogStatus";

/// Tableros FRM-Catalogos y M-FRM-Catalogos: activo en verde, de baja en gris y «No se puede usar» en rojo, con su motivo
/// en la (i). La palabra sale de `enums.FormCatalogStatus`, que no es un enum del contrato: lo arma `catalogStatus`.
const catalogStatusTones: StatusTones<CatalogStatus> = { enum: "FormCatalogStatus", tones: { Active: "success", Inactive: "neutral", Unusable: "danger" } };

export function CatalogStatusText({ catalog }: { catalog: FormCatalogRow }) {
  const format = useFormat();
  const status = catalogStatus(catalog);
  const reason = status === "Unusable" && catalog.unusableReason && !format.isLoading ? format.formatEnum("FormCatalogUnusableReason", catalog.unusableReason) : undefined;
  return <span className="inline-flex items-center gap-1.5">
    <StatusBadge tones={catalogStatusTones} value={status} />
    {reason ? <InfoTip standalone text={reason} title={reason} /> : null}
  </span>;
}

/// El tipo de valor es de los escritos a mano: uno con filtros es siempre de texto y dice «—» (FRM-Catalogos).
export function ValueTypeText({ catalog }: { catalog: FormCatalogRow }) {
  const format = useFormat();
  if (catalog.source !== "Manual") return <EmptyValue />;
  return <span>{format.formatEnum("FormCatalogValueType", catalog.valueType)}</span>;
}

export function SourceText({ catalog }: { catalog: FormCatalogRow }) {
  const format = useFormat();
  return <span>{format.formatEnum("FormCatalogSource", catalog.source)}</span>;
}
