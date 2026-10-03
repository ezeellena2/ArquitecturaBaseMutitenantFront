import { useFormat } from "@/shared/format/useFormat";
import { EmptyValue, FormatLoading } from "./EmptyValue";

type TaxIdValue = { country?: string; type: string; number: string };

// withType antepone el nombre traducido del tipo («CUIT 30-71234567-8»), como en la banda de Empresa.
export function TaxIdText({ value, withType = false, className }: { value: TaxIdValue | null | undefined; withType?: boolean; className?: string }) {
  const format = useFormat();
  if (format.isLoading) return <FormatLoading className={className} />;
  if (value == null) return <EmptyValue className={className} />;
  const number = format.formatTaxId({ type: value.type, number: value.number });
  const type = withType ? format.referenceData.taxIdTypes.find((item) => item.code === value.type)?.name : undefined;
  return <span className={className}>{type ? `${type} ${number}` : number}</span>;
}
