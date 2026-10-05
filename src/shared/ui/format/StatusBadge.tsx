import type { StatusTones } from "@/shared/format/statusTones";
import { useFormat } from "@/shared/format/useFormat";
import { StatusDot } from "../StatusDot";
import { EmptyValue, FormatLoading } from "./EmptyValue";

/// Un estado del contrato como el lienzo: el punto del tono que registró su feature y la palabra de
/// `enums.<Enum>.<Valor>` («Criterio · Tablas»). Ningún color de estado se escribe en una pantalla.
export function StatusBadge<TState extends string>({ tones, value, className }: {
  tones: StatusTones<TState>;
  value: TState | null | undefined;
  className?: string;
}) {
  const format = useFormat();
  if (format.isLoading) return <FormatLoading className={className} />;
  if (value == null) return <EmptyValue className={className} />;
  return <StatusDot tone={tones.tones[value] ?? "neutral"} label={format.formatEnum(tones.enum, value)} className={className} />;
}
