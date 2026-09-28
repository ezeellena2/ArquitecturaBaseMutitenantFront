import { useFormat } from "@/shared/format/useFormat";
import { EmptyValue, FormatLoading } from "./EmptyValue";

export function BooleanText({ value, className }: { value: boolean | null | undefined; className?: string }) {
  const format = useFormat();
  if (format.isLoading) return <FormatLoading className={className} />;
  if (value == null) return <EmptyValue className={className} />;
  return <span className={className}>{format.formatBoolean(value)}</span>;
}
