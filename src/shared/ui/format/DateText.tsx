import { useFormat } from "@/shared/format/useFormat";
import { EmptyValue, FormatLoading } from "./EmptyValue";

/** `shortDate` y `shortDateTime`: la «Fecha corta», sin el año si es del año en curso; solo en las listas del teléfono. */
type DateKind = "date" | "dateTime" | "shortDate" | "shortDateTime" | "time" | "long" | "relative";

export function DateText({ value, kind = "date", className }: {
  value: string | null | undefined;
  kind?: DateKind;
  className?: string;
}) {
  const format = useFormat();
  if (format.isLoading) return <FormatLoading className={className} />;
  if (value == null) return <EmptyValue className={className} />;

  const text = kind === "dateTime" ? format.formatDateTime(value)
    : kind === "shortDate" ? format.formatShortDate(value)
      : kind === "shortDateTime" ? format.formatShortDateTime(value)
        : kind === "time" ? format.formatTime(value)
          : kind === "long" ? format.formatDateLong(value)
            : kind === "relative" ? format.formatRelative(value) : format.formatDate(value);
  const absolute = value.endsWith("Z") && (kind === "date" || kind === "relative" || kind === "shortDate" || kind === "shortDateTime")
    ? format.formatDateTime(value) : undefined;

  return <time dateTime={value} title={absolute} className={className}>{text}</time>;
}
