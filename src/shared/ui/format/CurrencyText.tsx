import { useFormat } from "@/shared/format/useFormat";
import { currencyLabel } from "@/shared/referenceData/referenceData";
import { EmptyValue, FormatLoading } from "./EmptyValue";

/** Una moneda por su nombre y código, «Peso argentino (ARS)», como en su desplegable. */
export function CurrencyText({ value, className }: { value: string | null | undefined; className?: string }) {
  const format = useFormat();
  if (format.isLoading) return <FormatLoading className={className} />;
  if (value == null) return <EmptyValue className={className} />;
  const currency = format.referenceData.currencies.find((row) => row.code === value);
  return <span className={className}>{currency ? currencyLabel(currency) : value}</span>;
}
