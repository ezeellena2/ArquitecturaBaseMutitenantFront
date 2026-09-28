import { getStatusTone, type StatusTone } from "@/shared/format/statusTones";
import { useFormat } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";
import { EmptyValue, FormatLoading } from "./EmptyValue";

const toneClasses: Record<StatusTone, string> = {
  success: "bg-[var(--ok-t)] text-[var(--ok)]",
  warning: "bg-[var(--alerta-t)] text-[var(--alerta)]",
  danger: "bg-[var(--peligro-t)] text-[var(--peligro)]",
  neutral: "bg-[var(--s3)] text-[var(--t2)]",
  pending: "bg-[var(--marca-t)] text-[var(--marca-tx)]",
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
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", toneClasses[tone], className)}>
      {format.formatEnum(enumName, value)}
    </span>
  );
}
