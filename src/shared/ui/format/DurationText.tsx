import { useFormat } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";
import { EmptyValue, FormatLoading } from "./EmptyValue";

export function DurationText({ value, className }: { value: number | null | undefined; className?: string }) {
  const format = useFormat();
  const classes = cn("inline-block tabular-nums", className);
  if (format.isLoading) return <FormatLoading className={classes} />;
  if (value == null) return <EmptyValue className={classes} />;
  return <span className={classes}>{format.formatDuration(value)}</span>;
}
