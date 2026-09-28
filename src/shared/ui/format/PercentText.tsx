import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";

export function PercentText({ value, className }: { value: number | null | undefined; className?: string }) {
  const format = useFormat();
  const { t } = useTranslation();
  const classes = cn("inline-block text-right tabular-nums", className);
  if (format.isLoading) return <span role="status" aria-label={t("states.loading")} className={classes} />;
  if (value == null) return <span className={cn(classes, "text-[var(--t3)]")}>{format.formatEmpty()}</span>;
  return <span className={classes}>{format.formatPercent(value)}</span>;
}
