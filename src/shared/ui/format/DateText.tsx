import { useTranslation } from "react-i18next";
import { useFormat } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";

type DateKind = "date" | "dateTime" | "time" | "long" | "relative";

export function DateText({ value, kind = "date", className }: {
  value: string | null | undefined;
  kind?: DateKind;
  className?: string;
}) {
  const format = useFormat();
  const { t } = useTranslation();
  if (format.isLoading) return <span role="status" aria-label={t("states.loading")} className={className} />;
  if (value == null) return <span className={cn("text-[var(--t3)]", className)}>{format.formatEmpty()}</span>;

  const text = kind === "dateTime" ? format.formatDateTime(value)
    : kind === "time" ? format.formatTime(value)
      : kind === "long" ? format.formatDateLong(value)
        : kind === "relative" ? format.formatRelative(value) : format.formatDate(value);
  const absolute = value.endsWith("Z") && (kind === "date" || kind === "relative")
    ? format.formatDateTime(value) : undefined;

  return <time dateTime={value} title={absolute} className={className}>{text}</time>;
}
