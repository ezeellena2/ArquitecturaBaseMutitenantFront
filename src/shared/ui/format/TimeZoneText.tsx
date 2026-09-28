import { useFormat } from "@/shared/format/useFormat";
import { EmptyValue, FormatLoading } from "./EmptyValue";

export function TimeZoneText({ value, className }: { value: string | null | undefined; className?: string }) {
  const format = useFormat();
  if (format.isLoading) return <FormatLoading className={className} />;
  if (value == null) return <EmptyValue className={className} />;
  return <span className={className}>{format.formatTimeZone(value)}</span>;
}
