import { useFormat } from "@/shared/format/useFormat";
import { EmptyValue, FormatLoading } from "./EmptyValue";

/** Una fecha se muestra completa, con su año, y un momento con su hora después de una coma, en la zona de quien mira:
 *  nunca la fecha corta, la larga, «hace 2 horas», «hoy» ni «ayer» (formatos.md y 205). */
type DateKind = "date" | "dateTime" | "time";

export function DateText({ value, kind = "date", className }: {
  value: string | null | undefined;
  kind?: DateKind;
  className?: string;
}) {
  const format = useFormat();
  if (format.isLoading) return <FormatLoading className={className} />;
  if (value == null) return <EmptyValue className={className} />;

  const text = kind === "dateTime" ? format.formatDateTime(value)
    : kind === "time" ? format.formatTime(value) : format.formatDate(value);
  const absolute = value.endsWith("Z") && kind === "date" ? format.formatDateTime(value) : undefined;

  return <time dateTime={value} title={absolute} className={className}>{text}</time>;
}
