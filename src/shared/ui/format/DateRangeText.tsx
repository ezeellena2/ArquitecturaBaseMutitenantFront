import { useFormat, type DateRangeValue } from "@/shared/format/useFormat";
import { EmptyValue, FormatLoading } from "./EmptyValue";

export function DateRangeText({ value, className }: { value: DateRangeValue | null | undefined; className?: string }) {
  const format = useFormat();
  if (format.isLoading) return <FormatLoading className={className} />;
  if (value == null) return <EmptyValue className={className} />;
  return <span className={className}>{format.formatDateRange(value)}</span>;
}
