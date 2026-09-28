import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";

type NumberProps = {
  value: number | null | undefined;
  className?: string;
} & ({ kind?: "integer" | "quantity" | "compact"; digits?: never } | { kind: "decimal"; digits: number });

export function NumberText({ value, kind = "integer", digits, className }: NumberProps) {
  const format = useFormat();
  const { t } = useTranslation();
  const classes = cn("inline-block text-right tabular-nums", className);
  if (format.isLoading) return <span role="status" aria-label={t("states.loading")} className={classes} />;
  if (value == null) return <span className={cn(classes, "text-[var(--t3)]")}>{format.formatEmpty()}</span>;

  const text = kind === "decimal" ? format.formatDecimal(value, digits!)
    : kind === "quantity" ? format.formatQuantity(value)
      : kind === "compact" ? format.formatCompact(value) : format.formatInteger(value);
  return <span className={classes} title={kind === "compact" ? format.formatQuantity(value) : undefined}>{text}</span>;
}
