import { useTranslation } from "react-i18next";
import { useFormat, type DateRangeValue } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";

export function DateRangeText({ value, className }: { value: DateRangeValue | null | undefined; className?: string }) {
  const format = useFormat();
  const { t } = useTranslation();
  if (format.isLoading) return <span role="status" aria-label={t("states.loading")} className={className} />;
  if (value == null) return <span className={cn("text-[var(--t3)]", className)}>{format.formatEmpty()}</span>;
  return <span className={className}>{format.formatDateRange(value)}</span>;
}
