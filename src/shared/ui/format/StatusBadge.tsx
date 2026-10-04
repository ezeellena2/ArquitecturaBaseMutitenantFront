import { getStatusTone, type StatusTone } from "@/shared/format/statusTones";
import { useFormat } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";
import { EmptyValue, FormatLoading } from "./EmptyValue";

const dotClasses: Record<StatusTone, string> = {
  success: "bg-[var(--punto-ok)]",
  warning: "bg-[var(--punto-alerta)]",
  danger: "bg-[var(--peligro)]",
  neutral: "bg-[var(--punto-apagado)]",
  pending: "bg-[var(--marca)]",
};

export function StatusBadge({ enum: enumName, value, className }: {
  enum: string;
  value: string | null | undefined;
  className?: string;
}) {
  const format = useFormat();
  if (format.isLoading) return <FormatLoading className={className} />;
  if (value == null) return <EmptyValue className={className} />;
  const tone = getStatusTone(enumName, value);
  return (
    <span className={cn("inline-flex w-fit max-w-full items-center gap-1.5 text-[13px] text-[var(--t1)]", className)}>
      <span data-slot="status-dot" aria-hidden="true" className={cn("inline-block size-2 shrink-0 rounded-full", dotClasses[tone])} />
      <span className="min-w-0 truncate">{format.formatEnum(enumName, value)}</span>
    </span>
  );
}
