import { useFormat } from "@/shared/format/useFormat";
import { EmptyValue, FormatLoading } from "./EmptyValue";

type TaxIdValue = { country?: string; type: string; number: string };

export function TaxIdText({ value, className }: { value: TaxIdValue | null | undefined; className?: string }) {
  const format = useFormat();
  if (format.isLoading) return <FormatLoading className={className} />;
  if (value == null) return <EmptyValue className={className} />;
  return <span className={className}>{format.formatTaxId({ type: value.type, number: value.number })}</span>;
}
